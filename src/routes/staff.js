const express = require('express');
const router = express.Router();
const TicketController = require('../controllers/ticketController');

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
})

router.get('/dashboard', (req, res) => res.render('staff/dashboard'));
router.get('/tickets/new', (req, res) => res.render('staff/tickets'));
router.get('/ticket/:id', TicketController.getTicketById);

module.exports = router;