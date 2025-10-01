// ./src/model/user.js
const pool = require('../config/db');

const User = {
  // Create a new user
  create: async (payload) => {
    const {
      username, hashedPassword, user_type,
      first_name, middle_name, last_name,
      address, city, zipcode, state,
    } = payload;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into users
      const [result] = await connection.query(
        `INSERT INTO users (username, password_hash, user_type)
         VALUES (?, ?, ?);`,
        [username, hashedPassword, user_type]
      );

      const user_id = result.insertId;

      // Insert into user_details
      await connection.query(
        `INSERT INTO user_details
          (user_id, first_name, middle_name, last_name, address, city, zipcode, state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [user_id, first_name, middle_name, last_name, address, city, zipcode, state]
      );

      await connection.commit(); // ✅ commit if everything succeeded
      return user_id;
    } catch (err) {
      await connection.rollback(); // ❌ rollback if anything failed
      throw err;
    } finally {
      connection.release();
    }
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
  },

  /**
   * Update user details
   */
  updateUserDetails: async (details) => {
    const {
      first_name, middle_name, last_name, address, city,
      zipcode, state, contact, email_address, user_id } = details;
      

    const [result] = await pool.execute(
      `UPDATE user_details
        SET first_name = COALESCE(?, first_name), 
            middle_name = COALESCE(?, middle_name), 
            last_name = COALESCE(?, last_name), 
            address = COALESCE(?, address), 
            city = COALESCE(?, city), 
            zipcode = COALESCE(?, zipcode), 
            state = COALESCE(?, state), 
            contact = COALESCE(?, contact), 
            email_address = COALESCE(?, email_address), 
            updated_at = NOW()
       WHERE user_id = ?`,
      [first_name, middle_name, last_name, address, city, zipcode, state, contact, email_address, user_id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Reset password (admin/forgot password flow)
   */
  resetPassword: async (user_id, newPassword) => {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [hashed, user_id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Change password (user flow)
   */
  changePassword: async (user_id, oldPassword, newPassword) => {
    // Fetch current hash
    const [rows] = await pool.execute(
      `SELECT password_hash FROM users WHERE id = ?`,
      [user_id]
    );
    if (rows.length === 0) throw new Error("User not found");

    const user = rows[0];
    const match = await bcrypt.compare(oldPassword, user.password_hash);
    if (!match) throw new Error("Invalid old password");

    // Update with new hash
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [hashed, user_id]
    );

    return result.affectedRows > 0;
  },

  /**
   * Set password (generic helper)
   */
  setPassword: async (user_id, newPassword) => {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.execute(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [hashed, user_id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Get user with details
   */
  getUserWithDetails: async (user_id) => {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.user_type, u.is_active, u.created_at,
              d.user_id, d.first_name, d.middle_name, d.last_name,
              d.address, d.city, d.zipcode, d.state, d.contact, d.email_address, d.avatar, d.updated_at
       FROM users u
       LEFT JOIN user_details d ON u.id = d.user_id
       WHERE u.id = ?`,
      [user_id]
    );

    if (rows.length === 0) return null;
    return rows[0];
  },
};

module.exports = User;
