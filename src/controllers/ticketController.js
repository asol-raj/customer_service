// ./src/controllers/ticketController.js
// const Tickets = require('../models/tickets');
const Messages = require('../models/messages');
const Attachments = require('../models/attachments');
const pool = require('../config/db');
const path = require('path');
const log = console.log;
const fs = require('fs');
const Tickets = require('../models/tickets');


const TicketController = {
  dashboard: async (req, res) => {
    try {
      // For customers, get their tickets
      let tickets = [];
      if (req.user.user_type === 'customer') {
        const [rows] = await pool.query(
          'SELECT id, subject, status, created_at FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
          [req.user.id]
        );
        tickets = rows;
        return res.render('users/dashboard', { user: req.user, tickets });
      }

      // For Staff
      if (req.user.user_type === 'staff') {
        // Staff might see all tickets, or assigned ones
        const [users] = await pool.query(`select count(*) from users where user_type = 'customer'`); log(users);
        const [rows] = await pool.query(
          'SELECT id, subject, status, created_at FROM tickets ORDER BY created_at DESC'
        );
        tickets = rows;
        return res.render('staff/dashboard', { user: req.user, tickets });
      }

      // res.render('users/dashboard', { user: req.user, tickets });
    } catch (err) {
      console.error(err);
      res.render('index', { user: req.user, tickets: [] });
    }
  },

  // Render ticket creation page
  ticketPage: async (req, res) => {
    res.render('ticket', { user: req.user, error: null, success: null });
  },

  // Handle ticket submission
  createTicket: async (req, res) => {
    try {
      const userId = req.user.id;
      const { subject, description, invoice_number, policy_number } = req.body;

      if (!subject) {
        return res.render('users/dashboard', { user: req.user, error: 'Subject is required', success: null });
      }

      // 1️⃣ Create ticket
      const ticketId = await Tickets.create(userId, {
        subject,
        description,
        invoice_number,
        policy_number,
        priority: 'medium'
      });

      // 2️⃣ Create initial message
      const messageText = description || null;
      const messageId = await Messages.create(ticketId, userId, messageText);

      // 3️⃣ Save attachments if any
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileType = file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype === 'application/pdf' ? 'pdf' : 'other'; // log(file);
          await Attachments.create(messageId, file.filename, file.path, fileType);
        }
      }

      return res.render('ticket', { user: req.user, error: null, success: 'Ticket created successfully!' });

    } catch (err) {
      console.error(err);
      return res.render('ticket', { user: req.user, error: 'Server error', success: null });
    }
  },

  getTicketById: async (req, res) => {
    const ticketId = parseInt(req.params.id, 10);
    const user = req.user;

    if (Number.isNaN(ticketId)) {
      return res.status(400).render('500', { message: 'Invalid ticket id' });
    }

    try {
      // 1) load ticket
      const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      if (ticketRows.length === 0) {
        return res.status(404).render('404', { message: 'Ticket not found' });
      }
      const ticket = ticketRows[0];

      // 2) access control: customers can only see their own tickets
      if (user.user_type === 'customer' && ticket.user_id !== user.id) {
        return res.status(403).render('403', { message: 'Access denied' });
      }

      // 3) load messages (follow-ups) with author info
      const [messages] = await pool.query(
      `SELECT 
          m.id,
          m.message_text,
          m.created_at,
          u.username,
          u.user_type,
          ud.first_name,
          ud.last_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN user_details ud ON ud.user_id = u.id
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
        [ticketId]
      );

      // 4) if there are messages, load attachments for those messages
      let attachments = [];
      if (messages.length > 0) {
        const messageIds = messages.map(m => m.id);
        const placeholders = messageIds.map(() => '?').join(',');
        const [attachRows] = await pool.query(
          `SELECT * FROM attachments WHERE message_id IN (${placeholders})`,
          messageIds
        );
        attachments = attachRows;
      }

      // 5) group attachments by message_id
      const attachmentsByMessage = {};
      for (const a of attachments) {
        if (!attachmentsByMessage[a.message_id]) attachmentsByMessage[a.message_id] = [];
        attachmentsByMessage[a.message_id].push(a);
      }

      // 6) enrich messages with attachments and author_name
      const messagesWithAttachments = messages.map(m => ({
        ...m,
        author_name: m.first_name && m.last_name
          ? `${m.first_name} ${m.last_name}`
          : m.username, // fallback
        author_type: m.user_type,
        attachments: attachmentsByMessage[m.id] || []
      }));

      // 7) render the right view based on role
      const view = (user.user_type === 'staff') ? 'staff/ticket' : 'users/ticket';

      return res.render(view, {
        ticket,
        messages: messagesWithAttachments,
        followUps: messagesWithAttachments, // alias for backward compatibility
        user
      });

    } catch (err) {
      console.error('getTicketById error:', err);
      return res.status(500).render('500', { message: 'Something went wrong' });
    }
  },

  addFollowUp: async (req, res) => {
    const ticketId = parseInt(req.params.id, 10);
    const user = req.user;
    const { message_text } = req.body;
    const files = req.files; // uploaded files

    if (Number.isNaN(ticketId)) {
      return res.status(400).render('500', { message: 'Invalid ticket id' });
    }

    if (!message_text || message_text.trim() === '') {
      return res.status(400).render('500', { message: 'Message cannot be empty' });
    }

    try {
      // 1) check ticket exists
      const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      if (ticketRows.length === 0) {
        return res.status(404).render('404', { message: 'Ticket not found' });
      }
      const ticket = ticketRows[0];

      // 2) customers can only reply to their own tickets
      if (user.user_type === 'customer' && ticket.user_id !== user.id) {
        return res.status(403).render('403', { message: 'Access denied' });
      }

      // 3) insert message
      const [result] = await pool.query(
        'INSERT INTO messages (ticket_id, user_id, message_text) VALUES (?, ?, ?)',
        [ticketId, user.id, message_text]
      );
      const messageId = result.insertId;

      // 4) insert attachments if any
      // if (files && files.length > 0) {
      //   const attachmentsData = files.map(f => [
      //     messageId,
      //     f.filename,
      //     f.path,
      //     f.mimetype.startsWith('image/') ? 'image' :
      //       f.mimetype === 'application/pdf' ? 'pdf' : 'other'
      //   ]);

      //   await Attachments.create(messageId, f.filename, `/uploads/${f.filename}`, fileType);
      //   await pool.query(
      //     'INSERT INTO attachments (message_id, file_name, file_path, file_type) VALUES ?',
      //     [attachmentsData]
      //   );
      // }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileType = file.mimetype.startsWith('image/') ? 'image' :
            file.mimetype === 'application/pdf' ? 'pdf' : 'other';
          // await Attachments.create(messageId, file.filename, `/uploads/${file.filename}`, fileType);
          await Attachments.create(messageId, file.filename, file.path, fileType);
        }
      }

      // 5) redirect back to the same ticket page
      res.redirect(`/auth/ticket/${ticketId}`);
    } catch (err) {
      console.error('addFollowUp error:', err);
      return res.status(500).render('500', { message: 'Something went wrong' });
    }
  }


};

module.exports = TicketController;
