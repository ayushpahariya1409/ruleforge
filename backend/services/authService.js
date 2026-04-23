const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { jwtSecret, jwtExpiresIn, googleClientId } = require('../config/env');
const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const client = new OAuth2Client(googleClientId);

class AuthService {
  generateToken(userId) {
    return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
  }

  async register({ name, email, password, role }) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw ApiError.badRequest('Email already registered');
    }

    const user = await userRepository.create({
      name,
      email,
      password,
      role: role || 'user',
      authProvider: 'local'
    });

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.authProvider === 'google' && !user.password) {
      throw ApiError.unauthorized('This account uses Google Login. Please sign in with Google.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async googleLogin(idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      // 1. Try finding by googleId
      let user = await userRepository.findByGoogleId(googleId);

      if (!user) {
        // 2. Try finding by email (in case they previously registered with email/password)
        user = await userRepository.findByEmail(email);

        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          user.authProvider = 'google'; // Mark as Google user or keep as local but linked? 
          // Let's mark as google for consistency if they use this flow
          await user.save();
        } else {
          // 3. Create new user
          user = await userRepository.create({
            name,
            email,
            googleId,
            authProvider: 'google',
            role: 'user'
          });
        }
      }

      const token = this.generateToken(user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      console.error('❌ Google Auth Service Error:', error.message);
      if (error.message.includes('audience')) {
        console.error('  Hint: The Client ID in your backend .env might not match the one in your frontend .env');
      }
      throw ApiError.unauthorized('Google authentication failed: ' + error.message);
    }
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }
}

module.exports = new AuthService();
