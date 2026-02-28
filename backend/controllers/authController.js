import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';

// Generate JWT Token
const generateAuthToken = (userId) => {
 return jwt.sign(
  { id: userId },
  process.env.JWT_SECRET || 'fallback_secret',
  { expiresIn: process.env.JWT_EXPIRE || '15m' }
 );
};

// Generate 6-digit OTP
const generateOTP = () => {
 return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
 console.log(req.body);
 const { email, password, profile, role } = req.body;

 // Check if user exists
 const existingUser = await User.findOne({ email });
 if (existingUser) {
  return res.status(400).json({
   success: false,
   message: 'User already exists with this email'
  });
 }

 // Create user
 const user = await User.create({
  email,
  password,
  profile,
  role: role || 'user'
 });

 // Generate email verification OTP
 const emailOTP = generateOTP();
 user.emailVerificationOTP = emailOTP;
 user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
 await user.save();

 // Send verification OTP email
 try {
  await sendEmail({
   email: user.email,
   template: 'emailVerification',
   templateData: [user.profile.firstName, emailOTP]
  });
 } catch (error) {
  console.error('Failed to send verification email:', error);
 }

 // Generate token
 const token = generateAuthToken(user._id);
 const refreshToken = generateRefreshToken({ id: user._id });

 res.status(201).json({
  success: true,
  message: 'User registered successfully. Please check your email for verification OTP.',
  data: {
   user,
   token,
   refreshToken
  }
 });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
 const { email, password } = req.body;


 // Check if email and password are provided
 if (!email || !password) {
  return res.status(400).json({
   success: false,
   message: 'Please provide email and password'
  });
 }

 // Check if user exists and password is correct
 const user = await User.findOne({ email }).select('+password');
 if (!user || !(await user.comparePassword(password))) {
  return res.status(401).json({
   success: false,
   message: 'Invalid email or password'
  });
 }

 // Check if user is active
 if (!user.isActive) {
  return res.status(401).json({
   success: false,
   message: 'Account is deactivated. Please contact support.'
  });
 }

 // Update last login
 user.lastLogin = new Date();
 await user.save();

 // Generate tokens
 const token = generateAuthToken(user._id);
 const refreshToken = generateRefreshToken({ id: user._id });

 res.json({
  success: true,
  message: 'Login successful',
  data: {
   user,
   token,
   refreshToken
  }
 });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
 res.json({
  success: true,
  message: 'Logged out successfully'
 });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req, res) => {
 const { refreshToken } = req.body;

 if (!refreshToken) {
  return res.status(401).json({
   success: false,
   message: 'Refresh token required'
  });
 }

 try {
  const decoded = jwt.verify(
   refreshToken,
   process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret'
  );

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
   return res.status(401).json({
    success: false,
    message: 'Invalid refresh token'
   });
  }

  const newToken = generateAuthToken(user._id);

  res.json({
   success: true,
   data: {
    token: newToken
   }
  });
 } catch (error) {
  return res.status(401).json({
   success: false,
   message: 'Invalid refresh token'
  });
 }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
 res.json({
  success: true,
  data: {
   user: req.user
  }
 });
});

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
 const { email } = req.body;

 const user = await User.findOne({ email });
 if (!user) {
  return res.status(404).json({
   success: false,
   message: 'No user found with this email address'
  });
 }

 // Generate OTP
 const resetOTP = generateOTP();

 // Save OTP to user
 user.passwordResetOTP = resetOTP;
 user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
 await user.save();

 // Send OTP email
 try {
  await sendEmail({
   email: user.email,
   template: 'passwordReset',
   templateData: [user.profile.firstName, resetOTP]
  });

  res.json({
   success: true,
   message: 'Password reset OTP sent to your email',
   data: {
    email: user.email,
    expiresIn: '10 minutes'
   }
  });
 } catch (error) {
  user.passwordResetOTP = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res.status(500).json({
   success: false,
   message: 'Failed to send OTP email'
  });
 }
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyResetOTP = asyncHandler(async (req, res) => {
 const { email, otp } = req.body;

 const user = await User.findOne({
  email,
  passwordResetOTP: otp,
  passwordResetExpires: { $gt: Date.now() }
 });
 if (!user) {
  return res.status(400).json({
   success: false,
   message: 'Invalid or expired OTP'
  });
 }

 // Generate a temporary token for password reset
 const resetToken = jwt.sign(
  { id: user._id, purpose: 'password_reset' },
  process.env.JWT_RESET_SECRET || 'reset_fallback_secret',
  { expiresIn: '15m' }
 );

 // Clear OTP after successful verification
 user.passwordResetOTP = undefined;
 user.passwordResetExpires = undefined;
 await user.save();

 res.json({
  success: true,
  message: 'OTP verified successfully',
  data: {
   resetToken,
   email: user.email
  }
 });
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
 const { resetToken, password } = req.body;

 try {
  const decoded = jwt.verify(
   resetToken,
   process.env.JWT_RESET_SECRET || 'reset_fallback_secret'
  );

  // Verify the token is for password reset
  if (decoded.purpose !== 'password_reset') {
   return res.status(400).json({
    success: false,
    message: 'Invalid reset token'
   });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
   return res.status(400).json({
    success: false,
    message: 'Invalid reset token'
   });
  }

  // Set new password
  user.password = password;
  await user.save();

  res.json({
   success: true,
   message: 'Password reset successfully'
  });
 } catch (error) {
  return res.status(400).json({
   success: false,
   message: 'Invalid or expired reset token'
  });
 }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
 const { email, otp } = req.body;

 const user = await User.findOne({
  email,
  emailVerificationOTP: otp,
  emailVerificationExpires: { $gt: Date.now() }
 });

 if (!user) {
  return res.status(400).json({
   success: false,
   message: 'Invalid or expired OTP'
  });
 }

 user.isVerified = true;
 user.emailVerificationOTP = undefined;
 user.emailVerificationExpires = undefined;
 await user.save();

 res.json({
  success: true,
  message: 'Email verified successfully'
 });
});

// @desc    Resend email verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = asyncHandler(async (req, res) => {
 const { email } = req.body;

 const user = await User.findOne({ email });
 if (!user) {
  return res.status(404).json({
   success: false,
   message: 'No user found with this email address'
  });
 }

 if (user.isVerified) {
  return res.status(400).json({
   success: false,
   message: 'Email is already verified'
  });
 }

 // Generate new OTP
 const emailOTP = generateOTP();
 user.emailVerificationOTP = emailOTP;
 user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
 await user.save();

 // Send verification OTP email
 try {
  await sendEmail({
   email: user.email,
   template: 'emailVerification',
   templateData: [user.profile.firstName, emailOTP]
  });

  res.json({
   success: true,
   message: 'Verification OTP sent to your email',
   data: {
    email: user.email,
    expiresIn: '10 minutes'
   }
  });
 } catch (error) {
  return res.status(500).json({
   success: false,
   message: 'Failed to send verification OTP'
  });
 }
});