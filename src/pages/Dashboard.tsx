import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Bed, Users, AlertTriangle, TrendingUp, Clock, Activity } from 'lucide-react';
import { predictAdmissions } from '../lib/utils';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdmitted: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    criticalPatients: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<number[]>([]);

  const loadData = async () => {
    try {
      const [patientsData, bedsData, alertsData, doctorsData] = await Promise.all([
        db.patients.getAdmitted(),
        db.beds.getAll(),
        db.alerts.getUnresolved(),
        db.doctors.getAll(),
      ]);

      const criticalCount = patientsData.filter((p: any) => p.status === 'critical').length;
      const availableCount = bedsData.filter((b: any) => b.status === 'available').length;
      const occupiedCount = bedsData.filter((b: any) => b.status === 'occupied').length;

      setStats({
        totalAdmitted: patientsData.length,
        availableBeds: availableCount,
        occupiedBeds: occupiedCount,
        totalBeds: bedsData.length,
        criticalPatients: criticalCount,
      });

      setAlerts(alertsData);
      setDoctors(doctorsData);
      setPredictions(predictAdmissions(patientsData.length));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const bedData = [
    { name: 'Occupied', value: stats.occupiedBeds, color: '#E63946' },
    { name: 'Available', value: stats.availableBeds, color: '#2DC653' },
    { name: 'Maintenance', value: stats.totalBeds - stats.occupiedBeds - stats.availableBeds, color: '#F4A261' },
  ];

  const predictionData = predictions.map((value, index) => ({
    day: `Day ${index + 1}`,
    admissions: value,
  }));

  const occupancyRate = ((stats.occupiedBeds / stats.totalBeds) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0F2C]">Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time hospital operations overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Admitted Patients</p>
              <p className="text-3xl font-bold text-[#0A0F2C] mt-2">{stats.totalAdmitted}</p>
              {stats.criticalPatients > 0 && (
                <p className="text-sm text-red-600 mt-2">{stats.criticalPatients} critical</p>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#2D7DD2]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Available Beds</p>
              <p className="text-3xl font-bold text-[#0A0F2C] mt-2">{stats.availableBeds}</p>
              <p className="text-sm text-gray-500 mt-2">of {stats.totalBeds} total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Bed className="w-6 h-6 text-[#2DC653]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Bed Occupancy</p>
              <p className="text-3xl font-bold text-[#0A0F2C] mt-2">{occupancyRate}%</p>
              <p className="text-sm text-orange-600 mt-2">
                {parseInt(occupancyRate) > 90 ? 'Technically fine. Practically chaos.' : 'Within capacity'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#F4A261]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Alerts</p>
              <p className="text-3xl font-bold text-[#0A0F2C] mt-2">{alerts.length}</p>
              {alerts.filter((a: any) => a.severity === 'critical').length > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  {alerts.filter((a: any) => a.severity === 'critical').length} critical
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#E63946]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0A0F2C] mb-4">Bed Availability</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {bedData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#2D7DD2]" />
            <h2 className="text-lg font-semibold text-[#0A0F2C]">Admission Predictions</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Expected admissions for next 7 days</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Line type="monotone" dataKey="admissions" stroke="#2D7DD2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A0F2C]">Critical Alerts</h2>
            <span className="text-sm text-gray-500">{alerts.length} unresolved</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active alerts</p>
            ) : (
              alerts.slice(0, 10).map((alert: any) => (
                <Link
                  key={alert.id}
                  to={`/patients/${alert.patient_id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-[#2D7DD2] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        alert.severity === 'critical'
                          ? 'bg-red-500'
                          : alert.severity === 'high'
                          ? 'bg-orange-500'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0F2C]">
                        {alert.patients?.name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {alert.alert_type} • {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#E63946]" />
            <h2 className="text-lg font-semibold text-[#0A0F2C]">Doctor Burnout Watch</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Monitoring shift hours</p>
          <div className="space-y-4">
            {doctors.map((doctor: any) => (
              <div key={doctor.id} className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-[#0A0F2C]">{doctor.name}</p>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doctor.status === 'on-duty'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {doctor.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Shift Hours</span>
                    <span className={doctor.shift_hours > 10 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {doctor.shift_hours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        doctor.shift_hours > 10 ? 'bg-red-500' : 'bg-[#2D7DD2]'
                      }`}
                      style={{ width: `${Math.min((doctor.shift_hours / 12) * 100, 100)}%` }}
                    />
                  </div>
                  {doctor.shift_hours > 10 && (
                    <p className="text-xs text-red-600 mt-2">
                      {doctor.shift_hours} hours. Someone check on {doctor.name.split(' ')[1]}.
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Patients seen today: {doctor.patients_seen_today}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0A0F2C] to-[#1a2456] rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Honest Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-300">Beds occupied:</p>
            <p className="text-2xl font-bold mt-1">{occupancyRate}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {parseInt(occupancyRate) > 90
                ? 'Technically fine. Practically chaos.'
                : 'Comfortable capacity'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Average wait time today:</p>
            <p className="text-2xl font-bold mt-1">
              {stats.totalAdmitted > 10 ? '2.3' : '0.8'} hours
            </p>
            <p className="text-xs text-gray-400 mt-1">Our record is 6.</p>
          </div>
          <div>
            <p className="text-sm text-gray-300">Queue position:</p>
            <p className="text-2xl font-bold mt-1">{Math.max(1, stats.totalAdmitted - 8)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Estimated wait: {Math.max(20, (stats.totalAdmitted - 8) * 15)} minutes. We're sorry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
