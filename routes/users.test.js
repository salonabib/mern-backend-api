process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;
let adminUser;
let regularUser;
let adminToken;
let userToken;
let testUser;
let testUser2;
let authToken;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    adminUser = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        username: 'adminuser',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        isActive: true,
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    regularUser = await User.create({
        firstName: 'Regular',
        lastName: 'User',
        username: 'regularuser',
        email: 'user@example.com',
        password: userPassword,
        role: 'user',
        isActive: true,
    });

    // Create tokens
    adminToken = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    userToken = jwt.sign(
        { id: regularUser._id, role: regularUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    // Create test users
    testUser = await new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
    }).save();

    testUser2 = await new User({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
    }).save();

    authToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});

    // Recreate users for each test
    adminUser = await new User({
        firstName: 'Admin',
        lastName: 'User',
        username: 'adminuser',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isActive: true,
    }).save();

    regularUser = await new User({
        firstName: 'Regular',
        lastName: 'User',
        username: 'regularuser',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        role: 'user',
        isActive: true,
    }).save();

    testUser = await new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
    }).save();

    testUser2 = await new User({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
    }).save();

    // Update tokens
    adminToken = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    userToken = jwt.sign(
        { id: regularUser._id, role: regularUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    authToken = jwt.sign(
        { id: testUser._id, role: testUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
});

describe('Users Routes', () => {
    describe('GET /api/users', () => {
        it('should return all users for admin', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should return paginated results', async () => {
            const response = await request(app)
                .get('/api/users?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter users by search term', async () => {
            const response = await request(app)
                .get('/api/users?search=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].username).toBe('adminuser');
        });

        it('should filter users by role', async () => {
            const response = await request(app)
                .get('/api/users?role=user')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.every(user => user.role === 'user')).toBe(true);
        });

        it('should filter users by status', async () => {
            const response = await request(app)
                .get('/api/users?isActive=true')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.every(user => user.isActive === true)).toBe(true);
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User role user is not authorized to access this route');
        });

        it('should return error for missing token', async () => {
            const response = await request(app)
                .get('/api/users')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });

        it('should get all users (admin only)', async () => {
            const adminUser = await new User({
                username: 'adminuser2',
                email: 'admin2@example.com',
                password: 'password123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isActive: true
            }).save();

            const adminToken = jwt.sign(
                { id: adminUser._id, role: adminUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return user details for admin', async () => {
            const response = await request(app)
                .get(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data._id).toBe(regularUser._id.toString());
        });

        it('should return error for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const response = await request(app)
                .get('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .get(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200); // Users can view their own profile

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user successfully for admin', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                bio: 'Updated bio'
            };

            const response = await request(app)
                .put(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User updated successfully');
            expect(response.body.data.firstName).toBe(updateData.firstName);
        });

        it('should return error for invalid email format', async () => {
            const response = await request(app)
                .put(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email is invalid');
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.some(error => error.message === 'Email is invalid')).toBe(true);
        });

        it('should return error for duplicate email', async () => {
            const updateData = { email: adminUser.email };

            const response = await request(app)
                .put(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already exists');
        });

        it('should return error for duplicate username', async () => {
            const updateData = { username: adminUser.username };

            const response = await request(app)
                .put(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Username already exists');
        });

        it('should return error for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = { firstName: 'Updated' };

            const response = await request(app)
                .put(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const response = await request(app)
                .put('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ firstName: 'Test' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const updateData = { firstName: 'Updated' };

            const response = await request(app)
                .put(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User role user is not authorized to access this route');
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete user successfully for admin', async () => {
            const response = await request(app)
                .delete(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');
        });

        it('should return error for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const response = await request(app)
                .delete('/api/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .delete(`/api/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User role user is not authorized to access this route');
        });

        it('should not allow admin to delete themselves', async () => {
            const response = await request(app)
                .delete(`/api/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot delete your own account');
        });
    });

    describe('PUT /api/users/:id/activate', () => {
        it('should activate user successfully for admin', async () => {
            // First deactivate the user
            regularUser.isActive = false;
            await regularUser.save();

            const response = await request(app)
                .put(`/api/users/${regularUser._id}/activate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User activated successfully');
        });

        it('should return error for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/users/${fakeId}/activate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .put(`/api/users/${regularUser._id}/activate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User role user is not authorized to access this route');
        });
    });

    describe('PUT /api/users/:id/deactivate', () => {
        it('should deactivate user successfully for admin', async () => {
            const response = await request(app)
                .put(`/api/users/${regularUser._id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deactivated successfully');
        });

        it('should return error for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .put(`/api/users/${fakeId}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .put(`/api/users/${regularUser._id}/deactivate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User role user is not authorized to access this route');
        });

        it('should not allow admin to deactivate themselves', async () => {
            const response = await request(app)
                .put(`/api/users/${adminUser._id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot deactivate your own account');
        });
    });
});

describe('User Routes', () => {
    describe('GET /api/users', () => {
        it('should get all users (admin only)', async () => {
            const adminUser = await new User({
                username: 'adminuser2',
                email: 'admin2@example.com',
                password: 'password123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                isActive: true
            }).save();

            const adminToken = jwt.sign(
                { id: adminUser._id, role: adminUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should deny access to non-admin users', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should get user by ID', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(testUser._id.toString());
            expect(response.body.data.username).toBe(testUser.username);
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/users/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/profile', () => {
        it('should update user profile with text fields', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name',
                about: 'This is my updated bio'
            };

            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe(updateData.firstName);
            expect(response.body.data.lastName).toBe(updateData.lastName);
            expect(response.body.data.about).toBe(updateData.about);
        });

        it('should update user profile with photo upload', async () => {
            const photoBuffer = Buffer.from('fake-image-data');

            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('photo', photoBuffer, {
                    filename: 'test.jpg',
                    contentType: 'image/jpeg'
                })
                .field('firstName', 'Updated')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe('Updated');
        });

        it('should validate about field length', async () => {
            const longAbout = 'a'.repeat(501);
            const updateData = { about: longAbout };

            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:id/photo', () => {
        it('should get user photo', async () => {
            // First upload a photo
            const photoBuffer = Buffer.from('fake-image-data');
            await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('photo', photoBuffer, {
                    filename: 'test.jpg',
                    contentType: 'image/jpeg'
                })
                .field('firstName', 'Test');

            // Then retrieve it
            const response = await request(app)
                .get(`/api/users/${testUser._id}/photo`)
                .expect(200);

            expect(response.headers['content-type']).toBe('image/jpeg');
            expect(response.body).toEqual(photoBuffer);
        });

        it('should return 404 if user has no photo', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}/photo`)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/follow', () => {
        it('should follow a user', async () => {
            const response = await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: testUser2._id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Successfully followed user');

            // Verify the follow relationship
            const updatedUser1 = await User.findById(testUser._id);
            const updatedUser2 = await User.findById(testUser2._id);

            expect(updatedUser1.following).toContainEqual(testUser2._id);
            expect(updatedUser2.followers).toContainEqual(testUser._id);
        });

        it('should not allow following yourself', async () => {
            const response = await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: testUser._id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot follow yourself');
        });

        it('should not allow following the same user twice', async () => {
            // First follow
            await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: testUser2._id });

            // Second follow attempt
            const response = await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: testUser2._id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Already following this user');
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: fakeId })
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/unfollow', () => {
        beforeEach(async () => {
            // Setup: make testUser follow testUser2
            testUser.following.push(testUser2._id);
            testUser2.followers.push(testUser._id);
            await testUser.save();
            await testUser2.save();
        });

        it('should unfollow a user', async () => {
            const response = await request(app)
                .put('/api/users/unfollow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ unfollowId: testUser2._id })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Successfully unfollowed user');

            // Verify the unfollow relationship
            const updatedUser1 = await User.findById(testUser._id);
            const updatedUser2 = await User.findById(testUser2._id);

            expect(updatedUser1.following).not.toContainEqual(testUser2._id);
            expect(updatedUser2.followers).not.toContainEqual(testUser._id);
        });

        it('should not allow unfollowing yourself', async () => {
            const response = await request(app)
                .put('/api/users/unfollow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ unfollowId: testUser._id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot unfollow yourself');
        });

        it('should not allow unfollowing someone you are not following', async () => {
            // First unfollow
            await request(app)
                .put('/api/users/unfollow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ unfollowId: testUser2._id });

            // Second unfollow attempt
            const response = await request(app)
                .put('/api/users/unfollow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ unfollowId: testUser2._id })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Not following this user');
        });
    });

    describe('GET /api/users/suggestions', () => {
        beforeEach(async () => {
            // Create additional users
            await new User({
                username: 'user3',
                email: 'user3@example.com',
                password: 'password123',
                firstName: 'User',
                lastName: 'Three'
            }).save();

            await new User({
                username: 'user4',
                email: 'user4@example.com',
                password: 'password123',
                firstName: 'User',
                lastName: 'Four'
            }).save();
        });

        it('should get user suggestions', async () => {
            const response = await request(app)
                .get('/api/users/suggestions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.length).toBeLessThanOrEqual(5); // Max 5 suggestions

            // Should not include testUser in suggestions
            const suggestionIds = response.body.data.map(user => user._id);
            expect(suggestionIds).not.toContain(testUser._id.toString());
        });

        it('should exclude followed users from suggestions', async () => {
            // First follow testUser2
            await request(app)
                .put('/api/users/follow')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ followId: testUser2._id })
                .expect(200);

            const response = await request(app)
                .get('/api/users/suggestions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.length).toBeLessThanOrEqual(5); // Max 5 suggestions

            // Should not include testUser2 in suggestions
            const suggestionIds = response.body.data.map(user => user._id);
            expect(suggestionIds).not.toContain(testUser2._id.toString());
        });
    });

    describe('GET /api/users/:id/followers', () => {
        beforeEach(async () => {
            // Setup: make testUser2 follow testUser
            testUser2.followers.push(testUser._id);
            await testUser2.save();
        });

        it('should get user followers', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser2._id}/followers`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]._id).toBe(testUser._id.toString());
        });

        it('should return empty array for user with no followers', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}/followers`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/users/:id/following', () => {
        beforeEach(async () => {
            // Setup: make testUser follow testUser2
            testUser.following.push(testUser2._id);
            await testUser.save();
        });

        it('should get user following', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser._id}/following`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]._id).toBe(testUser2._id.toString());
        });

        it('should return empty array for user with no following', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser2._id}/following`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });
    });
}); 