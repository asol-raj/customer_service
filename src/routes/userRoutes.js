const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// all routes start here with /auth/user

// User profile routes
router.get('/test', (req, res) => { res.json('ok') })
router.get('/details', AuthController.getUserWithDetails);
router.post('/update', AuthController.updateUserDetails);

// Password routes
router.post('/:id/reset-password', AuthController.resetPassword);
router.post('/:id/change-password', AuthController.changePassword);
router.post('/:id/set-password', AuthController.setPassword);


module.exports = router;