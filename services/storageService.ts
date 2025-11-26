import { Patient } from '../types';
import { getDbPool, initDbSchema } from './db';

let dbInitialized = false;
const STORAGE_KEY = 'metaborisk_patients';

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    const pool = getDbPool();
    if (pool) {
      await initDbSchema();
    }
    dbInitialized = true;
  }
};

const mapRowToPatient = (row: any): Patient => {
  return {
    id: row.patient_id || row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: new Date(row.birth_date).toISOString().split('T')[0],
    gender: row.gender as 'M' | 'F',
    createdAt: row.created_at,
    
    weight: parseFloat(row.weight) || 0,
    height: parseFloat(row.height) || 0,
    idealWeight: row.ideal_weight ? parseFloat(row.ideal_weight) : undefined,
    bmi: parseFloat(row.bmi) || 0,
    
    glucose: parseFloat(row.glucose) || 0,
    insulin: parseFloat(row.insulin) || 0,
    hdl: parseFloat(row.hdl) || 0,
    triglycerides: parseFloat(row.triglycerides) || 0,
    
    homaIr: parseFloat(row.homa_ir) || 0,
    tgHdlRatio: parseFloat(row.tg_hdl_ratio) || 0,
    
    aiAnalysis: row.ai_analysis || undefined
  };
};

// Now requires currentUserId to enforce privacy
export const getPatients = async (currentUserId: string): Promise<Patient[]> => {
  const pool = getDbPool();
  
  if (!pool) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  try {
    await ensureDbInitialized();
    
    const { rows } = await pool.query(`
      SELECT 
        p.id as patient_id, p.user_id, p.first_name, p.last_name, p.birth_date, p.gender, p.created_at,
        a.weight, a.height, a.ideal_weight, a.bmi,
        a.glucose, a.insulin, a.hdl, a.triglycerides,
        a.homa_ir, a.tg_hdl_ratio, a.ai_analysis
      FROM patients p
      LEFT JOIN LATERAL (
        SELECT * FROM assessments 
        WHERE patient_id = p.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) a ON true
      WHERE p.user_id = $1
      ORDER BY p.last_name ASC, p.first_name ASC
    `, [currentUserId]);

    return rows.map(mapRowToPatient);
  } catch (error) {
    console.error("Failed to fetch patients from DB:", error);
    return [];
  }
};

export const savePatient = async (patient: Patient, currentUserId: string): Promise<Patient> => {
  const pool = getDbPool();

  if (!pool) {
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
  }

  await ensureDbInitialized();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let patientId = patient.id;

    const patientRes = await client.query(`
      INSERT INTO patients (id, user_id, first_name, last_name, birth_date, gender)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        birth_date = EXCLUDED.birth_date,
        gender = EXCLUDED.gender
      RETURNING id
    `, [patient.id, currentUserId, patient.firstName, patient.lastName, patient.birthDate, patient.gender]);
    
    patientId = patientRes.rows[0].id;

    await client.query(`
      INSERT INTO assessments (
        patient_id, weight, height, ideal_weight, bmi,
        glucose, insulin, hdl, triglycerides,
        homa_ir, tg_hdl_ratio, ai_analysis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      patientId,
      patient.weight,
      patient.height,
      patient.idealWeight || null,
      patient.bmi,
      patient.glucose,
      patient.insulin,
      patient.hdl,
      patient.triglycerides,
      patient.homaIr,
      patient.tgHdlRatio,
      patient.aiAnalysis || null
    ]);

    await client.query('COMMIT');
    return { ...patient, id: patientId, userId: currentUserId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error saving patient:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const deletePatient = async (id: string, currentUserId: string): Promise<void> => {
  const pool = getDbPool();

  if (!pool) {
    const patients = await getPatients(currentUserId);
    const updated = patients.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return;
  }

  await ensureDbInitialized();
  // Ensure we only delete if it belongs to current user
  await pool.query('DELETE FROM patients WHERE id = $1 AND user_id = $2', [id, currentUserId]);
};