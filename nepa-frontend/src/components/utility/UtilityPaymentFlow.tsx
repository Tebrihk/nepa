import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Bank, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  Droplets,
  Flame,
  Wifi,
  ArrowRight,
  Shield,
  TrendingUp,
  Calendar,
  FileText,
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UtilityType, UtilityTypeBadge } from './UtilityTypeSelector';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'mobile' | 'crypto';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fees: number;
  processingTime: string;
  available: boolean;
  popular?: boolean;
}

export interface UtilityBill {
  id: string;
  utilityType: UtilityType;
  billNumber: string;
  providerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  period: string;
  usage?: {
    current: number;
    previous: number;
    unit: string;
  };
}

export interface PaymentFlow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  estimatedTime: string;
  fees: number;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

interface UtilityPaymentFlowProps {
  utilityType: UtilityType;
  bill: UtilityBill;
  onPaymentComplete: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

export const UtilityPaymentFlow: React.FC<UtilityPaymentFlowProps> = ({
  utilityType,
  bill,
  onPaymentComplete,
  onPaymentError,
  className
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [selectedFlow, setSelectedFlow] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>({});

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      type: 'card',
      name: 'Credit/Debit Card',
      description: 'Instant payment with your card',
      icon: CreditCard,
      fees: 0.025,
      processingTime: 'Instant',
      available: true,
      popular: true
    },
    {
      id: 'bank',
      type: 'bank',
      name: 'Bank Transfer',
      description: 'Direct bank account payment',
      icon: Bank,
      fees: 0.01,
      processingTime: '1-2 business days',
      available: true
    },
    {
      id: 'mobile',
      type: 'mobile',
      name: 'Mobile Money',
      description: 'Pay with mobile money services',
      icon: Smartphone,
      fees: 0.015,
      processingTime: 'Instant',
      available: true
    },
    {
      id: 'crypto',
      type: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, or Stellar',
      icon: Wallet,
      fees: 0.005,
      processingTime: '5-15 minutes',
      available: true
    }
  ];

  const getUtilitySpecificFlows = (): PaymentFlow[] => {
    const baseFlows: PaymentFlow[] = [
      {
        id: 'instant',
        name: 'Instant Payment',
        description: 'Pay immediately and get instant confirmation',
        steps: ['Select payment method', 'Enter payment details', 'Confirm and pay', 'Get receipt'],
        estimatedTime: '2-5 minutes',
        fees: 0.025,
        features: ['Instant confirmation', 'Email receipt', 'Payment tracking'],
        icon: Zap,
        recommended: true
      },
      {
        id: 'scheduled',
        name: 'Scheduled Payment',
        description: 'Schedule payment for a future date',
        steps: ['Select payment date', 'Choose payment method', 'Set up auto-pay', 'Confirm schedule'],
        estimatedTime: '1-2 minutes setup',
        fees: 0.01,
        features: ['Flexible scheduling', 'Auto-pay options', 'Email reminders'],
        icon: Calendar
      }
    ];

    // Add utility-specific flows
    switch (utilityType) {
      case 'electricity':
        return [
          ...baseFlows,
          {
            id: 'prepaid-recharge',
            name: 'Prepaid Recharge',
            description: 'Recharge your prepaid electricity meter',
            steps: ['Enter meter number', 'Select amount', 'Choose payment method', 'Get recharge token'],
            estimatedTime: '3-5 minutes',
            fees: 0.02,
            features: ['Instant token delivery', 'Multiple denominations', 'Balance tracking'],
            icon: Zap
          },
          {
            id: 'postpaid-bill',
            name: 'Postpaid Bill Payment',
            description: 'Pay your monthly electricity bill',
            steps: ['Enter account number', 'Verify bill details', 'Choose payment method', 'Complete payment'],
            estimatedTime: '2-5 minutes',
            fees: 0.025,
            features: ['Bill verification', 'Payment history', 'Due date reminders'],
            icon: FileText
          }
        ];
      
      case 'water':
        return [
          ...baseFlows,
          {
            id: 'water-bill',
            name: 'Water Bill Payment',
            description: 'Pay your monthly water bill',
            steps: ['Enter account number', 'View consumption details', 'Select payment method', 'Complete payment'],
            estimatedTime: '2-5 minutes',
            fees: 0.02,
            features: ['Consumption analytics', 'Leak alerts', 'Usage trends'],
            icon: Droplets
          }
        ];
      
      case 'gas':
        return [
          ...baseFlows,
          {
            id: 'gas-refill',
            name: 'Gas Cylinder Refill',
            description: 'Order and pay for gas cylinder refill',
            steps: ['Select cylinder size', 'Enter delivery address', 'Choose payment method', 'Schedule delivery'],
            estimatedTime: '15-30 minutes',
            fees: 0.03,
            features: ['Home delivery', 'Multiple sizes', 'Safety certified'],
            icon: Flame
          }
        ];
      
      case 'internet':
        return [
          ...baseFlows,
          {
            id: 'internet-recharge',
            name: 'Data Bundle Recharge',
            description: 'Recharge your internet data bundle',
            steps: ['Select data plan', 'Enter phone/account number', 'Choose payment method', 'Instant activation'],
            estimatedTime: '1-3 minutes',
            fees: 0.015,
            features: ['Instant activation', 'Multiple plans', 'Data rollover'],
            icon: Wifi
          }
        ];
      
      default:
        return baseFlows;
    }
  };

  const calculateFees = (amount: number, method: PaymentMethod, flow: PaymentFlow) => {
    const methodFee = amount * method.fees;
    const flowFee = amount * flow.fees;
    return methodFee + flowFee;
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setCurrentStep(1);
  };

  const handleFlowSelect = (flowId: string) => {
    setSelectedFlow(flowId);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      onPaymentComplete(paymentId);
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedPaymentMethodData = paymentMethods.find(m => m.id === selectedPaymentMethod);
  const selectedFlowData = getUtilitySpecificFlows().find(f => f.id === selectedFlow);
  const totalFees = selectedPaymentMethodData && selectedFlowData 
    ? calculateFees(bill.amount, selectedPaymentMethodData, selectedFlowData)
    : 0;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[0, 1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
            currentStep > step ? 'bg-green-600 text-white' :
            currentStep === step ? 'bg-blue-600 text-white' :
            'bg-gray-200 text-gray-600'
          )}>
            {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step + 1}
          </div>
          {step < 3 && (
            <div className={cn(
              'w-full h-1 mx-2 transition-colors',
              currentStep > step ? 'bg-green-600' : 'bg-gray-200'
            )} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPaymentMethodSelection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Payment Method</h3>
        <p className="text-gray-600">Choose how you'd like to pay your {utilityType} bill</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedPaymentMethod === method.id;
          const estimatedFee = (bill.amount * method.fees).toFixed(2);
          
          return (
            <button
              key={method.id}
              onClick={() => handlePaymentMethodSelect(method.id)}
              disabled={!method.available}
              className={cn(
                'relative p-4 rounded-lg border-2 transition-all duration-200',
                'hover:shadow-md hover:border-blue-300',
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200',
                !method.available && 'opacity-50 cursor-not-allowed'
              )}
            >
              {method.popular && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  )} />
                </div>
                
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900">{method.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{method.processingTime}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Fee: </span>
                      <span className="font-semibold text-gray-900">${estimatedFee}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFlowSelection = () => {
    const flows = getUtilitySpecificFlows();
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Flow</h3>
          <p className="text-gray-600">Select the best payment option for your needs</p>
        </div>

        <div className="space-y-4">
          {flows.map((flow) => {
            const Icon = flow.icon;
            const isSelected = selectedFlow === flow.id;
            const estimatedFee = (bill.amount * flow.fees).toFixed(2);
            
            return (
              <button
                key={flow.id}
                onClick={() => handleFlowSelect(flow.id)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 transition-all duration-200',
                  'hover:shadow-md hover:border-blue-300',
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-3 rounded-lg',
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    <Icon className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    )} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{flow.name}</h4>
                      {flow.recommended && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{flow.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Fee: ${estimatedFee}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {flow.features.map((feature, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <ChevronRight className={cn(
                    'w-5 h-5 text-gray-400 transition-transform',
                    isSelected && 'text-blue-600 rotate-90'
                  )} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPaymentDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Summary</h3>
        <p className="text-gray-600">Review your payment details before confirming</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtilityTypeBadge type={utilityType} />
            <div>
              <div className="font-semibold text-gray-900">{bill.providerName}</div>
              <div className="text-sm text-gray-600">{bill.billNumber}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${bill.amount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Bill Amount</div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Method</span>
            <span className="font-medium text-gray-900">
              {selectedPaymentMethodData?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Flow</span>
            <span className="font-medium text-gray-900">
              {selectedFlowData?.name}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Processing Time</span>
            <span className="font-medium text-gray-900">
              {selectedPaymentMethodData?.processingTime}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-900">Total Fees</span>
            <span className="font-semibold text-gray-900">${totalFees.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-lg font-bold text-gray-900">Total Amount</span>
            <span className="text-lg font-bold text-gray-900">
              ${(bill.amount + totalFees).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Payment Information</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Payment confirmation will be sent to your email</li>
              <li>• Transaction ID will be generated after successful payment</li>
              <li>• You can track payment status in your payment history</li>
              <li>• Refunds are processed within 3-5 business days</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={handlePaymentSubmit}
        disabled={isProcessing}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-medium transition-colors',
          'bg-blue-600 text-white hover:bg-blue-700',
          'disabled:bg-gray-300 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Pay ${(bill.amount + totalFees).toFixed(2)}
          </>
        )}
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderPaymentMethodSelection();
      case 1:
        return renderFlowSelection();
      case 2:
        return renderPaymentDetails();
      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <UtilityTypeBadge type={utilityType} size="lg" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <p className="text-gray-600">Complete your {utilityType} bill payment</p>
            </div>
          </div>
          
          {/* Bill Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{bill.providerName}</div>
                <div className="text-sm text-gray-600">{bill.billNumber} • {bill.period}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">${bill.amount.toFixed(2)}</div>
                <div className={cn(
                  'text-sm',
                  bill.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                )}>
                  Due: {new Date(bill.dueDate).toLocaleDateString()}
                  {bill.status === 'overdue' && ' (Overdue)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        {currentStep > 0 && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UtilityPaymentFlow;
