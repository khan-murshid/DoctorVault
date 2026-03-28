import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../lib/db';
import { calculateDaysAdmitted, getStatusColor, getSeverityColor, isDangerousDrugCombination, formatDate, formatDateTime, isVitalAbnormal, parseSystolicBP } from '../lib/utils';
import { ArrowLeft, Plus, X, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useToast } from '../contexts/ToastContext';

type TabType = 'overview' | 'symptoms' | 'vitals' | 'diagnoses' | 'prescriptions' | 'labs' | 'hunches' | 'ai';

export const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [patient, setPatient] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labReports, setLabReports] = useState<any[]>([]);
  const [hunches, setHunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showLabForm, setShowLabForm] = useState(false);
  const [showHunchForm, setShowHunchForm] = useState(false);

  const [dischargeData, setDischargeData] = useState({
    discharge_diagnosis: '',
    discharge_summary: '',
    followup_instructions: '',
  });

  const [symptomForm, setSymptomForm] = useState({
    chief_complaint: '',
    onset_date: new Date().toISOString().split('T')[0],
    severity: 'mild',
    progression_notes: '',
  });

  const [vitalForm, setVitalForm] = useState({
    blood_pressure: '',
    heart_rate: '',
    temperature: '',
    oxygen_saturation: '',
    respiratory_rate: '',
  });

  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis_text: '',
    diagnosis_type: 'primary',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  const [labForm, setLabForm] = useState({
    report_name: '',
    result: '',
    normal_range: '',
    is_abnormal: false,
  });

  const [hunchForm, setHunchForm] = useState({
    hunch_note: '',
  });

  const loadPatientData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [patientData, symptomsData, vitalsData, diagnosesData, prescriptionsData, labsData, hunchesData] = await Promise.all([
        db.patients.getById(id),
        db.symptoms.getByPatient(id),
        db.vitals.getByPatient(id),
        db.diagnoses.getByPatient(id),
        db.prescriptions.getByPatient(id),
        db.labReports.getByPatient(id),
        db.hunchLog.getByPatient(id),
      ]);
      setPatient(patientData);
      setSymptoms(symptomsData);
      setVitals(vitalsData);
      setDiagnoses(diagnosesData);
      setPrescriptions(prescriptionsData);
      setLabReports(labsData);
      setHunches(hunchesData);
    } catch (error) {
      showToast('Failed to load patient data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const handleDischarge = async () => {
    if (!patient || !id) return;
    const admissionDate = new Date(patient.admission_date);
    const today = new Date();
    const totalDays = Math.ceil((today.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
    try {
      await db.dischargeRecords.create({
        patient_id: id,
        discharge_date: new Date().toISOString(),
        total_days: totalDays,
        discharge_diagnosis: dischargeData.discharge_diagnosis,
        discharge_summary: dischargeData.discharge_summary,
        followup_instructions: dischargeData.followup_instructions,
      });
      await db.patients.update(id, {
        status: 'discharged',
        discharge_date: new Date().toISOString(),
      });
      if (patient.bed_number) {
        await db.beds.release(patient.bed_number);
      }
      showToast('Patient discharged successfully', 'success');
      navigate('/patients');
    } catch (error) {
      showToast('Failed to discharge patient', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2D7DD2] border-t-transparent"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12">Patient not found</div>;
  }

  const drugCombinationCheck = isDangerousDrugCombination(
    prescriptions.filter((p) => p.is_active).map((p) => p.medication)
  );

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'symptoms', label: 'Symptoms' },
    { id: 'vitals', label: 'Vitals' },
    { id: 'diagnoses', label: 'Diagnoses' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'labs', label: 'Lab Reports' },
    { id: 'hunches', label: 'Hunch Log' },
    { id: 'ai', label: 'AI Analysis' },
  ];

  const vitalsChartData = vitals.map((v) => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    'Heart Rate': v.heart_rate,
    'Temperature': v.temperature,
    'O2 Sat': v.oxygen_saturation,
    'BP Systolic': parseSystolicBP(v.blood_pressure),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link to="/patients" className="inline-flex items-center gap-2 text-[#2D7DD2] hover:text-[#2564a8] mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0A0F2C]">{patient.name}</h1>
            <p className="text-gray-600 mt-1">
              {patient.age} years • {patient.gender} • {patient.blood_type}
            </p>
          </div>
          {patient.status !== 'discharged' && (
            <button
              onClick={() => setShowDischargeModal(true)}
              className="px-4 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#d62936] transition-colors"
            >
              Discharge Patient
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#2D7DD2] text-[#2D7DD2]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-[#0A0F2C]">{patient.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-[#0A0F2C]">{patient.address || 'N/A'}</span>
                    </div>
                    {patient.families && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Family:</span>
                        <span className="text-[#0A0F2C]">{patient.families.family_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0A0F2C] mb-4">Admission Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ward:</span>
                      <span className="text-[#0A0F2C]">{patient.ward}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bed:</span>
                      <span className="text-[#0A0F2C]">{patient.bed_number} (Floor {patient.floor})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admission Date:</span>
                      <span className="text-[#0A0F2C]">{formatDate(patient.admission_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Admitted:</span>
                      <span className="font-semibold text-[#0A0F2C]">{calculateDaysAdmitted(patient.admission_date)}</span>
                    </div>
                    {patient.doctors && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assigned Doctor:</span>
                        <span className="text-[#0A0F2C]">{patient.doctors.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SYMPTOMS */}
          {activeTab === 'symptoms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Symptom Timeline</h3>
                <button
                  onClick={() => setShowSymptomForm(!showSymptomForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Symptom
                </button>
              </div>
              {showSymptomForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Chief complaint *"
                    value={symptomForm.chief_complaint}
                    onChange={(e) => setSymptomForm({ ...symptomForm, chief_complaint: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={symptomForm.onset_date}
                      onChange={(e) => setSymptomForm({ ...symptomForm, onset_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                    />
                    <select
                      value={symptomForm.severity}
                      onChange={(e) => setSymptomForm({ ...symptomForm, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Progression notes"
                    value={symptomForm.progression_notes}
                    onChange={(e) => setSymptomForm({ ...symptomForm, progression_notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!symptomForm.chief_complaint) return showToast('Chief complaint required', 'error');
                        try {
                          await db.symptoms.create({
                            patient_id: id!,
                            ...symptomForm,
                            severity: symptomForm.severity as 'mild' | 'moderate' | 'severe',
                          });
                          showToast('Symptom added', 'success');
                          setShowSymptomForm(false);
                          setSymptomForm({ chief_complaint: '', onset_date: new Date().toISOString().split('T')[0], severity: 'mild', progression_notes: '' });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to add symptom', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowSymptomForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {symptoms.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No symptoms recorded</p>
              ) : (
                <div className="space-y-4">
                  {symptoms.map((symptom) => (
                    <div key={symptom.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-[#0A0F2C]">{symptom.chief_complaint}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                          {symptom.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{symptom.progression_notes}</p>
                      <p className="text-xs text-gray-500">
                        Onset: {formatDate(symptom.onset_date)} • Recorded: {formatDateTime(symptom.recorded_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VITALS */}
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Vitals Monitoring</h3>
                <button
                  onClick={() => setShowVitalForm(!showVitalForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Vitals
                </button>
              </div>
              {showVitalForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <input type="text" placeholder="Blood Pressure (e.g. 120/80)" value={vitalForm.blood_pressure} onChange={(e) => setVitalForm({ ...vitalForm, blood_pressure: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="number" placeholder="Heart Rate (bpm)" value={vitalForm.heart_rate} onChange={(e) => setVitalForm({ ...vitalForm, heart_rate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="number" step="0.1" placeholder="Temperature (°C)" value={vitalForm.temperature} onChange={(e) => setVitalForm({ ...vitalForm, temperature: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="number" step="0.1" placeholder="O2 Saturation (%)" value={vitalForm.oxygen_saturation} onChange={(e) => setVitalForm({ ...vitalForm, oxygen_saturation: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="number" placeholder="Respiratory Rate" value={vitalForm.respiratory_rate} onChange={(e) => setVitalForm({ ...vitalForm, respiratory_rate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await db.vitals.create({
                            patient_id: id!,
                            blood_pressure: vitalForm.blood_pressure,
                            heart_rate: parseInt(vitalForm.heart_rate),
                            temperature: parseFloat(vitalForm.temperature),
                            oxygen_saturation: parseFloat(vitalForm.oxygen_saturation),
                            respiratory_rate: parseInt(vitalForm.respiratory_rate),
                          });
                          showToast('Vitals recorded', 'success');
                          setShowVitalForm(false);
                          setVitalForm({ blood_pressure: '', heart_rate: '', temperature: '', oxygen_saturation: '', respiratory_rate: '' });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to record vitals', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowVitalForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {vitals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No vitals recorded</p>
              ) : (
                <>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Heart Rate" stroke="#E63946" strokeWidth={2} />
                        <Line type="monotone" dataKey="Temperature" stroke="#F4A261" strokeWidth={2} />
                        <Line type="monotone" dataKey="O2 Sat" stroke="#2DC653" strokeWidth={2} />
                        <Line type="monotone" dataKey="BP Systolic" stroke="#2D7DD2" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {vitals.map((vital) => {
                      const hasAbnormal =
                        isVitalAbnormal('heart_rate', vital.heart_rate) ||
                        isVitalAbnormal('temperature', vital.temperature) ||
                        isVitalAbnormal('oxygen_saturation', vital.oxygen_saturation) ||
                        isVitalAbnormal('blood_pressure_systolic', parseSystolicBP(vital.blood_pressure));
                      return (
                        <div key={vital.id} className={`border rounded-lg p-4 ${hasAbnormal ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">BP</p>
                              <p className={`font-semibold ${isVitalAbnormal('blood_pressure_systolic', parseSystolicBP(vital.blood_pressure)) ? 'text-red-600' : ''}`}>{vital.blood_pressure}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">HR</p>
                              <p className={`font-semibold ${isVitalAbnormal('heart_rate', vital.heart_rate) ? 'text-red-600' : ''}`}>{vital.heart_rate} bpm</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Temp</p>
                              <p className={`font-semibold ${isVitalAbnormal('temperature', vital.temperature) ? 'text-red-600' : ''}`}>{vital.temperature}°C</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">O2 Sat</p>
                              <p className={`font-semibold ${isVitalAbnormal('oxygen_saturation', vital.oxygen_saturation) ? 'text-red-600' : ''}`}>{vital.oxygen_saturation}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{formatDateTime(vital.recorded_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* DIAGNOSES */}
          {activeTab === 'diagnoses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Diagnoses</h3>
                <button
                  onClick={() => setShowDiagnosisForm(!showDiagnosisForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Diagnosis
                </button>
              </div>
              {showDiagnosisForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Diagnosis *"
                    value={diagnosisForm.diagnosis_text}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, diagnosis_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                  />
                  <select
                    value={diagnosisForm.diagnosis_type}
                    onChange={(e) => setDiagnosisForm({ ...diagnosisForm, diagnosis_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!diagnosisForm.diagnosis_text) return showToast('Diagnosis required', 'error');
                        try {
                          await db.diagnoses.create({ patient_id: id!, ...diagnosisForm });
                          showToast('Diagnosis added', 'success');
                          setShowDiagnosisForm(false);
                          setDiagnosisForm({ diagnosis_text: '', diagnosis_type: 'primary' });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to add diagnosis', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowDiagnosisForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {diagnoses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No diagnoses recorded</p>
              ) : (
                <div className="space-y-3">
                  {diagnoses.map((diagnosis) => (
                    <div key={diagnosis.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-[#0A0F2C]">{diagnosis.diagnosis_text}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {diagnosis.diagnosis_type} • {formatDateTime(diagnosis.diagnosed_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Prescriptions</h3>
                <button
                  onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Prescription
                </button>
              </div>
              {showPrescriptionForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Medication *" value={prescriptionForm.medication} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="text" placeholder="Dosage (e.g. 75mg)" value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="text" placeholder="Frequency (e.g. Twice daily)" value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="text" placeholder="Duration (e.g. 7 days)" value={prescriptionForm.duration} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                  </div>
                  <input type="text" placeholder="Instructions" value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!prescriptionForm.medication) return showToast('Medication required', 'error');
                        try {
                          await db.prescriptions.create({ patient_id: id!, ...prescriptionForm, is_active: true });
                          showToast('Prescription added', 'success');
                          setShowPrescriptionForm(false);
                          setPrescriptionForm({ medication: '', dosage: '', frequency: '', duration: '', instructions: '' });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to add prescription', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowPrescriptionForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {drugCombinationCheck.isDangerous && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Dangerous Drug Combination Detected</p>
                    <p className="text-sm text-red-700 mt-1">{drugCombinationCheck.warning}</p>
                  </div>
                </div>
              )}
              {prescriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No prescriptions recorded</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className={`border rounded-lg p-4 ${prescription.is_active ? 'border-gray-200' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[#0A0F2C]">{prescription.medication}</h4>
                          <p className="text-sm text-gray-600">{prescription.dosage} • {prescription.frequency}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${prescription.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {prescription.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{prescription.instructions}</p>
                      <p className="text-xs text-gray-500 mt-2">Duration: {prescription.duration} • Prescribed: {formatDateTime(prescription.prescribed_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LAB REPORTS */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Laboratory Reports</h3>
                <button
                  onClick={() => setShowLabForm(!showLabForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Report
                </button>
              </div>
              {showLabForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Report Name *" value={labForm.report_name} onChange={(e) => setLabForm({ ...labForm, report_name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="text" placeholder="Result *" value={labForm.result} onChange={(e) => setLabForm({ ...labForm, result: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                    <input type="text" placeholder="Normal Range" value={labForm.normal_range} onChange={(e) => setLabForm({ ...labForm, normal_range: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={labForm.is_abnormal} onChange={(e) => setLabForm({ ...labForm, is_abnormal: e.target.checked })} className="w-4 h-4" />
                    Mark as Abnormal
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!labForm.report_name || !labForm.result) return showToast('Report name and result required', 'error');
                        try {
                          await db.labReports.create({ patient_id: id!, ...labForm });
                          showToast('Lab report added', 'success');
                          setShowLabForm(false);
                          setLabForm({ report_name: '', result: '', normal_range: '', is_abnormal: false });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to add lab report', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowLabForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {labReports.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No lab reports recorded</p>
              ) : (
                <div className="space-y-3">
                  {labReports.map((report) => (
                    <div key={report.id} className={`border rounded-lg p-4 ${report.is_abnormal ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-[#0A0F2C]">{report.report_name}</h4>
                          <p className={`text-sm mt-1 ${report.is_abnormal ? 'text-red-700 font-medium' : 'text-gray-600'}`}>Result: {report.result}</p>
                          {report.normal_range && <p className="text-sm text-gray-600">Normal Range: {report.normal_range}</p>}
                        </div>
                        {report.is_abnormal && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Abnormal</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(report.reported_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HUNCH LOG */}
          {activeTab === 'hunches' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0A0F2C]">Doctor Hunches</h3>
                <button
                  onClick={() => setShowHunchForm(!showHunchForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D7DD2] text-white rounded-lg hover:bg-[#2564a8] transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Hunch
                </button>
              </div>
              {showHunchForm && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <textarea
                    placeholder="Clinical hunch note *"
                    value={hunchForm.hunch_note}
                    onChange={(e) => setHunchForm({ ...hunchForm, hunch_note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2] text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!hunchForm.hunch_note) return showToast('Note required', 'error');
                        try {
                          await db.hunchLog.create({ patient_id: id!, hunch_note: hunchForm.hunch_note, is_monitoring: true });
                          showToast('Hunch logged', 'success');
                          setShowHunchForm(false);
                          setHunchForm({ hunch_note: '' });
                          await loadPatientData();
                        } catch {
                          showToast('Failed to log hunch', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-[#2D7DD2] text-white rounded-lg text-sm hover:bg-[#2564a8]"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowHunchForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {hunches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hunches recorded</p>
              ) : (
                <div className="space-y-3">
                  {hunches.map((hunch: any) => (
                    <div key={hunch.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-[#0A0F2C]">{hunch.doctors?.name || 'Unknown Doctor'}</p>
                          <p className="text-sm text-gray-600 mt-1">{hunch.hunch_note}</p>
                        </div>
                        {hunch.is_monitoring && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Monitoring</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{formatDateTime(hunch.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI ANALYSIS */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#0A0F2C] to-[#1a2456] rounded-lg p-6 text-white">
                <h3 className="text-xl font-semibold mb-2">Dr. Obvi AI Analysis</h3>
                <p className="text-sm text-gray-300">Intelligent patient risk assessment and recommendations</p>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A0F2C] mb-2">Risk Assessment</h4>
                  <p className="text-sm text-gray-700">
                    Based on current vitals and admission history, {patient.name} shows{' '}
                    {patient.status === 'critical' ? 'elevated' : 'moderate'} risk indicators.
                    {vitals.length > 0 && isVitalAbnormal('oxygen_saturation', vitals[vitals.length - 1]?.oxygen_saturation) &&
                      ' Oxygen saturation requires immediate attention.'}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A0F2C] mb-2">Suggested Next Steps</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Continue monitoring vital signs every 4 hours</li>
                    <li>Review lab results when available</li>
                    {drugCombinationCheck.isDangerous && (
                      <li className="text-red-600">Address drug interaction concerns immediately</li>
                    )}
                    <li>Schedule follow-up consultation with assigned physician</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-[#0A0F2C] mb-2">Drug Interaction Notes</h4>
                  <p className="text-sm text-gray-700">
                    {drugCombinationCheck.isDangerous ? drugCombinationCheck.warning : 'No dangerous drug interactions detected in current prescriptions.'}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800">Dr. Obvi AI integration coming soon. Currently running on vibes.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DISCHARGE MODAL */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0A0F2C]">Discharge Patient</h2>
              <button onClick={() => setShowDischargeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={dischargeData.discharge_diagnosis}
                  onChange={(e) => setDischargeData({ ...dischargeData, discharge_diagnosis: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Summary *</label>
                <textarea
                  required
                  value={dischargeData.discharge_summary}
                  onChange={(e) => setDischargeData({ ...dischargeData, discharge_summary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions *</label>
                <textarea
                  required
                  value={dischargeData.followup_instructions}
                  onChange={(e) => setDischargeData({ ...dischargeData, followup_instructions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D7DD2]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDischargeModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDischarge}
                  disabled={!dischargeData.discharge_diagnosis || !dischargeData.discharge_summary || !dischargeData.followup_instructions}
                  className="px-6 py-2 bg-[#E63946] text-white rounded-lg hover:bg-[#d62936] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Discharge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};