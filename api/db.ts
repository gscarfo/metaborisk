import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environments (Vercel Serverless Functions)
neonConfig.webSocketConstructor = ws;

// Initialize Pool with the connection string from environment variables
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

export default pool;