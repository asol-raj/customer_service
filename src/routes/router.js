const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const AuthController = require('../controllers/authController');

router.use('/auth', verifyToken, require('./auth'));
router.use('/staff', verifyToken, require('./staff'));
// router.use('/auth/ticket', require('./ticketRoute'));

router.get('/', (req, res)=> res.render('index'));
router.post('/register', AuthController.register); // for customers
router.post('/login', AuthController.login);

// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token'); // Remove JWT cookie
  res.redirect('/'); // Redirect to index.ejs (login/register page)
});

module.exports = router;