const mongoose = require('mongoose');
const Post = require('./Post');
const User = require('./User');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Post.deleteMany({});
    await User.deleteMany({});
});

describe('Post Model Test', () => {
    let testUser;

    beforeEach(async () => {
        testUser = await new User({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe'
        }).save();
    });

    const validPostData = (userId) => ({
        text: 'This is a test post content',
        postedBy: userId
    });

    describe('Basic Post Creation', () => {
        it('should create a post with required fields', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            expect(savedPost._id).toBeDefined();
            expect(savedPost.text).toBe(validPostData(testUser._id).text);
            expect(savedPost.postedBy).toEqual(testUser._id);
            expect(savedPost.likes).toEqual([]);
            expect(savedPost.comments).toEqual([]);
        });

        it('should create a post with default values', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            expect(savedPost.likes).toEqual([]);
            expect(savedPost.comments).toEqual([]);
            expect(savedPost.createdAt).toBeDefined();
            expect(savedPost.updatedAt).toBeDefined();
        });
    });

    describe('Social Media Features', () => {
        it('should create a post with photo', async () => {
            const photoData = Buffer.from('fake-image-data');
            const postData = {
                ...validPostData(testUser._id),
                photo: {
                    data: photoData,
                    contentType: 'image/jpeg'
                }
            };

            const post = new Post(postData);
            const savedPost = await post.save();

            // Compare as Buffer
            expect(Buffer.from(savedPost.photo.data).equals(photoData)).toBe(true);
            expect(savedPost.photo.contentType).toBe('image/jpeg');
        });

        it('should handle likes array', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            savedPost.likes.push(testUser._id);
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.likes).toContainEqual(testUser._id);
        });

        it('should handle comments array', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const comment = {
                text: 'This is a test comment',
                postedBy: testUser._id,
                createdAt: new Date()
            };

            savedPost.comments.push(comment);
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.comments).toHaveLength(1);
            expect(updatedPost.comments[0].text).toBe(comment.text);
            expect(updatedPost.comments[0].postedBy).toEqual(testUser._id);
        });

        it('should handle multiple comments', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const comment1 = {
                text: 'First comment',
                postedBy: testUser._id,
                createdAt: new Date()
            };

            const comment2 = {
                text: 'Second comment',
                postedBy: testUser._id,
                createdAt: new Date()
            };

            savedPost.comments.push(comment1, comment2);
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.comments).toHaveLength(2);
        });
    });

    describe('Validation', () => {
        it('should require text', async () => {
            const postData = { postedBy: testUser._id };

            const post = new Post(postData);
            let err;

            try {
                await post.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.text).toBeDefined();
        });

        it('should require postedBy', async () => {
            const postData = { text: 'Test post' };

            const post = new Post(postData);
            let err;

            try {
                await post.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.postedBy).toBeDefined();
        });

        it('should validate text length', async () => {
            const longText = 'a'.repeat(1001);
            const postData = {
                text: longText,
                postedBy: testUser._id
            };

            const post = new Post(postData);
            let err;

            try {
                await post.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.text).toBeDefined();
        });

        it('should validate comment text length', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const longCommentText = 'a'.repeat(501);
            const comment = {
                text: longCommentText,
                postedBy: testUser._id
            };

            savedPost.comments.push(comment);
            let err;

            try {
                await savedPost.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        });

        it('should require comment text', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const comment = {
                postedBy: testUser._id
            };

            savedPost.comments.push(comment);
            let err;

            try {
                await savedPost.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        });

        it('should require comment postedBy', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const comment = {
                text: 'Test comment'
            };

            savedPost.comments.push(comment);
            let err;

            try {
                await savedPost.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        });
    });

    describe('Virtual Fields', () => {
        it('should calculate comment count', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            expect(savedPost.commentCount).toBe(0);

            savedPost.comments.push({
                text: 'Test comment',
                postedBy: testUser._id
            });
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.commentCount).toBe(1);
        });

        it('should calculate like count', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            expect(savedPost.likeCount).toBe(0);

            savedPost.likes.push(testUser._id);
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.likeCount).toBe(1);
        });
    });

    describe('JSON Serialization', () => {
        it('should include virtual fields in JSON', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            savedPost.likes.push(testUser._id);
            savedPost.comments.push({
                text: 'Test comment',
                postedBy: testUser._id
            });
            await savedPost.save();

            const postJson = savedPost.toJSON();

            expect(postJson.commentCount).toBe(1);
            expect(postJson.likeCount).toBe(1);
        });
    });

    describe('Timestamps', () => {
        it('should add timestamps', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            expect(savedPost.createdAt).toBeDefined();
            expect(savedPost.updatedAt).toBeDefined();
            expect(savedPost.createdAt).toBeInstanceOf(Date);
            expect(savedPost.updatedAt).toBeInstanceOf(Date);
        });

        it('should update timestamp on modification', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();
            const originalUpdatedAt = savedPost.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            savedPost.text = 'Updated text';
            await savedPost.save();

            expect(savedPost.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });
    });

    describe('Comment Timestamps', () => {
        it('should add timestamps to comments', async () => {
            const post = new Post(validPostData(testUser._id));
            const savedPost = await post.save();

            const comment = {
                text: 'Test comment',
                postedBy: testUser._id
            };

            savedPost.comments.push(comment);
            await savedPost.save();

            const updatedPost = await Post.findById(savedPost._id);
            expect(updatedPost.comments[0].createdAt).toBeDefined();
            expect(updatedPost.comments[0].createdAt).toBeInstanceOf(Date);
        });
    });

    describe('Database Integration Tests', () => {
        it('should create multiple posts without database index conflicts', async () => {
            // This test ensures that post creation works without any database index issues
            // It will fail if there are stale indexes or schema conflicts

            const posts = [];
            const postTexts = [
                'First test post',
                'Second test post',
                'Third test post',
                'Fourth test post',
                'Fifth test post'
            ];

            // Create multiple posts rapidly to test for index conflicts
            for (let i = 0; i < postTexts.length; i++) {
                const postData = {
                    text: postTexts[i],
                    postedBy: testUser._id
                };

                const post = new Post(postData);
                const savedPost = await post.save();
                posts.push(savedPost);

                // Verify each post was created successfully
                expect(savedPost._id).toBeDefined();
                expect(savedPost.text).toBe(postTexts[i]);
                expect(savedPost.postedBy).toEqual(testUser._id);
            }

            // Verify all posts exist in database
            const allPosts = await Post.find({ postedBy: testUser._id });
            expect(allPosts).toHaveLength(postTexts.length);

            // Verify each post can be retrieved individually
            for (const post of posts) {
                const retrievedPost = await Post.findById(post._id);
                expect(retrievedPost).toBeDefined();
                expect(retrievedPost.text).toBe(post.text);
            }
        });

        it('should handle concurrent post creation without conflicts', async () => {
            // This test simulates concurrent post creation to catch race conditions
            // and index conflicts that might occur in production

            const concurrentPosts = [];
            const promises = [];

            // Create 10 posts concurrently
            for (let i = 0; i < 10; i++) {
                const postData = {
                    text: `Concurrent post ${i + 1}`,
                    postedBy: testUser._id
                };

                const promise = new Post(postData).save();
                promises.push(promise);
            }

            // Wait for all posts to be created
            const results = await Promise.all(promises);

            // Verify all posts were created successfully
            expect(results).toHaveLength(10);

            for (let i = 0; i < results.length; i++) {
                expect(results[i]._id).toBeDefined();
                expect(results[i].text).toBe(`Concurrent post ${i + 1}`);
                expect(results[i].postedBy).toEqual(testUser._id);
            }

            // Verify all posts exist in database
            const allPosts = await Post.find({ postedBy: testUser._id });
            expect(allPosts.length).toBeGreaterThanOrEqual(10);
        });

        it('should create posts with photos without database errors', async () => {
            // This test ensures that posts with photos can be created without
            // any database schema or index issues

            const photoData = Buffer.from('fake-image-data-for-testing');
            const postData = {
                text: 'Test post with photo',
                postedBy: testUser._id,
                photo: {
                    data: photoData,
                    contentType: 'image/jpeg'
                }
            };

            const post = new Post(postData);
            const savedPost = await post.save();

            // Verify post was created with photo
            expect(savedPost._id).toBeDefined();
            expect(savedPost.text).toBe('Test post with photo');
            expect(savedPost.photo).toBeDefined();
            expect(savedPost.photo.contentType).toBe('image/jpeg');
            expect(Buffer.from(savedPost.photo.data).equals(photoData)).toBe(true);

            // Verify post can be retrieved from database
            const retrievedPost = await Post.findById(savedPost._id);
            expect(retrievedPost).toBeDefined();
            expect(retrievedPost.photo).toBeDefined();
            expect(retrievedPost.photo.contentType).toBe('image/jpeg');
        });

        it('should handle database index validation', async () => {
            // This test specifically checks for database index issues
            // It will fail if there are any unique index conflicts or schema mismatches

            try {
                // Create a post and immediately try to create another
                // This helps catch any unique index issues
                const post1 = await new Post({
                    text: 'Index test post 1',
                    postedBy: testUser._id
                }).save();

                const post2 = await new Post({
                    text: 'Index test post 2',
                    postedBy: testUser._id
                }).save();

                // If we get here, no index conflicts occurred
                expect(post1._id).toBeDefined();
                expect(post2._id).toBeDefined();
                expect(post1._id.toString()).not.toBe(post2._id.toString());

            } catch (error) {
                // If there's a duplicate key error, it means there's an index issue
                if (error.code === 11000) {
                    throw new Error(`Database index conflict detected: ${error.message}. This indicates a stale or conflicting database index that needs to be resolved.`);
                }
                throw error;
            }
        });

        it('should validate database schema integrity', async () => {
            // This test ensures the database schema matches our model expectations
            // It will catch any schema drift or missing fields

            const post = await new Post({
                text: 'Schema validation test post',
                postedBy: testUser._id
            }).save();

            // Verify all expected fields exist and have correct types
            expect(post._id).toBeDefined();
            expect(typeof post.text).toBe('string');
            expect(post.postedBy).toBeDefined();
            expect(Array.isArray(post.likes)).toBe(true);
            expect(Array.isArray(post.comments)).toBe(true);
            expect(post.createdAt).toBeInstanceOf(Date);
            expect(post.updatedAt).toBeInstanceOf(Date);

            // Verify virtual fields work correctly
            expect(post.commentCount).toBe(0);
            expect(post.likeCount).toBe(0);

            // Add a like and comment to test virtual fields
            post.likes.push(testUser._id);
            post.comments.push({
                text: 'Test comment',
                postedBy: testUser._id
            });
            await post.save();

            // Verify virtual fields update correctly
            expect(post.likeCount).toBe(1);
            expect(post.commentCount).toBe(1);
        });
    });
}); 