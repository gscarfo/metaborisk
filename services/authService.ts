
import { getDbPool, initDbSchema } from './db';
import { User } from '../types';

const mapUser = (row: any): User => ({
  id: row.id,
  username: row.username,
  role: row.role,
  isActive: row.is_active,
  expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  createdAt: row.created_at,
  firstName: row.first_name || '',
  lastName: row.last_name || '',
  title: row.title || '',
  specialization: row.specialization || '',
  email: row.email || '',
  phone: row.phone || ''
});

export const login = async (username: string, password: string): Promise<{ user: User | null; error?: string }> => {
  const pool = getDbPool();
  if (!pool) {
    // Mock for demo/offline
    if (username === 'admin' && password === 'admin123') {
      return { 
        user: { 
          id: 'mock-admin', 
          username: 'admin', 
          role: 'admin', 
          isActive: true, 
          expiresAt: null, 
          createdAt: new Date().toISOString(),
          firstName: 'Amministratore',
          lastName: 'Sistema',
          title: 'Dr.'
        } 
      };
    }
    return { user: null, error: "Database non connesso. Usa admin/admin123 o prova la Registrazione Offline." };
  }

  try {
    await initDbSchema(); // Ensure DB is ready
    
    const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (res.rowCount === 0) {
      return { user: null, error: "Credenziali non valide." };
    }

    const userData = res.rows[0];

    // Password Check (Simple for this demo - In production use bcrypt)
    if (userData.password_hash !== password) {
      return { user: null, error: "Credenziali non valide." };
    }

    // Status Check
    if (!userData.is_active) {
      return { user: null, error: "Account disattivato dall'amministratore." };
    }

    // Expiry Check
    if (userData.expires_at) {
      const expiry = new Date(userData.expires_at);
      if (expiry < new Date()) {
        return { user: null, error: "Il tuo abbonamento è scaduto. Contatta l'amministratore." };
      }
    }

    return { user: mapUser(userData) };

  } catch (error) {
    console.error("Login error:", error);
    return { user: null, error: "Errore del server o connessione DB persa." };
  }
};

export const register = async (firstName: string, lastName: string, username: string, password: string): Promise<{ user: User | null; error?: string }> => {
  const pool = getDbPool();
  
  // OFFLINE / MOCK MODE
  if (!pool) {
    console.warn("Database non connesso. Registrazione utente mock offline.");
    const mockUser: User = {
      id: `mock-user-${Date.now()}`, // ID univoco temporaneo
      username,
      role: 'user',
      isActive: true,
      expiresAt: null,
      createdAt: new Date().toISOString(),
      firstName,
      lastName,
      title: 'Dr.',
      specialization: '',
      email: '',
      phone: ''
    };
    return { user: mockUser };
  }

  try {
    await initDbSchema();
    
    // Check if username exists
    const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rowCount > 0) {
      return { user: null, error: "Nome utente già in uso." };
    }

    const res = await pool.query(`
      INSERT INTO users (username, password_hash, role, first_name, last_name, is_active, title)
      VALUES ($1, $2, 'user', $3, $4, true, 'Dr.')
      RETURNING *
    `, [username, password, firstName, lastName]);

    return { user: mapUser(res.rows[0]) };
  } catch (error) {
    console.error("Registration error:", error);
    return { user: null, error: "Errore durante la registrazione." };
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<User> => {
  const pool = getDbPool();
  if (!pool) throw new Error("Database offline");

  const res = await pool.query(`
    UPDATE users 
    SET first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        title = COALESCE($4, title),
        specialization = COALESCE($5, specialization),
        email = COALESCE($6, email),
        phone = COALESCE($7, phone)
    WHERE id = $1
    RETURNING *
  `, [
    userId, 
    data.firstName, 
    data.lastName, 
    data.title, 
    data.specialization, 
    data.email, 
    data.phone
  ]);

  if (res.rowCount === 0) throw new Error("Utente non trovato");
  return mapUser(res.rows[0]);
};

// ADMIN FUNCTIONS

export const getAllUsers = async (): Promise<User[]> => {
  const pool = getDbPool();
  if (!pool) return [];

  const res = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return res.rows.map(mapUser);
};

export const createUser = async (username: string, password: string): Promise<User> => {
  const pool = getDbPool();
  if (!pool) throw new Error("No DB");

  try {
    const res = await pool.query(`
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, 'user')
      RETURNING *
    `, [username, password]);
    
    return mapUser(res.rows[0]);
  } catch (e: any) {
    if (e.code === '23505') { // Unique violation
      throw new Error("Nome utente già esistente.");
    }
    throw e;
  }
};

export const updateUserStatus = async (userId: string, isActive: boolean, expiresAt: string | null): Promise<void> => {
  const pool = getDbPool();
  if (!pool) return;

  await pool.query(`
    UPDATE users 
    SET is_active = $2, expires_at = $3
    WHERE id = $1
  `, [userId, isActive, expiresAt]);
};

export const changeUserPassword = async (userId: string, newPass: string): Promise<void> => {
  const pool = getDbPool();
  if (!pool) return;
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, newPass]);
}
