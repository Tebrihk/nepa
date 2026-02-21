import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Droplets, 
  Flame, 
  Wifi, 
  ChevronDown,
  Check,
  Settings,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UtilityType = 'electricity' | 'water' | 'gas' | 'internet';

export interface UtilityConfig {
  id: UtilityType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  features: string[];
  popular?: boolean;
  status: 'active' | 'coming-soon' | 'maintenance';
}

const utilityConfigs: UtilityConfig[] = [
  {
    id: 'electricity',
    name: 'Electricity',
    description: 'Pay electricity bills from multiple providers',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    features: [
      'Instant payment confirmation',
      'Multiple provider support',
      'Usage analytics',
      'Bill reminders'
    ],
    popular: true,
    status: 'active'
  },
  {
    id: 'water',
    name: 'Water',
    description: 'Manage water utility payments and consumption',
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: [
      'Water usage tracking',
      'Leak detection alerts',
      'Consumption analytics',
      'Monthly reports'
    ],
    status: 'active'
  },
  {
    id: 'gas',
    name: 'Gas',
    description: 'Pay for natural gas and LPG services',
    icon: Flame,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    features: [
      'Gas consumption monitoring',
      'Safety alerts',
      'Usage predictions',
      'Cost optimization'
    ],
    status: 'coming-soon'
  },
  {
    id: 'internet',
    name: 'Internet',
    description: 'Manage internet and broadband services',
    icon: Wifi,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Data usage tracking',
      'Speed monitoring',
      'Plan optimization',
      'Outage notifications'
    ],
    status: 'coming-soon'
  }
];

interface UtilityTypeSelectorProps {
  selectedUtility?: UtilityType;
  onUtilitySelect: (utility: UtilityType) => void;
  disabled?: boolean;
  showFeatures?: boolean;
  variant?: 'grid' | 'list' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UtilityTypeSelector: React.FC<UtilityTypeSelectorProps> = ({
  selectedUtility,
  onUtilitySelect,
  disabled = false,
  showFeatures = true,
  variant = 'grid',
  size = 'md',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredUtility, setHoveredUtility] = useState<UtilityType | null>(null);

  const handleUtilitySelect = (utility: UtilityType) => {
    if (!disabled) {
      onUtilitySelect(utility);
      if (variant === 'dropdown') {
        setIsOpen(false);
      }
    }
  };

  const getSelectedConfig = () => {
    return utilityConfigs.find(config => config.id === selectedUtility);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-2',
          icon: 'w-4 h-4',
          text: 'text-sm',
          spacing: 'gap-2'
        };
      case 'lg':
        return {
          container: 'p-6',
          icon: 'w-8 h-8',
          text: 'text-lg',
          spacing: 'gap-4'
        };
      default:
        return {
          container: 'p-4',
          icon: 'w-6 h-6',
          text: 'text-base',
          spacing: 'gap-3'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'dropdown') {
    const selectedConfig = getSelectedConfig();
    const SelectedIcon = selectedConfig?.icon || Zap;

    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between',
            'border rounded-lg transition-all duration-200',
            'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
            selectedConfig?.bgColor || 'bg-white',
            selectedConfig?.borderColor || 'border-gray-200',
            sizeClasses.container,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className={cn('flex items-center', sizeClasses.spacing)}>
            <SelectedIcon className={cn(sizeClasses.icon, selectedConfig?.color)} />
            <span className={cn('font-medium', sizeClasses.text)}>
              {selectedConfig?.name || 'Select Utility Type'}
            </span>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="max-h-64 overflow-y-auto">
              {utilityConfigs.map((config) => {
                const Icon = config.icon;
                return (
                  <button
                    key={config.id}
                    onClick={() => handleUtilitySelect(config.id)}
                    disabled={config.status !== 'active'}
                    className={cn(
                      'w-full flex items-center justify-between p-3 text-left',
                      'hover:bg-gray-50 transition-colors duration-150',
                      config.status !== 'active' && 'opacity-50 cursor-not-allowed',
                      selectedUtility === config.id && 'bg-blue-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn('w-5 h-5', config.color)} />
                      <div>
                        <div className="font-medium">{config.name}</div>
                        <div className="text-sm text-gray-500">{config.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.popular && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      {config.status === 'coming-soon' && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Coming Soon
                        </span>
                      )}
                      {selectedUtility === config.id && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {utilityConfigs.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedUtility === config.id;
          
          return (
            <button
              key={config.id}
              onClick={() => handleUtilitySelect(config.id)}
              disabled={disabled || config.status !== 'active'}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-lg border',
                'transition-all duration-200 hover:shadow-md',
                config.bgColor,
                config.borderColor,
                isSelected && 'ring-2 ring-blue-500 shadow-md',
                (disabled || config.status !== 'active') && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'p-3 rounded-full bg-white shadow-sm',
                  sizeClasses.container
                )}>
                  <Icon className={cn(sizeClasses.icon, config.color)} />
                </div>
                <div className="text-left">
                  <div className={cn('font-semibold', sizeClasses.text)}>
                    {config.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {config.description}
                  </div>
                  {config.popular && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-yellow-600">Most Popular</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {config.status === 'coming-soon' && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
                {isSelected && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {utilityConfigs.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedUtility === config.id;
          const isHovered = hoveredUtility === config.id;
          
          return (
            <button
              key={config.id}
              onClick={() => handleUtilitySelect(config.id)}
              onMouseEnter={() => setHoveredUtility(config.id)}
              onMouseLeave={() => setHoveredUtility(null)}
              disabled={disabled || config.status !== 'active'}
              className={cn(
                'relative p-6 rounded-xl border-2 transition-all duration-300',
                'hover:shadow-lg hover:scale-105',
                config.bgColor,
                config.borderColor,
                isSelected && 'ring-2 ring-blue-500 shadow-lg scale-105',
                (disabled || config.status !== 'active') && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Popular Badge */}
              {config.popular && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              
              {/* Status Badge */}
              {config.status === 'coming-soon' && (
                <div className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SOON
                </div>
              )}
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={cn(
                  'p-4 rounded-full bg-white shadow-md transition-transform',
                  isHovered && 'scale-110'
                )}>
                  <Icon className={cn('w-8 h-8', config.color)} />
                </div>
                
                <div>
                  <h3 className={cn('font-bold text-gray-900', sizeClasses.text)}>
                    {config.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {config.description}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Features Display */}
      {showFeatures && selectedUtility && (
        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {getSelectedConfig()?.name} Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getSelectedConfig()?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility Type Badge Component
export const UtilityTypeBadge: React.FC<{
  type: UtilityType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}> = ({ type, size = 'md', showLabel = true }) => {
  const config = utilityConfigs.find(c => c.id === type);
  if (!config) return null;

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full font-medium',
      config.bgColor,
      config.color,
      config.borderColor,
      'border',
      sizeClasses[size]
    )}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.name}</span>}
    </div>
  );
};

// Utility Type Stats Component
export const UtilityTypeStats: React.FC<{
  type: UtilityType;
  stats: {
    totalBills: number;
    totalAmount: number;
    paidBills: number;
    pendingBills: number;
  };
}> = ({ type, stats }) => {
  const config = utilityConfigs.find(c => c.id === type);
  if (!config) return null;

  const Icon = config.icon;
  const paymentRate = stats.totalBills > 0 ? (stats.paidBills / stats.totalBills) * 100 : 0;

  return (
    <div className={cn('p-4 rounded-lg border', config.bgColor, config.borderColor)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white">
            <Icon className={cn('w-5 h-5', config.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-600">Utility Overview</p>
          </div>
        </div>
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            ${stats.totalAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Amount</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalBills}
          </div>
          <div className="text-sm text-gray-600">Total Bills</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {stats.paidBills}
          </div>
          <div className="text-sm text-gray-600">Paid Bills</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.pendingBills}
          </div>
          <div className="text-sm text-gray-600">Pending Bills</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Payment Rate</span>
          <span className="text-sm font-semibold text-gray-900">{paymentRate.toFixed(1)}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${paymentRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UtilityTypeSelector;
