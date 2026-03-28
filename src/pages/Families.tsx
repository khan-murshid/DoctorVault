import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Plus, X, Users } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';
import { calculateDaysAdmitted, getStatusColor } from '../lib/utils';

export const Families = () => {
  const [families, setFamilies] = useState<any[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    family_name: '',
    emergency_contact: '',
    emergency_phone: '',
    address: '',
  });

  const loadFamilies = async () => {
    try {
      const data = await db.families.getAll();
      const familiesWithCounts = await Promise.all(
        data.map(async (family: any) => {
          const patients = await db.patients.getAll();
          const memberCount = patients.filter((p: any) => p.family_id === family.id).length;
          return { ...family, memberCount };
        })
      );
      setFamilies(familiesWithCounts);
    } catch (error) {
      showToast('Failed to load families', 'error');
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    try {
      const allPatients = await db.patients.getAll();
      const members = allPatients.filter((p: any) => p.family_id === familyId);
      setFamilyMembers(members);
    } catch (error) {
      showToast('Failed to load family members', 'error');
    }
  };

  useEffect(() => {
    loadFamilies();

    const channel = supabase
      .channel('families-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families' }, loadFamilies)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, loadFamilies)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyMembers(selectedFamily.id);
    }
  }, [selectedFamily]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await db.families.create(formData);
      showToast('Family added successfully', 'success');
      setShowModal(false);
      setFormData({
        family_name: '',
        emergency_contact: '',
        emergency_phone: '',
        address: '',
      });
      loadFamilies();
    } catch (error) {
      showToast('Failed to add family', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0F2C]">Family Portal</h1>
          <p className="text-gray-600 mt-1">Manage patient families and relationships</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Family
        </button>
      </div>

      {selectedFamily ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setSelectedFamily(null)}
              className="text-[#2D7DD2] hover:text-[#2564a8] mb-4 text-sm"
            >
              ← Back to Families
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0A0F2C]">{selectedFamily.family_name}</h2>
                <p className="text-gray-600 mt-2">Emergency Contact: {selectedFamily.emergency_contact}</p>
                <p className="text-gray-600">Phone: {selectedFamily.emergency_phone}</p>
                <p className="text-gray-600">Address: {selectedFamily.address}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>{familyMembers.length} members</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Family Members</h3>
            {familyMembers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No members in this family</p>
            ) : (
              <div className="space-y-3">
                {familyMembers.map((member: any) => (
                  <Link
                    key={member.id}
                    to={`/patients/${member.id}`}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#2D7DD2] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-[#0A0F2C]">{member.name}</h4>
                        {member.is_child && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Child
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {member.age} years • {member.gender} • {member.blood_type}
                      </p>
                      {member.status !== 'discharged' && (
                        <p className="text-sm text-gray-600 mt-1">
                          {member.ward} • Bed {member.bed_number} (Floor {member.floor})
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                      {member.status !== 'discharged' && (
                        <p className="text-sm text-gray-600 mt-2">
                          {calculateDaysAdmitted(member.admission_date)} days
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {families.map((family) => (
            <div
              key={family.id}
              onClick={() => setSelectedFamily(family)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-[#2D7DD2] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">{family.family_name}</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  <span>{family.memberCount}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Emergency Contact</p>
                  <p className="font-medium text-[#0A0F2C]">{family.emergency_contact}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-[#0A0F2C]">{family.emergency_phone}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-medium text-[#0A0F2C]">{family.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-[#0A0F2C]">Add Family</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                <input
                  type="text"
                  required
                  value={formData.family_name}
                  onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact *</label>
                <input
                  type="text"
                  required
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.emergency_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
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
                  Add Family
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
