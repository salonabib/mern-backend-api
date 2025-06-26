const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';

describe('Users Routes', () => {
    let adminUser;
    let regularUser;
    let adminToken;
    let userToken;

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

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            username: 'admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin',
            isActive: true,
        });

        // Create regular user
        const userPassword = await bcrypt.hash('user123', 10);
        regularUser = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
            password: userPassword,
            role: 'user',
            isActive: true,
        });

        // Create tokens
        adminToken = jwt.sign(
            { userId: adminUser._id, role: adminUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        userToken = jwt.sign(
            { userId: regularUser._id, role: regularUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    });

    describe('GET /users', () => {
        it('should return all users for admin', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.length).toBe(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should return paginated results', async () => {
            const response = await request(app)
                .get('/users?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should filter users by search term', async () => {
            const response = await request(app)
                .get('/users?search=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].username).toBe('admin');
        });

        it('should filter users by role', async () => {
            const response = await request(app)
                .get('/users?role=user')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].role).toBe('user');
        });

        it('should filter users by status', async () => {
            const response = await request(app)
                .get('/users?isActive=true')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data.every(user => user.isActive)).toBe(true);
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });

        it('should return error for missing token', async () => {
            const response = await request(app)
                .get('/users')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. No token provided.');
        });
    });

    describe('GET /users/:id', () => {
        it('should return user details for admin', async () => {
            const response = await request(app)
                .get(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data._id).toBe(regularUser._id.toString());
            expect(response.body.data.email).toBe(regularUser.email);
            expect(response.body.data.password).toBeUndefined();
        });

        it('should return error for non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/users/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const response = await request(app)
                .get('/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .get(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });
    });

    describe('PUT /users/:id', () => {
        it('should update user successfully for admin', async () => {
            const updateData = {
                firstName: 'Johnny',
                lastName: 'Doe Jr.',
                role: 'admin',
                isActive: false,
            };

            const response = await request(app)
                .put(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User updated successfully');
            expect(response.body.data.firstName).toBe(updateData.firstName);
            expect(response.body.data.lastName).toBe(updateData.lastName);
            expect(response.body.data.role).toBe(updateData.role);
            expect(response.body.data.isActive).toBe(updateData.isActive);
        });

        it('should return error for invalid email format', async () => {
            const updateData = {
                email: 'invalid-email',
            };

            const response = await request(app)
                .put(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email is invalid');
        });

        it('should return error for duplicate email', async () => {
            const updateData = {
                email: 'admin@example.com', // Same email as adminUser
            };

            const response = await request(app)
                .put(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already exists');
        });

        it('should return error for duplicate username', async () => {
            const updateData = {
                username: 'admin', // Same username as adminUser
            };

            const response = await request(app)
                .put(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Username already exists');
        });

        it('should return error for non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const updateData = {
                firstName: 'Johnny',
            };

            const response = await request(app)
                .put(`/users/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const updateData = {
                firstName: 'Johnny',
            };

            const response = await request(app)
                .put('/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const updateData = {
                firstName: 'Johnny',
            };

            const response = await request(app)
                .put(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });
    });

    describe('DELETE /users/:id', () => {
        it('should delete user successfully for admin', async () => {
            const response = await request(app)
                .delete(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');

            // Verify user is deleted
            const deletedUser = await User.findById(regularUser._id);
            expect(deletedUser).toBeNull();
        });

        it('should return error for non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/users/${nonExistentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for invalid user ID', async () => {
            const response = await request(app)
                .delete('/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .delete(`/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });

        it('should not allow admin to delete themselves', async () => {
            const response = await request(app)
                .delete(`/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot delete your own account');
        });
    });

    describe('PUT /users/:id/activate', () => {
        it('should activate user successfully for admin', async () => {
            // Deactivate user first
            await User.findByIdAndUpdate(regularUser._id, { isActive: false });

            const response = await request(app)
                .put(`/users/${regularUser._id}/activate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User activated successfully');
            expect(response.body.data.isActive).toBe(true);
        });

        it('should return error for non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/users/${nonExistentId}/activate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .put(`/users/${regularUser._id}/activate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });
    });

    describe('PUT /users/:id/deactivate', () => {
        it('should deactivate user successfully for admin', async () => {
            const response = await request(app)
                .put(`/users/${regularUser._id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deactivated successfully');
            expect(response.body.data.isActive).toBe(false);
        });

        it('should return error for non-existent user', async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/users/${nonExistentId}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return error for non-admin users', async () => {
            const response = await request(app)
                .put(`/users/${regularUser._id}/deactivate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access denied. Admin role required.');
        });

        it('should not allow admin to deactivate themselves', async () => {
            const response = await request(app)
                .put(`/users/${adminUser._id}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot deactivate your own account');
        });
    });
}); 