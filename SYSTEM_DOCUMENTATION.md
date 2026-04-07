# PCG MindRift Document Management System

## 🎯 Overview

A comprehensive, secure web-based document management system with user authentication, AI-powered document extraction, 3-step approval workflows, duplicate detection, advanced reporting, and AI-driven insights.

## ✨ Core Features Implemented

### 1. **Authentication & Role-Based Access**

- ✅ Secure login system
- ✅ User registration with email verification
- ✅ Role-based access control (Admin, Approver, Reviewer, Viewer)
- ✅ Token-based authentication

**Files:**

- [app/type/Auth.ts](app/type/Auth.ts) - Auth types with role support
- [app/store/Auth.ts](app/store/Auth.ts) - Authentication store
- [app/pages/Login.tsx](app/pages/Login.tsx) - Login page
- [app/pages/Register.tsx](app/pages/Register.tsx) - Registration page

### 2. **Document Upload**

- ✅ Multi-file upload support
- ✅ File type validation (PDF, DOC, DOCX, XLS, XLSX only)
- ✅ File size validation (max 10MB)
- ✅ Document type selection (Invoice/Credit Note)
- ✅ Real-time progress tracking

**Files:**

- [app/pages/Upload.tsx](app/pages/Upload.tsx) - Enhanced upload page
- [app/type/upload.ts](app/type/upload.ts) - Upload types
- [app/utils/upload.ts](app/utils/upload.ts) - Upload utilities

### 3. **AI Data Extraction**

- ✅ Automatic data extraction from documents
- ✅ Extracts: Vendor name, Invoice date, Invoice number, Amount, VAT, Currency
- ✅ Data validation
- ✅ Mock AI extraction (ready for real OCR integration)

**Files:**

- [app/utils/extraction.ts](app/utils/extraction.ts) - Extraction utilities
- [app/type/Document.ts](app/type/Document.ts) - Document and extraction types

### 4. **Duplicate Detection**

- ✅ Invoice number matching
- ✅ Vendor + Amount validation
- ✅ Real-time duplicate checking during upload
- ✅ Duplicate warning alerts

**Files:**

- [app/store/Document.ts](app/store/Document.ts) - Document store with duplicate checks
- [app/type/Document.ts](app/type/Document.ts) - Duplicate types

### 5. **3-Step Approval Workflow**

- ✅ **Step 1: Reviewer** - Initial document verification
- ✅ **Step 2: Manager** - Department head approval
- ✅ **Step 3: Finance/Admin** - Final authorization
- ✅ Status tracking (Pending/Approved/Rejected)
- ✅ Comments/notes for each approval
- ✅ Approval history

**Files:**

- [app/pages/Approvals.tsx](app/pages/Approvals.tsx) - Approval workflow page
- [app/store/Approval.ts](app/store/Approval.ts) - Approval store
- [app/type/Document.ts](app/type/Document.ts) - Approval types

### 6. **Advanced Reports & Analytics**

- ✅ **Spend Summary Report**
  - Total amount, approved amount, pending amount, rejected amount
  - Currency breakdown
  - Average amount per document
- ✅ **Vendor Analysis Report**
  - Vendor spending totals
  - Document counts
  - Average amounts
  - Approval rates
  - Last transaction dates
- ✅ **Tax/VAT Report**
  - Total tax and base amounts
  - Tax rates
  - Tax by vendor breakdown

**Features:**

- Date range filtering
- Vendor filtering
- Approval status filtering
- Amount range filtering
- CSV export

**Files:**

- [app/pages/Reports.tsx](app/pages/Reports.tsx) - Reports page
- [app/store/Report.ts](app/store/Report.ts) - Report generation store
- [app/type/Report.ts](app/type/Report.ts) - Report types

### 7. **AI-Driven Insights**

- ✅ Spending trends analysis
- ✅ Anomaly detection (unusual amounts, frequent vendors)
- ✅ Smart recommendations
- ✅ Highest spending vendor identification
- ✅ Average daily spend calculation

**Files:**

- [app/store/Report.ts](app/store/Report.ts) - AI insights generation
- [app/type/Report.ts](app/type/Report.ts) - Insights types

### 8. **Export Functionality**

- ✅ Export reports to CSV (Excel compatible)
- ✅ Export document lists to CSV
- ✅ Browser-based PDF generation ready
- ✅ One-click downloads

**Files:**

- [app/utils/export.ts](app/utils/export.ts) - Export utilities

### 9. **Dashboard**

- ✅ Overview of key metrics
- ✅ Approval workflow status
- ✅ Quick action buttons
- ✅ AI processing status indicators
- ✅ Role-based customization

**Files:**

- [app/pages/Dashboard.tsx](app/pages/Dashboard.tsx) - Main dashboard

## 📁 Project Structure

```
app/
├── components/
│   └── ui/             # UI components (Button, Input, etc.)
├── pages/
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Upload.tsx      # Document upload (ENHANCED)
│   ├── Approvals.tsx   # Approval workflow (NEW)
│   ├── Reports.tsx     # Reports & analytics (NEW)
│   └── NotFound.tsx    # 404 page
├── store/
│   ├── Auth.ts         # Authentication store
│   ├── Document.ts     # Document management (NEW)
│   ├── Approval.ts     # Approval workflow (NEW)
│   └── Report.ts       # Report generation (NEW)
├── type/
│   ├── Auth.ts         # Auth types (ENHANCED)
│   ├── Document.ts     # Document types (NEW)
│   ├── Report.ts       # Report types (NEW)
│   ├── upload.ts       # Upload types
│   └── index.ts
├── utils/
│   ├── extraction.ts   # AI extraction utilities (NEW)
│   ├── export.ts       # Export utilities (NEW)
│   ├── upload.ts       # Upload utilities
│   ├── Auth.ts         # Auth utilities
│   └── useScrollAnimation.ts
├── lib/
│   └── utils.ts
├── App.tsx             # App routes (UPDATED)
├── main.tsx            # App entry point
├── App.css
├── index.css
└── vite-env.d.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm lint
```

### Development

The app runs on `http://localhost:5173` by default with Vite.

## 🔄 Workflow

### Upload Flow

1. User navigates to Upload page
2. Selects documents (PDF, DOC, DOCX, etc.)
3. Selects document type (Invoice/Credit Note)
4. Clicks "Extract Data with AI"
5. System performs:
   - AI data extraction
   - Duplicate detection
   - Data validation
6. User reviews extracted data
7. Clicks "Upload Documents"
8. Documents are stored and moved to approval workflow

### Approval Flow

1. Document enters Step 1 (Reviewer)
2. Reviewer can approve or reject with comments
3. If approved, moves to Step 2 (Manager)
4. Manager reviews and approves or rejects
5. If approved, moves to Step 3 (Finance/Admin)
6. Finance/Admin makes final decision
7. Documents marked as either "Approved" or "Rejected"

### Reporting Flow

1. Navigate to Reports page
2. Choose report type (Spend, Vendor, Tax)
3. Apply filters (date range, vendor, status, amount)
4. View insights and analytics
5. Export to CSV if needed

## 🔐 Security Features

- Role-based access control
- Token-based authentication
- Input validation on all forms
- File type and size validation
- XSS protection (React built-in)
- CSRF protection ready

## 📊 Data Models

### Document

```typescript
{
  id: string
  fileName: string
  fileSize: number
  fileType: string
  documentType: "invoice" | "credit-note"
  uploadedBy: string
  uploadedAt: string
  extractedData: ExtractedData
  isDuplicate: boolean
  currentApprovalStage: 1 | 2 | 3
  approvalStatus: "pending" | "approved" | "rejected"
  approvals: Approval[]
}
```

### Approval

```typescript
{
  id: string
  documentId: string
  stage: 1 | 2 | 3
  approverRole: "reviewer" | "manager" | "admin"
  approverId?: string
  status: "pending" | "approved" | "rejected"
  comment?: string
  approvedAt?: string
}
```

## 🎨 UI Components Used

- **shadcn/ui** - Pre-built, accessible components
- **Lucide React** - Beautiful icons
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - State management
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Sonner** - Toast notifications

## 🧪 Testing

To test the system:

1. **Authentication**
   - Register a new account
   - Login with credentials
   - Verify role assignment

2. **Upload & Extraction**
   - Upload a test PDF/DOC
   - Verify extraction results
   - Check duplicate detection

3. **Workflow**
   - Submit document for approval
   - Navigate to Approvals page
   - Test approve/reject actions

4. **Reports**
   - Generate spend summary
   - Filter by vendor and date
   - Export to CSV

## 🔄 Integration Points

The system is ready to integrate with:

1. **OCR Service** - Replace mock extraction in `app/utils/extraction.ts`
2. **Backend API** - Configure in environment variables
3. **Authentication Service** - Update auth endpoints in `app/store/Auth.ts`
4. **Email Service** - For notifications and verification
5. **PDF Generation** - Replace browser print with library like jsPDF

## 📝 Environment Variables

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:3000
VITE_CONSUMER_TENANT=default
VITE_APP_VERSION=1.0.0
```

## 🐛 Known Issues & Future Enhancements

### Current Limitations

- AI extraction is mocked (should integrate real OCR)
- No backend API integration (in-memory storage only)
- No email notifications
- No audit logging yet
- PDF export uses browser print (consider jsPDF)

### Planned Features

- Real OCR integration (Tesseract, AWS Textract, etc.)
- Backend API integration
- Email notifications for approvals
- Advanced search and filtering
- Bulk operations
- Audit trail/logging
- Two-factor authentication
- Document versioning
- Webhook support
- API documentation

## 📄 License

This project is part of the PCG | MindRift internship initiative.

## 👥 Support

For questions or issues, contact the development team.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
