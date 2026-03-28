import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export const Settings = () => {
  const { showToast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [bedAlertThreshold, setBedAlertThreshold] = useState(90);
  const [doctorBurnoutThreshold, setDoctorBurnoutThreshold] = useState(10);
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    bedUpdates: true,
    newAdmissions: false,
    discharges: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('doctorVaultSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDarkMode(settings.darkMode || false);
      setBedAlertThreshold(settings.bedAlertThreshold || 90);
      setDoctorBurnoutThreshold(settings.doctorBurnoutThreshold || 10);
      setNotifications(settings.notifications || notifications);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      darkMode,
      bedAlertThreshold,
      doctorBurnoutThreshold,
      notifications,
    };
    localStorage.setItem('doctorVaultSettings', JSON.stringify(settings));
    showToast('Settings saved successfully', 'success');
  };

  useEffect(() => {
    saveSettings();
  }, [darkMode, bedAlertThreshold, doctorBurnoutThreshold, notifications]);

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset all demo data? This action cannot be undone.')) {
      return;
    }

    try {
      const tables = [
        'hunch_log',
        'alerts',
        'lab_reports',
        'prescriptions',
        'diagnoses',
        'vitals',
        'symptoms',
        'discharge_records',
        'patients',
        'beds',
        'doctors',
        'families',
      ];

      for (const table of tables) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      showToast('Demo data reset successfully. Please refresh the page.', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showToast('Failed to reset data', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0F2C]">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your preferences and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0A0F2C] mb-4 flex items-center gap-2">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0A0F2C]">Dark Mode</p>
                <p className="text-sm text-gray-600">Toggle dark theme</p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-[#2D7DD2]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {darkMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Dark mode is enabled in settings but not fully implemented in this demo.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0A0F2C] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0A0F2C]">Critical Alerts</p>
                <p className="text-sm text-gray-600">Notify for critical patient alerts</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, criticalAlerts: !notifications.criticalAlerts })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.criticalAlerts ? 'bg-[#2D7DD2]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.criticalAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0A0F2C]">Bed Updates</p>
                <p className="text-sm text-gray-600">Notify for bed status changes</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, bedUpdates: !notifications.bedUpdates })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.bedUpdates ? 'bg-[#2D7DD2]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.bedUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0A0F2C]">New Admissions</p>
                <p className="text-sm text-gray-600">Notify for new patient admissions</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, newAdmissions: !notifications.newAdmissions })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.newAdmissions ? 'bg-[#2D7DD2]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.newAdmissions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#0A0F2C]">Discharges</p>
                <p className="text-sm text-gray-600">Notify for patient discharges</p>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, discharges: !notifications.discharges })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.discharges ? 'bg-[#2D7DD2]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.discharges ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0A0F2C] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alert Thresholds
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0A0F2C] mb-2">
                Bed Alert Threshold: {bedAlertThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={bedAlertThreshold}
                onChange={(e) => setBedAlertThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2D7DD2 0%, #2D7DD2 ${bedAlertThreshold}%, #e5e7eb ${bedAlertThreshold}%, #e5e7eb 100%)`,
                }}
              />
              <p className="text-sm text-gray-600 mt-2">
                Alert when bed occupancy exceeds this percentage
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0F2C] mb-2">
                Doctor Burnout Threshold: {doctorBurnoutThreshold} hours
              </label>
              <input
                type="range"
                min="6"
                max="16"
                value={doctorBurnoutThreshold}
                onChange={(e) => setDoctorBurnoutThreshold(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #2D7DD2 0%, #2D7DD2 ${((doctorBurnoutThreshold - 6) / 10) * 100}%, #e5e7eb ${((doctorBurnoutThreshold - 6) / 10) * 100}%, #e5e7eb 100%)`,
                }}
              />
              <p className="text-sm text-gray-600 mt-2">
                Flag doctors working more than this many hours
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0A0F2C] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Danger Zone
          </h2>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-1">Reset Demo Data</p>
              <p className="text-sm text-red-700 mb-3">
                This will delete all current data and reseed the database with fresh demo data. This action cannot be undone.
              </p>
              <button
                onClick={handleResetData}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          All settings are automatically saved to your browser's local storage.
        </p>
      </div>
    </div>
  );
};
