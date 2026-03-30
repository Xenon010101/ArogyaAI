const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { createSendToken, verifyToken } = require('../utils/jwt');
const { signToken } = require('../utils/jwt');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, passwordConfirm, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    const user = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      phone,
    });

    const verificationToken = user.createEmailVerificationToken();

    console.log(`Verification Token: ${verificationToken}`);
    console.log(`Verification URL: ${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`);

    createSendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    if (!user.isActive) {
      throw new ApiError(401, 'Your account has been deactivated');
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.cookie('refreshToken', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw new ApiError(404, 'There is no user with this email address');
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    console.log(`Password Reset Token: ${resetToken}`);
    console.log(`Reset URL: ${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Token is invalid or has expired');
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ApiError(400, 'Token is invalid or has expired');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    const decoded = await verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};
