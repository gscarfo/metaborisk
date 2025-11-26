import pool from './db';
import { randomUUID } from 'crypto';

export default async function handler(req: any, res: any) {
  const { userId, id } = req.query;

  try {
    if (req.method === 'GET') {
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

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
      `, [userId]);

      const patients = rows.map((row: any) => ({
        id: row.patient_id,
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        birthDate: new Date(row.birth_date).toISOString().split('T')[0],
        gender: row.gender,
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
        aiAnalysis: row.ai_analysis
      }));

      return res.status(200).json(patients);
    }

    if (req.method === 'POST') {
      const patient = req.body;
      const currentUserId = req.query.userId;
      
      if (!currentUserId) {
        return res.status(400).json({ error: 'Missing userId for saving patient' });
      }
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insert/Update Patient
        const patientRes = await client.query(`
          INSERT INTO patients (id, user_id, first_name, last_name, birth_date, gender)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            birth_date = EXCLUDED.birth_date,
            gender = EXCLUDED.gender
          RETURNING id
        `, [patient.id || randomUUID(), currentUserId, patient.firstName, patient.lastName, patient.birthDate, patient.gender]);

        const patientId = patientRes.rows[0].id;

        // Insert Assessment
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
        return res.status(200).json({ ...patient, id: patientId });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    if (req.method === 'DELETE') {
      if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });
      await pool.query('DELETE FROM patients WHERE id = $1 AND user_id = $2', [id, userId]);
      return res.status(200).json({ success: true });
    }

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}