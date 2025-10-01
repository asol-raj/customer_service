const express = require('express');
const TicketController = require('../controllers/ticketController');
const { advanceQuery } = require('../controllers/helperController');
const AuthController = require('../controllers/authController');
const router = express.Router();

// all routes start here with /auth

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
})

router.get('/test', (req, res) => { res.json('ok') })

router.use('/user', require('./userRoutes'));
router.use('/ticket', require('./ticketRoute'));

router.get('/dashboard', TicketController.dashboard)
router.get('/profile', AuthController.getUserWithDetails)
router.post('/profile', AuthController.updaetUserProfile)
router.post('/advance-query', advanceQuery);


module.exports = router;

// <!-- <?- include('../partials/header') ?> -->
// <!-- <?- include('../partials/footer') ?> -->
// staff/dashbaord
// staff/dashboard