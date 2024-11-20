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
}

module.exports = new AuthController();
