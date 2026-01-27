# Novy - Lease Transfer Marketplace

## Overview

Novy is a real estate lease-transfer marketplace where current tenants list their residential or commercial rental units to find replacement tenants to assume or novate their lease. The platform facilitates lease transfers only—it is NOT a real estate broker and does NOT negotiate rent. Owner approval is mandatory before listings go live, and Novy charges the incoming tenant a platform fee upon successful transfer.

**Core User Roles:**
- Outgoing Tenant (Lister) - Creates lease transfer listings
- Incoming Tenant (Applicant) - Applies to assume leases
- Property Owner / Property Manager - Authorizes listings
- Admin - Platform administration

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state and caching
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling:** React Hook Form with Zod validation
- **Build Tool:** Vite with React plugin

### Backend Architecture
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript with ES modules
- **API Design:** RESTful JSON API with `/api` prefix
- **Authentication:** Replit OpenID Connect (OIDC) with Passport.js
- **Session Management:** Express sessions stored in PostgreSQL via connect-pg-simple

### Data Storage
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM with drizzle-zod for schema validation
- **Schema Location:** `shared/schema.ts` (shared between client and server)
- **Migrations:** Drizzle Kit with `db:push` command

### Key Design Patterns
- **Monorepo Structure:** Client (`client/`), server (`server/`), and shared code (`shared/`)
- **Path Aliases:** `@/` for client source, `@shared/` for shared modules
- **Type Safety:** End-to-end TypeScript with shared schema types
- **API Pattern:** Route handlers in `server/routes.ts`, storage abstraction in `server/storage.ts`

### Authentication Flow
- Replit OIDC integration handles user authentication
- Sessions stored in PostgreSQL `sessions` table
- User data stored in `users` table with profile extensions in `user_profiles`
- Role-based access control (tenant, owner, admin)

### Owner Authorization Flow
- Listings start in "draft" status
- System generates authorization token and sends email to property owner
- Owner receives secure link to review and approve/reject listing
- Approval changes listing status to "active" and records timestamp, IP hash

## External Dependencies

### Database
- **PostgreSQL:** Primary data store, connection via `DATABASE_URL` environment variable

### Authentication
- **Replit Auth (OIDC):** OAuth 2.0 / OpenID Connect provider via `ISSUER_URL`
- **Session Secret:** Required via `SESSION_SECRET` environment variable

### Frontend Libraries
- **Radix UI:** Accessible component primitives
- **TanStack Query:** Data fetching and caching
- **Embla Carousel:** Carousel functionality
- **date-fns:** Date formatting utilities
- **Recharts:** Chart components (via shadcn/ui)

### Backend Libraries
- **Passport.js:** Authentication middleware
- **express-session:** Session handling
- **connect-pg-simple:** PostgreSQL session store
- **drizzle-orm:** Database ORM
- **zod:** Runtime validation

### Build & Development
- **Vite:** Frontend build tool with HMR
- **esbuild:** Server bundling for production
- **tsx:** TypeScript execution for development

### Payment Processing
- **Stripe:** Payment integration for platform fees
- Platform Fees: $399 (residential), $2,500 (commercial)
- Charged to incoming tenant upon successful lease transfer

## Recent Changes (January 2026)

### Security Hardening (Latest)
1. **One-time Owner Authorization Tokens:** Authorization links can only be used once. The `usedAt` timestamp is set after processing, and both GET and POST endpoints reject already-used tokens.
2. **Payment Gating for Checkout:** Stripe checkout is blocked until the property owner approves the specific applicant (`application.status === "approved"`).
3. **ToS and Disclaimer Logging:** Applications require acceptance of Terms of Service and Non-Broker Disclaimer. Acceptance timestamps (`tosAcceptedAt`, `disclaimerAcceptedAt`) are stored and audit logged.
4. **Messaging Restriction:** Messaging between parties is blocked until payment is completed (`paymentStatus === "paid"`). This applies to BOTH listing owners and applicants.
5. **Comprehensive Audit Logging:** New `audit_logs` table tracks: owner approvals/rejections, ToS/disclaimer acceptance, application submissions, payment initiation/completion/failure, and message sending. Logs include user ID, IP hash, user agent, and metadata.

### Completed Features
1. **Database Schema:** 8 tables defined - users, sessions, user_profiles, listings, applications, documents, messages, owner_authorizations, payments, audit_logs
2. **Frontend:** Complete UI with landing page, dashboard, listings browse/detail/create, my-listings, applications, messages, admin panel, owner authorization page
3. **Backend API:** All CRUD endpoints for listings, applications, messages. Owner authorization flow with secure token links. Admin endpoints for management.
4. **Authentication:** Replit Auth (OIDC) integrated with session management
5. **Theme:** Professional real estate theme with primary blue (#3b82f6), accent green, light/dark mode support

### Design Tokens (index.css)
- Primary: Blue (221 83% 53%)
- Accent: Green (158 64% 40%)
- Font: Inter (sans), Playfair Display (serif)

### Key Pages
- `/` - Landing (guest) / Dashboard (authenticated)
- `/listings` - Browse active listings
- `/listings/:id` - Listing detail with apply modal
- `/create-listing` - 4-step form (property, lease info, description, owner auth)
- `/my-listings` - User's own listings
- `/applications` - User's applications
- `/messages` - Messaging center
- `/admin` - Admin panel
- `/authorize/:token` - Owner authorization page

### API Endpoints
- `GET /api/listings` - Get active listings
- `GET /api/listings/my` - User's listings
- `POST /api/listings` - Create listing (triggers owner auth)
- `GET /api/authorize/:token` - Get authorization details
- `POST /api/authorize/:token` - Approve/reject listing
- `GET /api/applications/my` - User's applications
- `POST /api/applications` - Apply to listing
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/admin/*` - Admin endpoints