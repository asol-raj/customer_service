const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { jwtSecret, jwtExpiry } = require('../config/auth');
const log = console.log;

const saltRounds = 10;

const AuthController = {
  // Register customer
  register: async (req, res) => {
    try {
      const { 
        username, password, user_type='customer',
        first_name = null, middle_name = null, last_name = null,
        address = null, city = null, zipcode, state = null
      } = req.body;

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).render('index', { message: 'Username already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const payload = {
        username, hashedPassword, user_type,
        first_name, middle_name, last_name, address, city, zipcode, state
      }
      const userId = await User.create(payload);

      return res.status(201).render('index', { message: 'Registration successful', userId });
    } catch (err) {
      console.error(err);
      return res.status(500).render('index', { error: 'Server error' });
    }
  },

  // Login (customer or staff)
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await User.findByUsername(username);
      if (!user) return res.status(401).render('index', { error: 'Invalid credentials' });

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) return res.status(401).render('index', { error: 'Invalid credentials' });

      const payload = { id: user.id, username: user.username, user_type: user.user_type };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 8 // 8 hours
      });

      if (user.user_type === 'customer') {
        res.redirect('/auth/dashboard');
      } else if (user.user_type === 'staff') {
        res.redirect('/staff/dashboard');
      } else {
        res.redirect('/');
      }
    } catch (err) {
      console.error(err);
      res.status(500).render('index', { error: 'Server error' });
    }
  },

  // ==========================
  // New User Controllers
  // ==========================

  // Get user with details
  getUserWithDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.getUserWithDetails(id);
      if (!user) return res.status(404).json({ status: false, error: 'User not found' });
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: true, error: 'Server error' });
    }
  },

  // Update user details
  updateUserDetails: async (req, res) => {
    try {
      // const { id } = req.params;
      const updated = await User.updateUserDetails(req.body);
      if (!updated) return res.status(404).json({ error: 'User not found or not updated' });
      res.json({status: true, message: 'User details updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false,  error: 'Server error' });
    }
  },

  // Reset password (admin or forgot password)
  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const ok = await User.resetPassword(id, newPassword);
      if (!ok) return res.status(404).json({ error: 'User not found' });
      res.json({ status: true, message: 'Password reset successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Server error' });
    }
  },

  // Change password (with old password check)
  changePassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      const ok = await User.changePassword(id, oldPassword, newPassword);
      if (!ok) return res.status(400).json({ error: 'Password not changed' });
      res.json({ status: true, message: 'Password changed successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(400).json({ status: false, error: err.message });
    }
  },

  // Set password (generic helper, no old password check)
  setPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const ok = await User.setPassword(id, newPassword);
      if (!ok) return res.status(404).json({ error: 'User not found' });
      res.json({ status: true, message: 'Password updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: false, error: 'Server error' });
    }
  }
};

module.exports = AuthController;
