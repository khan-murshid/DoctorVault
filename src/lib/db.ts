import { supabase } from './supabase';

export interface Family {
  id: string;
  family_name: string;
  emergency_contact: string;
  emergency_phone: string;
  address: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  shift_hours: number;
  patients_seen_today: number;
  status: 'on-duty' | 'off-duty';
  created_at: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_type: string;
  phone: string;
  address: string;
  admission_date: string;
  discharge_date?: string;
  status: 'admitted' | 'discharged' | 'critical';
  ward: string;
  bed_number: string;
  floor: number;
  family_id?: string;
  guardian_id?: string;
  assigned_doctor_id?: string;
  is_child: boolean;
  created_at: string;
}

export interface Bed {
  id: string;
  bed_number: string;
  floor: number;
  ward: string;
  status: 'available' | 'occupied' | 'maintenance';
  patient_id?: string;
  last_cleaned: string;
  created_at: string;
}

export interface Symptom {
  id: string;
  patient_id: string;
  chief_complaint: string;
  onset_date: string;
  severity: 'mild' | 'moderate' | 'severe';
  progression_notes: string;
  recorded_at: string;
}

export interface Vital {
  id: string;
  patient_id: string;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  oxygen_saturation: number;
  respiratory_rate: number;
  weight?: number;
  height?: number;
  recorded_at: string;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  diagnosis_text: string;
  diagnosis_type: 'primary' | 'secondary';
  diagnosed_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  is_active: boolean;
  prescribed_at: string;
}

export interface LabReport {
  id: string;
  patient_id: string;
  report_name: string;
  result: string;
  normal_range: string;
  is_abnormal: boolean;
  reported_at: string;
}

export interface DischargeRecord {
  id: string;
  patient_id: string;
  discharge_date: string;
  total_days: number;
  discharge_diagnosis: string;
  discharge_summary: string;
  followup_instructions: string;
  created_at: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

export interface HunchLog {
  id: string;
  patient_id: string;
  doctor_id: string;
  hunch_note: string;
  is_monitoring: boolean;
  created_at: string;
}

export const db = {
  families: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Family[];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Family;
    },
    create: async (family: Omit<Family, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('families')
        .insert([family])
        .select()
        .single();
      if (error) throw error;
      return data as Family;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('families')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  doctors: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Doctor[];
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Doctor;
    },
    create: async (doctor: Omit<Doctor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('doctors')
        .insert([doctor])
        .select()
        .single();
      if (error) throw error;
      return data as Doctor;
    },
    update: async (id: string, updates: Partial<Doctor>) => {
      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Doctor;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  patients: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, families(*), doctors(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getAdmitted: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, families(*), doctors(*)')
        .in('status', ['admitted', 'critical'])
        .order('admission_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, families(*), doctors(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    create: async (patient: Omit<Patient, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert([patient])
        .select()
        .single();
      if (error) throw error;
      return data as Patient;
    },
    update: async (id: string, updates: Partial<Patient>) => {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Patient;
    },
    search: async (query: string) => {
      const { data, error } = await supabase
        .from('patients')
        .select('*, families(*), doctors(*)')
        .or(`name.ilike.%${query}%,blood_type.ilike.%${query}%`)
        .in('status', ['admitted', 'critical']);
      if (error) throw error;
      return data;
    },
    searchBySymptom: async (symptom: string) => {
      const { data: symptoms, error } = await supabase
        .from('symptoms')
        .select('patient_id, patients(*, families(*), doctors(*))')
        .ilike('chief_complaint', `%${symptom}%`);
      if (error) throw error;
      return symptoms;
    },
  },

  beds: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('beds')
        .select('*, patients(*)')
        .order('floor', { ascending: true })
        .order('bed_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    getAvailable: async (floor?: number, ward?: string) => {
      let query = supabase
        .from('beds')
        .select('*')
        .eq('status', 'available');

      if (floor) query = query.eq('floor', floor);
      if (ward) query = query.eq('ward', ward);

      const { data, error } = await query;
      if (error) throw error;
      return data as Bed[];
    },
    update: async (id: string, updates: Partial<Bed>) => {
      const { data, error } = await supabase
        .from('beds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Bed;
    },
    updateByBedNumber: async (bed_number: string, updates: Partial<Bed>) => {
      const { data, error } = await supabase
        .from('beds')
        .update(updates)
        .eq('bed_number', bed_number)
        .select()
        .single();
      if (error) throw error;
      return data as Bed;
    },
    assignToPatient: async (bedNumber: string, patientId: string) => {
      const { data, error } = await supabase
        .from('beds')
        .update({ status: 'occupied', patient_id: patientId })
        .eq('bed_number', bedNumber)
        .select()
        .single();
      if (error) throw error;
      return data as Bed;
    },
    release: async (bedNumber: string) => {
      const { data, error } = await supabase
        .from('beds')
        .update({ status: 'available', patient_id: null })
        .eq('bed_number', bedNumber)
        .select()
        .single();
      if (error) throw error;
      return data as Bed;
    },
  },

  symptoms: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data as Symptom[];
    },
    create: async (symptom: Omit<Symptom, 'id' | 'recorded_at'>) => {
      const { data, error } = await supabase
        .from('symptoms')
        .insert([symptom])
        .select()
        .single();
      if (error) throw error;
      return data as Symptom;
    },
    update: async (id: string, updates: Partial<Symptom>) => {
      const { data, error } = await supabase
        .from('symptoms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Symptom;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('symptoms')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  vitals: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data as Vital[];
    },
    create: async (vital: Omit<Vital, 'id' | 'recorded_at'>) => {
      const { data, error } = await supabase
        .from('vitals')
        .insert([vital])
        .select()
        .single();
      if (error) throw error;
      return data as Vital;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('vitals')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  diagnoses: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('patient_id', patientId)
        .order('diagnosed_at', { ascending: false });
      if (error) throw error;
      return data as Diagnosis[];
    },
    create: async (diagnosis: Omit<Diagnosis, 'id' | 'diagnosed_at'>) => {
      const { data, error } = await supabase
        .from('diagnoses')
        .insert([diagnosis])
        .select()
        .single();
      if (error) throw error;
      return data as Diagnosis;
    },
    update: async (id: string, updates: Partial<Diagnosis>) => {
      const { data, error } = await supabase
        .from('diagnoses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Diagnosis;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('diagnoses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  prescriptions: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false });
      if (error) throw error;
      return data as Prescription[];
    },
    getActive: async (patientId: string) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('prescribed_at', { ascending: false });
      if (error) throw error;
      return data as Prescription[];
    },
    create: async (prescription: Omit<Prescription, 'id' | 'prescribed_at'>) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([prescription])
        .select()
        .single();
      if (error) throw error;
      return data as Prescription;
    },
    update: async (id: string, updates: Partial<Prescription>) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Prescription;
    },
    deactivate: async (id: string) => {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Prescription;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  labReports: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('reported_at', { ascending: false });
      if (error) throw error;
      return data as LabReport[];
    },
    create: async (report: Omit<LabReport, 'id' | 'reported_at'>) => {
      const { data, error } = await supabase
        .from('lab_reports')
        .insert([report])
        .select()
        .single();
      if (error) throw error;
      return data as LabReport;
    },
    update: async (id: string, updates: Partial<LabReport>) => {
      const { data, error } = await supabase
        .from('lab_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LabReport;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('lab_reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  dischargeRecords: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('discharge_records')
        .select('*, patients(*)')
        .order('discharge_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('discharge_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('discharge_date', { ascending: false });
      if (error) throw error;
      return data as DischargeRecord[];
    },
    create: async (record: Omit<DischargeRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('discharge_records')
        .insert([record])
        .select()
        .single();
      if (error) throw error;
      return data as DischargeRecord;
    },
  },

  alerts: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, patients(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getUnresolved: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*, patients(*)')
        .eq('is_resolved', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
    create: async (alert: Omit<Alert, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('alerts')
        .insert([alert])
        .select()
        .single();
      if (error) throw error;
      return data as Alert;
    },
    resolve: async (id: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({ is_resolved: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Alert;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  hunchLog: {
    getByPatient: async (patientId: string) => {
      const { data, error } = await supabase
        .from('hunch_log')
        .select('*, doctors(*)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false});
      if (error) throw error;
      return data;
    },
    create: async (hunch: Omit<HunchLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('hunch_log')
        .insert([hunch])
        .select()
        .single();
      if (error) throw error;
      return data as HunchLog;
    },
    update: async (id: string, updates: Partial<HunchLog>) => {
      const { data, error } = await supabase
        .from('hunch_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as HunchLog;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('hunch_log')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },
};
