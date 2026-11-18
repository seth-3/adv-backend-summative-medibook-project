const { pool, buildSetClause } = require('./db');

const COLUMNS = 'doctor_id, full_name, specialty, consultation_fee, room, created_at';

async function findAll() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM doctors ORDER BY doctor_id`);
  return rows;
}

async function findById(id, connection = pool) {
  const [rows] = await connection.query(`SELECT ${COLUMNS} FROM doctors WHERE doctor_id = ?`, [id]);
  return rows[0] || null;
}

async function create({ full_name, specialty, consultation_fee, room }) {
  const [result] = await pool.query(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, room) VALUES (?, ?, ?, ?)',
    [full_name, specialty, consultation_fee, room],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const { setClause, values } = buildSetClause(fields);
  const [result] = await pool.query(`UPDATE doctors SET ${setClause} WHERE doctor_id = ?`, [...values, id]);
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM doctors WHERE doctor_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
