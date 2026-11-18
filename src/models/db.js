const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

// Runs fn(connection) inside a transaction: commit if it works, rollback if it throws.
async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Builds "col1 = ?, col2 = ?" for an UPDATE. Column names come from the validators'
// whitelist (never from the user), and the values are passed as ? parameters.
function buildSetClause(fields) {
  const columns = Object.keys(fields);
  return {
    setClause: columns.map((column) => `${column} = ?`).join(', '),
    values: columns.map((column) => fields[column]),
  };
}

module.exports = { pool, withTransaction, buildSetClause };
