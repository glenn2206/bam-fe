# BAM Testing Laboratory - Frontend

React + Vite application untuk sistem booking laboratorium pengujian material.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dan sesuaikan API URL
# VITE_API_URL=http://localhost:5000

# Start development server
npm run dev
```

Buka browser di `http://localhost:5173`

## 📦 Tech Stack

- **React 18** - UI Library
- **Vite** - Build tool & dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Context API** - State management

## 🏗️ Project Structure

```
src/
├── components/     # Reusable components
├── config/         # Configuration
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── layouts/        # Layout components
├── pages/          # Page components
├── services/       # API services
└── utils/          # Utility functions
```

Lihat [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md) untuk detail lengkap.

## 🔐 Authentication

### Login
```javascript
import { useAuth } from './contexts/AuthContext';

const { login } = useAuth();
await login(no_hp, password);
```

### Protected Routes
```jsx
<ProtectedRoute>
  <Booking />
</ProtectedRoute>
```

## 📡 API Integration

### Using Services
```javascript
import bookingService from './services/booking.service';

// Get bookings
const bookings = await bookingService.getBookings();

// Create booking
const newBooking = await bookingService.createBooking(data);
```

### Using Custom Hooks
```javascript
import { useBooking } from './hooks/useBooking';

const { bookings, loading, createBooking } = useBooking();
```

## 🎨 Styling

Menggunakan Tailwind CSS dengan custom configuration.

### Common Classes
```jsx
// Buttons
<button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
  Click Me
</button>

// Cards
<div className="bg-white rounded-xl shadow-sm p-6">
  Content
</div>

// Forms
<input className="w-full p-3 border rounded-lg focus:border-sky-500 outline-none" />
```

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 📱 Features

### ✅ Implemented
- User authentication (login/register)
- Protected routes
- Booking management (CRUD)
- Schedule viewer
- Project information
- Responsive design

### 🚧 Planned
- Booking history
- Payment integration
- PDF report generation
- Email notifications
- Real-time updates
- Dark mode

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=BAM Testing Laboratory
VITE_APP_VERSION=1.0.0
```

### API Endpoints
Configured in `src/config/api.js`:
- `/api/auth/login`
- `/api/auth/register`
- `/api/bookings`
- `/api/projects`

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use different port
npm run dev -- --port 3000
```

### API connection error
1. Check if backend is running
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in backend

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- [Architecture Guide](FRONTEND_ARCHITECTURE.md)
- [Backend Integration](BACKEND_FIX_NOTES.md)
- [Component Library](docs/components.md) (coming soon)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

---

**Maintainer**: BAM Development Team
**Last Updated**: 2024-02-11
