# Doctors Appointment Platform - Backend API

NestJS backend for the Doctors Appointment Platform with RESTful API endpoints.

## Features

- ✅ User authentication with Clerk
- ✅ Role-based access control (Admin, Doctor, Patient)
- ✅ Complete appointment booking system
- ✅ Video call integration with Vonage
- ✅ Credit-based payment system
- ✅ Doctor verification workflow
- ✅ Payout management for doctors
- ✅ PostgreSQL database with Prisma ORM

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk
- **Video**: Vonage Video API
- **Validation**: class-validator

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account
- Vonage Video API account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `DATABASE_URL`: Your PostgreSQL connection string
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `NEXT_PUBLIC_VONAGE_APPLICATION_ID`: Vonage application ID
- `VONAGE_PRIVATE_KEY`: Vonage private key
- `FRONTEND_URL`: Your frontend URL (for CORS)
- `PORT`: Server port (default: 4000)

3. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:4000/api`

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Users
- `GET /api/users/current` - Get current user
- `POST /api/users/role` - Set user role (onboarding)
- `POST /api/users/sync` - Sync user from Clerk

### Admin (Admin only)
- `GET /api/admin/doctors/pending` - Get pending doctor verifications
- `GET /api/admin/doctors/verified` - Get verified doctors
- `POST /api/admin/doctors/update-status` - Verify/reject doctor
- `POST /api/admin/doctors/update-active-status` - Suspend/reinstate doctor
- `GET /api/admin/payouts/pending` - Get pending payouts
- `POST /api/admin/payouts/approve` - Approve payout

### Appointments
- `POST /api/appointments/book` - Book an appointment
- `POST /api/appointments/video-token` - Generate video call token
- `GET /api/appointments/patient` - Get patient's appointments
- `POST /api/appointments/cancel` - Cancel appointment
- `POST /api/appointments/complete` - Complete appointment (doctor only)

### Doctors
- `GET /api/doctors/specialty/:specialty` - Get doctors by specialty
- `POST /api/doctors/availability` - Set doctor availability
- `GET /api/doctors/availability` - Get doctor availability
- `GET /api/doctors/appointments` - Get doctor's appointments
- `GET /api/doctors/earnings` - Get doctor earnings summary

### Payouts
- `POST /api/payouts/request` - Request payout (doctor only)
- `GET /api/payouts` - Get payout history

### Credits
- `POST /api/credits/allocate` - Allocate subscription credits (webhook)

## Authentication

All endpoints (except health check and public doctor listing) require Clerk authentication. Pass the Clerk session token in the Authorization header:

```
Authorization: Bearer <clerk_session_token>
```

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── admin/               # Admin module
│   ├── appointments/        # Appointments module
│   ├── common/              # Shared guards, decorators
│   ├── credits/             # Credits module
│   ├── doctors/             # Doctors module
│   ├── payouts/             # Payouts module
│   ├── prisma/              # Prisma service
│   ├── users/               # Users module
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   ├── app.service.ts       # Root service
│   └── main.ts              # Application entry point
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build for production
- `npm run lint` - Lint code
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT
