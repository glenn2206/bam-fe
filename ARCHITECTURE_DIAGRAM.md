# Frontend Architecture Diagram

## 📐 Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                        (Components)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Booking.jsx  │  │ Jadwal.jsx   │  │ Profile.jsx  │     │
│  │              │  │              │  │              │     │
│  │ - UI Logic   │  │ - UI Logic   │  │ - UI Logic   │     │
│  │ - User Input │  │ - Display    │  │ - Forms      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│                      (Custom Hooks)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              useBooking() Hook                        │  │
│  │                                                       │  │
│  │  - fetchUnits()          - getBookedSchedules()     │  │
│  │  - saveUnits()           - getBookedSlots()         │  │
│  │  - fetchBookings()       - createBooking()          │  │
│  │  - updateBooking()       - deleteBooking()          │  │
│  │                                                       │  │
│  │  State: loading, error, bookings                     │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │              useProject() Hook                        │  │
│  │                                                       │  │
│  │  - fetchProject()        - syncProject()             │  │
│  │                                                       │  │
│  │  State: project, loading, error                      │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│                    (API Services)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           booking.service.js                          │  │
│  │                                                       │  │
│  │  - getUnits()            - getBookedSchedules()      │  │
│  │  - syncUnits()           - getBookedSlots()          │  │
│  │  - getBookings()         - createBooking()           │  │
│  │  - updateBooking()       - deleteBooking()           │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │           project.service.js                          │  │
│  │                                                       │  │
│  │  - getMyProject()        - syncProject()             │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │           auth.service.js                             │  │
│  │                                                       │  │
│  │  - login()               - register()                │  │
│  │  - logout()              - getCurrentUser()          │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      API CLIENT LAYER                        │
│                   (HTTP Client)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              api.service.js                           │  │
│  │                                                       │  │
│  │  - get(url, requireAuth)                             │  │
│  │  - post(url, data, requireAuth)                      │  │
│  │  - put(url, data, requireAuth)                       │  │
│  │  - delete(url, requireAuth)                          │  │
│  │                                                       │  │
│  │  Features:                                            │  │
│  │  - Auto token injection                              │  │
│  │  - Error handling                                    │  │
│  │  - Response parsing                                  │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              config/api.js                            │  │
│  │                                                       │  │
│  │  - API_BASE_URL                                      │  │
│  │  - API_ENDPOINTS                                     │  │
│  │  - HTTP_STATUS                                       │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │              config/constants.js                      │  │
│  │                                                       │  │
│  │  - APP_NAME, VERSION                                 │  │
│  │  - STORAGE_KEYS                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
                   Backend API Server
                 (http://localhost:5000)
```

---

## 🔄 Data Flow Example: Save Booking

```
User Types in Form (Booking.jsx)
         ↓
State Update: setUnits([...])
         ↓
useEffect Detects Change
         ↓
Debounce Timer (10 seconds)
         ↓
Call: saveUnits(units) from useBooking hook
         ↓
Hook calls: bookingService.syncUnits(units)
         ↓
Service calls: apiService.post('/api/booking/sync', { units })
         ↓
API Service adds token & sends request
         ↓
Backend receives & processes
         ↓
Response returns to API Service
         ↓
Service returns data to Hook
         ↓
Hook updates state: setLoading(false)
         ↓
Component shows: "SAVED" status
```

---

## 🔄 Data Flow Example: Load Booking

```
User Logs In
         ↓
AuthContext updates: setUser(userData)
         ↓
useEffect in Booking.jsx detects user change
         ↓
Call: fetchUnits() from useBooking hook
         ↓
Hook calls: bookingService.getUnits()
         ↓
Service calls: apiService.get('/api/booking')
         ↓
API Service adds token & sends request
         ↓
Backend queries database
         ↓
Response returns to API Service
         ↓
Service returns data to Hook
         ↓
Hook returns data to Component
         ↓
Component: isFromFetch.current = true
         ↓
Component: setUnits(data)
         ↓
useEffect detects units change
         ↓
Check: isFromFetch.current === true
         ↓
Skip auto-save (data from fetch, not user input)
         ↓
Display data in form
```

---

## 📦 File Structure

```
src/
├── components/
│   ├── AuthPopup.jsx
│   ├── AuthStatus.jsx
│   ├── Navbar.jsx
│   ├── PilihJadwal.jsx
│   ├── ProtectedRoute.jsx
│   ├── PublicRoute.jsx
│   └── SmartSelect.jsx
│
├── config/
│   ├── api.js              ← API endpoints & base URL
│   └── constants.js        ← App constants
│
├── contexts/
│   └── AuthContext.jsx     ← Auth state management
│
├── hooks/
│   ├── index.js
│   ├── useBooking.js       ← Booking operations hook
│   └── useProject.js       ← Project operations hook
│
├── layouts/
│   └── MainLayout.jsx      ← Main app layout
│
├── pages/
│   ├── Booking.jsx         ← Booking form page
│   ├── Jadwal.jsx          ← Schedule monitoring page
│   └── Profile.jsx         ← User profile page
│
├── services/
│   ├── index.js
│   ├── api.service.js      ← HTTP client (base)
│   ├── auth.service.js     ← Auth API calls
│   ├── booking.service.js  ← Booking API calls
│   └── project.service.js  ← Project API calls
│
├── utils/
│   ├── index.js
│   ├── date.utils.js       ← Date formatting
│   ├── format.utils.js     ← Data formatting
│   └── validation.utils.js ← Input validation
│
├── helper/
│   └── index.js            ← Legacy helpers (db)
│
├── App.jsx
└── main.jsx
```

---

## 🎯 Key Principles

### 1. Single Responsibility
- Each layer has one clear purpose
- Components: UI only
- Hooks: Business logic & state
- Services: API communication
- Utils: Pure functions

### 2. Dependency Injection
- Components depend on hooks
- Hooks depend on services
- Services depend on API client
- Easy to mock for testing

### 3. Separation of Concerns
- UI logic separated from business logic
- Business logic separated from API calls
- Configuration separated from implementation

### 4. Reusability
- Hooks can be used in multiple components
- Services can be called from multiple hooks
- Utils can be used anywhere

### 5. Testability
- Each layer can be tested independently
- Mock dependencies easily
- Clear interfaces between layers

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
└─────────────────────────────────────────────────────────────┘

User enters credentials
         ↓
AuthPopup.jsx
         ↓
authService.login(credentials)
         ↓
apiService.post('/api/auth/login', credentials)
         ↓
Backend validates & returns token
         ↓
authService stores token in localStorage
         ↓
AuthContext updates: setUser(userData)
         ↓
All components re-render with user context
         ↓
Protected routes become accessible
         ↓
API calls automatically include token
```

---

## 🛡️ Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Flow                       │
└─────────────────────────────────────────────────────────────┘

API call fails
         ↓
api.service.js catches error
         ↓
Check error type:
  - 401: Token expired → logout user
  - 403: Forbidden → show error
  - 404: Not found → show error
  - 500: Server error → show error
         ↓
Throw formatted error
         ↓
Service layer catches & logs
         ↓
Hook catches & updates error state
         ↓
Component displays error to user
```

---

**Last Updated:** 2024-02-11
