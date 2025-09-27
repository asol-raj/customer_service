// ./src/model/userDetails.js
const pool = require('../config/db');

const UserDetails = {
  // Create details for a user
  create: async (userId, details) => {
    const {
      first_name,
      middle_name,
      last_name,
      address,
      city,
      zipcode,
      state
    } = details;

    const [result] = await pool.query(
      `INSERT INTO user_details 
        (user_id, first_name, middle_name, last_name, address, city, zipcode, state) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, first_name, middle_name, last_name, address, city, zipcode, state]
    );

    return result.insertId;
  },

  // Find details by user_id
  findByUserId: async (userId) => {
    const [rows] = await pool.query(
      `SELECT * FROM user_details WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  // Update details for a user
  update: async (userId, details) => {
    const {
      first_name,
      middle_name,
      last_name,
      address,
      city,
      zipcode,
      state
    } = details;

    const [result] = await pool.query(
      `UPDATE user_details 
       SET first_name = ?, middle_name = ?, last_name = ?, address = ?, city = ?, zipcode = ?, state = ?
       WHERE user_id = ?`,
      [first_name, middle_name, last_name, address, city, zipcode, state, userId]
    );

    return result.affectedRows > 0;
  },

  // Delete details by user_id
  deleteByUserId: async (userId) => {
    const [result] = await pool.query(
      `DELETE FROM user_details WHERE user_id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = UserDetails;
