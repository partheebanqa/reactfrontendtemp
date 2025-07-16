import React from 'react';
import { CreditCard, Plus, Download } from 'lucide-react';

const AccountBilling: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Billing & Payments</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your billing information and view payment history
        </p>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Payment Methods</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-500">Expires 12/24</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Default
            </span>
          </div>
          <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Add new payment method
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Billing History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              date: 'Feb 1, 2024',
              amount: '$29.00',
              status: 'Paid',
              invoice: '#INV-2024-002'
            },
            {
              date: 'Jan 1, 2024',
              amount: '$29.00',
              status: 'Paid',
              invoice: '#INV-2024-001'
            }
          ].map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.date}</p>
                <p className="text-sm text-gray-500">{item.invoice}</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-900">{item.amount}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {item.status}
                </span>
                <button className="text-gray-400 hover:text-gray-500">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Current Plan</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">Professional Plan</p>
              <p className="text-sm text-gray-500">$29/month</p>
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Change Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBilling;