const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';

describe('Auth Routes', () => {
    let testUser;
    let testToken;

    beforeAll(async () => {
        // Connect to test database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
    });

    afterAll(async () => {
        // Clean up and disconnect
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Clear database before each test
        await User.deleteMany({});

        // Create test user
        testUser = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
            password: 'password123', // Use plain password, let model hash it
            role: 'user',
            isActive: true,
        });

        // Create test token
        testToken = jwt.sign(
            { id: testUser._id, role: testUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(newUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(newUser.email);
            expect(response.body.user.username).toBe(newUser.username);
            expect(response.body.user.password).toBeUndefined(); // Password should not be returned
        });

        it('should return error for duplicate email', async () => {
            const duplicateUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'john@example.com', // Same email as testUser
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already exists');
        });

        it('should return error for duplicate username', async () => {
            const duplicateUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'johndoe', // Same username as testUser
                email: 'jane@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(duplicateUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Username already exists');
        });

        it('should return error for invalid email format', async () => {
            const invalidUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'invalid-email',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email is invalid');
        });

        it('should return error for short password', async () => {
            const invalidUser = {
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                password: '123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Password must be at least 6 characters');
        });

        it('should return error for missing required fields', async () => {
            const incompleteUser = {
                username: 'janeuser',
                firstName: 'Jane',
                email: 'jane@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(incompleteUser)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Last name is required');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login user successfully with valid credentials', async () => {
            const loginData = {
                email: 'john@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.token).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(loginData.email);
            expect(response.body.user.password).toBeUndefined();
        });

        it('should return error for invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return error for invalid password', async () => {
            const loginData = {
                email: 'john@example.com',
                password: 'wrongpassword',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid credentials');
        });

        it('should return error for inactive user', async () => {
            // Deactivate test user
            await User.findByIdAndUpdate(testUser._id, { isActive: false });

            const loginData = {
                email: 'john@example.com',
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Account is deactivated');
        });

        it('should return error for missing email', async () => {
            const loginData = {
                password: 'password123',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email is required');
        });

        it('should return error for missing password', async () => {
            const loginData = {
                email: 'john@example.com',
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Password is required');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe('john@example.com');
            expect(response.body.user.password).toBeUndefined();
        });

        it('should return error for missing token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });

        it('should return error for invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid token');
        });

        it('should return error for expired token', async () => {
            // Create expired token
            const expiredToken = jwt.sign(
                { id: testUser._id, role: testUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '0s' }
            );

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Token expired');
        });

        it('should return error for non-existent user', async () => {
            // Create token for non-existent user
            const nonExistentUserId = new mongoose.Types.ObjectId();
            const invalidToken = jwt.sign(
                { id: nonExistentUserId, role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('PUT /api/auth/profile', () => {
        it('should update user profile successfully', async () => {
            const updateData = {
                firstName: 'Johnny',
                lastName: 'Doe Jr.',
                bio: 'Updated bio',
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Profile updated successfully');
            expect(response.body.user.firstName).toBe(updateData.firstName);
            expect(response.body.user.lastName).toBe(updateData.lastName);
            expect(response.body.user.bio).toBe(updateData.bio);
        });

        it('should return error for invalid email format', async () => {
            const updateData = {
                email: 'invalid-email',
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email is invalid');
        });

        it('should return error for duplicate email', async () => {
            // Create another user
            const anotherUser = await User.create({
                firstName: 'Jane',
                lastName: 'Smith',
                username: 'janesmith',
                email: 'jane@example.com',
                password: await bcrypt.hash('password123', 10),
                role: 'user',
            });

            const updateData = {
                email: 'jane@example.com', // Same email as anotherUser
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${testToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already exists');
        });

        it('should return error for missing token', async () => {
            const updateData = {
                firstName: 'Johnny',
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .send(updateData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });
    });

    describe('PUT /api/auth/password', () => {
        it('should change password successfully', async () => {
            const passwordData = {
                currentPassword: 'password123',
                newPassword: 'newpassword123',
            };

            const response = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${testToken}`)
                .send(passwordData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');
        });

        it('should return error for incorrect current password', async () => {
            const passwordData = {
                currentPassword: 'wrongpassword',
                newPassword: 'newpassword123',
            };

            const response = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${testToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Current password is incorrect');
        });

        it('should return error for short new password', async () => {
            const passwordData = {
                currentPassword: 'password123',
                newPassword: '123',
            };

            const response = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${testToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Password must be at least 6 characters');
        });

        it('should return error for missing current password', async () => {
            const passwordData = {
                newPassword: 'newpassword123',
            };

            const response = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${testToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Current password is required');
        });

        it('should return error for missing new password', async () => {
            const passwordData = {
                currentPassword: 'password123',
            };

            const response = await request(app)
                .put('/api/auth/password')
                .set('Authorization', `Bearer ${testToken}`)
                .send(passwordData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('New password is required');
        });
    });
}); 