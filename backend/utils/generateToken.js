import jwt from 'jsonwebtoken';

// Generate JWT Token
export const generateToken = (payload, expiresIn = '15m') => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn }
  );
};

// Generate Refresh Token
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'refresh_fallback_secret',
    { expiresIn: '7d' }
  );
};

// Generate Email Verification Token
export const generateEmailVerificationToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_VERIFY_SECRET || 'verify_fallback_secret',
    { expiresIn: '1h' }
  );
};

// Generate Password Reset Token
export const generatePasswordResetToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_RESET_SECRET || 'reset_fallback_secret',
    { expiresIn: '1h' }
  );
};

// Verify JWT Token
export const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Decode token without verification
export const decodeToken = (token) => {
  return jwt.decode(token);
};