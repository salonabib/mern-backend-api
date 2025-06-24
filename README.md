# MERN Stack Backend API

A robust and scalable backend API built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication, blog post management, and comprehensive CRUD operations.

## Features

- 🔐 **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password encryption with bcrypt
  - User registration and login

- 📝 **Blog Post Management**
  - Create, read, update, delete posts
  - Post categories and tags
  - Draft/Published status management
  - Like/unlike functionality
  - Comment system

- 👥 **User Management**
  - User profiles with avatars and bios
  - Admin user management
  - User statistics and analytics

- 🛡️ **Security Features**
  - Input validation with express-validator
  - CORS protection
  - Helmet.js security headers
  - Rate limiting ready
  - Error handling middleware

- 📊 **Advanced Features**
  - Pagination support
  - Search functionality
  - Filtering by categories, authors, status
  - View count tracking
  - Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors
- **Logging**: morgan
- **Compression**: compression

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=24h
   BCRYPT_ROUNDS=12
   ```

4. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/password` | Change password | Private |

### User Management Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin |
| GET | `/api/users/:id` | Get single user | Private |
| PUT | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/stats/overview` | User statistics | Admin |

### Post Management Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/posts` | Get all posts | Public |
| GET | `/api/posts/:id` | Get single post | Public |
| POST | `/api/posts` | Create new post | Private |
| PUT | `/api/posts/:id` | Update post | Private |
| DELETE | `/api/posts/:id` | Delete post | Private |
| PUT | `/api/posts/:id/like` | Like/unlike post | Private |
| POST | `/api/posts/:id/comments` | Add comment | Private |
| GET | `/api/posts/stats/overview` | Post statistics | Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | Server health check | Public |

## Request/Response Examples

### User Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Create Post
```bash
POST /api/posts
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My First Blog Post",
  "content": "This is the content of my blog post...",
  "category": "technology",
  "tags": ["javascript", "nodejs"],
  "status": "draft"
}
```

### Get Posts with Pagination
```bash
GET /api/posts?page=1&limit=10&category=technology&search=javascript
```

## Database Models

### User Schema
- `username` (String, unique, required)
- `email` (String, unique, required)
- `password` (String, required, encrypted)
- `firstName` (String, required)
- `lastName` (String, required)
- `avatar` (String, optional)
- `bio` (String, optional)
- `role` (String, enum: ['user', 'admin'], default: 'user')
- `isActive` (Boolean, default: true)
- `timestamps` (createdAt, updatedAt)

### Post Schema
- `title` (String, required)
- `content` (String, required)
- `author` (ObjectId, ref: User, required)
- `slug` (String, unique, auto-generated)
- `excerpt` (String, auto-generated)
- `category` (String, enum, required)
- `tags` (Array of Strings)
- `status` (String, enum: ['draft', 'published', 'archived'])
- `featuredImage` (String, optional)
- `viewCount` (Number, default: 0)
- `likes` (Array of ObjectIds, ref: User)
- `comments` (Array of comment objects)
- `timestamps` (createdAt, updatedAt)

## Middleware

- **Authentication**: JWT token verification
- **Authorization**: Role-based access control
- **Validation**: Request data validation
- **Error Handling**: Centralized error management
- **Security**: CORS, Helmet, compression

## Error Handling

The API uses a centralized error handling system that:
- Catches and formats all errors consistently
- Provides meaningful error messages
- Includes stack traces in development mode
- Handles Mongoose validation errors
- Manages JWT authentication errors

## Security Features

- **Password Encryption**: bcryptjs with configurable rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Helmet.js for HTTP headers
- **Rate Limiting**: Ready for implementation

## Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests (when implemented)

### Environment Variables
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRE`: JWT token expiration time
- `BCRYPT_ROUNDS`: Password hashing rounds

## Deployment

1. Set environment variables for production
2. Ensure MongoDB is accessible
3. Use a process manager like PM2
4. Set up reverse proxy (nginx)
5. Configure SSL certificates
6. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 