// ./src/model/messages.js
const pool = require('../config/db');

const Messages = {
  // Add a message to a ticket
  create: async (ticketId, userId, messageText = null) => {
    const [result] = await pool.query(
      `INSERT INTO messages (ticket_id, user_id, message_text, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [ticketId, userId, messageText]
    );
    return result.insertId;
  },

  // Get all messages for a ticket
  findByTicketId: async (ticketId) => {
    const [rows] = await pool.query(
      `SELECT m.*, u.email, u.user_type 
       FROM messages m 
       JOIN users u ON m.user_id = u.id 
       WHERE m.ticket_id = ? 
       ORDER BY m.created_at ASC`,
      [ticketId]
    );
    return rows;
  }
};

module.exports = Messages;
