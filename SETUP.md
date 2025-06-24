# MERN Backend Setup Guide

This guide will help you set up and run the MERN backend API.

## Quick Start

### Option 1: Local Development (Recommended)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=24h
   BCRYPT_ROUNDS=12
   ```

3. **Start MongoDB** (Choose one):
   - **Local MongoDB**: Install and start MongoDB locally
   - **MongoDB Atlas**: Use a cloud MongoDB instance
   - **Docker**: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

4. **Start the Server**
   ```bash
   npm run dev
   ```

5. **Test the API**
   ```bash
   npm run test:api
   ```

### Option 2: Docker Setup (All-in-one)

1. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the services**:
   - **Backend API**: http://localhost:5000
   - **MongoDB**: localhost:27017
   - **Mongo Express**: http://localhost:8081 (admin/password)

3. **Test the API**
   ```bash
   npm run test:api
   ```

## API Testing

### Manual Testing with curl

1. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Register User**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

3. **Login**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

4. **Create Post** (requires authentication)
   ```bash
   curl -X POST http://localhost:5000/api/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "My First Post",
       "content": "This is my first blog post content.",
       "category": "technology",
       "tags": ["javascript", "nodejs"],
       "status": "draft"
     }'
   ```

### Automated Testing

Run the included test script:
```bash
npm run test:api
```

## Database Setup

### MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mern-app
   ```

### Local MongoDB

1. **Install MongoDB**:
   - **macOS**: `brew install mongodb-community`
   - **Ubuntu**: `sudo apt install mongodb`
   - **Windows**: Download from [MongoDB website](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Ubuntu
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/mern-app` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRE` | JWT token expiration | `24h` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, change the port in your `.env` file:
```env
PORT=5001
```

### MongoDB Connection Issues
1. Ensure MongoDB is running
2. Check your connection string
3. Verify network connectivity
4. Check firewall settings

### Permission Issues
If you encounter permission issues:
```bash
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

## Development Workflow

1. **Start the server in development mode**:
   ```bash
   npm run dev
   ```

2. **Make changes to your code** (server will auto-restart)

3. **Test your changes**:
   ```bash
   npm run test:api
   ```

4. **Check the logs** for any errors

## Production Deployment

1. **Set production environment variables**
2. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "mern-backend"
   ```
3. **Set up a reverse proxy** (nginx)
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

## API Documentation

See the main [README.md](README.md) for complete API documentation and endpoint details. 