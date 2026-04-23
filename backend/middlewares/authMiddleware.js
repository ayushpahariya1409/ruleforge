const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

/**
 * JWT Authentication middleware.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token || token === 'none') {
      return next(ApiError.unauthorized('Access denied. No token provided.'));
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    // Safety check for decoded payload
    if (!decoded || !decoded.id) {
      return next(ApiError.unauthorized('Invalid token payload'));
    }

    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    next(error);
  }
};

module.exports = { authenticate };
