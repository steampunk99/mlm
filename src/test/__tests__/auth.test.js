const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');
const { generateUser, generateToken } = require('../helpers/testData');

describe('Authentication System', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                country: 'TestCountry'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(userData.email);
        });

        it('should not register user with existing email', async () => {
            const existingUser = await generateUser();
            await User.create(existingUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...existingUser,
                    password: 'newpassword123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const password = 'password123';
            const user = await generateUser({ password });
            await User.create(user);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('id');
        });

        it('should not login with incorrect password', async () => {
            const user = await generateUser();
            await User.create(user);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should get user profile with valid token', async () => {
            const user = await generateUser();
            const savedUser = await User.create(user);
            const token = generateToken(savedUser.id);

            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', savedUser.id);
            expect(response.body).toHaveProperty('email', user.email);
        });

        it('should not access profile without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/auth/profile', () => {
        it('should update user profile successfully', async () => {
            const user = await generateUser();
            const savedUser = await User.create(user);
            const token = generateToken(savedUser.id);

            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                phone: '9876543210'
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('firstName', updateData.firstName);
            expect(response.body).toHaveProperty('lastName', updateData.lastName);
            expect(response.body).toHaveProperty('phone', updateData.phone);
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should initiate password reset for existing email', async () => {
            const user = await generateUser();
            await User.create(user);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: user.email });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });

        it('should handle non-existent email gracefully', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
