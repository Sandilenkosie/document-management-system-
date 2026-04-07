# PCG MindRift Backend

Backend API for the PCG MindRift Document Management System built with Express.js, Prisma, PostgreSQL, and OCRSpace.

## Features

- 🔐 **Authentication & Authorization** - JWT-based auth with role-based access control
- 📄 **Document Management** - Upload, process, and manage documents
- 🤖 **OCR-Powered Extraction** - OCRSpace for automatic data extraction from documents
- ✅ **Approval Workflows** - 3-stage approval process (Reviewer → Manager → Admin)
- 📊 **Advanced Reporting** - Spend analysis, vendor insights, and tax reports
- 🧠 **AI Insights** - Intelligent anomaly detection and recommendations

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **OCR**: OCRSpace API
- **Security**: JWT, bcrypt, helmet, CORS
- **Validation**: Zod

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- OCRSpace API key

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the `.env` file and update the values:

```bash
cp .env.example .env
```

Update the following variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `OCRSPACE_API_KEY`: Your OCRSpace API key

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:7261`

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Documents

- `POST /api/documents/upload` - Upload document (PDF/image)
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document

### Approvals

- `GET /api/approvals/pending` - Get pending approvals for user
- `POST /api/approvals/:documentId/approve/:stage` - Approve document
- `POST /api/approvals/:documentId/reject/:stage` - Reject document

### Reports

- `GET /api/reports/spend-summary` - Spend summary report
- `GET /api/reports/vendor-analysis` - Vendor analysis report
- `GET /api/reports/tax-vat` - Tax/VAT report
- `GET /api/reports/insights` - Generated insights based on extracted document data

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and role management
- **Documents**: File metadata and extracted data
- **Approvals**: Approval workflow tracking

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
backend/
├── src/
│   ├── lib/           # Utilities (Prisma client, OCRSpace extraction service)
│   ├── middleware/    # Express middleware (auth, error handling)
│   ├── routes/        # API route handlers
│   └── index.ts       # Server entry point
├── prisma/
│   └── schema.prisma  # Database schema
└── package.json
```

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation with Zod
- SQL injection prevention via Prisma

## Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm run start`

## License

This project is part of the PCG MindRift internship application.
