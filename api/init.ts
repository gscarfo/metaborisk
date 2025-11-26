import pool from './db';
import { createHash } from 'crypto';

export default async function handler(req: any, res: any) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Table: Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        first_name TEXT,
        last_name TEXT,
        title TEXT,
        specialization TEXT,
        email TEXT,
        phone TEXT
      );
    `);

    // 2. Table: Patients
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id), 
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date DATE NOT NULL,
        gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table: Assessments
    await client.query(`
      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        weight DECIMAL(5,2) NOT NULL,
        height DECIMAL(5,2) NOT NULL,
        ideal_weight DECIMAL(5,2),
        bmi DECIMAL(4,1),
        glucose DECIMAL(5,1) NOT NULL,
        insulin DECIMAL(5,1) NOT NULL,
        hdl DECIMAL(5,1) NOT NULL,
        triglycerides DECIMAL(5,1) NOT NULL,
        homa_ir DECIMAL(5,2),
        tg_hdl_ratio DECIMAL(5,2),
        ai_analysis TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Seed Default Admin
    const adminCheck = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rowCount === 0) {
      // SHA-256 for 'admin123'
      const adminHash = createHash('sha256').update('admin123').digest('hex');
      
      await client.query(`
        INSERT INTO users (username, password_hash, role, is_active, first_name, last_name, title)
        VALUES ('admin', $1, 'admin', true, 'System', 'Admin', 'Dr.')
      `, [adminHash]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: "Database initialized successfully" });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}