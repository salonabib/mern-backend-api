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
const Post = require('../models/Post');
const { generateToken } = require('../middleware/auth');

let mongoServer;
let testUser1, testUser2, testUser3;
let testPost1, testPost2;
let token1, token2, token3;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Post.deleteMany({});

    // Create test users
    testUser1 = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
    });

    testUser2 = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
        email: 'jane@example.com',
        password: 'password123',
        role: 'user'
    });

    testUser3 = await User.create({
        firstName: 'Bob',
        lastName: 'Johnson',
        username: 'bobjohnson',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user'
    });

    // Create test posts
    testPost1 = await Post.create({
        text: 'Test post 1 by John',
        postedBy: testUser1._id
    });

    testPost2 = await Post.create({
        text: 'Test post 2 by Jane',
        postedBy: testUser2._id
    });

    // Set up following relationships
    testUser1.following.push(testUser2._id);
    testUser2.followers.push(testUser1._id);
    await testUser1.save();
    await testUser2.save();

    // Generate tokens
    token1 = generateToken(testUser1);
    token2 = generateToken(testUser2);
    token3 = generateToken(testUser3);
});

describe('POST /api/posts', () => {
    it('should create a new post with text only', async () => {
        const postData = {
            text: 'This is a new test post'
        };

        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .send(postData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.text).toBe(postData.text);
        expect(response.body.data.postedBy._id).toBe(testUser1._id.toString());
        expect(response.body.data.likes).toHaveLength(0);
        expect(response.body.data.comments).toHaveLength(0);
    });

    it('should create a new post with text and photo', async () => {
        const postData = {
            text: 'This is a new test post with photo'
        };

        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .field('text', postData.text)
            .attach('photo', Buffer.from('fake-image-data'), 'test.jpg');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.text).toBe(postData.text);
        expect(response.body.data.photo).toBeDefined();
        expect(response.body.data.photo.data).toBeDefined();
        expect(response.body.data.photo.contentType).toBeDefined();
    });

    it('should return 400 if text is missing', async () => {
        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 400 if text is too long', async () => {
        const longText = 'a'.repeat(1001);
        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .send({ text: longText });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .post('/api/posts')
            .send({ text: 'Test post' });

        expect(response.status).toBe(401);
    });
});

describe('GET /api/posts/feed', () => {
    it('should return posts from followed users and current user', async () => {
        const response = await request(app)
            .get('/api/posts/feed')
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(2); // testUser1's post + testUser2's post (followed)
        expect(response.body.data[0].postedBy._id).toBe(testUser2._id.toString());
        expect(response.body.data[1].postedBy._id).toBe(testUser1._id.toString());
    });

    it('should return only current user posts if not following anyone', async () => {
        const response = await request(app)
            .get('/api/posts/feed')
            .set('Authorization', `Bearer ${token3}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(0); // testUser3 has no posts
    });

    it('should support pagination', async () => {
        // Create more posts
        for (let i = 0; i < 15; i++) {
            await Post.create({
                text: `Post ${i}`,
                postedBy: testUser1._id
            });
        }

        const response = await request(app)
            .get('/api/posts/feed?page=1&limit=10')
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
        expect(response.body.pagination.pages).toBe(2);
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .get('/api/posts/feed');

        expect(response.status).toBe(401);
    });
});

describe('GET /api/posts/by-user/:userId', () => {
    it('should return posts by specific user', async () => {
        const response = await request(app)
            .get(`/api/posts/by-user/${testUser1._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].postedBy._id).toBe(testUser1._id.toString());
        expect(response.body.data[0].text).toBe('Test post 1 by John');
    });

    it('should return empty array for user with no posts', async () => {
        const response = await request(app)
            .get(`/api/posts/by-user/${testUser3._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(0);
    });

    it('should support pagination', async () => {
        // Create more posts for testUser1
        for (let i = 0; i < 15; i++) {
            await Post.create({
                text: `User post ${i}`,
                postedBy: testUser1._id
            });
        }

        const response = await request(app)
            .get(`/api/posts/by-user/${testUser1._id}?page=1&limit=10`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .get(`/api/posts/by-user/${testUser1._id}`);

        expect(response.status).toBe(401);
    });
});

describe('PUT /api/posts/like', () => {
    it('should like a post', async () => {
        const response = await request(app)
            .put('/api/posts/like')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.likes).toContain(testUser1._id.toString());
    });

    it('should return 400 if post already liked', async () => {
        // First like
        await request(app)
            .put('/api/posts/like')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id });

        // Try to like again
        const response = await request(app)
            .put('/api/posts/like')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put('/api/posts/like')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: fakeId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .put('/api/posts/like')
            .send({ postId: testPost2._id });

        expect(response.status).toBe(401);
    });
});

describe('PUT /api/posts/unlike', () => {
    beforeEach(async () => {
        // Like the post first
        testPost2.likes.push(testUser1._id);
        await testPost2.save();
    });

    it('should unlike a post', async () => {
        const response = await request(app)
            .put('/api/posts/unlike')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.likes).not.toContain(testUser1._id.toString());
    });

    it('should return 400 if post not liked', async () => {
        const response = await request(app)
            .put('/api/posts/unlike')
            .set('Authorization', `Bearer ${token2}`)
            .send({ postId: testPost2._id });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put('/api/posts/unlike')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: fakeId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe('PUT /api/posts/comment', () => {
    it('should add a comment to a post', async () => {
        const commentData = {
            postId: testPost2._id,
            text: 'This is a test comment'
        };

        const response = await request(app)
            .put('/api/posts/comment')
            .set('Authorization', `Bearer ${token1}`)
            .send(commentData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.comments).toHaveLength(1);
        expect(response.body.data.comments[0].text).toBe(commentData.text);
        expect(response.body.data.comments[0].postedBy._id).toBe(testUser1._id.toString());
    });

    it('should return 400 if comment text is missing', async () => {
        const response = await request(app)
            .put('/api/posts/comment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 400 if comment text is too long', async () => {
        const longComment = 'a'.repeat(501);
        const response = await request(app)
            .put('/api/posts/comment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id, text: longComment });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put('/api/posts/comment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: fakeId, text: 'Test comment' });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe('PUT /api/posts/uncomment', () => {
    let commentId;

    beforeEach(async () => {
        // Add a comment first
        testPost2.comments.push({
            text: 'Test comment to delete',
            postedBy: testUser1._id
        });
        await testPost2.save();
        commentId = testPost2.comments[0]._id;
    });

    it('should remove a comment from a post', async () => {
        const response = await request(app)
            .put('/api/posts/uncomment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id, commentId });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.comments).toHaveLength(0);
    });

    it('should return 403 if user does not own the comment', async () => {
        const response = await request(app)
            .put('/api/posts/uncomment')
            .set('Authorization', `Bearer ${token2}`)
            .send({ postId: testPost2._id, commentId });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if comment not found', async () => {
        const fakeCommentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put('/api/posts/uncomment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: testPost2._id, commentId: fakeCommentId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakePostId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .put('/api/posts/uncomment')
            .set('Authorization', `Bearer ${token1}`)
            .send({ postId: fakePostId, commentId });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe('GET /api/posts/:id/photo', () => {
    beforeEach(async () => {
        // Add photo to testPost1
        testPost1.photo = {
            data: Buffer.from('fake-image-data'),
            contentType: 'image/jpeg'
        };
        await testPost1.save();
    });

    it('should return post photo', async () => {
        const response = await request(app)
            .get(`/api/posts/${testPost1._id}/photo`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('image/jpeg');
        expect(response.body).toEqual(Buffer.from('fake-image-data'));
    });

    it('should return 404 if post has no photo', async () => {
        const response = await request(app)
            .get(`/api/posts/${testPost2._id}/photo`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .get(`/api/posts/${fakeId}/photo`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe('DELETE /api/posts/:id', () => {
    it('should delete a post owned by the user', async () => {
        const response = await request(app)
            .delete(`/api/posts/${testPost1._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify post is deleted
        const deletedPost = await Post.findById(testPost1._id);
        expect(deletedPost).toBeNull();
    });

    it('should return 403 if user does not own the post', async () => {
        const response = await request(app)
            .delete(`/api/posts/${testPost2._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it('should return 404 if post not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .delete(`/api/posts/${fakeId}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .delete(`/api/posts/${testPost1._id}`);

        expect(response.status).toBe(401);
    });
}); 