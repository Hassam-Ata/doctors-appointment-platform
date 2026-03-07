# Quick Start Guide

This guide will help you quickly set up and run your NestJS backend.

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Setup Environment Variables

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/doctors_appointment"
CLERK_SECRET_KEY="your_clerk_secret_key"
NEXT_PUBLIC_VONAGE_APPLICATION_ID="your_vonage_app_id"
VONAGE_PRIVATE_KEY="your_vonage_private_key"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

## Step 3: Setup Database

1. Make sure PostgreSQL is running
2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Run migrations:
```bash
npm run prisma:migrate
```

## Step 4: Start the Server

```bash
npm run start:dev
```

Your backend will be running at `http://localhost:4000`

Test it by visiting: `http://localhost:4000/api/health`

## Step 5: Update Frontend

1. Add to `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

2. Copy the API helper hook (already created):
```
frontend/hooks/use-api.js
```

3. Start migrating your server actions to API calls following the [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)

## Common Commands

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# View database with Prisma Studio
npm run prisma:studio

# Run tests
npm run test
```

## Verify Installation

Test the API with curl:

```bash
# Health check (no auth required)
curl http://localhost:4000/api/health

# Get doctors by specialty (no auth required)
curl http://localhost:4000/api/doctors/specialty/Cardiology

# Current user (requires auth)
# Get token from browser console: await window.Clerk.session.getToken()
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/users/current
```

## Troubleshooting

### Port already in use
Change `PORT` in `.env` to a different port like `4001`

### Database connection error
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists

### CORS errors from frontend
- Verify `FRONTEND_URL` in `.env` matches your Next.js app URL
- Make sure backend is running before starting frontend

### 401 Unauthorized errors
- Verify `CLERK_SECRET_KEY` is correct
- Ensure token is being passed in Authorization header
- Check token hasn't expired

## Next Steps

1. Read the [backend README](backend/README.md) for full API documentation
2. Follow the [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) to migrate frontend code
3. Test each endpoint as you migrate

## Support

For issues or questions, check:
- NestJS docs: https://docs.nestjs.com
- Prisma docs: https://www.prisma.io/docs
- Clerk docs: https://clerk.com/docs
