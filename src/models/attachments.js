// ./src/model/attachments.js
const pool = require('../config/db');

const Attachments = {
  // Add attachment to a message
  create: async (messageId, fileName, filePath, fileType) => {
    const [result] = await pool.query(
      `INSERT INTO attachments (message_id, file_name, file_path, file_type, uploaded_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [messageId, fileName, filePath, fileType]
    );
    return result.insertId;
  },

  // Get all attachments for a message
  findByMessageId: async (messageId) => {
    const [rows] = await pool.query(
      `SELECT * FROM attachments WHERE message_id = ?`,
      [messageId]
    );
    return rows;
  },

  // Delete attachment
  delete: async (id) => {
    const [result] = await pool.query(
      `DELETE FROM attachments WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Attachments;
