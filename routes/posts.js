const express = require('express');
const { body, query } = require('express-validator');
const Post = require('../models/Post');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const multer = require('multer');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// @desc    Get all posts (newsfeed)
// @route   GET /api/posts
// @access  Private
router.get('/', protect, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get current user's following list
        const currentUser = await User.findById(req.user.id);
        const followingIds = [...(currentUser.following || []), req.user.id];

        // Get posts from followed users and current user
        const posts = await Post.find({
            postedBy: { $in: followingIds }
        })
            .populate('postedBy', 'firstName lastName username photo')
            .populate('comments.postedBy', 'firstName lastName username photo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({
            postedBy: { $in: followingIds }
        });

        res.json({
            success: true,
            count: posts.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: posts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching posts',
            error: error.message
        });
    }
});

// @desc    Get newsfeed (posts from followed users)
// @route   GET /api/posts/feed
// @access  Private
router.get('/feed', protect, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get current user's following list
        const currentUser = await User.findById(req.user.id);

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const followingIds = [...(currentUser.following || []), req.user.id];

        // Get posts from followed users and current user
        const posts = await Post.find({
            postedBy: { $in: followingIds }
        })
            .populate('postedBy', 'firstName lastName username photo')
            .populate('comments.postedBy', 'firstName lastName username photo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({
            postedBy: { $in: followingIds }
        });

        res.json({
            success: true,
            count: posts.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: posts
        });
    } catch (error) {
        console.error('Error in /api/posts/feed:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching feed',
            error: error.message
        });
    }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('postedBy', 'firstName lastName username photo')
            .populate('comments.postedBy', 'firstName lastName username photo');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching post',
            error: error.message
        });
    }
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, upload.single('photo'), [
    body('text')
        .notEmpty()
        .withMessage('Text is required')
        .isLength({ max: 1000 })
        .withMessage('Text cannot exceed 1000 characters')
], validate, async (req, res) => {
    try {
        const { text } = req.body;
        const postData = {
            text,
            postedBy: req.user.id
        };

        // Handle photo upload
        if (req.file) {
            postData.photo = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const post = await Post.create(postData);

        await post.populate('postedBy', 'firstName lastName username photo');

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating post',
            error: error.message
        });
    }
});

// @desc    Get post photo
// @route   GET /api/posts/:id/photo
// @access  Public
router.get('/:id/photo', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select('photo');

        if (!post || !post.photo.data) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        res.set('Content-Type', post.photo.contentType);
        res.send(post.photo.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching photo',
            error: error.message
        });
    }
});

// @desc    Like a post
// @route   PUT /api/posts/like
// @access  Private
router.put('/like', protect, [
    body('postId')
        .isMongoId()
        .withMessage('Invalid post ID')
], validate, async (req, res) => {
    try {
        const { postId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if already liked
        if (post.likes.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Post already liked'
            });
        }

        // Add like
        post.likes.push(req.user.id);
        await post.save();

        await post.populate('postedBy', 'firstName lastName username photo');
        await post.populate('comments.postedBy', 'firstName lastName username photo');

        res.json({
            success: true,
            message: 'Post liked successfully',
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error liking post',
            error: error.message
        });
    }
});

// @desc    Unlike a post
// @route   PUT /api/posts/unlike
// @access  Private
router.put('/unlike', protect, [
    body('postId')
        .isMongoId()
        .withMessage('Invalid post ID')
], validate, async (req, res) => {
    try {
        const { postId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if not liked
        if (!post.likes.includes(req.user.id)) {
            return res.status(400).json({
                success: false,
                message: 'Post not liked'
            });
        }

        // Remove like
        post.likes = post.likes.filter(like => like.toString() !== req.user.id);
        await post.save();

        await post.populate('postedBy', 'firstName lastName username photo');
        await post.populate('comments.postedBy', 'firstName lastName username photo');

        res.json({
            success: true,
            message: 'Post unliked successfully',
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unliking post',
            error: error.message
        });
    }
});

// @desc    Comment on a post
// @route   PUT /api/posts/comment
// @access  Private
router.put('/comment', protect, [
    body('postId')
        .isMongoId()
        .withMessage('Invalid post ID'),
    body('text')
        .notEmpty()
        .withMessage('Comment text is required')
        .isLength({ max: 500 })
        .withMessage('Comment cannot exceed 500 characters')
], validate, async (req, res) => {
    try {
        const { postId, text } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Add comment
        post.comments.push({
            text,
            postedBy: req.user.id
        });
        await post.save();

        await post.populate('postedBy', 'firstName lastName username photo');
        await post.populate('comments.postedBy', 'firstName lastName username photo');

        res.json({
            success: true,
            message: 'Comment added successfully',
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
});

// @desc    Remove comment from a post
// @route   PUT /api/posts/uncomment
// @access  Private
router.put('/uncomment', protect, [
    body('postId')
        .isMongoId()
        .withMessage('Invalid post ID'),
    body('commentId')
        .isMongoId()
        .withMessage('Invalid comment ID')
], validate, async (req, res) => {
    try {
        const { postId, commentId } = req.body;

        let post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Remove comment using array splice
        const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        // Check if user owns the comment
        if (post.comments[commentIndex].postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }
        post.comments.splice(commentIndex, 1);
        await post.save();

        // Reload post to ensure population is correct
        post = await Post.findById(postId)
            .populate('postedBy', 'firstName lastName username photo')
            .populate('comments.postedBy', 'firstName lastName username photo');

        res.json({
            success: true,
            message: 'Comment removed successfully',
            data: post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing comment',
            error: error.message
        });
    }
});

// @desc    Get posts by user
// @route   GET /api/posts/by-user/:userId
// @access  Private
router.get('/by-user/:userId', protect, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({
            postedBy: req.params.userId
        })
            .populate('postedBy', 'firstName lastName username photo')
            .populate('comments.postedBy', 'firstName lastName username photo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({
            postedBy: req.params.userId
        });

        res.json({
            success: true,
            count: posts.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: posts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching posts',
            error: error.message
        });
    }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user owns the post
        if (post.postedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this post'
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting post',
            error: error.message
        });
    }
});

module.exports = router; 