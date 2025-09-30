const express = require('express');
const verifyToken = require('../middleware/authMw');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/', (req, res)=> res.render('index'));
// router.get('/test', (req, res)=> res.render('index'));


router.use('/auth', verifyToken, require('./authRoutes'));
router.use('/staff', verifyToken, require('./staffRoutes'));

router.post('/register', AuthController.register); // for customers
router.post('/login', AuthController.login);



// Logout route
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token'); // Remove JWT cookie
  res.redirect('/'); // Redirect to index.ejs (login/register page)
});

module.exports = router;