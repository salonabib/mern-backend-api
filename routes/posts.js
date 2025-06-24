const express = require('express');
const { body, query } = require('express-validator');
const Post = require('../models/Post');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// @desc    Get all posts (public)
// @route   GET /api/posts
// @access  Public
router.get('/', optionalAuth, [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('category')
        .optional()
        .isIn(['technology', 'lifestyle', 'business', 'health', 'education', 'other'])
        .withMessage('Invalid category'),
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    query('author')
        .optional()
        .isMongoId()
        .withMessage('Invalid author ID'),
    query('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Invalid status')
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Only show published posts to non-authenticated users
        if (!req.user || req.user.role !== 'admin') {
            query.status = 'published';
            query.isPublished = true;
        }

        if (req.query.category) {
            query.category = req.query.category;
        }

        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.search, 'i')] } }
            ];
        }

        if (req.query.author) {
            query.author = req.query.author;
        }

        if (req.query.status && (req.user?.role === 'admin')) {
            query.status = req.query.status;
        }

        const posts = await Post.find(query)
            .populate('author', 'username firstName lastName avatar')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments(query);

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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username firstName lastName avatar bio')
            .populate('comments.user', 'username firstName lastName avatar');

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user can view this post
        if (post.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Increment view count for published posts
        if (post.status === 'published') {
            post.viewCount += 1;
            await post.save();
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
router.post('/', protect, [
    body('title')
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
    body('content')
        .notEmpty()
        .withMessage('Content is required')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters long'),
    body('category')
        .isIn(['technology', 'lifestyle', 'business', 'health', 'education', 'other'])
        .withMessage('Invalid category'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('status')
        .optional()
        .isIn(['draft', 'published'])
        .withMessage('Status must be either draft or published'),
    body('featuredImage')
        .optional()
        .isURL()
        .withMessage('Featured image must be a valid URL')
], validate, async (req, res) => {
    try {
        const { title, content, category, tags, status, featuredImage } = req.body;

        const post = await Post.create({
            title,
            content,
            category,
            tags: tags || [],
            status: status || 'draft',
            featuredImage: featuredImage || '',
            author: req.user.id
        });

        await post.populate('author', 'username firstName lastName avatar');

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

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, [
    body('title')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters long'),
    body('category')
        .optional()
        .isIn(['technology', 'lifestyle', 'business', 'health', 'education', 'other'])
        .withMessage('Invalid category'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Invalid status'),
    body('featuredImage')
        .optional()
        .isURL()
        .withMessage('Featured image must be a valid URL')
], validate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user can update this post
        if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this post'
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('author', 'username firstName lastName avatar');

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: updatedPost
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating post',
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

        // Check if user can delete this post
        if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
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

// @desc    Like/Unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        const likeIndex = post.likes.indexOf(req.user.id);

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();

        res.json({
            success: true,
            message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
            data: {
                likes: post.likes,
                likeCount: post.likes.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating like',
            error: error.message
        });
    }
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
router.post('/:id/comments', protect, [
    body('content')
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 1000 })
        .withMessage('Comment cannot exceed 1000 characters')
], validate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        post.comments.push({
            user: req.user.id,
            content: req.body.content
        });

        await post.save();
        await post.populate('comments.user', 'username firstName lastName avatar');

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: post.comments[post.comments.length - 1]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding comment',
            error: error.message
        });
    }
});

// @desc    Get post statistics (admin only)
// @route   GET /api/posts/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
    try {
        const totalPosts = await Post.countDocuments();
        const publishedPosts = await Post.countDocuments({ status: 'published' });
        const draftPosts = await Post.countDocuments({ status: 'draft' });
        const totalViews = await Post.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalPosts,
                publishedPosts,
                draftPosts,
                totalViews: totalViews[0]?.totalViews || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching post statistics',
            error: error.message
        });
    }
});

module.exports = router; 