import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environments (Vercel Serverless Functions)
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL ERROR: DATABASE_URL is missing in environment variables.");
  throw new Error("DATABASE_URL is missing");
}

// Initialize Pool with the connection string from environment variables
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Force SSL for Neon
});

export default pool;