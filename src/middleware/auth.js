const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

const verifyToken = (req, res, next) => {
  const token = req.cookies.auth_token; // read JWT from cookie
  if (!token) return res.redirect('/auth/login'); // redirect to login if missing

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/auth/login'); // redirect if invalid/expired
  }
};

module.exports = verifyToken;
