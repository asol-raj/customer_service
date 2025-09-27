const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const TicketController = require('../controllers/ticketController');
const multer = require('multer');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');

// console.log(path.join(__dirname, '../uploads'));
// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');  // folder for attachments
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // unique file name: timestamp-originalname
        // const unique = Date.now() + '-' + file.originalname;
        // cb(null, `${unique}${ext}`);
        const ext = path.extname(file.originalname);
        const storedName = `${nanoid()}${ext}`;
        cb(null, storedName);
    }
});

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per file
const MAX_FILES = 10;

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
    fileFilter: function (req, file, cb) {
        // If you want to restrict types, implement logic here. For now accept all:
        cb(null, true);
    }
});

// const upload = multer({ storage });

router.get('/new', verifyToken, TicketController.ticketPage);
router.get('/:id', TicketController.getTicketById);
// router.post('/create', verifyToken, TicketController.uploadFiles, TicketController.createTicket);
router.post('/create', upload.array('attachments', MAX_FILES), TicketController.createTicket);
// POST follow-up
router.post('/:id/reply', upload.array('attachments', MAX_FILES), TicketController.addFollowUp);

// staff routes


router.get('/attachments/:ticketId/:filename', verifyToken, async (req, res) => {
  try {
    const { ticketId, filename } = req.params;
    const user = req.user;

    // 1) Lookup attachment for this ticket only
    const [rows] = await pool.query(
      `SELECT a.*, m.ticket_id, t.user_id AS ticket_owner
       FROM attachments a
       JOIN messages m ON a.message_id = m.id
       JOIN tickets t ON m.ticket_id = t.id
       WHERE m.ticket_id = ?`,
      [ticketId]
    );

    // 2) Find the row that matches the requested original filename
    const attachment = rows.find(a => a.file_name === filename);
    if (!attachment) return res.status(404).send('File not found');

    // 3) Access control: customers can only see their own tickets
    if (user.user_type === 'customer' && attachment.ticket_owner !== user.id) {
      return res.status(403).send('Access denied');
    }

    // 4) Send the file
    const filePath = path.resolve(attachment.file_path);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found on server');

    res.sendFile(filePath);

  } catch (err) {
    console.error('Error serving attachment:', err);
    res.status(500).send('Something went wrong');
  }
});



module.exports = router;
