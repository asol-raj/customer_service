// ./src/model/user.js
const pool = require('../config/db');

const User = {
  // Create a new user
  create: async (username, passwordHash, userType = 'customer') => {
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, user_type) VALUES (?, ?, ?)`,
      [username, passwordHash, userType]
    );
    return result.insertId;
  },

  // Find user by username
  findByUsername: async (username) => {
    const [rows] = await pool.query(
      // Specify the columns needed for authentication
       `SELECT id, username, password_hash, user_type 
        FROM users 
        WHERE username = ? AND is_active = true 
        LIMIT 1;`,
      [username]
    );
    return rows[0] || null;
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE id = ? AND is_active = true LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Get all users (basic info)
  getAll: async () => {
    const [rows] = await pool.query(
      `SELECT id, username, user_type, is_active, created_at FROM users`
    );
    return rows;
  },

  // Delete user by ID
  delete: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
