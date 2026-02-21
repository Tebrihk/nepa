import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Droplets, 
  Flame, 
  Wifi,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Plus,
  X,
  Info,
  ChevronDown,
  User,
  Home,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UtilityType, UtilityTypeBadge, UtilityTypeStats } from './UtilityTypeSelector';

export interface UtilityAccount {
  id: string;
  utilityType: UtilityType;
  providerName: string;
  accountNumber: string;
  serviceAddress: string;
  status: 'active' | 'inactive' | 'suspended';
  balance: number;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  monthlyAverage?: number;
  isPrimary?: boolean;
  autoPayEnabled?: boolean;
}

export interface UtilitySwitcherProps {
  accounts: UtilityAccount[];
  onAccountSelect: (accountId: string) => void;
  onAccountAdd: (utilityType: UtilityType) => void;
  onAccountRemove: (accountId: string) => void;
  onAccountUpdate: (accountId: string, updates: Partial<UtilityAccount>) => void;
  selectedAccountId?: string;
  showStats?: boolean;
  allowAdding?: boolean;
  allowRemoving?: boolean;
  className?: string;
}

export const UtilitySwitcher: React.FC<UtilitySwitcherProps> = ({
  accounts,
  onAccountSelect,
  onAccountAdd,
  onAccountRemove,
  onAccountUpdate,
  selectedAccountId,
  showStats = true,
  allowAdding = true,
  allowRemoving = true,
  className
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'carousel'>('grid');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAddUtility, setShowAddUtility] = useState(false);
  const [selectedUtilityType, setSelectedUtilityType] = useState<UtilityType>('electricity');
  const [showAccountDetails, setShowAccountDetails] = useState<string | null>(null);

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.utilityType]) {
      acc[account.utilityType] = [];
    }
    acc[account.utilityType].push(account);
    return acc;
  }, {} as Record<UtilityType, UtilityAccount[]>);

  const utilityIcons = {
    electricity: Zap,
    water: Droplets,
    gas: Flame,
    internet: Wifi
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'inactive': return AlertCircle;
      case 'suspended': return X;
      default: return AlertCircle;
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(accounts.length - 1, prev + 1));
  };

  const handleAccountSelect = (accountId: string) => {
    onAccountSelect(accountId);
    setShowAccountDetails(null);
  };

  const handleAddUtility = () => {
    onAccountAdd(selectedUtilityType);
    setShowAddUtility(false);
  };

  const handleToggleAutoPay = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      onAccountUpdate(accountId, { autoPayEnabled: !account.autoPayEnabled });
    }
  };

  const handleSetPrimary = (accountId: string) => {
    // Reset all accounts to non-primary
    accounts.forEach(account => {
      if (account.isPrimary) {
        onAccountUpdate(account.id, { isPrimary: false });
      }
    });
    // Set new primary
    onAccountUpdate(accountId, { isPrimary: true });
  };

  const renderAccountCard = (account: UtilityAccount, index: number) => {
    const Icon = utilityIcons[account.utilityType];
    const StatusIcon = getStatusIcon(account.status);
    const isSelected = account.id === selectedAccountId;
    const isPrimary = account.isPrimary;

    return (
      <div
        key={account.id}
        className={cn(
          'relative bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer',
          'hover:shadow-lg hover:border-blue-300',
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200',
          'p-6'
        )}
        onClick={() => handleAccountSelect(account.id)}
      >
        {/* Primary Badge */}
        {isPrimary && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            PRIMARY
          </div>
        )}

        {/* Auto-pay Badge */}
        {account.autoPayEnabled && (
          <div className="absolute -top-2 -left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            AUTO-PAY
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-lg',
              isSelected ? 'bg-blue-100' : 'bg-gray-100'
            )}>
              <Icon className={cn(
                'w-6 h-6',
                isSelected ? 'text-blue-600' : 'text-gray-600'
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{account.providerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <UtilityTypeBadge type={account.utilityType} size="sm" />
                <div className={cn(
                  'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                  getStatusColor(account.status)
                )}>
                  <StatusIcon className="w-3 h-3" />
                  {account.status}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAccountDetails(showAccountDetails === account.id ? null : account.id);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Account</span>
            <span className="font-medium text-gray-900">{account.accountNumber}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Balance</span>
            <span className={cn(
              'font-semibold',
              account.balance > 0 ? 'text-red-600' : 'text-green-600'
            )}>
              ${Math.abs(account.balance).toFixed(2)}
              {account.balance > 0 ? ' Due' : ' Credit'}
            </span>
          </div>

          {account.monthlyAverage && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Avg</span>
              <span className="font-medium text-gray-900">${account.monthlyAverage.toFixed(2)}</span>
            </div>
          )}

          {account.nextBillingDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Billing</span>
              <span className="font-medium text-gray-900">
                {new Date(account.nextBillingDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleAutoPay(account.id);
            }}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              account.autoPayEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <RefreshCw className="w-3 h-3" />
            {account.autoPayEnabled ? 'Auto-pay ON' : 'Auto-pay OFF'}
          </button>
          
          {!isPrimary && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetPrimary(account.id);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Star className="w-3 h-3" />
              Set Primary
            </button>
          )}
        </div>

        {/* Account Details */}
        {showAccountDetails === account.id && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">Service Address</div>
                <div className="text-sm text-gray-600">{account.serviceAddress}</div>
              </div>
            </div>
            
            {account.lastPaymentDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Last Payment</div>
                  <div className="text-sm text-gray-600">
                    {new Date(account.lastPaymentDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account, index) => renderAccountCard(account, index))}
      
      {allowAdding && (
        <button
          onClick={() => setShowAddUtility(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200"
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Add Utility Account</h3>
              <p className="text-sm text-gray-600 mt-1">Connect a new utility provider</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {accounts.map((account, index) => (
        <div
          key={account.id}
          className={cn(
            'bg-white rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer',
            'hover:shadow-md hover:border-blue-300',
            account.id === selectedAccountId ? 'border-blue-500 shadow-md' : 'border-gray-200'
          )}
          onClick={() => handleAccountSelect(account.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-2 rounded-lg',
                account.id === selectedAccountId ? 'bg-blue-100' : 'bg-gray-100'
              )}>
                {React.createElement(utilityIcons[account.utilityType], {
                  className: cn(
                    'w-5 h-5',
                    account.id === selectedAccountId ? 'text-blue-600' : 'text-gray-600'
                  )
                })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{account.providerName}</h3>
                  <UtilityTypeBadge type={account.utilityType} size="sm" />
                  {account.isPrimary && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      PRIMARY
                    </span>
                  )}
                  {account.autoPayEnabled && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                      AUTO-PAY
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {account.accountNumber} • {account.serviceAddress}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className={cn(
                  'font-semibold',
                  account.balance > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  ${Math.abs(account.balance).toFixed(2)}
                  {account.balance > 0 ? ' Due' : ' Credit'}
                </div>
                {account.nextBillingDate && (
                  <div className="text-sm text-gray-600">
                    Due: {new Date(account.nextBillingDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {allowRemoving && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccountRemove(account.id);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {allowAdding && (
        <button
          onClick={() => setShowAddUtility(true)}
          className="w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 hover:bg-gray-100 transition-all duration-200"
        >
          <div className="flex items-center justify-center gap-3">
            <Plus className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Add New Utility Account</span>
          </div>
        </button>
      )}
    </div>
  );

  const renderCarouselView = () => {
    const visibleAccounts = viewMode === 'carousel' 
      ? accounts.slice(currentIndex, currentIndex + 1)
      : accounts;

    return (
      <div className="relative">
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300 ease-in-out">
            {visibleAccounts.map((account, index) => (
              <div key={account.id} className="w-full flex-shrink-0 px-2">
                {renderAccountCard(account, currentIndex + index)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation */}
        {accounts.length > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentIndex === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              {accounts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentIndex === accounts.length - 1}
              className={cn(
                'p-2 rounded-lg transition-colors',
                currentIndex === accounts.length - 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderAddUtilityModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Add Utility Account</h3>
          <button
            onClick={() => setShowAddUtility(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Utility Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['electricity', 'water', 'gas', 'internet'] as UtilityType[]).map((type) => {
                const Icon = utilityIcons[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedUtilityType(type)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all duration-200',
                      'hover:border-blue-300 hover:bg-blue-50',
                      selectedUtilityType === type 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    )}
                  >
                    <Icon className={cn(
                      'w-6 h-6 mx-auto mb-2',
                      selectedUtilityType === type ? 'text-blue-600' : 'text-gray-600'
                    )} />
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {type}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowAddUtility(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddUtility}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderStats = () => {
    if (!showStats || accounts.length === 0) return null;

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalMonthlyAverage = accounts.reduce((sum, acc) => sum + (acc.monthlyAverage || 0), 0);
    const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
    const autoPayEnabled = accounts.filter(acc => acc.autoPayEnabled).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${Math.abs(totalBalance).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Balance</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalMonthlyAverage.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Monthly Average</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {activeAccounts}/{accounts.length}
              </div>
              <div className="text-sm text-gray-600">Active Accounts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {autoPayEnabled}
              </div>
              <div className="text-sm text-gray-600">Auto-pay Enabled</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utility Accounts</h2>
          <p className="text-gray-600 mt-1">
            Manage your utility accounts and switch between them
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                viewMode === 'carousel' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Accounts Display */}
      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6">
            <Home className="w-10 h-10 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Utility Accounts
          </h3>
          <p className="text-gray-600 mb-6">
            Add your first utility account to get started with bill payments and management.
          </p>
          {allowAdding && (
            <button
              onClick={() => setShowAddUtility(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Account
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'carousel' && renderCarouselView()}
        </>
      )}

      {/* Add Utility Modal */}
      {showAddUtility && renderAddUtilityModal()}
    </div>
  );
};

export default UtilitySwitcher;
