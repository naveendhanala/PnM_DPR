const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { project_id, project_code, date, from, to, ownership } = req.query;
    let query = `
      SELECT e.*, p.code AS project_code, p.name AS project_name,
             u.name AS submitted_by_name
      FROM dpr_entries e
      JOIN projects p ON e.project_id = p.id
      LEFT JOIN users u ON e.submitted_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (project_id) {
      params.push(project_id);
      query += ` AND e.project_id = $${params.length}`;
    }
    if (project_code) {
      params.push(project_code);
      query += ` AND p.code = $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND e.entry_date = $${params.length}`;
    }
    if (from) {
      params.push(from);
      query += ` AND e.entry_date >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      query += ` AND e.entry_date <= $${params.length}`;
    }
    if (ownership) {
      params.push(ownership);
      query += ` AND e.ownership = $${params.length}`;
    }
    if (req.user.role !== 'admin' && req.user.project_codes.length > 0) {
      params.push(req.user.project_codes);
      query += ` AND p.code = ANY($${params.length})`;
    }

    query += ' ORDER BY e.entry_date DESC, e.submitted_at DESC';
    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get entries error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  try {
    const {
      machine_id, project_id, entry_date,
      r1_open, r1_close, r2_open, r2_close,
      hsd, breakdown, qty, work_done, remarks
    } = req.body;

    if (!machine_id || !project_id || !entry_date) {
      return res.status(400).json({ error: 'machine_id, project_id, and entry_date are required' });
    }

    const machineResult = await db.query(
      'SELECT * FROM machines WHERE id = $1 AND active = true',
      [machine_id]
    );
    if (machineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    const machine = machineResult.rows[0];

    const r1Total = r1_close != null && r1_open != null
      ? parseFloat(r1_close) - parseFloat(r1_open) : null;
    const r2Total = r2_close != null && r2_open != null
      ? parseFloat(r2_close) - parseFloat(r2_open) : null;

    const workingHours = (r1Total || 0) + (machine.dual_reading && r2Total ? r2Total : 0);
    const plannedHours = parseFloat(machine.planned_hours) || 10;
    const utilPct = plannedHours > 0 ? Math.round((workingHours / plannedHours) * 100) : 0;
    const fuelAvg = workingHours > 0 && hsd
      ? parseFloat((parseFloat(hsd) / workingHours).toFixed(2)) : null;

    const result = await db.query(
      `INSERT INTO dpr_entries (
        machine_id, project_id, entry_date,
        slno, eq_type, capacity, reg_no, ownership, dual_reading, planned_hours,
        r1_open, r1_close, r1_total, r2_open, r2_close, r2_total,
        working_hours, util_pct, hsd, fuel_avg,
        breakdown, qty, work_done, remarks, submitted_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25
      ) RETURNING *`,
      [
        machine_id, project_id, entry_date,
        machine.slno, machine.eq_type, machine.capacity, machine.reg_no,
        machine.ownership, machine.dual_reading, machine.planned_hours,
        r1_open ?? null, r1_close ?? null, r1Total,
        r2_open ?? null, r2_close ?? null, r2Total,
        workingHours, utilPct,
        hsd ?? null, fuelAvg,
        breakdown ?? 0, qty ?? null, work_done ?? null, remarks ?? null,
        req.user.id
      ]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Entry already exists for this machine on this date' });
    }
    console.error('Create entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { r1_open, r1_close, r2_open, r2_close, hsd, breakdown, qty, work_done, remarks } = req.body;

    const entryResult = await db.query('SELECT * FROM dpr_entries WHERE id = $1', [id]);
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = entryResult.rows[0];

    const newR1Open  = r1_open  !== undefined ? parseFloat(r1_open)  : entry.r1_open;
    const newR1Close = r1_close !== undefined ? parseFloat(r1_close) : entry.r1_close;
    const newR2Open  = r2_open  !== undefined ? parseFloat(r2_open)  : entry.r2_open;
    const newR2Close = r2_close !== undefined ? parseFloat(r2_close) : entry.r2_close;
    const newHsd     = hsd      !== undefined ? parseFloat(hsd)      : entry.hsd;

    const r1Total = newR1Close != null && newR1Open != null
      ? newR1Close - newR1Open : entry.r1_total;
    const r2Total = newR2Close != null && newR2Open != null
      ? newR2Close - newR2Open : entry.r2_total;

    const workingHours = (r1Total || 0) + (entry.dual_reading && r2Total ? r2Total : 0);
    const plannedHours = parseFloat(entry.planned_hours) || 10;
    const utilPct = plannedHours > 0 ? Math.round((workingHours / plannedHours) * 100) : 0;
    const fuelAvg = workingHours > 0 && newHsd
      ? parseFloat((newHsd / workingHours).toFixed(2)) : null;

    const result = await db.query(
      `UPDATE dpr_entries SET
        r1_open=$1, r1_close=$2, r1_total=$3,
        r2_open=$4, r2_close=$5, r2_total=$6,
        working_hours=$7, util_pct=$8, hsd=$9, fuel_avg=$10,
        breakdown  = COALESCE($11, breakdown),
        qty        = COALESCE($12, qty),
        work_done  = COALESCE($13, work_done),
        remarks    = COALESCE($14, remarks),
        updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        newR1Open, newR1Close, r1Total,
        newR2Open, newR2Close, r2Total,
        workingHours, utilPct, newHsd, fuelAvg,
        breakdown !== undefined ? breakdown : null,
        qty       !== undefined ? qty       : null,
        work_done !== undefined ? work_done : null,
        remarks   !== undefined ? remarks   : null,
        id
      ]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM dpr_entries WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, create, update, remove };
