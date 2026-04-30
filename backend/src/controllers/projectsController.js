const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    let query = 'SELECT * FROM projects WHERE active = true ORDER BY code';
    let params = [];

    if (req.user.role !== 'admin' && req.user.project_codes.length > 0) {
      query = 'SELECT * FROM projects WHERE code = ANY($1) AND active = true ORDER BY code';
      params = [req.user.project_codes];
    }

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }
    const result = await db.query(
      'INSERT INTO projects (code, name) VALUES ($1, $2) RETURNING *',
      [code.trim(), name.trim()]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Project code already exists' });
    }
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;
    const result = await db.query(
      'UPDATE projects SET name = COALESCE($1, name), active = COALESCE($2, active) WHERE id = $3 RETURNING *',
      [name || null, active !== undefined ? active : null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE projects SET active = false WHERE id = $1', [id]);
    res.json({ message: 'Project deactivated' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
