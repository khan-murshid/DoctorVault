import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { formatDate, formatDateTime } from '../lib/utils';
import { Search, FileText } from 'lucide-react';

export const DischargeRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await db.dischargeRecords.getAll();
      setRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error('Failed to load discharge records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = records.filter(
        (record) =>
          record.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.discharge_diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  }, [searchQuery, records]);

  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedRecord(null)}
          className="text-[#2D7DD2] hover:text-[#2564a8] text-sm"
        >
          ← Back to Records
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#0A0F2C]">Discharge Summary</h1>
              <p className="text-gray-600 mt-1">{selectedRecord.patients?.name}</p>
            </div>
            <FileText className="w-12 h-12 text-[#2D7DD2]" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Patient Information</h3>
                <p className="text-lg font-semibold text-[#0A0F2C]">{selectedRecord.patients?.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedRecord.patients?.age} years • {selectedRecord.patients?.gender}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Discharge Date</h3>
                <p className="text-lg font-semibold text-[#0A0F2C]">
                  {formatDate(selectedRecord.discharge_date)}
                </p>
                <p className="text-sm text-gray-600">Total Stay: {selectedRecord.total_days} days</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#0A0F2C] mb-2">Discharge Diagnosis</h3>
              <p className="text-gray-700">{selectedRecord.discharge_diagnosis}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#0A0F2C] mb-2">Summary</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.discharge_summary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#0A0F2C] mb-2">Follow-up Instructions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedRecord.followup_instructions}</p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Record created: {formatDateTime(selectedRecord.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A0F2C]">Discharge Records</h1>
        <p className="text-gray-600 mt-1">Complete discharge documentation and history</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#2D7DD2] border-t-transparent"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No discharge records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Discharge Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-[#0A0F2C]">{record.patients?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">
                          {record.patients?.age} years • {record.patients?.gender}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{formatDate(record.discharge_date)}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{record.total_days} days</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 truncate max-w-xs">
                        {record.discharge_diagnosis}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-[#2D7DD2] hover:text-[#2564a8] text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
