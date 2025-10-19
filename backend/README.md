# Ebake Backend

The backend API for the Ebake cake ordering platform built with Node.js, Express.js, and MongoDB.

## Features

- **Express.js** server with modern middleware
- **MongoDB** with Mongoose for data persistence
- **JWT Authentication** with HTTP-only cookies
- **Google OAuth** integration
- **RESTful API** design
- **Input validation** with express-validator
- **Error handling** middleware
- **Security** with Helmet and CORS
- **Rate limiting** for API protection

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Update environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ebake
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Cakes
- `GET /api/cakes` - Get all cakes (with filters)
- `GET /api/cakes/:id` - Get single cake
- `POST /api/cakes` - Add cake (Admin)
- `PUT /api/cakes/:id` - Update cake (Admin)
- `DELETE /api/cakes/:id` - Delete cake (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PATCH /api/orders/:id/status` - Update order status (Admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/profile` - Admin profile
- `PUT /api/admin/profile` - Update admin profile

## Database Models

### User
- name, email, password, googleId, phone, address, role, isActive

### Cake
- name, flavor, price, description, weightOptions, imageUrl, category, rating

### Order
- userId, items, totalAmount, customerInfo, deliveryAddress, status

## Security Features

- Password hashing with bcrypt
- JWT tokens in HTTP-only cookies
- Input validation and sanitization
- Rate limiting on all routes
- CORS protection
- Helmet security headers
