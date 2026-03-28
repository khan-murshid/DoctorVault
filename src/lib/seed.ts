import { supabase } from './supabase';

export const seedDatabase = async () => {
  try {
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (existingPatients && existingPatients.length > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database with demo data...');

    const { data: families } = await supabase
      .from('families')
      .insert([
        {
          family_name: 'Khan Family',
          emergency_contact: 'Arif Khan',
          emergency_phone: '9876543210',
          address: 'Lal Chowk Srinagar',
        },
        {
          family_name: 'Bhat Family',
          emergency_contact: 'Shabir Bhat',
          emergency_phone: '9812345678',
          address: 'Rajbagh Srinagar',
        },
        {
          family_name: 'Dar Family',
          emergency_contact: 'Tariq Dar',
          emergency_phone: '9834567890',
          address: 'Hyderpora Srinagar',
        },
      ])
      .select();

    const khanFamily = families![0];
    const bhatFamily = families![1];
    const darFamily = families![2];

    const { data: doctors } = await supabase
      .from('doctors')
      .insert([
        {
          name: 'Dr. Aisha Malik',
          specialty: 'Cardiologist',
          phone: '9876543211',
          email: 'aisha.malik@doctorvault.com',
          shift_hours: 11,
          patients_seen_today: 14,
          status: 'on-duty',
        },
        {
          name: 'Dr. Faisal Mir',
          specialty: 'General Physician',
          phone: '9876543212',
          email: 'faisal.mir@doctorvault.com',
          shift_hours: 8,
          patients_seen_today: 22,
          status: 'on-duty',
        },
        {
          name: 'Dr. Nadia Shah',
          specialty: 'Pediatrician',
          phone: '9876543213',
          email: 'nadia.shah@doctorvault.com',
          shift_hours: 6,
          patients_seen_today: 9,
          status: 'off-duty',
        },
      ])
      .select();

    const drMalik = doctors![0];
    const drMir = doctors![1];
    const drShah = doctors![2];

    await supabase.from('beds').insert([
      { bed_number: 'A101', floor: 1, ward: 'General Ward', status: 'available' },
      { bed_number: 'A102', floor: 1, ward: 'General Ward', status: 'available' },
      { bed_number: 'A103', floor: 1, ward: 'General Ward', status: 'available' },
      { bed_number: 'A104', floor: 1, ward: 'General Ward', status: 'available' },
      { bed_number: 'A105', floor: 1, ward: 'General Ward', status: 'maintenance' },
      { bed_number: 'ICU-01', floor: 2, ward: 'ICU', status: 'available' },
      { bed_number: 'ICU-02', floor: 2, ward: 'ICU', status: 'available' },
      { bed_number: 'ICU-03', floor: 2, ward: 'ICU', status: 'available' },
      { bed_number: 'P201', floor: 2, ward: 'Pediatric', status: 'available' },
      { bed_number: 'P205', floor: 2, ward: 'Pediatric', status: 'available' },
      { bed_number: 'B301', floor: 3, ward: 'Surgery', status: 'available' },
      { bed_number: 'B302', floor: 3, ward: 'Surgery', status: 'available' },
      { bed_number: 'B303', floor: 3, ward: 'Surgery', status: 'maintenance' },
    ]);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: patients } = await supabase
      .from('patients')
      .insert([
        {
          name: 'Mohammad Yusuf Khan',
          age: 45,
          gender: 'Male',
          blood_type: 'B+',
          phone: '9876543220',
          address: 'Lal Chowk Srinagar',
          admission_date: fiveDaysAgo.toISOString(),
          status: 'admitted',
          ward: 'General Ward',
          bed_number: 'A101',
          floor: 1,
          family_id: khanFamily.id,
          assigned_doctor_id: drMalik.id,
          is_child: false,
        },
        {
          name: 'Fatima Bhat',
          age: 32,
          gender: 'Female',
          blood_type: 'O+',
          phone: '9876543221',
          address: 'Rajbagh Srinagar',
          admission_date: twoDaysAgo.toISOString(),
          status: 'critical',
          ward: 'ICU',
          bed_number: 'ICU-03',
          floor: 2,
          family_id: bhatFamily.id,
          assigned_doctor_id: drMir.id,
          is_child: false,
        },
        {
          name: 'Amir Dar',
          age: 8,
          gender: 'Male',
          blood_type: 'A+',
          phone: '9876543222',
          address: 'Hyderpora Srinagar',
          admission_date: oneDayAgo.toISOString(),
          status: 'admitted',
          ward: 'Pediatric',
          bed_number: 'P205',
          floor: 2,
          family_id: darFamily.id,
          assigned_doctor_id: drShah.id,
          is_child: true,
        },
        {
          name: 'Zainab Khan',
          age: 67,
          gender: 'Female',
          blood_type: 'AB-',
          phone: '9876543223',
          address: 'Lal Chowk Srinagar',
          admission_date: tenDaysAgo.toISOString(),
          status: 'admitted',
          ward: 'General Ward',
          bed_number: 'A104',
          floor: 1,
          family_id: khanFamily.id,
          assigned_doctor_id: drMir.id,
          is_child: false,
        },
        {
          name: 'Bilal Mir',
          age: 29,
          gender: 'Male',
          blood_type: 'O-',
          phone: '9876543224',
          address: 'Habba Kadal Srinagar',
          admission_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          discharge_date: threeDaysAgo.toISOString(),
          status: 'discharged',
          ward: 'General Ward',
          bed_number: null,
          floor: 1,
          assigned_doctor_id: drMir.id,
          is_child: false,
        },
      ])
      .select();

    const mohammad = patients![0];
    const fatima = patients![1];
    const amir = patients![2];
    const bilal = patients![4];

    await supabase.from('beds').update({ status: 'occupied', patient_id: mohammad.id }).eq('bed_number', 'A101');
    await supabase.from('beds').update({ status: 'occupied', patient_id: fatima.id }).eq('bed_number', 'ICU-03');
    await supabase.from('beds').update({ status: 'occupied', patient_id: amir.id }).eq('bed_number', 'P205');
    await supabase.from('beds').update({ status: 'occupied', patient_id: patients![3].id }).eq('bed_number', 'A104');

    await supabase.from('symptoms').insert([
      {
        patient_id: mohammad.id,
        chief_complaint: 'Chest pain and shortness of breath',
        onset_date: new Date(fiveDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        severity: 'severe',
        progression_notes: 'Worsening over 3 days before admission',
      },
      {
        patient_id: fatima.id,
        chief_complaint: 'High fever and loss of consciousness',
        onset_date: new Date(twoDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        severity: 'severe',
        progression_notes: 'Sudden onset, brought in by family',
      },
    ]);

    await supabase.from('vitals').insert([
      {
        patient_id: mohammad.id,
        blood_pressure: '140/90',
        heart_rate: 95,
        temperature: 37.8,
        oxygen_saturation: 96.5,
        respiratory_rate: 18,
        recorded_at: new Date().toISOString(),
      },
      {
        patient_id: fatima.id,
        blood_pressure: '90/60',
        heart_rate: 110,
        temperature: 39.5,
        oxygen_saturation: 91.0,
        respiratory_rate: 24,
        recorded_at: new Date().toISOString(),
      },
    ]);

    await supabase.from('diagnoses').insert([
      {
        patient_id: mohammad.id,
        diagnosis_text: 'Acute Myocardial Infarction',
        diagnosis_type: 'primary',
      },
      {
        patient_id: fatima.id,
        diagnosis_text: 'Severe Sepsis',
        diagnosis_type: 'primary',
      },
      {
        patient_id: amir.id,
        diagnosis_text: 'Community Acquired Pneumonia',
        diagnosis_type: 'primary',
      },
    ]);

    await supabase.from('prescriptions').insert([
      {
        patient_id: mohammad.id,
        medication: 'Aspirin',
        dosage: '75mg',
        frequency: 'once daily',
        duration: '30 days',
        instructions: 'Take after food',
        is_active: true,
      },
      {
        patient_id: fatima.id,
        medication: 'Meropenem',
        dosage: '1g IV',
        frequency: 'every 8 hours',
        duration: '7 days',
        instructions: 'Administer via drip',
        is_active: true,
      },
    ]);

    await supabase.from('alerts').insert([
      {
        patient_id: fatima.id,
        alert_type: 'Vitals',
        message: 'Oxygen saturation dropped below 92%',
        severity: 'critical',
        is_resolved: false,
      },
      {
        patient_id: mohammad.id,
        alert_type: 'Medication',
        message: 'Aspirin flagged - check for drug interactions',
        severity: 'high',
        is_resolved: false,
      },
    ]);

    await supabase.from('discharge_records').insert([
      {
        patient_id: bilal.id,
        discharge_date: threeDaysAgo.toISOString(),
        total_days: 3,
        discharge_diagnosis: 'Viral Fever Resolved',
        discharge_summary: 'Patient responded well to treatment. Fever subsided on day 2. No complications observed.',
        followup_instructions: 'Review in 1 week. Avoid cold exposure. Complete course of prescribed medications.',
      },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
