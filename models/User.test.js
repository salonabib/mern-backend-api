const mongoose = require('mongoose');
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
    await User.deleteMany({});
});

process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRE = '1h';

describe('User Model Test', () => {
    const validUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
    };

    describe('Basic User Creation', () => {
        it('should create a user with required fields', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser._id).toBeDefined();
            expect(savedUser.username).toBe(validUserData.username);
            expect(savedUser.email).toBe(validUserData.email);
            expect(savedUser.firstName).toBe(validUserData.firstName);
            expect(savedUser.lastName).toBe(validUserData.lastName);
            expect(savedUser.password).toBeDefined();
            expect(savedUser.password).not.toBe(validUserData.password); // Should be hashed
        });

        it('should create a user with default values', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser.avatar).toBe('');
            expect(savedUser.bio).toBeUndefined();
            expect(savedUser.isActive).toBe(true);
            expect(savedUser.role).toBe('user');
            expect(savedUser.following).toEqual([]);
            expect(savedUser.followers).toEqual([]);
        });
    });

    describe('Social Media Features', () => {
        it('should create a user with about field', async () => {
            const userData = {
                ...validUserData,
                about: 'This is my bio description'
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.about).toBe('This is my bio description');
        });

        it('should create a user with photo data', async () => {
            const photoData = Buffer.from('fake-image-data');
            const userData = {
                ...validUserData,
                photo: {
                    data: photoData,
                    contentType: 'image/jpeg'
                }
            };

            const user = new User(userData);
            const savedUser = await user.save();
            // Compare as Buffer
            expect(Buffer.from(savedUser.photo.data).equals(photoData)).toBe(true);
            expect(savedUser.photo.contentType).toBe('image/jpeg');
        });

        it('should handle following and followers arrays', async () => {
            const user1 = await new User(validUserData).save();
            const user2 = await new User({
                ...validUserData,
                username: 'user2',
                email: 'user2@example.com'
            }).save();

            user1.following.push(user2._id);
            user2.followers.push(user1._id);

            await user1.save();
            await user2.save();

            const updatedUser1 = await User.findById(user1._id);
            const updatedUser2 = await User.findById(user2._id);

            expect(updatedUser1.following).toContainEqual(user2._id);
            expect(updatedUser2.followers).toContainEqual(user1._id);
        });
    });

    describe('Validation', () => {
        it('should require username', async () => {
            const userData = { ...validUserData };
            delete userData.username;

            const user = new User(userData);
            let err;

            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.username).toBeDefined();
        });

        it('should require unique username', async () => {
            await new User(validUserData).save();

            const duplicateUser = new User(validUserData);
            let err;

            try {
                await duplicateUser.save();
            } catch (error) {
                err = error;
            }

            expect(err.code).toBe(11000); // Duplicate key error
        });

        it('should require valid email format', async () => {
            const userData = {
                ...validUserData,
                email: 'invalid-email'
            };

            const user = new User(userData);
            let err;

            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.email).toBeDefined();
        });

        it('should require password with minimum length', async () => {
            const userData = {
                ...validUserData,
                password: '123'
            };

            const user = new User(userData);
            let err;

            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.password).toBeDefined();
        });

        it('should validate about field length', async () => {
            const longAbout = 'a'.repeat(501);
            const userData = {
                ...validUserData,
                about: longAbout
            };

            const user = new User(userData);
            let err;

            try {
                await user.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
            expect(err.errors.about).toBeDefined();
        });
    });

    describe('Password Hashing', () => {
        it('should hash password before saving', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser.password).not.toBe(validUserData.password);
            expect(savedUser.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/); // bcrypt pattern
        });

        it('should not hash password if not modified', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();
            const originalHash = savedUser.password;

            savedUser.username = 'newusername';
            await savedUser.save();

            expect(savedUser.password).toBe(originalHash);
        });
    });

    describe('Password Comparison', () => {
        it('should compare password correctly', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            const isMatch = await savedUser.comparePassword(validUserData.password);
            expect(isMatch).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            const isMatch = await savedUser.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });
    });

    describe('JWT Token Generation', () => {
        it('should generate JWT token', () => {
            const user = new User(validUserData);
            const token = user.getSignedJwtToken();

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });
    });

    describe('JSON Serialization', () => {
        it('should exclude password from JSON output', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            const userJson = savedUser.toJSON();

            expect(userJson.password).toBeUndefined();
            expect(userJson._id).toBeDefined();
            expect(userJson.username).toBeDefined();
        });
    });

    describe('Timestamps', () => {
        it('should add timestamps', async () => {
            const user = new User(validUserData);
            const savedUser = await user.save();

            expect(savedUser.createdAt).toBeDefined();
            expect(savedUser.updatedAt).toBeDefined();
            expect(savedUser.createdAt).toBeInstanceOf(Date);
            expect(savedUser.updatedAt).toBeInstanceOf(Date);
        });
    });
}); 