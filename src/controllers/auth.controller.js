const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('../services/user.service');
const nodeService = require('../services/node.service');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const { generateUsername } = require('../utils/userUtils');

class AuthController {
  /**
   * Register a new user
   * @param {Request} req 
   * @param {Response} res 
   */
  async register(req, res) {
    try {
      // Validate request body
      const { error } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }

      const { 
        email,
        password,
        firstName,
        lastName, 
        phone,
        country,
        sponsorUsername,
        placementUsername,
        position 
      } = req.body;

      // Check if email already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Validate sponsor
      const sponsorNode = await nodeService.findByUsername(sponsorUsername);
      if (!sponsorNode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sponsor username'
        });
      }

      // Validate placement
      const placementNode = await nodeService.findByUsername(placementUsername);
      if (!placementNode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid placement username'
        });
      }

      // Generate unique username
      const username = await generateUsername(email);

      // Create user with node in a transaction
      const { user, node } = await userService.createUserWithNode({
        user: {
          username,
          email,
          password,
          firstName,
          lastName,
          phone,
          country,
          role: 'USER',
          status: 'ACTIVE'
        },
        node: {
          position,
          level: placementNode.level + 1,
          placementId: placementNode.id,
          sponsorId: sponsorNode.id,
          status: 'PENDING'
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          node: {
            id: node.id,
            position: node.position,
            level: node.level,
            status: node.status
          },
          token
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during registration'
      });
    }
  }

  /**
   * Login user
   * @param {Request} req 
   * @param {Response} res 
   */
  async login(req, res) {
    try {
      // Validate request body
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login'
      });
    }
  }

  /**
   * Logout user
   * @param {Request} req 
   * @param {Response} res 
   */
  async logout(req, res) {
    try {
      // Clear auth token from response
      res.clearCookie('token');

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  }

  /**
   * Reset password request
   * @param {Request} req 
   * @param {Response} res 
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate reset token
      const resetToken = await userService.generatePasswordResetToken(user.id);

      // TODO: Send reset token via email
      // For now, just return it in response
      res.json({
        success: true,
        message: 'Password reset token generated',
        data: { resetToken }
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing password reset request'
      });
    }
  }

  /**
   * Reset password with token
   * @param {Request} req 
   * @param {Response} res 
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const userId = await userService.verifyPasswordResetToken(token);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      await userService.updatePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting password'
      });
    }
  }

  /**
   * Change password while logged in
   * @param {Request} req 
   * @param {Response} res 
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user
      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await userService.updatePassword(userId, hashedPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  }

  /**
   * Get user profile
   * @param {Request} req 
   * @param {Response} res 
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          country: user.country,
          role: user.role,
          status: user.status
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting profile'
      });
    }
  }

  /**
   * Update user profile
   * @param {Request} req 
   * @param {Response} res 
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, country } = req.body;

      const user = await userService.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user profile
      await userService.updateProfile(userId, {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        phone: phone || user.phone,
        country: country || user.country
      });

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  }

  /**
   * Verify email address
   * @param {Request} req 
   * @param {Response} res 
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      // Verify token
      const userId = await userService.verifyEmailToken(token);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Update user's email verification status
      await userService.markEmailAsVerified(userId);

      res.json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying email'
      });
    }
  }

  /**
   * Resend verification email
   * @param {Request} req 
   * @param {Response} res 
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }

      // Generate new verification token and send email
      await userService.sendVerificationEmail(user);

      res.json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending verification email'
      });
    }
  }

  /**
   * Enable two-factor authentication
   * @param {Request} req 
   * @param {Response} res 
   */
  async enable2FA(req, res) {
    try {
      const userId = req.user.id;

      // Generate 2FA secret and QR code
      const { secret, qrCode } = await userService.generate2FASecret(userId);

      res.json({
        success: true,
        data: {
          secret,
          qrCode
        },
        message: 'Two-factor authentication setup initiated'
      });

    } catch (error) {
      console.error('Enable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Error enabling two-factor authentication'
      });
    }
  }

  /**
   * Disable two-factor authentication
   * @param {Request} req 
   * @param {Response} res 
   */
  async disable2FA(req, res) {
    try {
      const userId = req.user.id;

      await userService.disable2FA(userId);

      res.json({
        success: true,
        message: 'Two-factor authentication disabled'
      });

    } catch (error) {
      console.error('Disable 2FA error:', error);
      res.status(500).json({
        success: false,
        message: 'Error disabling two-factor authentication'
      });
    }
  }

  /**
   * Get user sessions
   * @param {Request} req 
   * @param {Response} res 
   */
  async getSessions(req, res) {
    try {
      const userId = req.user.id;

      const sessions = await userService.getUserSessions(userId);

      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting sessions'
      });
    }
  }
}

module.exports = new AuthController();
