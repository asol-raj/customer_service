// ./src/model/tickets.js
const pool = require('../config/db');

const Tickets = {
  // Create a new ticket
  create: async (userId, ticketData) => {
    const {
      subject,
      description = null,
      invoice_number = null,
      policy_number = null,
      priority = 'medium'
    } = ticketData;

    const [result] = await pool.query(
      `INSERT INTO tickets 
        (user_id, subject, description, invoice_number, policy_number, status, priority, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, 'open', ?, NOW(), NOW())`,
      [userId, subject, description, invoice_number, policy_number, priority]
    );

    return result.insertId;
  },

  // Find ticket by ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM tickets WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Get all tickets of a user
  findByUserId: async (userId) => {
    const [rows] = await pool.query(
      `SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  // Assign ticket to staff
  assignToStaff: async (ticketId, staffId) => {
    const [result] = await pool.query(
      `UPDATE tickets SET assigned_to = ?, status = 'in_progress', updated_at = NOW() WHERE id = ?`,
      [staffId, ticketId]
    );
    return result.affectedRows > 0;
  },

  // Update ticket status
  updateStatus: async (ticketId, status) => {
    const [result] = await pool.query(
      `UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, ticketId]
    );
    return result.affectedRows > 0;
  },

  // Optional: Update ticket details (subject, description, invoice, policy, priority)
  updateDetails: async (ticketId, updateData) => {
    const {
      subject,
      description,
      invoice_number,
      policy_number,
      priority
    } = updateData;

    const [result] = await pool.query(
      `UPDATE tickets 
       SET subject = COALESCE(?, subject),
           description = COALESCE(?, description),
           invoice_number = COALESCE(?, invoice_number),
           policy_number = COALESCE(?, policy_number),
           priority = COALESCE(?, priority),
           updated_at = NOW()
       WHERE id = ?`,
      [subject, description, invoice_number, policy_number, priority, ticketId]
    );

    return result.affectedRows > 0;
  }
};

module.exports = Tickets;
