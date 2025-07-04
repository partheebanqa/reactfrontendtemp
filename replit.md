# Optraflow - No-Code API Testing Platform

## Overview

Optraflow is a comprehensive no-code/low-code SaaS API testing platform built with a modern, scalable architecture. The platform enables users to test APIs without writing code while providing enterprise-grade features for different subscription tiers.

## System Architecture

**Comprehensive Architecture Documentation**: See `ARCHITECTURE.md` for detailed developer guidelines covering performance optimization, security considerations, responsive design patterns, and accessibility standards.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Replit OAuth integration with session management
- **Performance**: Memoized feature checks and optimized audit logging

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Database Provider**: Neon serverless PostgreSQL
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authentication**: OpenID Connect (OIDC) with Replit integration
- **API Design**: RESTful endpoints with comprehensive CRUD operations

### Database Schema
The system uses a multi-tenant architecture with the following key entities:
- **Users**: Platform users with role-based access control
- **Workspaces**: Multi-tenant containers with subscription management
- **Projects**: Organizational units within workspaces
- **API Endpoints**: Test target definitions
- **Test Suites**: Grouped test collections
- **Request Chains**: Sequential API test flows
- **Schedules**: Automated test execution
- **Executions**: Test run history and results
- **CI/CD Integrations**: External tool connections
- **Audit Logs**: Comprehensive activity tracking

## Key Components

### Feature Gating System
- **Subscription-based access control**: Free, Pro, and Enterprise tiers
- **Role-based permissions**: Platform admin, org admin, developer, QA, ops admin, support staff
- **Trial management**: 15-day trial period with automatic restrictions
- **Dynamic feature rollout**: Conditional component rendering

### Multi-tenant Workspace Management
- **Workspace isolation**: Complete data separation between tenants
- **Subscription management**: Per-workspace billing and feature access
- **User role assignment**: Granular permissions within workspaces
- **Trial period tracking**: Automatic trial expiration handling

### Authentication & Authorization
- **OAuth Integration**: Replit-based authentication
- **Session Management**: Secure, database-backed sessions
- **Protected Routes**: Component-level access control
- **Audit Logging**: Comprehensive access tracking

### API Testing Core
- **Request Builder**: Visual HTTP request construction
- **Request Chains**: Sequential test execution
- **Test Suites**: Grouped test management
- **Scheduler**: Cron-based automated testing
- **Execution Engine**: Real-time test running and monitoring

## Data Flow

1. **Authentication Flow**:
   - User authenticates via Replit OAuth
   - Session created in PostgreSQL
   - User context loaded with workspace associations

2. **Feature Access Flow**:
   - Component requests feature access
   - FeatureGate checks subscription plan and user role
   - Access granted/denied with audit logging

3. **API Testing Flow**:
   - User creates/configures API tests
   - Tests executed individually or via scheduler
   - Results stored with comprehensive metadata
   - Notifications sent based on configuration

4. **Multi-tenancy Flow**:
   - All operations scoped to current workspace
   - Data isolation enforced at database query level
   - Cross-workspace access strictly prohibited

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **wouter**: Client-side routing
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework

### Authentication
- **openid-client**: OIDC authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **tsx**: TypeScript execution
- **vite**: Build tool and dev server
- **esbuild**: Fast JavaScript bundler
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite HMR for instant feedback
- **TypeScript**: Compile-time type checking
- **Development Server**: Express with Vite middleware integration

### Production Build
- **Frontend**: Vite production build with asset optimization
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Automated migrations via Drizzle Kit
- **Environment**: Environment variable configuration

### Scalability Considerations
- **Database**: Serverless PostgreSQL with connection pooling
- **Sessions**: Database-backed for horizontal scaling
- **Static Assets**: Vite-optimized with caching headers
- **API Rate Limiting**: Ready for implementation

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Added enterprise and pro demo accounts with subscription-based feature gating
- July 02, 2025. Fixed app crash issues and authentication handling
- July 02, 2025. Cleaned up project structure by removing duplicate directories (/modules, /layout, /static, /dashboard)
- July 02, 2025. Added comprehensive architecture documentation (ARCHITECTURE.md) covering performance, security, accessibility, and responsive design
- July 02, 2025. Fixed performance issue with excessive audit logging by implementing memoization and deduplication
- July 02, 2025. Fixed runtime errors with unsafe array access using proper optional chaining
- July 02, 2025. Added complete trial and subscription management schema with PostgreSQL tables for 15-day trials, subscription plans, and subscription history tracking
- July 02, 2025. Implemented frontend trial UI components including TrialBanner, TrialStatusWidget, TrialDashboard, and useTrialManagement hook with full trial workflow support

## User Preferences

Preferred communication style: Simple, everyday language.