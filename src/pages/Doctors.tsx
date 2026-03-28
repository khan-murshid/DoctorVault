import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { getStatusColor } from '../lib/utils';
import { Plus, X, Clock, Users } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export const Doctors = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    status: 'off-duty',
  });

  const loadDoctors = async () => {
    try {
      const data = await db.doctors.getAll();
      setDoctors(data);
    } catch (error) {
      showToast('Failed to load doctors', 'error');
    }
  };

  useEffect(() => {
    loadDoctors();

    const channel = supabase
      .channel('doctors-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, loadDoctors)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await db.doctors.create({
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        email: formData.email,
        shift_hours: 0,
        patients_seen_today: 0,
        status: formData.status as 'on-duty' | 'off-duty',
      });

      showToast('Doctor added successfully', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        specialty: '',
        phone: '',
        email: '',
        status: 'off-duty',
      });
      loadDoctors();
    } catch (error) {
      showToast('Failed to add doctor', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0F2C]">Doctors</h1>
          <p className="text-gray-600 mt-1">Medical staff and shift monitoring</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0A0F2C]">{doctor.name}</h3>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.status)}`}>
                {doctor.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <span>{doctor.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span className="truncate">{doctor.email || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">Shift Hours</span>
                  </div>
                  <span className={doctor.shift_hours > 10 ? 'text-red-600 font-semibold' : 'font-semibold text-[#0A0F2C]'}>
                    {doctor.shift_hours}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
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

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Patients Today</span>
                </div>
                <span className="font-semibold text-[#0A0F2C]">{doctor.patients_seen_today}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-[#0A0F2C]">Add Doctor</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
                <input
                  type="text"
                  required
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                >
                  <option value="off-duty">Off Duty</option>
                  <option value="on-duty">On Duty</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors"
                >
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
