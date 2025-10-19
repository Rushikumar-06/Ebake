# 🎂 Ebake - MERN Stack Cake Ordering Platform

A complete, production-ready cake ordering platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). Ebake provides both user and admin portals for browsing, ordering, and managing cakes online.

## 🚀 Features

### User Portal
- **Browse Cakes**: Responsive grid layout with filtering and search
- **Authentication**: Login/Signup with Google OAuth support
- **Shopping Cart**: Add to cart with weight selection
- **Checkout**: Secure order placement with address validation (Hyderabad only)
- **Order Management**: View order history and status
- **Profile Management**: Update personal information and change password

### Admin Portal
- **Dashboard**: Overview of orders, revenue, and analytics
- **Cake Management**: Add, edit, delete, and manage cake inventory
- **Order Management**: View all orders and update status
- **User Management**: Admin profile and settings

### Technical Features
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **State Management**: Zustand for efficient state handling
- **Authentication**: JWT with HTTP-only cookies for security
- **API Integration**: Centralized Axios instance with interceptors
- **Form Validation**: React Hook Form with Yup validation
- **Notifications**: Toast notifications for all user actions
- **Error Handling**: Comprehensive error handling and loading states

## 🛠️ Tech Stack

### Frontend
- **React.js** 19+ with modern hooks
- **Vite** for fast development and building
- **TailwindCSS** for styling and responsiveness
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **React Hook Form** with Yup validation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication with HTTP-only cookies
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Helmet** and **CORS** for security
- **express-rate-limit** for API protection
- **cookie-parser** for cookie handling

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Ebake
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Update .env with your configuration
# Set MONGODB_URI, JWT_SECRET, and other required variables

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env
echo "VITE_GOOGLE_CLIENT_ID=your_google_client_id" >> .env

# Start the development server
npm run dev
```

### 4. Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ebake
JWT_SECRET=your_very_strong_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🗂️ Project Structure

```
Ebake/
├── backend/
│   ├── models/          # MongoDB models (User, Cake, Order)
│   ├── routes/          # API routes (auth, cakes, orders, admin)
│   ├── middleware/      # Authentication, validation, error handling
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components (user & admin)
│   │   ├── stores/      # Zustand state management
│   │   ├── lib/         # API configuration
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## 🔐 Authentication

- **JWT-based** authentication with HTTP-only cookies
- **Google OAuth** integration ready
- **Protected routes** for authenticated users
- **Admin roles** with separate admin portal
- **Password hashing** with bcryptjs

## 🛒 Key Features Implementation

### User Experience
- **Responsive Design**: Works seamlessly on all devices
- **Real-time Updates**: Immediate feedback on all actions
- **Search & Filter**: Backend-powered cake search and filtering
- **Order Tracking**: Complete order history and status tracking
- **Address Validation**: Hyderabad-only delivery validation

### Admin Experience
- **Dashboard Analytics**: Order statistics and revenue tracking
- **Inventory Management**: Complete CRUD operations for cakes
- **Order Management**: Status updates and order tracking
- **User Management**: Admin profile and settings

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables on your hosting platform
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages
3. Update API URL in environment variables

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

### Code Quality
- ESLint configuration for both frontend and backend
- Consistent code formatting
- Component-based architecture
- RESTful API design

## 📄 API Documentation

The API follows RESTful conventions:

- **GET** `/api/cakes` - Retrieve cakes with filtering
- **POST** `/api/orders` - Create new order
- **PUT** `/api/auth/profile` - Update user profile
- And many more endpoints documented in backend/README.md

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For support, email info@ebake.in or create an issue in the repository.

---

**Built with ❤️ for cake lovers everywhere! 🎂**
