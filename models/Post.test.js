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
}); 