# 💰 Smart Budget & Health Habit Tracker

A comprehensive personal finance and habit tracking platform designed for young adults and students. It correlates daily financial expenditure with lifestyle habits (nutrition/calories) and provides predictive simulations for long-term savings and habit optimization.

## 📋 Project Structure

```
Project/
├── backend/          # Express.js REST API with Prisma ORM
│   ├── prisma/       # Database schema and seed script
│   └── src/          # Application source code
│       ├── controllers/  # Business logic
│       ├── middlewares/  # Auth & validation
│       ├── routes/       # API route definitions
│       └── lib/          # Prisma client
└── frontend/         # React + Vite + Tailwind CSS
    └── src/
        ├── components/   # Reusable UI components
        ├── pages/        # Page components
        ├── context/      # React context (Auth)
        ├── api/          # Axios API client
        └── utils/        # Helper functions
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

### 1. Setup the Database

```bash
# Start your PostgreSQL server, then create the database
psql -U postgres -c "CREATE DATABASE smart_budget;"
```

### 2. Setup the Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your database credentials
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smart_budget"

# Generate Prisma client and create database tables
npx prisma generate
npx prisma db push

# (Optional) Seed the database with a demo user and sample data
npm run seed

# Start the backend server
npm run dev
```

The server will run at `http://localhost:5000`.

### 3. Setup the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 4. Open the Application

Navigate to `http://localhost:5173` in your browser.

**Demo Credentials** (if seeded):
- Email: `demo@example.com`
- Password: `demo1234`

Or register a new account to get started.

## 🔧 Technology Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide Icons** for UI icons
- **Axios** for API calls with automatic JWT refresh
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **Prisma ORM** with PostgreSQL
- **JWT** authentication with refresh tokens
- **Bcrypt** for password hashing
- **express-validator** for input validation

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Transactions (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (filterable, paginated) |
| GET | `/api/transactions/:id` | Get transaction by ID |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

### Habits (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | List habit logs (filterable, paginated) |
| GET | `/api/habits/:id` | Get habit log by ID |
| POST | `/api/habits` | Create a habit log |
| PUT | `/api/habits/:id` | Update a habit log |
| DELETE | `/api/habits/:id` | Delete a habit log |

### Analytics (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Dashboard summary metrics |
| GET | `/api/analytics/categories` | Category spending breakdown |
| GET | `/api/analytics/trends?days=30` | Daily expense vs calorie trends |

### Simulator (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simulator` | Run savings projection with cutbacks |

### Users (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/categories` | List user categories |
| POST | `/api/users/categories` | Create a category |
| DELETE | `/api/users/categories/:id` | Delete a category |

## 🌟 Features

### Dashboard Overview
- **Summary Cards**: Remaining budget with color-coded progress bar, total monthly expenses, average daily spend, and average daily calories
- **Interactive Charts**: Donut chart for category distribution and dual-axis bar chart linking expenses vs calories
- **Recent Activity**: Quick-view of recent transactions with edit/delete actions

### Quick Log
- **Dual tabs** for logging financial entries (expense/income) and habit/calorie entries
- Quick access from any page

### Smart Budget Simulator
- **Interactive sliders** for habit reduction (e.g., "Reduce fast food spending by X%")
- **Real-time projections** for 3, 6, and 12 months
- **Visual comparison charts** showing current vs. optimized spending

### Transactions & Reports
- **Fully filterable data grid** with search, category filtering, and date ranges
- **Inline edit and delete** capabilities
- **Pagination** support
- **CSV export** functionality

### Habit Tracking
- Track calories, water intake, steps, and sleep
- Filter and paginate habit logs
- Edit/delete log entries

### Settings
- Update monthly budget and calorie goals
- Change currency preference
- Manage custom categories

## 🔐 Authentication Flow

1. User registers or logs in to receive JWT access and refresh tokens
2. Access tokens are stored in localStorage
3. Axios interceptor automatically attaches the token to requests
4. When access token expires, the interceptor automatically refreshes using the refresh token
5. Passwords are securely hashed using Bcrypt (10 salt rounds)

## 📊 Database Schema

```sql
-- Users table
users (
  id VARCHAR (PK),
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  created_at TIMESTAMP,
  monthly_budget FLOAT,
  calorie_goal INTEGER,
  currency VARCHAR
)

-- Transactions table
transactions (
  id VARCHAR (PK),
  user_id VARCHAR (FK → users),
  amount FLOAT,
  category VARCHAR,
  type VARCHAR ('expense'|'income'),
  timestamp TIMESTAMP,
  note VARCHAR
)

-- Habits table
habits (
  id VARCHAR (PK),
  user_id VARCHAR (FK → users),
  metric_name VARCHAR,
  value FLOAT,
  timestamp TIMESTAMP,
  note VARCHAR
)

-- Categories table
categories (
  id VARCHAR (PK),
  name VARCHAR,
  type VARCHAR,
  user_id VARCHAR (FK → users)
)
```

## 🛠️ Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smart_budget"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Support

For issues or questions, please open an issue in the repository.