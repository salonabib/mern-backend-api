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

describe('Database Integration Tests', () => {
    it('should handle multiple concurrent post creations without database conflicts', async () => {
        // This test ensures that the API can handle multiple concurrent post creations
        // without any database index conflicts or race conditions

        const postPromises = [];
        const postTexts = [
            'Concurrent post 1',
            'Concurrent post 2',
            'Concurrent post 3',
            'Concurrent post 4',
            'Concurrent post 5'
        ];

        // Create multiple posts concurrently through the API
        for (const text of postTexts) {
            const promise = request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({ text });
            postPromises.push(promise);
        }

        // Wait for all posts to be created
        const responses = await Promise.all(postPromises);

        // Verify all posts were created successfully
        expect(responses).toHaveLength(5);

        for (let i = 0; i < responses.length; i++) {
            expect(responses[i].status).toBe(201);
            expect(responses[i].body.success).toBe(true);
            expect(responses[i].body.data.text).toBe(postTexts[i]);
            expect(responses[i].body.data.postedBy._id).toBe(testUser1._id.toString());
        }

        // Verify all posts exist in the database
        const allPosts = await Post.find({ postedBy: testUser1._id });
        expect(allPosts.length).toBeGreaterThanOrEqual(5);
    });

    it('should handle rapid post creation and retrieval without index issues', async () => {
        // This test simulates rapid post creation and retrieval to catch
        // any database index or schema issues that might occur in production

        const createdPosts = [];

        // Create 10 posts rapidly
        for (let i = 0; i < 10; i++) {
            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({ text: `Rapid post ${i + 1}` });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            createdPosts.push(response.body.data);
        }

        // Immediately retrieve all posts
        const feedResponse = await request(app)
            .get('/api/posts/feed')
            .set('Authorization', `Bearer ${token1}`);

        expect(feedResponse.status).toBe(200);
        expect(feedResponse.body.success).toBe(true);
        expect(feedResponse.body.data.length).toBeGreaterThanOrEqual(10);

        // Verify each created post can be retrieved individually
        for (const post of createdPosts) {
            const getResponse = await request(app)
                .get(`/api/posts/${post._id}`)
                .set('Authorization', `Bearer ${token1}`);

            expect(getResponse.status).toBe(200);
            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data._id).toBe(post._id);
        }
    });

    it('should handle posts with photos without database schema errors', async () => {
        // This test ensures that posts with photos can be created and retrieved
        // without any database schema or index issues

        const photoData = Buffer.from('fake-image-data-for-api-testing');

        const response = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .field('text', 'Test post with photo via API')
            .attach('photo', photoData, 'test-image.jpg');

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.text).toBe('Test post with photo via API');
        expect(response.body.data.photo).toBeDefined();
        expect(response.body.data.photo.contentType).toBeDefined();

        // Verify the post can be retrieved
        const getResponse = await request(app)
            .get(`/api/posts/${response.body.data._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.success).toBe(true);
        expect(getResponse.body.data.photo).toBeDefined();

        // Verify the photo can be retrieved
        const photoResponse = await request(app)
            .get(`/api/posts/${response.body.data._id}/photo`);

        expect(photoResponse.status).toBe(200);
        expect(photoResponse.headers['content-type']).toBeDefined();
    });

    it('should detect and report database index conflicts', async () => {
        // This test specifically checks for database index issues
        // It will fail with a clear error message if there are any unique index conflicts

        try {
            // Create multiple posts to test for index conflicts
            const post1 = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({ text: 'Index test post 1' });

            const post2 = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({ text: 'Index test post 2' });

            const post3 = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${token1}`)
                .send({ text: 'Index test post 3' });

            // If we get here, no index conflicts occurred
            expect(post1.status).toBe(201);
            expect(post2.status).toBe(201);
            expect(post3.status).toBe(201);

            // Verify all posts have unique IDs
            const post1Id = post1.body.data._id;
            const post2Id = post2.body.data._id;
            const post3Id = post3.body.data._id;

            expect(post1Id).not.toBe(post2Id);
            expect(post2Id).not.toBe(post3Id);
            expect(post1Id).not.toBe(post3Id);

        } catch (error) {
            // If there's a duplicate key error, provide a clear error message
            if (error.code === 11000 || error.message.includes('duplicate key')) {
                throw new Error(`Database index conflict detected in API test: ${error.message}. This indicates a stale or conflicting database index that needs to be resolved. Check for unique indexes on fields that shouldn't be unique.`);
            }
            throw error;
        }
    });

    it('should handle complex post operations without database errors', async () => {
        // This test performs a series of complex operations to ensure
        // the database can handle real-world usage patterns

        // 1. Create a post
        const createResponse = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .send({ text: 'Complex operation test post' });

        expect(createResponse.status).toBe(201);
        const postId = createResponse.body.data._id;

        // 2. Like the post
        const likeResponse = await request(app)
            .put('/api/posts/like')
            .set('Authorization', `Bearer ${token2}`)
            .send({ postId });

        expect(likeResponse.status).toBe(200);
        expect(likeResponse.body.data.likes).toContain(testUser2._id.toString());

        // 3. Add a comment
        const commentResponse = await request(app)
            .put('/api/posts/comment')
            .set('Authorization', `Bearer ${token2}`)
            .send({ postId, text: 'Test comment' });

        expect(commentResponse.status).toBe(200);
        expect(commentResponse.body.data.comments).toHaveLength(1);

        // 4. Retrieve the post with all interactions
        const getResponse = await request(app)
            .get(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.data.likes).toContain(testUser2._id.toString());
        expect(getResponse.body.data.comments).toHaveLength(1);

        // 5. Unlike the post
        const unlikeResponse = await request(app)
            .put('/api/posts/unlike')
            .set('Authorization', `Bearer ${token2}`)
            .send({ postId });

        expect(unlikeResponse.status).toBe(200);
        expect(unlikeResponse.body.data.likes).not.toContain(testUser2._id.toString());

        // 6. Verify final state
        const finalResponse = await request(app)
            .get(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(finalResponse.status).toBe(200);
        expect(finalResponse.body.data.likes).toHaveLength(0);
        expect(finalResponse.body.data.comments).toHaveLength(1);
    });

    it('should validate database schema integrity through API operations', async () => {
        // This test ensures that all API operations maintain database schema integrity
        // and that the database schema matches our expectations

        // Create a post and verify all expected fields are present
        const createResponse = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token1}`)
            .send({ text: 'Schema integrity test post' });

        expect(createResponse.status).toBe(201);
        const post = createResponse.body.data;

        // Verify all expected fields exist and have correct types
        expect(post._id).toBeDefined();
        expect(typeof post.text).toBe('string');
        expect(post.postedBy).toBeDefined();
        expect(post.postedBy._id).toBe(testUser1._id.toString());
        expect(Array.isArray(post.likes)).toBe(true);
        expect(Array.isArray(post.comments)).toBe(true);
        expect(post.createdAt).toBeDefined();
        expect(post.updatedAt).toBeDefined();
        expect(post.commentCount).toBe(0);
        expect(post.likeCount).toBe(0);

        // Verify the post can be retrieved from the database
        const getResponse = await request(app)
            .get(`/api/posts/${post._id}`)
            .set('Authorization', `Bearer ${token1}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.data._id).toBe(post._id);
        expect(getResponse.body.data.text).toBe(post.text);

        // Verify the post appears in the feed
        const feedResponse = await request(app)
            .get('/api/posts/feed')
            .set('Authorization', `Bearer ${token1}`);

        expect(feedResponse.status).toBe(200);
        expect(feedResponse.body.data.some(p => p._id === post._id)).toBe(true);
    });
}); 