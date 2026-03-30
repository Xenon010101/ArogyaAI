const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const signRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, config.jwt.secret, {
    expiresIn: '30d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const accessToken = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('jwt', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  user.password = undefined;
  user.passwordConfirm = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    refreshToken,
    data: {
      user,
    },
  });
};

const verifyToken = async (token) => {
  return await promisify(jwt.verify)(token, config.jwt.secret);
};

module.exports = { signToken, signRefreshToken, createSendToken, verifyToken };
