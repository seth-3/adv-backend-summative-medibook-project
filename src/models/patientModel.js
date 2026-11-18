const { pool, buildSetClause } = require('./db');

const COLUMNS = 'patient_id, full_name, email, phone, created_at';

async function findAll() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM patients ORDER BY patient_id`);
  return rows;
}

async function findById(id, connection = pool) {
  const [rows] = await connection.query(`SELECT ${COLUMNS} FROM patients WHERE patient_id = ?`, [id]);
  return rows[0] || null;
}

async function create({ full_name, email, phone }) {
  const [result] = await pool.query(
    'INSERT INTO patients (full_name, email, phone) VALUES (?, ?, ?)',
    [full_name, email, phone],
  );
  return findById(result.insertId);
}

async function update(id, fields) {
  const { setClause, values } = buildSetClause(fields);
  const [result] = await pool.query(`UPDATE patients SET ${setClause} WHERE patient_id = ?`, [...values, id]);
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM patients WHERE patient_id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = { findAll, findById, create, update, remove };
