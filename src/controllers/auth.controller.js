const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Node } = require('../models');
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
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Validate sponsor
      const sponsorNode = await Node.findOne({ 
        include: [{
          model: User,
          as: 'user',
          where: { username: sponsorUsername }
        }]
      });
      if (!sponsorNode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sponsor username'
        });
      }

      // Validate placement
      const placementNode = await Node.findOne({
        include: [{
          model: User,
          as: 'user',
          where: { username: placementUsername }
        }]
      });
      if (!placementNode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid placement username'
        });
      }

      // Generate unique username
      const username = await generateUsername(email);

      // Create user first
      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        country,
        role: 'USER',
        active: true
      });

      // Create MLM node
      const node = await Node.create({
        userId: user.id,
        position,
        level: placementNode.level + 1,
        parentNodeId: placementNode.id,
        sponsorNodeId: sponsorNode.id,
        status: 'pending',
        isSpillover: false,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          node: {
            id: node.id,
            position,
            level: node.level,
            status: node.status
          }
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
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
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ 
        where: { email },
        include: [{
          model: Node,
          as: 'node'
        }]
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          node: user.node ? {
            id: user.node.id,
            position: user.node.position,
            level: user.node.level,
            status: user.node.status,
            balance: user.node.balance,
            earnings: user.node.earnings,
            totalReferrals: user.node.totalReferrals
          } : null
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
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

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id },
        process.env.JWT_RESET_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token and expiry
      await user.update({
        resetToken: resetToken,
        resetTokenExpires: new Date(Date.now() + 3600000) // 1 hour
      });

      // TODO: Send reset email with token

      res.json({
        success: true,
        message: 'Password reset instructions sent to email'
      });

    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
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
      const { token, password } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);

      // Find user
      const user = await User.findOne({
        where: {
          id: decoded.id,
          resetToken: token,
          resetTokenExpires: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      });

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();
