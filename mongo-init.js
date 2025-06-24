// MongoDB initialization script
db = db.getSiblingDB('mern-app');

// Create collections
db.createCollection('users');
db.createCollection('posts');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.posts.createIndex({ "slug": 1 }, { unique: true });
db.posts.createIndex({ "author": 1 });
db.posts.createIndex({ "status": 1 });
db.posts.createIndex({ "category": 1 });
db.posts.createIndex({ "tags": 1 });

// Create admin user
db.users.insertOne({
    username: "admin",
    email: "admin@example.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8e", // password: admin123
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create sample posts
db.posts.insertMany([
    {
        title: "Welcome to Our Blog",
        content: "This is the first blog post on our platform. We're excited to share our thoughts and experiences with you.",
        author: db.users.findOne({ username: "admin" })._id,
        slug: "welcome-to-our-blog",
        excerpt: "This is the first blog post on our platform...",
        category: "technology",
        tags: ["welcome", "introduction"],
        status: "published",
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        likes: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        title: "Getting Started with MERN Stack",
        content: "The MERN stack is a popular choice for building full-stack web applications. It consists of MongoDB, Express.js, React, and Node.js. In this post, we'll explore the basics of setting up a MERN stack application.",
        author: db.users.findOne({ username: "admin" })._id,
        slug: "getting-started-with-mern-stack",
        excerpt: "The MERN stack is a popular choice for building full-stack web applications...",
        category: "technology",
        tags: ["mern", "javascript", "mongodb", "express", "react", "nodejs"],
        status: "published",
        isPublished: true,
        publishedAt: new Date(),
        viewCount: 0,
        likes: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

print("Database initialized successfully!");
print("Admin user created: admin@example.com / admin123");
print("Sample posts created"); 