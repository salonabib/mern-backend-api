const express = require('express');
const { body, query, param } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string'),
    query('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin')
], validate, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        if (req.query.search) {
            query.$or = [
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { firstName: { $regex: req.query.search, $options: 'i' } },
                { lastName: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        if (req.query.role) {
            query.role = req.query.role;
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            count: users.length,
            total,
            pagination: {
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
});

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats/overview
// @access  Private/Admin
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const adminUsers = await User.countDocuments({ role: 'admin' });
        const recentUsers = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                adminUsers,
                recentUsers,
                inactiveUsers: totalUsers - activeUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
});

// @desc    Get users to follow (suggestions)
// @route   GET /api/users/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const followingIds = currentUser.following || [];

        // Get all users except the current user
        const allUsers = await User.find({
            _id: { $ne: req.user.id }
        })
            .select('firstName lastName username avatar')
            .limit(10)
            .sort({ createdAt: -1 });

        // Add a flag to indicate if current user is following each user
        const suggestions = allUsers.map(user => ({
            ...user.toObject(),
            isFollowing: followingIds.includes(user._id.toString())
        }));

        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching suggestions',
            error: error.message
        });
    }
});

// @desc    Update user profile (user can update their own profile)
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, upload.single('photo'), [
    body('firstName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    body('about')
        .optional()
        .isLength({ max: 500 })
        .withMessage('About cannot exceed 500 characters'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters')
], validate, async (req, res) => {
    try {
        const { firstName, lastName, about, bio } = req.body;
        const updateData = { firstName, lastName, about, bio };

        // Handle photo upload
        if (req.file) {
            updateData.photo = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// @desc    Follow a user
// @route   PUT /api/users/follow
// @access  Private
router.put('/follow', protect, [
    body('followId')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const { followId } = req.body;

        if (req.user.id === followId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot follow yourself'
            });
        }

        const userToFollow = await User.findById(followId);
        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: 'User to follow not found'
            });
        }

        const currentUser = await User.findById(req.user.id);

        // Check if already following
        if (currentUser.following.includes(followId)) {
            return res.status(400).json({
                success: false,
                message: 'Already following this user'
            });
        }

        // Add to following and followers
        await User.findByIdAndUpdate(req.user.id, {
            $push: { following: followId }
        });

        await User.findByIdAndUpdate(followId, {
            $push: { followers: req.user.id }
        });

        res.json({
            success: true,
            message: 'Successfully followed user'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error following user',
            error: error.message
        });
    }
});

// @desc    Unfollow a user
// @route   PUT /api/users/unfollow
// @access  Private
router.put('/unfollow', protect, [
    body('unfollowId')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const { unfollowId } = req.body;

        if (req.user.id === unfollowId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot unfollow yourself'
            });
        }

        const userToUnfollow = await User.findById(unfollowId);
        if (!userToUnfollow) {
            return res.status(404).json({
                success: false,
                message: 'User to unfollow not found'
            });
        }

        const currentUser = await User.findById(req.user.id);

        // Check if not following
        if (!currentUser.following.includes(unfollowId)) {
            return res.status(400).json({
                success: false,
                message: 'Not following this user'
            });
        }

        // Remove from following and followers
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { following: unfollowId }
        });

        await User.findByIdAndUpdate(unfollowId, {
            $pull: { followers: req.user.id }
        });

        res.json({
            success: true,
            message: 'Successfully unfollowed user'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error unfollowing user',
            error: error.message
        });
    }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only allow users to view their own profile or admins to view any profile
        if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this user'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
});

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),
    body('firstName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email is invalid'),
    body('username')
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
], validate, async (req, res) => {
    try {
        const { firstName, lastName, email, username, bio, avatar, role, isActive } = req.body;

        // Check for duplicate email if email is being updated
        if (email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Check for duplicate username if username is being updated
        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, username, bio, avatar, role, isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
});

// @desc    Get user photo
// @route   GET /api/users/:id/photo
// @access  Public
router.get('/:id/photo', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('photo');

        if (!user || !user.photo.data) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        res.set('Content-Type', user.photo.contentType);
        res.send(user.photo.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching photo',
            error: error.message
        });
    }
});

// @desc    Activate user (admin only)
// @route   PUT /api/users/:id/activate
// @access  Private/Admin
router.put('/:id/activate', protect, authorize('admin'), [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from activating themselves (they should already be active)
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot activate your own account'
            });
        }

        user.isActive = true;
        await user.save();

        res.json({
            success: true,
            message: 'User activated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error activating user',
            error: error.message
        });
    }
});

// @desc    Deactivate user (admin only)
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
router.put('/:id/deactivate', protect, authorize('admin'), [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
], validate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (user.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating user',
            error: error.message
        });
    }
});

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'firstName lastName username avatar')
            .select('followers');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.followers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching followers',
            error: error.message
        });
    }
});

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'firstName lastName username avatar')
            .select('following');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.following
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching following',
            error: error.message
        });
    }
});

module.exports = router; 