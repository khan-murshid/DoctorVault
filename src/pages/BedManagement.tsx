import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateDaysAdmitted } from '../lib/utils';
import { useToast } from '../contexts/ToastContext';

export const BedManagement = () => {
  const [beds, setBeds] = useState<any[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set([1, 2, 3]));
  const { showToast } = useToast();

  const loadBeds = async () => {
    try {
      const data = await db.beds.getAll();
      setBeds(data);
    } catch (error) {
      showToast('Failed to load beds', 'error');
    }
  };

  useEffect(() => {
    loadBeds();

    const channel = supabase
      .channel('beds-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beds' }, loadBeds)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFloor = (floor: number) => {
    const newExpanded = new Set(expandedFloors);
    if (newExpanded.has(floor)) {
      newExpanded.delete(floor);
    } else {
      newExpanded.add(floor);
    }
    setExpandedFloors(newExpanded);
  };

  const toggleMaintenance = async (bed: any) => {
    if (bed.status === 'occupied') {
      showToast('Cannot set occupied bed to maintenance', 'error');
      return;
    }

    try {
      const newStatus = bed.status === 'maintenance' ? 'available' : 'maintenance';
      await db.beds.update(bed.id, { status: newStatus });
      showToast(`Bed ${bed.bed_number} ${newStatus === 'maintenance' ? 'set to maintenance' : 'made available'}`, 'success');
      loadBeds();
    } catch (error) {
      showToast('Failed to update bed status', 'error');
    }
  };

  const bedsByFloor = beds.reduce((acc: any, bed) => {
    if (!acc[bed.floor]) acc[bed.floor] = {};
    if (!acc[bed.floor][bed.ward]) acc[bed.floor][bed.ward] = [];
    acc[bed.floor][bed.ward].push(bed);
    return acc;
  }, {});

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:border-green-400';
      case 'occupied':
        return 'bg-red-100 border-red-300 hover:border-red-400';
      case 'maintenance':
        return 'bg-yellow-100 border-yellow-300 hover:border-yellow-400';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getTotalStats = () => {
    const available = beds.filter(b => b.status === 'available').length;
    const occupied = beds.filter(b => b.status === 'occupied').length;
    const maintenance = beds.filter(b => b.status === 'maintenance').length;
    return { available, occupied, maintenance, total: beds.length };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0F2C]">Bed Management</h1>
        <p className="text-gray-600 mt-1">Real-time bed availability and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Beds</p>
          <p className="text-3xl font-bold text-[#0A0F2C] mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-3xl font-bold text-[#2DC653] mt-2">{stats.available}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Occupied</p>
          <p className="text-3xl font-bold text-[#E63946] mt-2">{stats.occupied}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-3xl font-bold text-[#F4A261] mt-2">{stats.maintenance}</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(bedsByFloor).sort().map((floor) => (
          <div key={floor} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleFloor(parseInt(floor))}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-xl font-semibold text-[#0A0F2C]">Floor {floor}</h2>
              {expandedFloors.has(parseInt(floor)) ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedFloors.has(parseInt(floor)) && (
              <div className="px-6 pb-6 space-y-6">
                {Object.keys(bedsByFloor[floor]).map((ward) => (
                  <div key={ward}>
                    <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">{ward}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {bedsByFloor[floor][ward].map((bed: any) => (
                        <div
                          key={bed.id}
                          className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${getStatusStyle(bed.status)}`}
                          onClick={() => {
                            if (bed.status === 'occupied' && bed.patients) {
                              window.location.href = `/patients/${bed.patient_id}`;
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-semibold text-[#0A0F2C]">{bed.bed_number}</span>
                            <span
                              className={`w-3 h-3 rounded-full ${
                                bed.status === 'available'
                                  ? 'bg-green-500'
                                  : bed.status === 'occupied'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}
                            />
                          </div>

                          {bed.status === 'occupied' && bed.patients ? (
                            <div className="text-sm">
                              <p className="font-medium text-[#0A0F2C] truncate">{bed.patients.name}</p>
                              <p className="text-gray-600 text-xs mt-1">
                                {calculateDaysAdmitted(bed.patients.admission_date)} days
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="text-gray-600 capitalize">{bed.status}</p>
                              {bed.status !== 'occupied' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMaintenance(bed);
                                  }}
                                  className="text-xs text-[#2D7DD2] hover:underline mt-2"
                                >
                                  {bed.status === 'maintenance' ? 'Make Available' : 'Set Maintenance'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          Click on occupied beds to view patient details. Click available or maintenance beds to toggle status.
        </p>
      </div>
    </div>
  );
};
