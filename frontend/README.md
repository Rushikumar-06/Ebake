# Ebake Frontend

The frontend for the Ebake cake ordering platform built with React, Vite, TailwindCSS, and Zustand.

## Features

- **Modern React App** with Vite for fast development
- **TailwindCSS** for responsive, modern UI design
- **Zustand** for state management
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Protected Routes** for authentication
- **Google OAuth** integration ready

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note:** To enable Google OAuth, you need to:
1. Create a Google OAuth application in [Google Cloud Console](https://console.cloud.google.com/)
2. Add your domain to authorized origins
3. Copy the Client ID to the `VITE_GOOGLE_CLIENT_ID` environment variable

4. Start development server:
```bash
npm run dev
```

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components (user and admin)
- `src/stores/` - Zustand state management
- `src/lib/` - API configuration and utilities
- `src/pages/user/` - User portal pages
- `src/pages/admin/` - Admin portal pages
