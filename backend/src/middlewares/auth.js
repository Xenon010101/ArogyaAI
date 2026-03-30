const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'You are not logged in. Please log in to get access.');
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new ApiError(401, 'The user belonging to this token no longer exists.');
    }

    if (!currentUser.isActive) {
      throw new ApiError(401, 'Your account has been deactivated.');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid token. Please log in again.'));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
