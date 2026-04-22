import { Request, Response } from 'express';
import { BillingService } from '../services/BillingService';
import { MultiChainPaymentService, PaymentRequest, PaymentResult } from '../src/services/MultiChainPaymentService';
import { BlockchainNetwork, TransactionStatus, BlockchainErrorImpl } from '../src/blockchain/types';
import { paymentLimiter, transactionLimiter } from '../middleware/rateLimiter';
import { conditionalCaptcha } from '../middleware/captcha';
import { abuseDetector } from '../middleware/abuseDetection';
import { invalidateUserCache, invalidateCacheByPattern } from '../middleware/cache';

const billingService = new BillingService();
const paymentService = new MultiChainPaymentService({
  environment: 'TESTNET', // Configure based on environment
  enableCrossChain: false,
  gasMultiplier: 1.1
});

// Apply rate limiting and security to all payment routes
export const applyPaymentSecurity = [
  abuseDetector,
  paymentLimiter,
  transactionLimiter,
  conditionalCaptcha
];

/**
 * @openapi
 * /api/payment/process:
 *   post:
 *     summary: Process a payment
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, CREDIT_CARD, CRYPTO, STELLAR]
 *               network:
 *                 type: string
 *                 enum: [ETHEREUM, POLYGON, STELLAR]
 *               recipientAddress:
 *                 type: string
 *               memo:
 *                 type: string
 *               recaptchaToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       429:
 *         description: Rate limit exceeded
 *       400:
 *         description: Invalid payment data
 */
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { billId, amount, paymentMethod, network, recipientAddress, memo } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        error: 'User authentication required'
      });
    }

    // Validate payment data
    if (!billId || !amount || !paymentMethod) {
      return res.status(400).json({
        status: 400,
        error: 'Missing required payment fields'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: 400,
        error: 'Payment amount must be greater than 0'
      });
    }

    // Validate bill exists and belongs to user
    const bill = await billingService.getBill(billId);
    if (!bill || bill.userId !== userId) {
      return res.status(404).json({
        status: 404,
        error: 'Bill not found or access denied'
      });
    }

    let paymentResult: any;

    // Handle blockchain payments
    if (paymentMethod === 'CRYPTO' || paymentMethod === 'STELLAR') {
      if (!network || !recipientAddress) {
        return res.status(400).json({
          status: 400,
          error: 'Network and recipient address required for crypto payments'
        });
      }

      // Validate recipient address based on network
      if (!paymentService.validateAddress(recipientAddress, network as BlockchainNetwork)) {
        return res.status(400).json({
          status: 400,
          error: `Invalid recipient address for ${network}`
        });
      }

      const paymentRequest: PaymentRequest = {
        billId,
        userId,
        amount: amount.toString(),
        currency: 'USD', // Convert based on actual currency
        network: network as BlockchainNetwork,
        recipientAddress,
        memo: memo || `Payment for bill ${billId}`
      };

      const blockchainResult: PaymentResult = await paymentService.processPayment(paymentRequest);

      if (!blockchainResult.success) {
        return res.status(400).json({
          status: 400,
          error: 'Blockchain payment failed',
          details: blockchainResult.error
        });
      }

      // Store blockchain payment in database
      paymentResult = await billingService.processPayment({
        billId,
        userId,
        amount,
        paymentMethod: `${paymentMethod}_${network}`,
        timestamp: new Date(),
        transactionId: blockchainResult.transactionHash,
        blockchainData: {
          network,
          transactionHash: blockchainResult.transactionHash,
          status: blockchainResult.status,
          fee: blockchainResult.fee,
          gasUsed: blockchainResult.gasUsed,
          gasPrice: blockchainResult.gasPrice
        }
      });

      // Add blockchain-specific data to response
      paymentResult.blockchain = blockchainResult;
    } else {
      // Traditional payment methods
      paymentResult = await billingService.processPayment({
        billId,
        userId,
        amount,
        paymentMethod,
        timestamp: new Date()
      });
    }

    // Invalidate user cache and payment cache after payment processing
    await invalidateUserCache(userId);
    await invalidateCacheByPattern('payment');

    res.status(200).json({
      status: 200,
      message: 'Payment processed successfully',
      data: paymentResult
    });

  } catch (error) {
    console.error('Payment processing error:', error);

    // Handle blockchain-specific errors
    if (error instanceof BlockchainErrorImpl) {
      return res.status(400).json({
        status: 400,
        error: 'Blockchain payment failed',
        code: error.code,
        network: error.network,
        details: error.message
      });
    }

    res.status(500).json({
      status: 500,
      error: 'Payment processing failed'
    });
  }
};

/**
 * @openapi
 * /api/payment/history:
 *   get:
 *     summary: Get payment history for a user
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUCCESS, PENDING, FAILED]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [ETHEREUM, POLYGON, STELLAR]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 */
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 records
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;
    const paymentMethod = req.query.paymentMethod as string;
    const network = req.query.network as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        error: 'User authentication required'
      });
    }

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        status: 400,
        error: 'Limit must be between 1 and 100'
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        status: 400,
        error: 'Offset must be non-negative'
      });
    }

    const paymentHistory = await billingService.getPaymentHistory(userId, limit, offset);

    // Enhance payment data with blockchain status if applicable
    const enhancedPayments = await Promise.all(
      paymentHistory.payments.map(async (payment: any) => {
        const enhancedPayment = { ...payment };

        // Check if this is a blockchain payment and update status
        if (payment.transactionId && (payment.method?.includes('CRYPTO') || payment.method?.includes('STELLAR'))) {
          try {
            // Extract network from payment method
            const paymentNetwork = payment.method?.split('_')[1] as BlockchainNetwork;
            if (paymentNetwork && Object.values(BlockchainNetwork).includes(paymentNetwork)) {
              const blockchainStatus = await paymentService.getPaymentStatus(payment.transactionId, paymentNetwork);
              enhancedPayment.blockchainStatus = {
                status: blockchainStatus.status,
                confirmations: blockchainStatus.confirmations,
                timestamp: blockchainStatus.timestamp,
                fee: blockchainStatus.fee,
                gasUsed: blockchainStatus.gasUsed,
                gasPrice: blockchainStatus.gasPrice
              };
            }
          } catch (error) {
            console.error(`Failed to get blockchain status for transaction ${payment.transactionId}:`, error);
            enhancedPayment.blockchainStatus = {
              status: 'UNKNOWN',
              error: 'Failed to retrieve blockchain status'
            };
          }
        }

        return enhancedPayment;
      })
    );

    // Apply filters if specified
    let filteredPayments = enhancedPayments;

    if (status) {
      filteredPayments = filteredPayments.filter((payment: any) =>
        payment.status === status || payment.blockchainStatus?.status === status
      );
    }

    if (paymentMethod) {
      filteredPayments = filteredPayments.filter((payment: any) =>
        payment.method?.toLowerCase().includes(paymentMethod.toLowerCase())
      );
    }

    if (network) {
      filteredPayments = filteredPayments.filter((payment: any) =>
        payment.method?.includes(network) || payment.blockchainData?.network === network
      );
    }

    if (startDate) {
      filteredPayments = filteredPayments.filter((payment: any) =>
        new Date(payment.createdAt) >= startDate
      );
    }

    if (endDate) {
      filteredPayments = filteredPayments.filter((payment: any) =>
        new Date(payment.createdAt) <= endDate
      );
    }

    // Recalculate pagination after filtering
    const filteredTotal = filteredPayments.length;
    const paginatedPayments = filteredPayments.slice(offset, offset + limit);

    res.status(200).json({
      status: 200,
      data: paginatedPayments,
      pagination: {
        limit,
        offset,
        total: filteredTotal,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(filteredTotal / limit),
        hasNext: offset + limit < filteredTotal,
        hasPrev: offset > 0,
        filters: {
          status,
          paymentMethod,
          network,
          startDate,
          endDate
        }
      },
      summary: {
        totalPayments: filteredTotal,
        successfulPayments: filteredPayments.filter((p: any) => p.status === 'SUCCESS' || p.blockchainStatus?.status === 'confirmed').length,
        pendingPayments: filteredPayments.filter((p: any) => p.status === 'PENDING' || p.blockchainStatus?.status === 'pending').length,
        failedPayments: filteredPayments.filter((p: any) => p.status === 'FAILED' || p.blockchainStatus?.status === 'failed').length,
        blockchainPayments: filteredPayments.filter((p: any) => p.method?.includes('CRYPTO') || p.method?.includes('STELLAR')).length
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      status: 500,
      error: 'Failed to retrieve payment history'
    });
  }
};

/**
 * @openapi
 * /api/payment/validate:
 *   post:
 *     summary: Validate payment data before processing
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               billId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, CREDIT_CARD, CRYPTO, STELLAR]
 *               network:
 *                 type: string
 *                 enum: [ETHEREUM, POLYGON, STELLAR]
 *               recipientAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment data is valid
 */
export const validatePayment = async (req: Request, res: Response) => {
  try {
    const { billId, amount, paymentMethod, network, recipientAddress } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        error: 'User authentication required'
      });
    }

    // Validate required fields
    if (!billId || !amount) {
      return res.status(400).json({
        status: 400,
        error: 'Bill ID and amount are required'
      });
    }

    // Validate bill exists and belongs to user
    const bill = await billingService.getBill(billId);
    if (!bill || bill.userId !== userId) {
      return res.status(404).json({
        status: 404,
        error: 'Bill not found or access denied'
      });
    }

    // Validate amount
    const totalDue = Number(bill.amount) + Number(bill.lateFee || 0);
    if (amount <= 0 || amount > totalDue) {
      return res.status(400).json({
        status: 400,
        error: `Invalid payment amount. Must be between 0 and ${totalDue}`,
        details: {
          billAmount: bill.amount,
          lateFee: bill.lateFee,
          totalDue
        }
      });
    }

    const validationResult: any = {
      isValid: true,
      billAmount: bill.amount,
      lateFee: bill.lateFee,
      totalDue,
      paymentMethod: paymentMethod || 'Not specified'
    };

    // Additional validation for blockchain payments
    if (paymentMethod === 'CRYPTO' || paymentMethod === 'STELLAR') {
      if (!network) {
        return res.status(400).json({
          status: 400,
          error: 'Network is required for crypto payments',
          supportedNetworks: ['ETHEREUM', 'POLYGON', 'STELLAR']
        });
      }

      if (!recipientAddress) {
        return res.status(400).json({
          status: 400,
          error: 'Recipient address is required for crypto payments'
        });
      }

      // Validate network
      const supportedNetworks = ['ETHEREUM', 'POLYGON', 'STELLAR'];
      if (!supportedNetworks.includes(network)) {
        return res.status(400).json({
          status: 400,
          error: `Unsupported network: ${network}`,
          supportedNetworks
        });
      }

      // Validate recipient address based on network
      const isValidAddress = paymentService.validateAddress(recipientAddress, network as BlockchainNetwork);
      if (!isValidAddress) {
        return res.status(400).json({
          status: 400,
          error: `Invalid recipient address for ${network}`,
          details: {
            network,
            address: recipientAddress,
            expectedFormat: network === 'STELLAR' ? 'G[A-Z0-9]{55}' : '0x[a-fA-F0-9]{40}'
          }
        });
      }

      // Get network fee information
      try {
        const networkFeeInfo = await paymentService.getNetworkFeeInfo(network as BlockchainNetwork);
        validationResult.networkFees = networkFeeInfo;
        validationResult.estimatedFees = {
          slow: networkFeeInfo.slow,
          standard: networkFeeInfo.standard,
          fast: networkFeeInfo.fast
        };
      } catch (error) {
        console.error('Failed to get network fee info:', error);
        validationResult.networkFees = {
          error: 'Failed to retrieve network fee information'
        };
      }

      // Check network connectivity
      try {
        const connectionStatus = await paymentService.healthCheck();
        const networkConnected = connectionStatus.get(network as BlockchainNetwork);
        validationResult.networkConnected = networkConnected || false;

        if (!networkConnected) {
          validationResult.warnings = [`Network ${network} is currently experiencing connectivity issues`];
        }
      } catch (error) {
        validationResult.networkConnected = false;
        validationResult.warnings = ['Unable to verify network connectivity'];
      }

      // Add blockchain-specific validation details
      validationResult.blockchain = {
        network,
        recipientAddress,
        addressValid: isValidAddress,
        supportedAssets: network === 'STELLAR' ? ['XLM', 'USDC', 'EURT'] : ['ETH', 'USDC', 'USDT'],
        estimatedProcessingTime: network === 'STELLAR' ? '3-5 seconds' : '15 seconds - 5 minutes'
      };
    }

    // Check for duplicate payments
    try {
      const recentPayments = await billingService.getPaymentHistory(userId, 10, 0);
      const duplicatePayment = recentPayments.payments.find((payment: any) =>
        payment.billId === billId &&
        payment.status === 'SUCCESS' &&
        new Date(payment.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      if (duplicatePayment) {
        validationResult.warnings = validationResult.warnings || [];
        validationResult.warnings.push('A successful payment for this bill was already made in the last 24 hours');
        validationResult.duplicatePayment = {
          transactionId: duplicatePayment.transactionId,
          amount: duplicatePayment.amount,
          timestamp: duplicatePayment.createdAt
        };
      }
    } catch (error) {
      console.error('Failed to check for duplicate payments:', error);
    }

    // Validate bill status
    if (bill.status === 'PAID') {
      validationResult.warnings = validationResult.warnings || [];
      validationResult.warnings.push('This bill has already been marked as paid');
    }

    // Check if bill is overdue
    const isOverdue = new Date() > new Date(bill.dueDate);
    if (isOverdue) {
      validationResult.overdue = true;
      validationResult.daysOverdue = Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    }

    res.status(200).json({
      status: 200,
      message: 'Payment validation completed',
      data: validationResult
    });

  } catch (error) {
    console.error('Payment validation error:', error);

    // Handle blockchain-specific errors
    if (error instanceof BlockchainErrorImpl) {
      return res.status(400).json({
        status: 400,
        error: 'Blockchain validation failed',
        code: error.code,
        network: error.network,
        details: error.message
      });
    }

    res.status(500).json({
      status: 500,
      error: 'Payment validation failed'
    });
  }
};

/**
 * @openapi
 * /api/payment/status/{transactionId}:
 *   get:
 *     summary: Get transaction status with blockchain verification
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [ETHEREUM, POLYGON, STELLAR]
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *       404:
 *         description: Transaction not found
 */
export const getTransactionStatus = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { network } = req.query;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        error: 'User authentication required'
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        status: 400,
        error: 'Transaction ID is required'
      });
    }

    // First, get the payment from our database
    const paymentHistory = await billingService.getPaymentHistory(userId, 1000, 0);
    const payment = paymentHistory.payments.find((p: any) =>
      p.transactionId === transactionId || p.id === transactionId
    );

    if (!payment) {
      return res.status(404).json({
        status: 404,
        error: 'Transaction not found'
      });
    }

    // Verify the payment belongs to the authenticated user
    if (payment.userId !== userId) {
      return res.status(403).json({
        status: 403,
        error: 'Access denied'
      });
    }

    const statusResult: any = {
      transactionId: payment.transactionId,
      paymentId: payment.id,
      billId: payment.billId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };

    // If this is a blockchain payment, get live status from blockchain
    if (payment.method?.includes('CRYPTO') || payment.method?.includes('STELLAR')) {
      try {
        // Extract network from payment method or use provided network
        const paymentNetwork = network as BlockchainNetwork ||
          payment.method?.split('_')[1] as BlockchainNetwork;

        if (paymentNetwork && Object.values(BlockchainNetwork).includes(paymentNetwork)) {
          const blockchainStatus = await paymentService.getPaymentStatus(
            payment.transactionId,
            paymentNetwork
          );

          statusResult.blockchain = {
            network: paymentNetwork,
            hash: blockchainStatus.hash,
            status: blockchainStatus.status,
            confirmations: blockchainStatus.confirmations,
            timestamp: blockchainStatus.timestamp,
            from: blockchainStatus.from,
            to: blockchainStatus.to,
            amount: blockchainStatus.amount,
            asset: blockchainStatus.asset,
            fee: blockchainStatus.fee,
            gasUsed: blockchainStatus.gasUsed,
            gasPrice: blockchainStatus.gasPrice,
            blockNumber: blockchainStatus.blockNumber,
            blockTimestamp: blockchainStatus.blockTimestamp
          };

          // Determine if transaction is fully confirmed
          const isConfirmed = blockchainStatus.status === TransactionStatus.CONFIRMED &&
            (blockchainStatus.confirmations || 0) >= 1;

          statusResult.isConfirmed = isConfirmed;
          statusResult.needsVerification = !isConfirmed && payment.status === 'SUCCESS';

          // Add verification recommendations
          if (!isConfirmed && blockchainStatus.status === TransactionStatus.PENDING) {
            statusResult.recommendations = [
              'Transaction is still being processed on the blockchain',
              'Typical confirmation time: ' + (
                paymentNetwork === BlockchainNetwork.STELLAR ? '3-5 seconds' :
                  paymentNetwork === BlockchainNetwork.POLYGON ? '2-5 minutes' :
                    '5-15 minutes'
              ),
              'Check back in a few minutes for updated status'
            ];
          } else if (blockchainStatus.status === TransactionStatus.FAILED) {
            statusResult.recommendations = [
              'Transaction failed on the blockchain',
              'Check if sufficient funds were available',
              'Verify network fees were adequate',
              'Contact support if issue persists'
            ];
          }
        } else {
          statusResult.blockchain = {
            error: 'Invalid or unsupported network',
            network: paymentNetwork
          };
        }
      } catch (error) {
        console.error(`Failed to get blockchain status for transaction ${transactionId}:`, error);
        statusResult.blockchain = {
          status: 'UNKNOWN',
          error: 'Failed to retrieve blockchain status',
          details: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Add bill information
    try {
      const bill = await billingService.getBill(payment.billId);
      if (bill) {
        statusResult.bill = {
          id: bill.id,
          amount: bill.amount,
          dueDate: bill.dueDate,
          status: bill.status,
          utility: bill.utility
        };
      }
    } catch (error) {
      console.error('Failed to get bill information:', error);
    }

    // Add payment timeline
    statusResult.timeline = [
      {
        event: 'Payment Initiated',
        timestamp: payment.createdAt,
        status: 'completed'
      }
    ];

    if (payment.updatedAt && payment.updatedAt !== payment.createdAt) {
      statusResult.timeline.push({
        event: 'Payment Processed',
        timestamp: payment.updatedAt,
        status: 'completed'
      });
    }

    if (statusResult.blockchain?.timestamp) {
      statusResult.timeline.push({
        event: 'Blockchain Confirmation',
        timestamp: statusResult.blockchain.timestamp,
        status: statusResult.isConfirmed ? 'completed' : 'pending'
      });
    }

    res.status(200).json({
      status: 200,
      message: 'Transaction status retrieved successfully',
      data: statusResult
    });

  } catch (error) {
    console.error('Transaction status error:', error);

    // Handle blockchain-specific errors
    if (error instanceof BlockchainErrorImpl) {
      return res.status(400).json({
        status: 400,
        error: 'Blockchain status check failed',
        code: error.code,
        network: error.network,
        details: error.message
      });
    }

    res.status(500).json({
      status: 500,
      error: 'Failed to retrieve transaction status'
    });
  }
};

/**
 * @openapi
 * /api/payment/networks:
 *   get:
 *     summary: Get supported blockchain networks and their status
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Network information retrieved successfully
 */
export const getSupportedNetworks = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 401,
        error: 'User authentication required'
      });
    }

    const supportedNetworks = paymentService.getSupportedNetworks();
    const networkStatus = await paymentService.getConnectionStatus();
    const healthCheck = await paymentService.healthCheck();
    const networkMetrics = paymentService.getMetrics();

    const networkInfo: any = {};

    for (const network of supportedNetworks) {
      const isConnected = networkStatus.get(network) || false;
      const isHealthy = healthCheck.get(network) || false;
      const metrics = networkMetrics[network];

      // Get fee information
      let feeInfo;
      try {
        feeInfo = await paymentService.getNetworkFeeInfo(network);
      } catch (error) {
        feeInfo = { error: 'Failed to retrieve fee information' };
      }

      networkInfo[network] = {
        name: network,
        isConnected,
        isHealthy,
        feeInfo,
        metrics,
        supportedAssets: network === BlockchainNetwork.STELLAR
          ? ['XLM', 'USDC', 'EURT']
          : ['ETH', 'USDC', 'USDT'],
        estimatedProcessingTime: network === BlockchainNetwork.STELLAR
          ? '3-5 seconds'
          : network === BlockchainNetwork.POLYGON
            ? '2-5 minutes'
            : '5-15 minutes',
        addressFormat: network === BlockchainNetwork.STELLAR
          ? 'G[A-Z0-9]{55}'
          : '0x[a-fA-F0-9]{40}'
      };
    }

    res.status(200).json({
      status: 200,
      message: 'Network information retrieved successfully',
      data: {
        networks: networkInfo,
        summary: {
          totalNetworks: supportedNetworks.length,
          connectedNetworks: Array.from(networkStatus.values()).filter(Boolean).length,
          healthyNetworks: Array.from(healthCheck.values()).filter(Boolean).length
        }
      }
    });

  } catch (error) {
    console.error('Network information error:', error);
    res.status(500).json({
      status: 500,
      error: 'Failed to retrieve network information'
    });
  }
};
