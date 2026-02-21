import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  CreditCard, 
  Calendar, 
  Zap, 
  Droplets, 
  Flame, 
  Wifi,
  Mail,
  Smartphone,
  MessageSquare,
  Check,
  X,
  Info,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Globe,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UtilityType, UtilityTypeBadge } from './UtilityTypeSelector';

export interface UtilityPreferences {
  // General Preferences
  defaultUtilityType?: UtilityType;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  
  // Notification Preferences
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    billReminder: boolean;
    paymentConfirmation: boolean;
    usageAlerts: boolean;
    outageNotifications: boolean;
    promotionalOffers: boolean;
  };
  
  // Payment Preferences
  payments: {
    defaultPaymentMethod: string;
    autoPayEnabled: boolean;
    autoPayDay: number;
    paymentReminders: boolean;
    reminderDays: number;
    lowBalanceAlert: boolean;
    lowBalanceThreshold: number;
  };
  
  // Security Preferences
  security: {
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
    sessionTimeout: number;
    requirePinForPayments: boolean;
    paymentLimit: number;
  };
  
  // Display Preferences
  display: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    showUsageGraphs: boolean;
    showCostBreakdown: boolean;
    defaultView: 'grid' | 'list' | 'carousel';
  };
  
  // Utility-specific Preferences
  utilitySpecific: Record<UtilityType, {
    alerts: {
      highUsage: boolean;
      unusualUsage: boolean;
      rateChanges: boolean;
      maintenanceSchedule: boolean;
    };
    reporting: {
      frequency: 'weekly' | 'monthly' | 'quarterly';
      includeUsage: boolean;
      includeCosts: boolean;
      includeComparisons: boolean;
    };
    automation: {
      smartScheduling: boolean;
      budgetTracking: boolean;
      anomalyDetection: boolean;
    };
  }>;
}

interface UtilityPreferencesProps {
  preferences: UtilityPreferences;
  onPreferencesChange: (preferences: UtilityPreferences) => void;
  onSave?: (preferences: UtilityPreferences) => void;
  onReset?: () => void;
  className?: string;
}

const defaultPreferences: UtilityPreferences = {
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  
  notifications: {
    email: true,
    sms: false,
    push: true,
    billReminder: true,
    paymentConfirmation: true,
    usageAlerts: true,
    outageNotifications: true,
    promotionalOffers: false
  },
  
  payments: {
    defaultPaymentMethod: '',
    autoPayEnabled: false,
    autoPayDay: 1,
    paymentReminders: true,
    reminderDays: 3,
    lowBalanceAlert: true,
    lowBalanceThreshold: 50
  },
  
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    requirePinForPayments: false,
    paymentLimit: 1000
  },
  
  display: {
    theme: 'light',
    compactMode: false,
    showUsageGraphs: true,
    showCostBreakdown: true,
    defaultView: 'grid'
  },
  
  utilitySpecific: {
    electricity: {
      alerts: {
        highUsage: true,
        unusualUsage: true,
        rateChanges: true,
        maintenanceSchedule: true
      },
      reporting: {
        frequency: 'monthly',
        includeUsage: true,
        includeCosts: true,
        includeComparisons: true
      },
      automation: {
        smartScheduling: false,
        budgetTracking: true,
        anomalyDetection: true
      }
    },
    water: {
      alerts: {
        highUsage: true,
        unusualUsage: true,
        rateChanges: true,
        maintenanceSchedule: true
      },
      reporting: {
        frequency: 'monthly',
        includeUsage: true,
        includeCosts: true,
        includeComparisons: true
      },
      automation: {
        smartScheduling: false,
        budgetTracking: true,
        anomalyDetection: true
      }
    },
    gas: {
      alerts: {
        highUsage: true,
        unusualUsage: true,
        rateChanges: true,
        maintenanceSchedule: true
      },
      reporting: {
        frequency: 'monthly',
        includeUsage: true,
        includeCosts: true,
        includeComparisons: true
      },
      automation: {
        smartScheduling: false,
        budgetTracking: true,
        anomalyDetection: true
      }
    },
    internet: {
      alerts: {
        highUsage: true,
        unusualUsage: true,
        rateChanges: true,
        maintenanceSchedule: true
      },
      reporting: {
        frequency: 'monthly',
        includeUsage: true,
        includeCosts: true,
        includeComparisons: true
      },
      automation: {
        smartScheduling: false,
        budgetTracking: true,
        anomalyDetection: true
      }
    }
  }
};

export const UtilityPreferences: React.FC<UtilityPreferencesProps> = ({
  preferences,
  onPreferencesChange,
  onSave,
  onReset,
  className
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const utilityIcons = {
    electricity: Zap,
    water: Droplets,
    gas: Flame,
    internet: Wifi
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'utility-specific', label: 'Utility Settings', icon: Globe }
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'EST', label: 'EST (Eastern Standard Time)' },
    { value: 'PST', label: 'PST (Pacific Standard Time)' },
    { value: 'CET', label: 'CET (Central European Time)' },
    { value: 'JST', label: 'JST (Japan Standard Time)' }
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)' }
  ];

  useEffect(() => {
    setHasChanges(JSON.stringify(preferences) !== JSON.stringify(defaultPreferences));
  }, [preferences]);

  const handlePreferenceChange = (path: string, value: any) => {
    const newPreferences = { ...preferences };
    const keys = path.split('.');
    let current: any = newPreferences;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onPreferencesChange(newPreferences);
  };

  const handleSave = () => {
    onSave?.(preferences);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const handleReset = () => {
    onReset?.();
    onPreferencesChange(defaultPreferences);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Utility Type
          </label>
          <select
            value={preferences.defaultUtilityType || ''}
            onChange={(e) => handlePreferenceChange('defaultUtilityType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select default utility</option>
            {(['electricity', 'water', 'gas', 'internet'] as UtilityType[]).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={preferences.currency}
            onChange={(e) => handlePreferenceChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {dateFormats.map(format => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Notification Preferences</h4>
            <p className="text-sm text-blue-700 mt-1">
              Choose how you want to receive notifications about your utility accounts.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Notification Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'sms', label: 'SMS', icon: Smartphone },
            { key: 'push', label: 'Push Notifications', icon: Bell }
          ].map(({ key, label, icon: Icon }) => (
            <label key={key} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                onChange={(e) => handlePreferenceChange(`notifications.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Icon className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Notification Types</h3>
        <div className="space-y-3">
          {[
            { key: 'billReminder', label: 'Bill Reminders', description: 'Get notified when bills are due' },
            { key: 'paymentConfirmation', label: 'Payment Confirmations', description: 'Confirm successful payments' },
            { key: 'usageAlerts', label: 'Usage Alerts', description: 'Alerts for unusual usage patterns' },
            { key: 'outageNotifications', label: 'Outage Notifications', description: 'Service outage updates' },
            { key: 'promotionalOffers', label: 'Promotional Offers', description: 'Special offers and discounts' }
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                onChange={(e) => handlePreferenceChange(`notifications.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Payment Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Payment Method
            </label>
            <select
              value={preferences.payments.defaultPaymentMethod}
              onChange={(e) => handlePreferenceChange('payments.defaultPaymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select payment method</option>
              <option value="card">Credit/Debit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="mobile">Mobile Money</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto-pay Day
            </label>
            <select
              value={preferences.payments.autoPayDay}
              onChange={(e) => handlePreferenceChange('payments.autoPayDay', parseInt(e.target.value))}
              disabled={!preferences.payments.autoPayEnabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'autoPayEnabled', label: 'Enable Auto-pay', description: 'Automatically pay bills on due date' },
            { key: 'paymentReminders', label: 'Payment Reminders', description: 'Get reminded before payments are due' },
            { key: 'lowBalanceAlert', label: 'Low Balance Alerts', description: 'Alert when account balance is low' }
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.payments[key as keyof typeof preferences.payments]}
                onChange={(e) => handlePreferenceChange(`payments.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Days Before Due
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={preferences.payments.reminderDays}
              onChange={(e) => handlePreferenceChange('payments.reminderDays', parseInt(e.target.value))}
              disabled={!preferences.payments.paymentReminders}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Balance Threshold ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={preferences.payments.lowBalanceThreshold}
              onChange={(e) => handlePreferenceChange('payments.lowBalanceThreshold', parseFloat(e.target.value))}
              disabled={!preferences.payments.lowBalanceAlert}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Security Settings</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Configure security settings to protect your account and payments.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Authentication</h3>
        <div className="space-y-3">
          {[
            { key: 'twoFactorEnabled', label: 'Two-Factor Authentication', description: 'Add an extra layer of security' },
            { key: 'biometricEnabled', label: 'Biometric Authentication', description: 'Use fingerprint or face recognition' },
            { key: 'requirePinForPayments', label: 'Require PIN for Payments', description: 'Enter PIN for all payments' }
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.security[key as keyof typeof preferences.security]}
                onChange={(e) => handlePreferenceChange(`security.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <select
            value={preferences.security.sessionTimeout}
            onChange={(e) => handlePreferenceChange('security.sessionTimeout', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Limit ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={preferences.security.paymentLimit}
            onChange={(e) => handlePreferenceChange('security.paymentLimit', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Appearance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={preferences.display.theme}
              onChange={(e) => handlePreferenceChange('display.theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default View
            </label>
            <select
              value={preferences.display.defaultView}
              onChange={(e) => handlePreferenceChange('display.defaultView', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'compactMode', label: 'Compact Mode', description: 'Use more compact layout' },
            { key: 'showUsageGraphs', label: 'Show Usage Graphs', description: 'Display usage graphs on dashboard' },
            { key: 'showCostBreakdown', label: 'Show Cost Breakdown', description: 'Display detailed cost breakdown' }
          ].map(({ key, label, description }) => (
            <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={preferences.display[key as keyof typeof preferences.display]}
                onChange={(e) => handlePreferenceChange(`display.${key}`, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUtilitySpecificTab = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-purple-900">Utility-Specific Settings</h4>
            <p className="text-sm text-purple-700 mt-1">
              Configure settings specific to each utility type for personalized experience.
            </p>
          </div>
        </div>
      </div>

      {(['electricity', 'water', 'gas', 'internet'] as UtilityType[]).map(utilityType => {
        const Icon = utilityIcons[utilityType];
        const prefs = preferences.utilitySpecific[utilityType];
        
        return (
          <div key={utilityType} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(utilityType)}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-600" />
                <UtilityTypeBadge type={utilityType} />
                <span className="font-semibold text-gray-900 capitalize">
                  {utilityType} Settings
                </span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedSections[utilityType] && 'rotate-180'
              )} />
            </button>
            
            {expandedSections[utilityType] && (
              <div className="p-4 space-y-6">
                {/* Alerts Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Alerts</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'highUsage', label: 'High Usage Alerts' },
                      { key: 'unusualUsage', label: 'Unusual Usage Detection' },
                      { key: 'rateChanges', label: 'Rate Change Notifications' },
                      { key: 'maintenanceSchedule', label: 'Maintenance Schedule' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={prefs.alerts[key as keyof typeof prefs.alerts]}
                          onChange={(e) => handlePreferenceChange(`utilitySpecific.${utilityType}.alerts.${key}`, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reporting Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Reporting</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Frequency
                      </label>
                      <select
                        value={prefs.reporting.frequency}
                        onChange={(e) => handlePreferenceChange(`utilitySpecific.${utilityType}.reporting.frequency`, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    {[
                      { key: 'includeUsage', label: 'Include Usage Data' },
                      { key: 'includeCosts', label: 'Include Cost Analysis' },
                      { key: 'includeComparisons', label: 'Include Historical Comparisons' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={prefs.reporting[key as keyof typeof prefs.reporting]}
                          onChange={(e) => handlePreferenceChange(`utilitySpecific.${utilityType}.reporting.${key}`, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Automation Section */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Automation</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'smartScheduling', label: 'Smart Payment Scheduling' },
                      { key: 'budgetTracking', label: 'Budget Tracking' },
                      { key: 'anomalyDetection', label: 'Anomaly Detection' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={prefs.automation[key as keyof typeof prefs.automation]}
                          onChange={(e) => handlePreferenceChange(`utilitySpecific.${utilityType}.automation.${key}`, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'payments':
        return renderPaymentsTab();
      case 'security':
        return renderSecurityTab();
      case 'display':
        return renderDisplayTab();
      case 'utility-specific':
        return renderUtilitySpecificTab();
      default:
        return renderGeneralTab();
    }
  };

  return (
    <div className={cn('bg-white rounded-xl shadow-lg', className)}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
              <p className="text-gray-600 mt-1">
                Customize your utility management experience
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Unsaved changes
                </div>
              )}
              
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  hasChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>

      {/* Save Confirmation */}
      {showSaveConfirm && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          Preferences saved successfully!
        </div>
      )}
    </div>
  );
};

export default UtilityPreferences;
