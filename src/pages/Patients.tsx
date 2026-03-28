import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { calculateDaysAdmitted, getStatusColor } from '../lib/utils';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

export const Patients = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ ward: '', floor: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    blood_type: '',
    phone: '',
    address: '',
    chief_complaint: '',
    onset_date: new Date().toISOString().split('T')[0],
    severity: 'mild',
    progression_notes: '',
    ward: 'General Ward',
    floor: '1',
    bed_number: '',
    assigned_doctor_id: '',
    family_id: '',
    is_child: false,
  });

  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await db.patients.getAdmitted();
      setPatients(data);
      setFilteredPatients(data);
    } catch (error) {
      showToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const [bedsData, doctorsData, familiesData] = await Promise.all([
        db.beds.getAvailable(),
        db.doctors.getAll(),
        db.families.getAll(),
      ]);
      setAvailableBeds(bedsData);
      setDoctors(doctorsData);
      setFamilies(familiesData);
    } catch (error) {
      showToast('Failed to load form data', 'error');
    }
  };

  useEffect(() => {
    loadPatients();
    loadDropdownData();

    const channel = supabase
  .channel('patients-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
    loadPatients();
    loadDropdownData();
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, () => {
    loadDropdownData();
  })
  .subscribe();

return () => {
  supabase.removeChannel(channel);
};
  }, []);

  useEffect(() => {
    let result = patients;

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.blood_type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.ward) {
      result = result.filter((p) => p.ward === filters.ward);
    }

    if (filters.floor) {
      result = result.filter((p) => p.floor.toString() === filters.floor);
    }

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    setFilteredPatients(result);
  }, [searchQuery, filters, patients]);

  useEffect(() => {
    if (formData.floor && formData.ward) {
      const loadFilteredBeds = async () => {
        const beds = await db.beds.getAvailable(parseInt(formData.floor), formData.ward);
        setAvailableBeds(beds);
      };
      loadFilteredBeds();
    }
  }, [formData.floor, formData.ward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bed_number) {
      showToast('Please select a bed', 'error');
      return;
    }

    try {
      const newPatient = await db.patients.create({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        blood_type: formData.blood_type,
        phone: formData.phone,
        address: formData.address,
        admission_date: new Date().toISOString(),
        status: 'admitted',
        ward: formData.ward,
        bed_number: formData.bed_number,
        floor: parseInt(formData.floor),
        family_id: formData.family_id || null,
        assigned_doctor_id: formData.assigned_doctor_id || null,
        is_child: formData.is_child,
      });

      await db.symptoms.create({
        patient_id: newPatient.id,
        chief_complaint: formData.chief_complaint,
        onset_date: formData.onset_date,
        severity: formData.severity as 'mild' | 'moderate' | 'severe',
        progression_notes: formData.progression_notes,
      });

      await db.beds.assignToPatient(formData.bed_number, newPatient.id);

      showToast('Patient admitted successfully', 'success');
setShowModal(false);
setFormData({
  name: '',
  age: '',
  gender: 'Male',
  blood_type: '',
  phone: '',
  address: '',
  chief_complaint: '',
  onset_date: new Date().toISOString().split('T')[0],
  severity: 'mild',
  progression_notes: '',
  ward: 'General Ward',
  floor: '1',
  bed_number: '',
  assigned_doctor_id: '',
  family_id: '',
  is_child: false,
});
setTimeout(async () => {
  await loadPatients();
  await loadDropdownData();
}, 500);
    } catch (error) {
      showToast('Failed to admit patient', 'error');
    }
  };

  const wards = ['General Ward', 'ICU', 'Pediatric', 'Surgery'];
  const floors = ['1', '2', '3'];
  const statuses = ['admitted', 'critical'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0A0F2C]">Patients</h1>
          <p className="text-gray-600 mt-1">Manage admitted patients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Patient
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or blood type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filters.ward}
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
            >
              <option value="">All Wards</option>
              {wards.map((ward) => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
            <select
              value={filters.floor}
              onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
            >
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
            >
              <option value="">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2D7DD2] border-t-transparent"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-[#2D7DD2] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#0A0F2C]">{patient.name}</h3>
                  <p className="text-sm text-gray-600">
                    {patient.age} years • {patient.gender}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Type:</span>
                  <span className="font-medium text-[#0A0F2C]">{patient.blood_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ward:</span>
                  <span className="font-medium text-[#0A0F2C]">{patient.ward}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bed:</span>
                  <span className="font-medium text-[#0A0F2C]">
                    {patient.bed_number} (Floor {patient.floor})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Admitted:</span>
                  <span className="font-medium text-[#0A0F2C]">
                    {calculateDaysAdmitted(patient.admission_date)}
                  </span>
                </div>
                {patient.doctors && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Doctor:</span>
                    <span className="font-medium text-[#0A0F2C]">{patient.doctors.name}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A0F2C]">Admit New Patient</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input
                      type="number"
                      required
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <input
                      type="text"
                      value={formData.blood_type}
                      onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                      placeholder="e.g., O+"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Clinical Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
                    <input
                      type="text"
                      required
                      value={formData.chief_complaint}
                      onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Onset Date</label>
                      <input
                        type="date"
                        value={formData.onset_date}
                        onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Progression Notes</label>
                    <textarea
                      value={formData.progression_notes}
                      onChange={(e) => setFormData({ ...formData, progression_notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Admission Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ward *</label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value, bed_number: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    >
                      {wards.map((ward) => (
                        <option key={ward} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                    <select
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value, bed_number: '' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    >
                      {floors.map((floor) => (
                        <option key={floor} value={floor}>
                          Floor {floor}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed *</label>
                    <select
                      value={formData.bed_number}
                      onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                      required
                    >
                      <option value="">Select Bed</option>
                      {availableBeds.map((bed: any) => (
                        <option key={bed.id} value={bed.bed_number}>
                          {bed.bed_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor</label>
                    <select
                      value={formData.assigned_doctor_id}
                      onChange={(e) => setFormData({ ...formData, assigned_doctor_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((doctor: any) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Family</label>
                    <select
                      value={formData.family_id}
                      onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                    >
                      <option value="">Select Family</option>
                      {families.map((family: any) => (
                        <option key={family.id} value={family.id}>
                          {family.family_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_child}
                      onChange={(e) => setFormData({ ...formData, is_child: e.target.checked })}
                      className="w-4 h-4 text-[#2D7DD2] border-gray-300 rounded focus:ring-[#2D7DD2]"
                    />
                    <span className="text-sm text-gray-700">Patient is a child</span>
                  </label>
                </div>
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
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
