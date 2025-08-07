'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailNotificationChange = (checked: boolean) => {
    setEmailNotifications(checked);
    if (!checked) {
      setNotificationEmail('');
      setEmailError('');
    }
  };

  const handleEmailChange = (email: string) => {
    setNotificationEmail(email);
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSaveSettings = async () => {
    // Validate email if notifications are enabled
    if (emailNotifications && (!notificationEmail || !validateEmail(notificationEmail))) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications,
          notificationEmail: emailNotifications ? notificationEmail : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 mb-6 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Enter your display name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Notifications
              </label>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="email-notifications" 
                  className="mr-2" 
                  checked={emailNotifications}
                  onChange={(e) => handleEmailNotificationChange(e.target.checked)}
                />
                <label htmlFor="email-notifications" className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email notifications for important updates
                </label>
              </div>
              
              {/* Conditional Email Input */}
              {emailNotifications && (
                <div className="mt-4" aria-live="polite">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Email Address
                  </label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      emailError 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Wallet</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Network
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Mainnet</option>
                <option>Testnet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Confirmations
              </label>
              <div className="flex items-center">
                <input type="checkbox" id="tx-confirmations" className="mr-2" defaultChecked />
                <label htmlFor="tx-confirmations" className="text-sm text-gray-600 dark:text-gray-400">
                  Show confirmation dialog for all transactions
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trading</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slippage Tolerance
              </label>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">0.5%</button>
                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm">1%</button>
                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm">3%</button>
                <input
                  type="text"
                  placeholder="Custom"
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-Refresh Data
              </label>
              <div className="flex items-center">
                <input type="checkbox" id="auto-refresh" className="mr-2" defaultChecked />
                <label htmlFor="auto-refresh" className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically refresh market data every 30 seconds
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button and Messages */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving || (emailNotifications && !!emailError)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          {saveMessage && (
            <div className={`text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}