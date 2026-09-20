# LogiTrack — Logistics Management & Fleet Operations Platform

LogiTrack is a production-ready, enterprise-grade **Logistics Management System** built for small-to-medium transport companies and freight forwarding businesses, architected from the ground up for commercial multi-tenant SaaS expansion.

---

## 🌟 Key Platform Capabilities

### 1. Executive Operations Dashboard & Real-Time KPIs
- **Live Fleet & Driver Capacity**: Real-time gauge of available, in-transit, assigned, and maintenance assets.
- **Financial Analytics**: Interactive 6-month revenue vs. operating expenses trend chart built with Recharts.
- **Shipment Pipeline**: Donut chart tracking active consignments across all fulfillment milestones.
- **System Audit Timeline**: Real-time operational audit log capturing all dispatch, delivery, and payment events.
- **Regulatory Alert Banner**: Instant alerts for expired or expiring vehicle permits, fitness, and driver licenses.

### 2. Fleet & Driver Management
- **Commercial Vehicle Registry**: Track registration numbers, vehicle types (Taurus, Multi-Axle, Trailer, LCV, Flatbed), payload capacity, fuel types, and odometer readings.
- **Certified Drivers Database**: Driver code sequencing, license number tracking, license expiry monitoring, emergency contacts, and assignment history.
- **Lifecycle Statuses**: Explicit state-machine management (`Available`, `Assigned`, `InTransit`, `Maintenance`, `OnLeave`, `Inactive`).

### 3. Regulatory Document Vault & Expiry Engine
- **Automated Expiry Categorization**:
  - `Expired`: Expiry date has passed. Immediately restricts fleet dispatch.
  - `ExpiringSoon`: Within 30 days of expiration. Flags proactive warning badges.
  - `Valid`: Compliance intact (> 30 days).
- **Supported Documents**: Vehicle RC, National Permits, Fitness Certificates, Insurance, Pollution Certificates (PUC), and Driver Licenses.
- **Secure File Storage**: Validated MIME-type file persistence with direct view and download capabilities.

### 4. Booking, Consignment & Public Tracking
- **Auto-Sequenced Identifiers**:
  - Booking Reference: `BK-YYYY-XXXXXX`
  - Consignment Waybill: `SH-YYYY-XXXXXX`
  - Public Tracking Code: `LT-YYYY-XXXXXX`
- **Public Consignment Tracking**: Customer self-service portal (`/tracking?q=LT-...`) featuring vertical milestone timelines, live progress steps, carrier info, and origin-to-destination route visualization.

### 5. Fleet Dispatch & Conflict-Free Assignment
- **Strict Business Validation**:
  - Automatically rejects inactive or maintenance vehicles.
  - Automatically blocks drivers with expired licenses or on-leave status.
  - Prevents overlapping active assignments for the same vehicle or driver.
- **One-Click Dispatch Board**: Dispatches available trucks and certified drivers to unassigned consignments with status updates.

### 6. Delivery Confirmation & Proof of Delivery (POD)
- **Proof of Delivery Vault**: Upload physical receiver stamps, signed challans, or digital receipts (JPG, PNG, PDF).
- **Automated Fleet Release**: Marking a delivery as confirmed automatically transitions the shipment to `Delivered`, logs receiver remarks, and releases the assigned vehicle and driver back to `Available` status for subsequent trips.

### 7. Freight Invoicing, Payments & Fleet Expenses
- **Compliant Tax Invoices**: Generate invoices directly from bookings or custom line items with automatic SubTotal, GST (18%), discount, and balance calculations.
- **Printable Invoices**: Built-in, clean printable tax invoice layout (`window.print()` / PDF export).
- **Payment Receipts**: Multi-channel collections (Bank Transfer / NEFT / RTGS, UPI / QR Code, Cash, Cheque) with automatic invoice balance reconciliation.
- **Trip & Fleet Expenses**: Category tracking for Diesel Fuel, Highway Tolls, Driver Bhatta / Trip Allowances, and Repairs with receipt uploads.

### 8. Analytics & CSV Export Reports
- **Shipment Performance Report**: Route velocity, on-time delivery rates, and freight totals.
- **Financial & Invoicing Report**: Tax liabilities, collected revenue, and customer balances.
- **Vehicle Operating Costs**: Fuel vs. toll vs. maintenance expenses per vehicle.
- **Driver Performance Report**: Completed deliveries and trip assignments.
- **One-Click CSV Export**: Instant server-side streaming CSV download for any report and date range.

### 9. Role-Based Access Control (RBAC) & User Management
- Pre-configured security roles: `SuperAdmin`, `Admin`, `Dispatcher`, `Operations`, `Accountant`, `Driver`, `Viewer`.
- User administration panel with BCrypt password hashing, credential resets, and account deactivation.

---

## 🏗️ Technology Architecture

```
d:/LogiFlow/
├── backend/
│   ├── src/
│   │   ├── LogiTrack.Domain/          # Pure Domain Entities, Enums, Audit Contracts
│   │   ├── LogiTrack.Application/     # DTOs, Business Interfaces, Query Envelopes
│   │   ├── LogiTrack.Infrastructure/  # EF Core DbContext, Migrations, File Storage, BCrypt
│   │   └── LogiTrack.Api/             # ASP.NET Core Web API Controllers, JWT, Scalar Docs
│   ├── tests/
│   │   └── LogiTrack.Tests/           # Unit & Integration Tests (100% Pass)
│   ├── Dockerfile
│   └── LogiTrack.slnx
│
├── frontend/
│   └── logitrack-ui/
│       ├── src/
│       │   ├── components/ui/         # Reusable DataTable, Modal, ConfirmDialog, Badge
│       │   ├── layouts/               # AppLayout, Collapsible Sidebar, Notification Topbar
│       │   ├── pages/                 # Dashboard, Bookings, Shipments, Fleet, Finance, Reports
│       │   ├── services/              # Axios Interceptor, JWT Token Management
│       │   └── routes/                # Protected Routes & RBAC Guards
│       ├── Dockerfile
│       └── nginx.conf
│
└── docker-compose.yml                 # Multi-Container Orchestration (SQL Server + API + Web)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js 20+](https://nodejs.org/)
- SQL Server LocalDB or SQL Server Express

### 1. Backend Setup
```bash
cd backend
dotnet restore
dotnet build LogiTrack.slnx

# Run API (Database will automatically migrate and seed sample data on first run)
dotnet run --project src/LogiTrack.Api/LogiTrack.Api.csproj
```
- API will listen at: `http://localhost:5000`
- Interactive API Documentation (Scalar / OpenAPI): `http://localhost:5000/scalar/v1`

### 2. Frontend Setup
```bash
cd frontend/logitrack-ui
npm install
npm run dev
```
- Web Application will start at: `http://localhost:5173`

---

## 🐳 Production Docker Deployment

Deploy the entire stack with a single command:

```bash
docker compose up --build -d
```

Containers provisioned:
1. **logitrack-db**: Microsoft SQL Server 2022
2. **logitrack-api**: ASP.NET Core Web API on port `5000`
3. **logitrack-ui**: React SPA served with Nginx on port `80`

Access the application in your browser at `http://localhost`.

---

## 🔑 Default Seed Credentials

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `Admin123!` | Full unrestricted access across all modules |
| **Dispatcher** | `dispatcher` | `Dispatch123!` | Fleet management, dispatches, shipments, PODs |
| **Operations** | `operations` | `Dispatch123!` | Bookings, consignments, customer masters |
| **Accountant** | `accountant` | `Dispatch123!` | Invoices, collections, payments, trip expenses |

---

## 🧪 Automated Test Suite

Run the unit and integration test suite:

```bash
dotnet test backend/tests/LogiTrack.Tests/LogiTrack.Tests.csproj
```

**Test Coverage**:
- Document Expiry Status Calculations (Expired, ExpiringSoon, Valid)
- Driver License Compliance Verification
- Fleet Assignment Business Validation (Maintenance vehicle block, expired license block)
- Confirmed Delivery Fulfillment & Automated Fleet Asset Release
- Invoice Balance & Multi-item Tax Math
