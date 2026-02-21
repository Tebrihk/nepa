import React, { useState, useEffect } from 'react';
import { 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building, 
  FileText, 
  Calendar,
  Zap,
  Droplets,
  Flame,
  Wifi,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UtilityType } from './UtilityTypeSelector';

export interface UtilityFormData {
  // Common fields
  accountNumber: string;
  customerName: string;
  serviceAddress: string;
  phoneNumber: string;
  email: string;
  
  // Electricity specific
  meterNumber?: string;
  tariffClass?: string;
  connectionType?: string;
  averageMonthlyUsage?: number;
  
  // Water specific
  waterMeterNumber?: string;
  connectionSize?: string;
  propertyType?: string;
  averageMonthlyConsumption?: number;
  
  // Gas specific
  gasMeterNumber?: string;
  gasConnectionType?: string;
  applianceCount?: number;
  averageGasConsumption?: number;
  
  // Internet specific
  servicePlan?: string;
  connectionSpeed?: string;
  dataCap?: string;
  contractType?: string;
}

interface UtilityFormFieldsProps {
  utilityType: UtilityType;
  formData: Partial<UtilityFormData>;
  onChange: (data: Partial<UtilityFormData>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showValidation?: boolean;
  className?: string;
}

export const UtilityFormFields: React.FC<UtilityFormFieldsProps> = ({
  utilityType,
  formData,
  onChange,
  errors = {},
  disabled = false,
  showValidation = true,
  className
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleFieldChange = (field: string, value: string | number) => {
    onChange({ ...formData, [field]: value });
  };

  const handleFieldBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  const getFieldError = (field: string) => {
    if (!showValidation) return '';
    if (touched[field] || errors[field]) {
      return errors[field] || '';
    }
    return '';
  };

  const renderCommonFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Account Number"
          name="accountNumber"
          value={formData.accountNumber || ''}
          onChange={(value) => handleFieldChange('accountNumber', value)}
          onBlur={() => handleFieldBlur('accountNumber')}
          error={getFieldError('accountNumber')}
          disabled={disabled}
          required
          icon={FileText}
          placeholder="Enter your utility account number"
        />
        
        <FormField
          label="Customer Name"
          name="customerName"
          value={formData.customerName || ''}
          onChange={(value) => handleFieldChange('customerName', value)}
          onBlur={() => handleFieldBlur('customerName')}
          error={getFieldError('customerName')}
          disabled={disabled}
          required
          icon={User}
          placeholder="Full name as on utility bill"
        />
      </div>

      <FormField
        label="Service Address"
        name="serviceAddress"
        value={formData.serviceAddress || ''}
        onChange={(value) => handleFieldChange('serviceAddress', value)}
        onBlur={() => handleFieldBlur('serviceAddress')}
        error={getFieldError('serviceAddress')}
        disabled={disabled}
        required
        icon={MapPin}
        placeholder="Street address where utility is provided"
        multiline
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber || ''}
          onChange={(value) => handleFieldChange('phoneNumber', value)}
          onBlur={() => handleFieldBlur('phoneNumber')}
          error={getFieldError('phoneNumber')}
          disabled={disabled}
          required
          icon={Phone}
          placeholder="+1 (555) 123-4567"
          type="tel"
        />
        
        <FormField
          label="Email Address"
          name="email"
          value={formData.email || ''}
          onChange={(value) => handleFieldChange('email', value)}
          onBlur={() => handleFieldBlur('email')}
          error={getFieldError('email')}
          disabled={disabled}
          required
          icon={Mail}
          placeholder="your.email@example.com"
          type="email"
        />
      </div>
    </div>
  );

  const renderElectricityFields = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Electricity Service Details</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Please provide your electricity service information for accurate billing and usage tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Meter Number"
          name="meterNumber"
          value={formData.meterNumber || ''}
          onChange={(value) => handleFieldChange('meterNumber', value)}
          onBlur={() => handleFieldBlur('meterNumber')}
          error={getFieldError('meterNumber')}
          disabled={disabled}
          required
          icon={Calculator}
          placeholder="Found on your electricity meter"
        />
        
        <SelectField
          label="Tariff Class"
          name="tariffClass"
          value={formData.tariffClass || ''}
          onChange={(value) => handleFieldChange('tariffClass', value)}
          onBlur={() => handleFieldBlur('tariffClass')}
          error={getFieldError('tariffClass')}
          disabled={disabled}
          required
          options={[
            { value: 'residential', label: 'Residential' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'agricultural', label: 'Agricultural' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Connection Type"
          name="connectionType"
          value={formData.connectionType || ''}
          onChange={(value) => handleFieldChange('connectionType', value)}
          onBlur={() => handleFieldBlur('connectionType')}
          error={getFieldError('connectionType')}
          disabled={disabled}
          required
          options={[
            { value: 'single-phase', label: 'Single Phase' },
            { value: 'three-phase', label: 'Three Phase' },
            { value: 'prepaid', label: 'Prepaid' },
            { value: 'postpaid', label: 'Postpaid' }
          ]}
        />
        
        <FormField
          label="Average Monthly Usage (kWh)"
          name="averageMonthlyUsage"
          value={formData.averageMonthlyUsage || ''}
          onChange={(value) => handleFieldChange('averageMonthlyUsage', Number(value))}
          onBlur={() => handleFieldBlur('averageMonthlyUsage')}
          error={getFieldError('averageMonthlyUsage')}
          disabled={disabled}
          icon={TrendingUp}
          placeholder="500"
          type="number"
          min="0"
        />
      </div>
    </div>
  );

  const renderWaterFields = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Droplets className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Water Service Details</h4>
            <p className="text-sm text-blue-700 mt-1">
              Provide your water service information for consumption tracking and leak detection.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Water Meter Number"
          name="waterMeterNumber"
          value={formData.waterMeterNumber || ''}
          onChange={(value) => handleFieldChange('waterMeterNumber', value)}
          onBlur={() => handleFieldBlur('waterMeterNumber')}
          error={getFieldError('waterMeterNumber')}
          disabled={disabled}
          required
          icon={Calculator}
          placeholder="Found on your water meter"
        />
        
        <SelectField
          label="Connection Size"
          name="connectionSize"
          value={formData.connectionSize || ''}
          onChange={(value) => handleFieldChange('connectionSize', value)}
          onBlur={() => handleFieldBlur('connectionSize')}
          error={getFieldError('connectionSize')}
          disabled={disabled}
          required
          options={[
            { value: '0.5', label: '0.5 inch' },
            { value: '0.75', label: '0.75 inch' },
            { value: '1', label: '1 inch' },
            { value: '1.5', label: '1.5 inch' },
            { value: '2', label: '2 inch' },
            { value: '4', label: '4 inch' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Property Type"
          name="propertyType"
          value={formData.propertyType || ''}
          onChange={(value) => handleFieldChange('propertyType', value)}
          onBlur={() => handleFieldBlur('propertyType')}
          error={getFieldError('propertyType')}
          disabled={disabled}
          required
          options={[
            { value: 'residential', label: 'Residential' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'institutional', label: 'Institutional' }
          ]}
        />
        
        <FormField
          label="Average Monthly Consumption (gallons)"
          name="averageMonthlyConsumption"
          value={formData.averageMonthlyConsumption || ''}
          onChange={(value) => handleFieldChange('averageMonthlyConsumption', Number(value))}
          onBlur={() => handleFieldBlur('averageMonthlyConsumption')}
          error={getFieldError('averageMonthlyConsumption')}
          disabled={disabled}
          icon={Activity}
          placeholder="5000"
          type="number"
          min="0"
        />
      </div>
    </div>
  );

  const renderGasFields = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-900">Gas Service Details</h4>
            <p className="text-sm text-orange-700 mt-1">
              Enter your gas service information for safety monitoring and consumption tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Gas Meter Number"
          name="gasMeterNumber"
          value={formData.gasMeterNumber || ''}
          onChange={(value) => handleFieldChange('gasMeterNumber', value)}
          onBlur={() => handleFieldBlur('gasMeterNumber')}
          error={getFieldError('gasMeterNumber')}
          disabled={disabled}
          required
          icon={Calculator}
          placeholder="Found on your gas meter"
        />
        
        <SelectField
          label="Gas Connection Type"
          name="gasConnectionType"
          value={formData.gasConnectionType || ''}
          onChange={(value) => handleFieldChange('gasConnectionType', value)}
          onBlur={() => handleFieldBlur('gasConnectionType')}
          error={getFieldError('gasConnectionType')}
          disabled={disabled}
          required
          options={[
            { value: 'natural-gas', label: 'Natural Gas' },
            { value: 'lpg', label: 'LPG (Propane)' },
            { value: 'cng', label: 'Compressed Natural Gas' },
            { value: 'biogas', label: 'Biogas' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Number of Gas Appliances"
          name="applianceCount"
          value={formData.applianceCount || ''}
          onChange={(value) => handleFieldChange('applianceCount', Number(value))}
          onBlur={() => handleFieldBlur('applianceCount')}
          error={getFieldError('applianceCount')}
          disabled={disabled}
          icon={Home}
          placeholder="4"
          type="number"
          min="1"
        />
        
        <FormField
          label="Average Gas Consumption (therms)"
          name="averageGasConsumption"
          value={formData.averageGasConsumption || ''}
          onChange={(value) => handleFieldChange('averageGasConsumption', Number(value))}
          onBlur={() => handleFieldBlur('averageGasConsumption')}
          error={getFieldError('averageGasConsumption')}
          disabled={disabled}
          icon={TrendingUp}
          placeholder="100"
          type="number"
          min="0"
        />
      </div>
    </div>
  );

  const renderInternetFields = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Wifi className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900">Internet Service Details</h4>
            <p className="text-sm text-purple-700 mt-1">
              Provide your internet service information for usage tracking and plan optimization.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Service Plan"
          name="servicePlan"
          value={formData.servicePlan || ''}
          onChange={(value) => handleFieldChange('servicePlan', value)}
          onBlur={() => handleFieldBlur('servicePlan')}
          error={getFieldError('servicePlan')}
          disabled={disabled}
          required
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'standard', label: 'Standard' },
            { value: 'premium', label: 'Premium' },
            { value: 'enterprise', label: 'Enterprise' }
          ]}
        />
        
        <SelectField
          label="Connection Speed"
          name="connectionSpeed"
          value={formData.connectionSpeed || ''}
          onChange={(value) => handleFieldChange('connectionSpeed', value)}
          onBlur={() => handleFieldBlur('connectionSpeed')}
          error={getFieldError('connectionSpeed')}
          disabled={disabled}
          required
          options={[
            { value: '10mbps', label: '10 Mbps' },
            { value: '25mbps', label: '25 Mbps' },
            { value: '50mbps', label: '50 Mbps' },
            { value: '100mbps', label: '100 Mbps' },
            { value: '200mbps', label: '200 Mbps' },
            { value: '500mbps', label: '500 Mbps' },
            { value: '1gbps', label: '1 Gbps' }
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          label="Data Cap"
          name="dataCap"
          value={formData.dataCap || ''}
          onChange={(value) => handleFieldChange('dataCap', value)}
          onBlur={() => handleFieldBlur('dataCap')}
          error={getFieldError('dataCap')}
          disabled={disabled}
          required
          options={[
            { value: 'unlimited', label: 'Unlimited' },
            { value: '100gb', label: '100 GB' },
            { value: '250gb', label: '250 GB' },
            { value: '500gb', label: '500 GB' },
            { value: '1tb', label: '1 TB' },
            { value: '2tb', label: '2 TB' }
          ]}
        />
        
        <SelectField
          label="Contract Type"
          name="contractType"
          value={formData.contractType || ''}
          onChange={(value) => handleFieldChange('contractType', value)}
          onBlur={() => handleFieldBlur('contractType')}
          error={getFieldError('contractType')}
          disabled={disabled}
          required
          options={[
            { value: 'month-to-month', label: 'Month-to-Month' },
            { value: '1-year', label: '1 Year Contract' },
            { value: '2-year', label: '2 Year Contract' },
            { value: '3-year', label: '3 Year Contract' }
          ]}
        />
      </div>
    </div>
  );

  const renderUtilitySpecificFields = () => {
    switch (utilityType) {
      case 'electricity':
        return renderElectricityFields();
      case 'water':
        return renderWaterFields();
      case 'gas':
        return renderGasFields();
      case 'internet':
        return renderInternetFields();
      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-8', className)}>
      {renderCommonFields()}
      {renderUtilitySpecificFields()}
    </div>
  );
};

// Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  multiline?: boolean;
  min?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  placeholder,
  type = 'text',
  multiline = false,
  min
}) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(newValue);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlurEvent = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <div className="space-y-2">
      <label className={cn(
        'block text-sm font-medium text-gray-700',
        required && 'after:content-["*"] after:ml-1 after:text-red-500'
      )}>
        {label}
      </label>
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className={cn(
              'w-5 h-5 text-gray-400 transition-colors',
              focused && 'text-blue-500',
              error && 'text-red-500'
            )} />
          </div>
        )}
        
        {multiline ? (
          <textarea
            id={name}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlurEvent}
            disabled={disabled}
            placeholder={placeholder}
            rows={3}
            className={cn(
              'w-full px-3 py-2 border rounded-lg transition-colors',
              Icon && 'pl-10',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              error ? 'border-red-500' : 'border-gray-300',
              disabled && 'bg-gray-100 cursor-not-allowed',
              focused && !error && 'border-blue-500'
            )}
          />
        ) : (
          <input
            id={name}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlurEvent}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            className={cn(
              'w-full px-3 py-2 border rounded-lg transition-colors',
              Icon && 'pl-10',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              error ? 'border-red-500' : 'border-gray-300',
              disabled && 'bg-gray-100 cursor-not-allowed',
              focused && !error && 'border-blue-500'
            )}
          />
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

// Select Field Component
interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  options
}) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlurEvent = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <div className="space-y-2">
      <label className={cn(
        'block text-sm font-medium text-gray-700',
        required && 'after:content-["*"] after:ml-1 after:text-red-500'
      )}>
        {label}
      </label>
      
      <select
        id={name}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlurEvent}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 border rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-500' : 'border-gray-300',
          disabled && 'bg-gray-100 cursor-not-allowed',
          focused && !error && 'border-blue-500'
        )}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default UtilityFormFields;
