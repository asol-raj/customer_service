const express = require('express');
const TicketController = require('../controllers/ticketController');
const router = express.Router();

router.get('/dashboard', TicketController.dashboard)
// router.get('/dashboard', (req, res) => {
//     if (req.user.user_type === 'staff') {
//         return res.render('staff/dashboard', { user: req.user });
//     } else {
//         return res.render('users/dashboard', { user: req.user });
//     }
// });
// router.get('/dashboard', )
router.use('/ticket', require('./ticketRoute'));


module.exports = router;

// <!-- <?- include('../partials/header') ?> -->
// <!-- <?- include('../partials/footer') ?> -->
