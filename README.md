# Zillionaire Network Marketing API

A modern REST API built with Node.js and Express for the Zillionaire Network Marketing platform.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory (use .env.example as template)
4. Configure your environment variables in the `.env` file

## Development

To start the development server:

```bash
npm run dev
```

The server will start on http://localhost:3000 (or the port specified in your .env file)

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Sequelize models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── server.js       # Application entry point
```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Available Endpoints

#### Authentication
- POST /auth/register - Register new user
- POST /auth/login - User login
- POST /auth/forgot-password - Request password reset
- GET /auth/profile - Get user profile
- PUT /auth/profile - Update user profile

#### Network Management
- GET /network/referrals - Get direct referrals
- GET /network/children - Get direct children in binary tree
- GET /network/binary-tree - Get complete binary tree structure
- GET /network/genealogy - Get upline/genealogy
- GET /network/stats - Get network statistics

#### Package Management
- GET /packages - Get all packages
- GET /packages/user - Get user's packages
- POST /packages/purchase - Purchase a package
- POST /packages/upgrade - Upgrade existing package
- GET /packages/upgrade-history - Get package upgrade history

#### Financial Operations
- GET /finance/commissions - Get commission history
- GET /finance/withdrawals - Get withdrawal history
- POST /finance/withdrawals - Request withdrawal
- PUT /finance/withdrawals/:id - Process withdrawal (Admin)

#### Payment Management
- POST /payment/process - Process package payment
- GET /payment/history - Get payment history

#### Withdrawals
- POST /withdrawals/request - Request withdrawal
- GET /withdrawals/history - Get withdrawal history
- POST /withdrawals/:id/cancel - Cancel withdrawal request
- GET /withdrawals/all - Get all withdrawals (Admin)
- PUT /withdrawals/:id/process - Process withdrawal request (Admin)

#### Announcements
- GET /announcements - Get all announcements
- GET /announcements/active - Get active announcements
- POST /announcements - Create announcement (Admin)
- PUT /announcements/:id - Update announcement (Admin)
- DELETE /announcements/:id - Delete announcement (Admin)

#### Notifications
- GET /notifications - Get user notifications
- GET /notifications/unread-count - Get unread notification count
- PUT /notifications/mark-read - Mark notifications as read
- DELETE /notifications - Delete notifications

#### Reports
- GET /reports/network - Generate network report
- GET /reports/earnings - Generate earnings report
- GET /reports/package - Generate package report
- GET /reports/history - Get report history
- GET /reports/global-stats - Generate global statistics (Admin)

#### Admin Management
- GET /admin/users - Get all users
- PATCH /admin/users/:id/status - Update user status
- POST /admin/packages - Create package
- PUT /admin/packages/:id - Update package
- DELETE /admin/packages/:id - Delete package
- PATCH /admin/withdrawals/:id - Process withdrawal
- GET /admin/statistics - Get system statistics

## Data Models

### User
- Basic Info: username, email, password, firstName, lastName, phone, country
- Status: active, role (USER/ADMIN)
- Security: resetPasswordToken, resetPasswordExpires
- Relationships: node (MLM position)

### Node (MLM Position)
- Structure: position (LEFT/RIGHT), level, placementId, sponsorId
- Financial: balance, earnings, totalReferrals
- Status: pending/active/inactive/suspended
- Tracking: isSpillover, activatedAt

### Package
- Details: name, price, description, benefits
- Configuration: level, max_daily_earnings
- Bonuses: binary_bonus_percentage, referral_bonus_percentage
- Status: active/inactive

### Commission
- Details: amount, type (DIRECT/MATCHING/LEVEL)
- Status: PENDING/PROCESSED/FAILED
- References: userId, sourceUserId, packageId

### Withdrawal
- Details: amount, withdrawal_method
- Status: pending/processing/completed/rejected/cancelled
- Payment Info: bank details, mobile money, crypto details

### Announcement
- Content: title, content, type, priority
- Timing: startDate, endDate
- Target: targetAudience, isActive

### Notification
- Content: type, title, message, priority
- Status: isRead, expiresAt
- Data: JSON data for additional info

### Report
- Type: EARNINGS/NETWORK/PACKAGE/WITHDRAWAL/COMMISSION
- Period: startDate, endDate
- Data: metrics, totalAmount
- Status: PENDING/GENERATED/ERROR

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=zillionaire
DB_NAME_TEST=zilla_test

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Email Configuration (if implemented)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Payment Gateway Configuration (if implemented)
PAYMENT_API_KEY=
PAYMENT_SECRET=
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run tests

## Contributing

1. Create a new branch
2. Make your changes
3. Submit a pull request

## License

This project is proprietary software.
