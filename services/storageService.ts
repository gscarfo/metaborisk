import { Patient } from '../types';

const STORAGE_KEY = 'metaborisk_patients';

export const getPatients = async (currentUserId: string): Promise<Patient[]> => {
  try {
    const response = await fetch(`/api/patients?userId=${currentUserId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("API Fetch failed, checking local storage fallback");
  }

  // Fallback to LocalStorage if API fails or offline
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const savePatient = async (patient: Patient, currentUserId: string): Promise<Patient> => {
  try {
    const response = await fetch(`/api/patients?userId=${currentUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("API Save failed, falling back to local storage");
  }

  // LocalStorage Fallback
  const patients = await getPatients(currentUserId);
  const index = patients.findIndex(p => p.id === patient.id);
  const patientToSave = { ...patient, id: patient.id || crypto.randomUUID() };
  
  let updatedPatients;
  if (index >= 0) {
    updatedPatients = [...patients];
    updatedPatients[index] = patientToSave;
  } else {
    updatedPatients = [...patients, patientToSave];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPatients));
  return patientToSave;
};

export const deletePatient = async (id: string, currentUserId: string): Promise<void> => {
  try {
    await fetch(`/api/patients?id=${id}&userId=${currentUserId}`, { method: 'DELETE' });
    return;
  } catch (e) {
    console.error("API Delete failed");
  }

  // LocalStorage Fallback
  const patients = await getPatients(currentUserId);
  const updated = patients.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};