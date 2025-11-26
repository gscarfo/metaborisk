import pool from './db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, username, password, firstName, lastName, userId, data } = req.body;

  try {
    if (action === 'login') {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rowCount === 0) return res.status(401).json({ error: 'Credenziali non valide' });

      const user = result.rows[0];
      if (user.password_hash !== password) return res.status(401).json({ error: 'Credenziali non valide' });
      if (!user.is_active) return res.status(403).json({ error: 'Account disattivato' });
      if (user.expires_at && new Date(user.expires_at) < new Date()) {
        return res.status(403).json({ error: 'Abbonamento scaduto' });
      }

      return res.status(200).json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.is_active,
          expiresAt: user.expires_at,
          createdAt: user.created_at,
          firstName: user.first_name,
          lastName: user.last_name,
          title: user.title,
          specialization: user.specialization,
          email: user.email,
          phone: user.phone
        }
      });
    }

    if (action === 'register') {
      const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
      if (check.rowCount > 0) return res.status(400).json({ error: 'Nome utente già in uso' });

      const result = await pool.query(`
        INSERT INTO users (username, password_hash, role, first_name, last_name, is_active, title)
        VALUES ($1, $2, 'user', $3, $4, true, 'Dr.')
        RETURNING *
      `, [username, password, firstName, lastName]);

      const user = result.rows[0];
      return res.status(200).json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.is_active,
          expiresAt: user.expires_at,
          createdAt: user.created_at,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    }

    if (action === 'updateProfile') {
      const result = await pool.query(`
        UPDATE users 
        SET first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            title = COALESCE($4, title),
            specialization = COALESCE($5, specialization),
            email = COALESCE($6, email),
            phone = COALESCE($7, phone)
        WHERE id = $1
        RETURNING *
      `, [userId, data.firstName, data.lastName, data.title, data.specialization, data.email, data.phone]);
      
      const user = result.rows[0];
      return res.status(200).json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          isActive: user.is_active,
          expiresAt: user.expires_at,
          createdAt: user.created_at,
          firstName: user.first_name,
          lastName: user.last_name,
          title: user.title,
          specialization: user.specialization,
          email: user.email,
          phone: user.phone
        }
      });
    }

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}