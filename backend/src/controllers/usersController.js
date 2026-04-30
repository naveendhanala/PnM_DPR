const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, username, role, project_codes, active, created_at FROM users ORDER BY name'
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { name, username, password, role, project_codes } = req.body;
    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'name, username, password, and role are required' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (name, username, password_hash, role, project_codes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, username, role, project_codes, created_at`,
      [name.trim(), username.toLowerCase().trim(), hash, role, project_codes || []]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, role, project_codes, active } = req.body;
    const hash = password ? await bcrypt.hash(password, 12) : null;

    const result = await db.query(
      `UPDATE users SET
        name          = COALESCE($1, name),
        password_hash = COALESCE($2, password_hash),
        role          = COALESCE($3, role),
        project_codes = COALESCE($4, project_codes),
        active        = COALESCE($5, active),
        updated_at    = NOW()
       WHERE id = $6
       RETURNING id, name, username, role, project_codes, active`,
      [name || null, hash, role || null, project_codes || null, active !== undefined ? active : null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    await db.query('UPDATE users SET active = false WHERE id = $1', [id]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
