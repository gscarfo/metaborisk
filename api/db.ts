import { Pool } from '@neondatabase/serverless';

// Initialize Pool with the connection string from environment variables
// This runs in the Vercel Serverless environment
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

export default pool;