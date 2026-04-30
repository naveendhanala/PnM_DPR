const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { project_id, project_code } = req.query;
    let query = `
      SELECT m.*, p.code AS project_code, p.name AS project_name
      FROM machines m
      JOIN projects p ON m.project_id = p.id
      WHERE m.active = true
    `;
    const params = [];

    if (project_id) {
      params.push(project_id);
      query += ` AND m.project_id = $${params.length}`;
    }
    if (project_code) {
      params.push(project_code);
      query += ` AND p.code = $${params.length}`;
    }
    if (req.user.role !== 'admin' && req.user.project_codes.length > 0) {
      params.push(req.user.project_codes);
      query += ` AND p.code = ANY($${params.length})`;
    }

    query += ' ORDER BY p.code, m.slno';
    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get machines error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const {
      project_id, slno, eq_type, capacity, reg_no, ownership,
      vendor, rate, reading1_basis, reading2_basis, dual_reading,
      fuel_min, fuel_max, planned_hours
    } = req.body;

    if (!project_id || !slno || !eq_type) {
      return res.status(400).json({ error: 'project_id, slno, and eq_type are required' });
    }

    const result = await db.query(
      `INSERT INTO machines
        (project_id, slno, eq_type, capacity, reg_no, ownership, vendor, rate,
         reading1_basis, reading2_basis, dual_reading, fuel_min, fuel_max, planned_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        project_id, slno.trim(), eq_type.trim(),
        capacity || null, reg_no || null, ownership || 'Own',
        vendor || null, rate || null,
        reading1_basis || 'Hours', reading2_basis || null, dual_reading || false,
        fuel_min || null, fuel_max || null, planned_hours || 10
      ]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Machine slno already exists in this project' });
    }
    console.error('Create machine error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slno, eq_type, capacity, reg_no, ownership, vendor, rate,
      reading1_basis, reading2_basis, dual_reading,
      fuel_min, fuel_max, planned_hours, active
    } = req.body;

    const result = await db.query(
      `UPDATE machines SET
        slno            = COALESCE($1,  slno),
        eq_type         = COALESCE($2,  eq_type),
        capacity        = COALESCE($3,  capacity),
        reg_no          = COALESCE($4,  reg_no),
        ownership       = COALESCE($5,  ownership),
        vendor          = COALESCE($6,  vendor),
        rate            = COALESCE($7,  rate),
        reading1_basis  = COALESCE($8,  reading1_basis),
        reading2_basis  = COALESCE($9,  reading2_basis),
        dual_reading    = COALESCE($10, dual_reading),
        fuel_min        = COALESCE($11, fuel_min),
        fuel_max        = COALESCE($12, fuel_max),
        planned_hours   = COALESCE($13, planned_hours),
        active          = COALESCE($14, active),
        updated_at      = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        slno || null, eq_type || null, capacity || null, reg_no || null,
        ownership || null, vendor || null, rate || null,
        reading1_basis || null, reading2_basis || null,
        dual_reading !== undefined ? dual_reading : null,
        fuel_min || null, fuel_max || null, planned_hours || null,
        active !== undefined ? active : null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update machine error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE machines SET active = false WHERE id = $1', [id]);
    res.json({ message: 'Machine deactivated' });
  } catch (err) {
    console.error('Delete machine error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
