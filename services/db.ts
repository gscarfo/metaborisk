
import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

export const getDbPool = (): Pool | null => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Allow running without DB for UI dev, but warn
      return null;
    }
    pool = new Pool({ connectionString });
  }
  return pool;
};

export const initDbSchema = async () => {
  const pool = getDbPool();
  if (!pool) return; 

  // We define pool as any to bypass strict type checks for this specific operation if needed
  // or rely on standard Pool usage.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Table: Users (Admin & Doctors)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add profile columns if they don't exist
    // Using a safe approach compatible with various PG versions
    const columnsToAdd = [
      'first_name TEXT',
      'last_name TEXT',
      'title TEXT',
      'specialization TEXT',
      'email TEXT',
      'phone TEXT'
    ];

    for (const col of columnsToAdd) {
       const colName = col.split(' ')[0];
       await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='${colName}') THEN 
            ALTER TABLE users ADD COLUMN ${col};
          END IF; 
        END $$;
      `);
    }

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
    
    // Add user_id column if it doesn't exist (migration for existing setup)
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='user_id') THEN 
          ALTER TABLE patients ADD COLUMN user_id UUID REFERENCES users(id);
        END IF; 
      END $$;
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

    // 4. Seed Default Admin if not exists
    const adminCheck = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rowCount === 0) {
      await client.query(`
        INSERT INTO users (username, password_hash, role, is_active, first_name, last_name, title)
        VALUES ('admin', 'admin123', 'admin', true, 'System', 'Admin', 'Dr.')
      `);
      console.log("Default Admin created (admin/admin123)");
    }

    await client.query('COMMIT');
    console.log("Database schema initialized successfully.");
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error initializing database schema:", error);
    throw error;
  } finally {
    client.release();
  }
};
