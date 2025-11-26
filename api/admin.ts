import pool from './db';

export default async function handler(req: any, res: any) {
  const { action, username, password, userId, isActive, expiresAt } = req.body;

  try {
    if (req.method === 'GET') {
      const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
      const users = result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        role: row.role,
        isActive: row.is_active,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        firstName: row.first_name,
        lastName: row.last_name,
        title: row.title,
        specialization: row.specialization,
        email: row.email,
        phone: row.phone
      }));
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      if (action === 'createUser') {
        try {
          const result = await pool.query(`
            INSERT INTO users (username, password_hash, role)
            VALUES ($1, $2, 'user')
            RETURNING *
          `, [username, password]);
          return res.status(200).json(result.rows[0]);
        } catch (e: any) {
           if (e.code === '23505') return res.status(400).json({ error: 'Username exists' });
           throw e;
        }
      }

      if (action === 'updateStatus') {
        await pool.query(`
          UPDATE users SET is_active = $2, expires_at = $3 WHERE id = $1
        `, [userId, isActive, expiresAt]);
        return res.status(200).json({ success: true });
      }

      if (action === 'changePassword') {
         await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, password]);
         return res.status(200).json({ success: true });
      }
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}