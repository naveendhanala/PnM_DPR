require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const PROJECTS = [
  { code: 'E6',         name: 'Project E6' },
  { code: 'E8',         name: 'Project E8' },
  { code: 'E9',         name: 'Project E9' },
  { code: 'E13',        name: 'Project E13' },
  { code: 'N10',        name: 'Project N10' },
  { code: 'N11',        name: 'Project N11' },
  { code: 'N13',        name: 'Project N13' },
  { code: 'N14',        name: 'Project N14' },
  { code: 'Zone 3',     name: 'Zone 3' },
  { code: 'Zone 4',     name: 'Zone 4' },
  { code: 'Zone 5b',    name: 'Zone 5b' },
  { code: 'Neerukonda', name: 'Neerukonda' }
];

const EQ_TYPES = [
  'Excavator 5T', 'Excavator 7T', 'Excavator 14T', 'Excavator 20T', 'Excavator 30T',
  'Excavator 35T', 'Tipper 10T', 'Tipper 12T', 'Tipper 14T', 'Motor Grader',
  'Vibratory Roller', 'JCB 3DX', 'JCB 4DX', 'Water Tanker 5KL', 'Water Tanker 10KL',
  'Water Tanker 15KL', 'Transit Mixer', 'Boom Placer', 'Tower Crane', 'Hydra Crane',
  'Poclain', 'Dozer', 'Compactor', 'Road Roller', 'Pick & Carry Crane',
  'Self Loading Mixer', 'Concrete Pump', 'Batching Plant', 'Generator', 'Air Compressor'
];

// Mirrors the DM constant from the original HTML
const DEFAULT_MACHINES = [
  { project: 'E6',         slno: 'E6-EX-01',  eq_type: 'Excavator 20T', capacity: '20T',  reg_no: 'AP09CX3579', ownership: 'Own',  vendor: null,              rate: null, reading1_basis: 'Hours', fuel_min: 10, fuel_max: 18, planned_hours: 10 },
  { project: 'E6',         slno: 'E6-JCB-01', eq_type: 'JCB 3DX',       capacity: null,   reg_no: 'TS09GC4807', ownership: 'Own',  vendor: null,              rate: null, reading1_basis: 'Hours', fuel_min: 8,  fuel_max: 14, planned_hours: 10 },
  { project: 'E8',         slno: 'E8-EX-01',  eq_type: 'Excavator 20T', capacity: '20T',  reg_no: 'AP09EX5001', ownership: 'Own',  vendor: null,              rate: null, reading1_basis: 'Hours', fuel_min: 10, fuel_max: 18, planned_hours: 10 },
  { project: 'N10',        slno: 'N10-GR-01', eq_type: 'Motor Grader',  capacity: null,   reg_no: 'AP09MG1001', ownership: 'Own',  vendor: null,              rate: null, reading1_basis: 'Hours', fuel_min: 12, fuel_max: 20, planned_hours: 10 },
  { project: 'N10',        slno: 'N10-VB-01', eq_type: 'Vibratory Roller', capacity: null, reg_no: 'AP09VR2001', ownership: 'Own', vendor: null,              rate: null, reading1_basis: 'Hours', fuel_min: 8,  fuel_max: 14, planned_hours: 10 },
  { project: 'Neerukonda', slno: 'NK-TC-01',  eq_type: 'Transit Mixer', capacity: '7 CuM', reg_no: 'AP37XQ0001', ownership: 'Hire', vendor: 'Srinivas Rao',  rate: 1200, reading1_basis: 'KM',    fuel_min: 3,  fuel_max: 6,  planned_hours: 10 },
  { project: 'Neerukonda', slno: 'NK-BP-01',  eq_type: 'Boom Placer',   capacity: '36M',  reg_no: 'AP09BP0001', ownership: 'Hire', vendor: 'Lalitha Concrete', rate: 5000, reading1_basis: 'Hours', fuel_min: 8, fuel_max: 15, planned_hours: 10 }
];

async function seed() {
  try {
    console.log('Seeding database...\n');

    // Projects
    console.log('Creating projects...');
    const projectMap = {};
    for (const p of PROJECTS) {
      const res = await db.query(
        'INSERT INTO projects (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = $2 RETURNING id, code',
        [p.code, p.name]
      );
      projectMap[p.code] = res.rows[0].id;
    }
    console.log(`  ${PROJECTS.length} projects done.`);

    // Equipment types
    console.log('Creating equipment types...');
    for (const t of EQ_TYPES) {
      await db.query(
        'INSERT INTO equipment_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [t]
      );
    }
    console.log(`  ${EQ_TYPES.length} equipment types done.`);

    // Admin user
    console.log('Creating users...');
    const adminHash = await bcrypt.hash('admin123', 12);
    await db.query(
      `INSERT INTO users (name, username, password_hash, role, project_codes)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO NOTHING`,
      ['Admin', 'admin', adminHash, 'admin', []]
    );

    // Default operator user (access to all projects)
    const opHash = await bcrypt.hash('dpr2024', 12);
    await db.query(
      `INSERT INTO users (name, username, password_hash, role, project_codes)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO NOTHING`,
      ['Operator', 'operator', opHash, 'operator', PROJECTS.map(p => p.code)]
    );
    console.log('  2 users done.');

    // Default machines
    console.log('Creating default machines...');
    let machineCount = 0;
    for (const m of DEFAULT_MACHINES) {
      const pid = projectMap[m.project];
      if (!pid) continue;
      await db.query(
        `INSERT INTO machines
          (project_id, slno, eq_type, capacity, reg_no, ownership, vendor, rate,
           reading1_basis, fuel_min, fuel_max, planned_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (project_id, slno) DO NOTHING`,
        [pid, m.slno, m.eq_type, m.capacity, m.reg_no, m.ownership, m.vendor, m.rate,
         m.reading1_basis, m.fuel_min, m.fuel_max, m.planned_hours]
      );
      machineCount++;
    }
    console.log(`  ${machineCount} machines done.`);

    console.log('\nSeed complete!');
    console.log('-----------------------------------');
    console.log('Default credentials:');
    console.log('  Admin    → admin    / admin123');
    console.log('  Operator → operator / dpr2024');
    console.log('-----------------------------------');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
