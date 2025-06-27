#!/usr/bin/env node

/**
 * Database Integration Test Script
 * 
 * This script tests the database integration to ensure that:
 * 1. Posts can be created without database index conflicts
 * 2. Multiple concurrent operations work correctly
 * 3. The database schema is intact
 * 
 * Run this script manually to verify database health:
 * node test-database-integration.js
 */

const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

// Connect to the actual database (not test database)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-app';

async function testDatabaseIntegration() {
    console.log('🔍 Starting Database Integration Tests...\n');

    try {
        // Connect to database
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Create a test user
        const testUser = await User.create({
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser_' + Date.now(),
            email: 'test_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'user'
        });
        console.log('✅ Test user created:', testUser.username);

        // Test 1: Create multiple posts without index conflicts
        console.log('\n📝 Test 1: Creating multiple posts...');
        const posts = [];
        const postTexts = [
            'Database integration test post 1',
            'Database integration test post 2',
            'Database integration test post 3',
            'Database integration test post 4',
            'Database integration test post 5'
        ];

        for (let i = 0; i < postTexts.length; i++) {
            const post = await Post.create({
                text: postTexts[i],
                postedBy: testUser._id
            });
            posts.push(post);
            console.log(`  ✅ Created post ${i + 1}: ${post._id}`);
        }

        // Test 2: Verify all posts can be retrieved
        console.log('\n📖 Test 2: Retrieving all posts...');
        const allPosts = await Post.find({ postedBy: testUser._id });
        console.log(`  ✅ Retrieved ${allPosts.length} posts`);

        if (allPosts.length !== postTexts.length) {
            throw new Error(`Expected ${postTexts.length} posts, but found ${allPosts.length}`);
        }

        // Test 3: Test concurrent post creation
        console.log('\n⚡ Test 3: Concurrent post creation...');
        const concurrentPromises = [];
        for (let i = 0; i < 10; i++) {
            const promise = Post.create({
                text: `Concurrent post ${i + 1}`,
                postedBy: testUser._id
            });
            concurrentPromises.push(promise);
        }

        const concurrentResults = await Promise.all(concurrentPromises);
        console.log(`  ✅ Created ${concurrentResults.length} posts concurrently`);

        // Test 4: Verify unique IDs
        console.log('\n🆔 Test 4: Verifying unique IDs...');
        const allPostIds = [...posts.map(p => p._id.toString()), ...concurrentResults.map(p => p._id.toString())];
        const uniqueIds = new Set(allPostIds);

        if (allPostIds.length !== uniqueIds.size) {
            throw new Error('Duplicate post IDs detected! This indicates a database index issue.');
        }
        console.log(`  ✅ All ${allPostIds.length} posts have unique IDs`);

        // Test 5: Test posts with photos
        console.log('\n📸 Test 5: Creating post with photo...');
        const photoData = Buffer.from('fake-image-data-for-integration-testing');
        const postWithPhoto = await Post.create({
            text: 'Test post with photo',
            postedBy: testUser._id,
            photo: {
                data: photoData,
                contentType: 'image/jpeg'
            }
        });

        console.log('  ✅ Post with photo created successfully');
        console.log(`  ✅ Photo data size: ${postWithPhoto.photo.data.length} bytes`);

        // Test 6: Verify schema integrity
        console.log('\n🔍 Test 6: Verifying schema integrity...');
        const retrievedPost = await Post.findById(posts[0]._id);

        if (!retrievedPost) {
            throw new Error('Could not retrieve created post');
        }

        // Check all expected fields
        const requiredFields = ['_id', 'text', 'postedBy', 'likes', 'comments', 'createdAt', 'updatedAt'];
        for (const field of requiredFields) {
            if (!(field in retrievedPost)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        console.log('  ✅ All required fields present');
        console.log(`  ✅ Virtual fields: commentCount=${retrievedPost.commentCount}, likeCount=${retrievedPost.likeCount}`);

        // Test 7: Test like and comment operations
        console.log('\n❤️ Test 7: Testing like and comment operations...');

        // Add a like
        retrievedPost.likes.push(testUser._id);
        await retrievedPost.save();
        console.log('  ✅ Added like successfully');

        // Add a comment
        retrievedPost.comments.push({
            text: 'Integration test comment',
            postedBy: testUser._id
        });
        await retrievedPost.save();
        console.log('  ✅ Added comment successfully');

        // Verify virtual fields updated
        const updatedPost = await Post.findById(posts[0]._id);
        console.log(`  ✅ Updated counts: likes=${updatedPost.likeCount}, comments=${updatedPost.commentCount}`);

        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await Post.deleteMany({ postedBy: testUser._id });
        await User.findByIdAndDelete(testUser._id);
        console.log('  ✅ Test data cleaned up');

        console.log('\n🎉 All Database Integration Tests Passed!');
        console.log('\n✅ Database is healthy and ready for production use.');
        console.log('✅ No index conflicts detected.');
        console.log('✅ Schema integrity verified.');
        console.log('✅ Concurrent operations working correctly.');

    } catch (error) {
        console.error('\n❌ Database Integration Test Failed!');
        console.error('Error:', error.message);

        if (error.code === 11000) {
            console.error('\n🔧 This appears to be a database index conflict.');
            console.error('💡 Solution: Check for stale or conflicting database indexes.');
            console.error('   Run: mongosh mern-app --eval "db.posts.getIndexes()"');
            console.error('   Then drop any problematic indexes with: db.posts.dropIndex("index_name")');
        }

        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the tests
testDatabaseIntegration(); 