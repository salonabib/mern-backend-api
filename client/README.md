# MERN Stack React Client

A modern React frontend for the MERN stack application, built with Material-UI and React Router.

## Features

### 🔐 Authentication
- User registration and login
- JWT token-based authentication
- Protected routes
- Role-based access control (Admin/User)

### 👤 User Management
- User profile viewing and editing
- Admin user management interface
- User search and filtering
- Pagination for user lists

### 🎨 Modern UI
- Material-UI components
- Responsive design
- Dark/light theme support
- Loading states and error handling

### 🛡️ Security
- Form validation
- Input sanitization
- Secure API communication
- Token expiration handling

## Tech Stack

- **React 18** - Frontend framework
- **React Router 6** - Client-side routing
- **Material-UI 5** - UI component library
- **Axios** - HTTP client
- **JWT Decode** - Token handling

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── Login.js
│   │   └── Register.js
│   ├── common/         # Reusable components
│   │   └── LoadingSpinner.js
│   ├── layout/         # Layout components
│   │   └── Navbar.js
│   ├── pages/          # Page components
│   │   └── Home.js
│   └── user/           # User management components
│       ├── EditProfile.js
│       ├── Profile.js
│       ├── UserDetail.js
│       └── UserList.js
├── contexts/           # React contexts
│   └── AuthContext.js
├── App.js             # Main app component
└── index.js           # App entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## API Integration

The client communicates with the backend API through the `AuthContext`. Key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Authentication Flow

1. **Registration**: Users can create accounts with email, password, and personal info
2. **Login**: Users authenticate with email and password
3. **Token Storage**: JWT tokens are stored in localStorage
4. **Protected Routes**: Routes are protected based on authentication status
5. **Role-based Access**: Admin routes require admin privileges

## Component Features

### AuthContext
- Manages authentication state
- Handles API requests with token authentication
- Provides login, register, logout functions
- Auto-handles token expiration

### Protected Routes
- `ProtectedRoute` - Requires authentication
- `AdminRoute` - Requires admin role
- Automatic redirect to login for unauthorized access

### Form Validation
- Client-side validation for all forms
- Real-time error feedback
- Server error handling and display

## Styling

The app uses Material-UI's theming system with:
- Custom color palette
- Responsive breakpoints
- Consistent spacing and typography
- Icon integration

## Error Handling

- Network error handling
- Form validation errors
- Server error messages
- Loading states for better UX

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include loading states
4. Test on different screen sizes
5. Update documentation as needed

## License

MIT License - see the main project LICENSE file for details.
