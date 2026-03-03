# OPTRAFLOW - No-Code API Testing Platform

A comprehensive no-code/low-code SaaS API testing platform with enterprise-grade features, multi-tenant workspace architecture, and advanced compliance capabilities.

## 🚀 Features

### Core Testing Features

- **Visual Request Builder** - No-code API request construction
- **Test Suites** - Organize and manage test collections
- **Request Chains** - Sequential API workflow execution
- **Scheduler** - Cron-based automated testing
- **Real-time Monitoring** - Live test execution and results

### Enterprise Features

- **Multi-tenant Workspaces** - Complete data isolation
- **Role-based Access Control** - Granular permissions
- **Subscription Management** - Free, Pro, and Enterprise tiers
- **CI/CD Integrations** - GitHub, GitLab, Jenkins, CircleCI
- **Comprehensive Reporting** - Analytics and insights

### Compliance & Security

- **Audit Trails** - Complete activity logging
- **GDPR Compliance** - Privacy and consent management
- **Data Retention Policies** - Configurable data lifecycle
- **Feature Flags** - Gradual rollout management

## 🏗️ Architecture

### Frontend

- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **TanStack React Query** for state management
- **Wouter** for routing

### Backend

- **Node.js** with Express.js
- **PostgreSQL** with Drizzle ORM
- **Neon** serverless database
- **OpenID Connect** authentication
- **Session-based auth** with PostgreSQL storage

### Database Schema

```
- Users (authentication and profiles)
- Workspaces (multi-tenant containers)
- Projects (organizational units)
- API Endpoints (test targets)
- Test Suites (test collections)
- Request Chains (workflow sequences)
- Schedules (automated execution)
- Executions (test run history)
- CI/CD Integrations (external connections)
- Audit Logs (compliance tracking)
```

## 📁 Project Structure

```
├── client/src/
│   ├── modules/           # Feature modules
│   │   ├── dashboard/     # Main dashboard
│   │   ├── requestbuilder/ # API request builder
│   │   ├── testsuites/    # Test suite management
│   │   ├── requestchains/ # Request chain workflows
│   │   ├── scheduler/     # Test scheduling
│   │   ├── executions/    # Execution monitoring
│   │   ├── cicd/          # CI/CD integrations
│   │   ├── profile/       # User profile management
│   │   ├── settings/      # Workspace settings
│   │   ├── datamanagement/ # Data lifecycle
│   │   ├── utilities/     # Developer tools
│   │   ├── reports/       # Analytics and reporting
│   │   └── notifications/ # Alert management
│   ├── components/        # Shared UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── contexts/         # React contexts
│   ├── routes/           # Application routing
│   ├── compliance/       # GDPR and privacy
│   ├── rollout/          # Feature flag management
│   └── notify/           # Notification center
├── server/
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   ├── db.ts             # Database connection
└── shared/
    └── schema.ts         # Database schema and types
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon account)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd apiflow
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Database
   DATABASE_URL="your_postgresql_connection_string"

   ```

4. **Set up the database**

   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

### Database Management

The project uses Drizzle ORM for type-safe database operations. Schema changes should be made in `shared/schema.ts` and pushed using `npm run db:push`.

### Feature Development

New features should be developed as modules in `client/src/modules/`. Each module should be self-contained with its own components and logic.

## 🎯 Subscription Tiers

### Free Tier

- 1,000 API requests/month
- Basic test suites
- Email support
- Single workspace

### Pro Tier ($29/month)

- 50,000 API requests/month
- Advanced scheduling
- CI/CD integrations
- Priority support
- 5 team members

### Enterprise Tier (Custom)

- Unlimited API requests
- Advanced compliance features
- Custom integrations
- Dedicated support
- Unlimited team members

## 🛡️ Security & Compliance

### GDPR Compliance

- User consent management
- Data portability
- Right to erasure
- Privacy by design

### Security Features

- Role-based access control
- Audit logging
- Session management
- Data encryption

## 📊 Monitoring & Analytics

The platform includes comprehensive monitoring and analytics:

- Real-time test execution monitoring
- Performance metrics tracking
- Success rate analysis
- Team productivity insights
- Custom report generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- Documentation: [Internal Wiki]
- Issues: [GitHub Issues]
- Email: support@apiflow.com

---

Built with ❤️ using React, Node.js, and PostgreSQL
