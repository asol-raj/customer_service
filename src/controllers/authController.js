const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { jwtSecret, jwtExpiry } = require('../config/auth');

const saltRounds = 10;

const AuthController = {
  // Register customer
  register: async (req, res) => {
    try {
      const { username, password } = req.body;

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).render('index', {message: 'Username already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const userId = await User.create(username, hashedPassword, 'customer');

      return res.status(201).render('index', { message: 'Registration successful', userId });
    } catch (err) {
      console.error(err);
      // return res.status(500).json({ message: 'Server error' });
      return res.status(500).render('index', { error: 'Server error' });
    }
  },

  // Login (customer or staff)
  login: async (req, res) => {
    try {
      const { username, password } = req.body; console.log(username, password);

      const user = await User.findByUsername(username);
      if (!user) return res.status(401).render('index', { error: 'Invalid credentials' });

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) return res.status(401).render('index', { error: 'Invalid credentials' });

      // Create JWT payload
      const payload = { id: user.id, username: user.username, user_type: user.user_type };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

      // Set JWT in HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only HTTPS in production
        maxAge: 1000 * 60 * 60 * 8 // 8 hours
      });

      return res.redirect('/auth/dashboard');
      // // Redirect based on user_type
      // if (user.user_type === 'customer') {
      //   res.redirect('/auth/dashboard'); // customer ticket page
      //   // res.redirect('/', { message: 'testok'}); // customer ticket page
      // } else if (user.user_type === 'staff') {
      //   res.redirect('/auth/dashboard'); // staff dashboard
      // } else {
      //   res.redirect('/'); // fallback
      // }

    } catch (err) {
      console.error(err);
      res.status(500).render('index', { error: 'Server error' });
    }
  }
};

module.exports = AuthController;
