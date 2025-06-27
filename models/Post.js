const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Text is required'],
        maxlength: [1000, 'Text cannot exceed 1000 characters']
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        text: {
            type: String,
            required: true,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function () {
    return this.comments.length;
});

// Virtual for like count
postSchema.virtual('likeCount').get(function () {
    return this.likes.length;
});

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema); 