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
- POST /auth/reset-password - Reset password

(More endpoints will be documented as they are implemented)

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
