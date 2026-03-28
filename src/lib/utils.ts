export const calculateDaysAdmitted = (admissionDate: string): number => {
  const admission = new Date(admissionDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - admission.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isVitalAbnormal = (vitalType: string, value: number): boolean => {
  switch (vitalType) {
    case 'heart_rate':
      return value > 100 || value < 60;
    case 'temperature':
      return value > 38.5;
    case 'oxygen_saturation':
      return value < 94;
    case 'blood_pressure_systolic':
      return value > 140 || value < 90;
    default:
      return false;
  }
};

export const parseSystolicBP = (bp: string): number => {
  return parseInt(bp.split('/')[0]);
};

export const isDangerousDrugCombination = (medications: string[]): { isDangerous: boolean; warning?: string } => {
  const meds = medications.map(m => m.toLowerCase());

  if (meds.some(m => m.includes('aspirin')) && meds.some(m => m.includes('warfarin'))) {
    return { isDangerous: true, warning: 'Aspirin + Warfarin: Increased bleeding risk' };
  }

  if (meds.some(m => m.includes('ace inhibitor') || m.includes('lisinopril') || m.includes('enalapril')) &&
      meds.some(m => m.includes('potassium'))) {
    return { isDangerous: true, warning: 'ACE Inhibitors + Potassium: Risk of hyperkalemia' };
  }

  if (meds.some(m => m.includes('ssri') || m.includes('fluoxetine') || m.includes('sertraline')) &&
      meds.some(m => m.includes('maoi') || m.includes('phenelzine'))) {
    return { isDangerous: true, warning: 'SSRIs + MAOIs: Risk of serotonin syndrome' };
  }

  return { isDangerous: false };
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'admitted':
      return 'bg-blue-100 text-blue-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'discharged':
      return 'bg-green-100 text-green-800';
    case 'on-duty':
      return 'bg-green-100 text-green-800';
    case 'off-duty':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'low':
      return 'bg-blue-100 text-blue-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'mild':
      return 'bg-green-100 text-green-800';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'severe':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const predictAdmissions = (currentAdmitted: number): number[] => {
  const baseRate = currentAdmitted;
  const predictions: number[] = [];

  for (let i = 1; i <= 7; i++) {
    const variance = Math.random() * 0.2 - 0.1;
    const dayOfWeek = (new Date().getDay() + i) % 7;
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1;

    const predicted = Math.round(baseRate * (1 + variance) * weekendFactor);
    predictions.push(predicted);
  }

  return predictions;
};
