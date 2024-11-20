const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { User, Node } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Authentication Tests', () => {
  beforeAll(async () => {
    // Clear test database before all tests
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection after all tests
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await User.destroy({ where: {} });
    await Node.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
        sponsorUsername: null // Root user has no sponsor
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not register user with existing username', async () => {
      // First create a user
      await User.create({
        username: 'testuser',
        email: 'existing@example.com',
        password: await bcrypt.hash('Test123!@#', 10)
      });

      // Try to create another user with same username
      const userData = {
        username: 'testuser',
        email: 'new@example.com',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const hashedPassword = await bcrypt.hash('Test123!@#', 10);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(loginData.username);
    });

    it('should not login with incorrect password', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login with non-existent username', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'Test123!@#'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let testUser;

    beforeEach(async () => {
      // Create a test user and generate token
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('Test123!@#', 10)
      });

      token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
