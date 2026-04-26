import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import DashboardLayout from '../components/DashboardLayout';
import { Home, Zap, CreditCard, History } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { t, formatCurrency } = useTranslation();

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        <section aria-labelledby="dashboard-heading">
          <h2 id="dashboard-heading" className="text-3xl font-semibold text-gray-900">{t('dashboard.title') || 'Dashboard'}</h2>
          <p className="text-gray-600 text-lg">{t('dashboard.description') || 'Welcome to your NEPA payment dashboard'}</p>
        </section>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Usage</h3>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">₦{formatCurrency(245) || '245.00'}</p>
            <p className="text-gray-600">This month</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Last Payment</h3>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">₦{formatCurrency(45.2) || '45.20'}</p>
            <p className="text-gray-600">15 days ago</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Next Bill</h3>
              <History className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-600">₦{formatCurrency(52.8) || '52.80'}</p>
            <p className="text-gray-600">Due in 5 days</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Saved</h3>
              <Home className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">₦{formatCurrency(120) || '120.00'}</p>
            <p className="text-gray-600">This year</p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.quickActions') || 'Quick Actions'}</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium">
              {t('dashboard.payNow') || 'Pay Now'}
            </button>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium">
              {t('dashboard.viewHistory') || 'View History'}
            </button>
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
              {t('dashboard.updateProfile') || 'Update Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Electricity Bill</p>
                  <p className="text-sm text-gray-600">Jan 15, 2024</p>
                </div>
                <span className="font-semibold text-green-600">₦45.20</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Electricity Bill</p>
                  <p className="text-sm text-gray-600">Dec 15, 2023</p>
                </div>
                <span className="font-semibold text-green-600">₦52.80</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Electricity Bill</p>
                  <p className="text-sm text-gray-600">Nov 15, 2023</p>
                </div>
                <span className="font-semibold text-green-600">₦38.50</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Stellar Wallet</p>
                    <p className="text-sm text-gray-600">••••1234</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Default</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
