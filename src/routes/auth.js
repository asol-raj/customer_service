const express = require('express');
const TicketController = require('../controllers/ticketController');
const verifyToken = require('../middleware/auth');
const { advanceQuery } = require('../controllers/helperController');
const router = express.Router();


router.get('/dashboard', TicketController.dashboard)

router.use('/ticket', require('./ticketRoute'));

router.post('/advance-query', verifyToken, advanceQuery);


module.exports = router;

// <!-- <?- include('../partials/header') ?> -->
// <!-- <?- include('../partials/footer') ?> -->
// staff/dashbaord
// staff/dashboard