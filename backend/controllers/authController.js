const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const sendTokenResponse = (result, statusCode, res) => {
  const { token, user } = result;

  const cookieOptions = {
    // Session cookie — no expiration date
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      data: { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
    });
};

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register({ ...req.body, role: 'user' });
  sendTokenResponse(result, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendTokenResponse(result, 200, res);
});

exports.googleAuth = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const result = await authService.googleLogin(idToken);
  sendTokenResponse(result, 200, res);
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({
    success: true,
    data: { 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    },
  });
});
