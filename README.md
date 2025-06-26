# MERN Stack Full-Stack Application

A complete MERN (MongoDB, Express, React, Node.js) stack web application with user authentication, profile management, and admin features.

## 🚀 Features

### Backend (Node.js/Express)
- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: CRUD operations for users with role-based access control
- **API Security**: Input validation, CORS, Helmet security headers
- **Database**: MongoDB with Mongoose ODM
- **Error Handling**: Comprehensive error handling and validation

### Frontend (React)
- **Modern UI**: Material-UI components with responsive design
- **Authentication**: Login/Register forms with validation
- **User Profiles**: View and edit user profiles
- **Admin Panel**: User management interface for administrators
- **Protected Routes**: Role-based route protection
- **State Management**: React Context for authentication state

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - Frontend framework
- **React Router 6** - Client-side routing
- **Material-UI 5** - UI component library
- **Axios** - HTTP client
- **JWT Decode** - Token handling

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── public/
│   │   ├── components/
│   │   │   ├── auth/      # Authentication components
│   │   │   │   ├── Register.js
│   │   │   │   ├── Login.js
│   │   │   │   └── ResetPassword.js
│   │   │   │   └── common/    # Reusable components
│   │   │   │   └── layout/    # Layout components
│   │   │   │   └── pages/     # Page components
│   │   │   │   └── user/      # User management components
│   │   │   ├── contexts/      # React contexts
│   │   │   ├── App.js
│   │   │   └── index.js
│   │   ├── package.json
│   │   └── README.md
├── config/                 # Database configuration
├── middleware/             # Express middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── utils/                  # Utility functions
├── server.js              # Express server
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-stack-app
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**

   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mern-app
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   npm run dev
   ```

7. **Start the frontend development server**
   ```bash
   cd client
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Users (Admin Only)
- `GET /api/users` - Get all users (with pagination and search)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - Server health check

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Registration**: Users create accounts with email, password, and personal info
2. **Login**: Users authenticate with email and password
3. **Token Storage**: JWT tokens are stored in localStorage
4. **Protected Routes**: Routes are protected based on authentication status
5. **Role-based Access**: Admin routes require admin privileges

## 👥 User Roles

- **User**: Can view and edit their own profile
- **Admin**: Can manage all users, view user lists, and perform admin actions

## 🎨 Frontend Features

### Components
- **AuthContext**: Manages authentication state and API calls
- **Protected Routes**: Route protection based on authentication and roles
- **Form Validation**: Client-side and server-side validation
- **Loading States**: User-friendly loading indicators
- **Error Handling**: Comprehensive error display and handling

### Pages
- **Home**: Welcome page with different content for authenticated/non-authenticated users
- **Login/Register**: Authentication forms with validation
- **Profile**: User profile display and management
- **User Management**: Admin interface for managing users

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Role-based access control
- Token expiration handling

## 🧪 Testing

### Backend Testing
```bash
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build the application
3. Deploy to your preferred hosting service (Heroku, Vercel, etc.)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in each directory
- Review the API endpoints
- Check the console for error messages

## 🔄 Updates

Stay updated with the latest changes by checking the commit history and release notes. 

For support and questions, please open an issue in the repository. 