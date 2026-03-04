# Frontend Architecture - BAM Testing Laboratory

## 📁 Struktur Folder

```
src/
├── components/          # Reusable UI components
│   ├── AuthPopup.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── PublicRoute.jsx
│   ├── PilihJadwal.jsx
│   └── SmartSelect.jsx
│
├── config/             # Configuration files
│   ├── api.js         # API endpoints & base URL
│   └── constants.js   # App constants & master data
│
├── contexts/          # React Context providers
│   └── AuthContext.jsx # Authentication state management
│
├── hooks/             # Custom React hooks
│   ├── useBooking.js  # Booking operations
│   └── useProject.js  # Project operations
│
├── layouts/           # Layout components
│   └── MainLayout.jsx # Main app layout with navbar
│
├── pages/             # Page components (routes)
│   ├── Booking.jsx
│   ├── Jadwal.jsx
│   └── Profile.jsx
│
├── services/          # API service layer
│   ├── api.service.js      # Base API service
│   ├── auth.service.js     # Auth API calls
│   ├── booking.service.js  # Booking API calls
│   └── project.service.js  # Project API calls
│
├── utils/             # Utility functions
│   ├── date.utils.js       # Date formatting & manipulation
│   ├── format.utils.js     # Number, currency, text formatting
│   └── validation.utils.js # Form validation
│
├── App.jsx            # Root component (deprecated - use main.jsx)
├── main.jsx           # App entry point
└── index.css          # Global styles
```

## 🏗️ Architecture Layers

### 1. Presentation Layer (Components & Pages)
- **Components**: Reusable UI elements
- **Pages**: Route-specific views
- **Layouts**: Page structure templates

### 2. Business Logic Layer (Hooks & Contexts)
- **Hooks**: Encapsulate business logic and state
- **Contexts**: Global state management

### 3. Data Layer (Services)
- **Services**: API communication
- **Utils**: Helper functions

### 4. Configuration Layer
- **Config**: App-wide settings
- **Constants**: Static data

## 🔐 Authentication Flow

```
User Login
    ↓
AuthService.login()
    ↓
API Request to /api/auth/login
    ↓
Receive Token & User Data
    ↓
AuthContext.login()
    ↓
Store in localStorage
    ↓
Update Context State
    ↓
Redirect to /booking
```

## 🛡️ Route Protection

### Protected Routes
Routes that require authentication:
- `/booking` - Booking management
- `/jadwal` - Schedule view

**Implementation:**
```jsx
<ProtectedRoute>
  <Booking />
</ProtectedRoute>
```

### Public Routes
Routes accessible without authentication:
- `/profile` - Company profile (public info)

## 📡 API Service Layer

### Base Service (`api.service.js`)
Handles all HTTP requests with:
- Automatic token injection
- Error handling
- Response parsing
- 401 redirect (token expired)

### Specific Services
- `auth.service.js` - Login, Register, Logout
- `booking.service.js` - CRUD operations for bookings
- `project.service.js` - Project data management

**Usage Example:**
```javascript
import bookingService from '../services/booking.service';

// In component
const bookings = await bookingService.getBookings();
```

## 🎣 Custom Hooks

### useBooking
Manages booking state and operations:
```javascript
const {
  bookings,
  loading,
  error,
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookedSlots
} = useBooking();
```

### useProject
Manages project data:
```javascript
const {
  project,
  loading,
  error,
  fetchProject,
  syncProject,
  updateProjectLocal
} = useProject();
```

### useAuth (from Context)
Manages authentication:
```javascript
const {
  user,
  token,
  loading,
  login,
  register,
  logout,
  isAuthenticated
} = useAuth();
```

## 🔧 Utility Functions

### Date Utils
```javascript
import { formatDateKey, formatTimeFromSlot, getTimeRange } from '../utils/date.utils';

const dateKey = formatDateKey(new Date()); // "2024-02-11"
const time = formatTimeFromSlot(10); // "10:30"
const range = getTimeRange([10, 11, 12]); // "10:30 - 11:15"
```

### Format Utils
```javascript
import { formatCurrency, formatPhoneNumber } from '../utils/format.utils';

const price = formatCurrency(150000); // "Rp 150.000"
const phone = formatPhoneNumber("081234567890"); // "0812-3456-7890"
```

### Validation Utils
```javascript
import { validatePhoneNumber, validateBookingData } from '../utils/validation.utils';

const isValid = validatePhoneNumber("081234567890"); // true
const { isValid, errors } = validateBookingData(bookingData);
```

## 🎨 Component Patterns

### 1. Container/Presentational Pattern
```jsx
// Container (with logic)
const BookingContainer = () => {
  const { bookings, loading } = useBooking();
  
  if (loading) return <LoadingSpinner />;
  
  return <BookingList bookings={bookings} />;
};

// Presentational (UI only)
const BookingList = ({ bookings }) => (
  <div>
    {bookings.map(booking => (
      <BookingCard key={booking.id} booking={booking} />
    ))}
  </div>
);
```

### 2. Custom Hook Pattern
```jsx
// Extract logic to custom hook
const useBookingForm = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const validate = () => {
    // validation logic
  };
  
  const handleSubmit = async () => {
    // submit logic
  };
  
  return { formData, errors, validate, handleSubmit };
};

// Use in component
const BookingForm = () => {
  const { formData, errors, handleSubmit } = useBookingForm();
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

## 🔄 State Management

### Local State (useState)
For component-specific state:
```jsx
const [isOpen, setIsOpen] = useState(false);
```

### Context State (useContext)
For global state (auth, theme, etc.):
```jsx
const { user, logout } = useAuth();
```

### Server State (Custom Hooks)
For data from API:
```jsx
const { bookings, loading, error } = useBooking();
```

## 📦 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Custom Hook / Service
    ↓
API Service
    ↓
Backend API
    ↓
Response
    ↓
Update State
    ↓
Re-render Component
```

## 🚀 Best Practices

### 1. Component Organization
- One component per file
- Named exports for utilities, default for components
- Keep components small and focused

### 2. State Management
- Use local state when possible
- Lift state up only when needed
- Use context for truly global state

### 3. API Calls
- Always use service layer
- Handle errors gracefully
- Show loading states

### 4. Error Handling
```jsx
try {
  const data = await bookingService.createBooking(formData);
  // Success handling
} catch (error) {
  // Error handling
  setError(error.message);
}
```

### 5. Loading States
```jsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

## 🔐 Security Best Practices

1. **Token Storage**: Store in localStorage (consider httpOnly cookies for production)
2. **Auto Logout**: Redirect on 401 responses
3. **Input Validation**: Validate on client AND server
4. **XSS Prevention**: React escapes by default, but be careful with dangerouslySetInnerHTML

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

## 🧪 Testing Strategy (Future)

### Unit Tests
- Utils functions
- Custom hooks
- Service layer

### Integration Tests
- Component interactions
- API calls with mocked responses

### E2E Tests
- Critical user flows
- Authentication
- Booking creation

## 📝 Code Style

### Naming Conventions
- **Components**: PascalCase (`BookingCard.jsx`)
- **Hooks**: camelCase with `use` prefix (`useBooking.js`)
- **Utils**: camelCase (`date.utils.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### File Structure
```jsx
// 1. Imports
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// 2. Component
const MyComponent = () => {
  // 3. Hooks
  const { user } = useAuth();
  
  // 4. State
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {}, []);
  
  // 6. Handlers
  const handleClick = () => {};
  
  // 7. Render
  return <div>...</div>;
};

// 8. Export
export default MyComponent;
```

## 🔄 Migration from Old Structure

### Before (Old)
```
src/
├── helper/
│   └── authContext.jsx
├── App.jsx (with routing)
└── main.jsx (simple)
```

### After (New)
```
src/
├── contexts/
│   └── AuthContext.jsx
├── layouts/
│   └── MainLayout.jsx
├── services/
├── hooks/
├── utils/
└── main.jsx (with routing)
```

### Migration Steps
1. ✅ Move `helper/authContext.jsx` → `contexts/AuthContext.jsx`
2. ✅ Create service layer
3. ✅ Create custom hooks
4. ✅ Add route protection
5. ✅ Update imports in all files
6. ✅ Add utils functions
7. ✅ Create layouts

## 📚 Resources

- [React Documentation](https://react.dev)
- [React Router](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

---

**Status**: ✅ Production Ready
**Version**: 2.0.0 (Refactored)
**Last Updated**: 2024-02-11
