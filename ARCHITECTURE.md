# Optraflow Architecture Documentation

## System Overview

Optraflow is a modern, scalable SaaS API testing platform built with enterprise-grade performance, security, and accessibility considerations. This document provides essential architecture insights for developers.

## Core Architecture Principles

### 1. **Full-Stack TypeScript Architecture**
- **Frontend**: React 18 + TypeScript with Vite for optimal performance
- **Backend**: Node.js + Express with TypeScript for type safety
- **Shared Types**: Common schema definitions in `/shared/schema.ts`
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries

### 2. **Multi-Tenant SaaS Architecture**
- **Workspace Isolation**: Complete data segregation between tenants
- **Subscription-Based Features**: Three-tier model (Free/Pro/Enterprise)
- **Role-Based Access Control**: Granular permissions per workspace
- **Horizontal Scaling**: Database-backed sessions for stateless scaling

## Performance Considerations

### Frontend Performance
```typescript
// 1. Memoization for Feature Checks
// Avoid recalculating feature access on every render
const hasAccess = useMemo(() => 
  hasFeatureAccess(feature) && hasRoleAccess(roles), 
  [feature, roles, subscriptionPlan]
);

// 2. Query Optimization
// Use hierarchical cache keys for efficient invalidation
queryKey: ['/api/projects', workspaceId, projectId]

// 3. Code Splitting
// Lazy load enterprise features
const AuditViewer = lazy(() => import('@/admin/AuditViewer'));
```

### Backend Performance
```typescript
// 1. Database Query Optimization
// Always include workspace isolation in queries
const projects = await db.select()
  .from(projects)
  .where(eq(projects.workspaceId, workspaceId))
  .limit(50); // Always paginate

// 2. Connection Pooling
// Neon serverless PostgreSQL with automatic connection management
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20 // Limit concurrent connections
});

// 3. Audit Log Throttling
// Prevent excessive logging with memoization
const loggedFeatures = useRef(new Set<string>());
```

### Caching Strategy
- **React Query**: Server state caching with smart invalidation
- **Session Storage**: PostgreSQL-backed for horizontal scaling
- **Static Assets**: Vite optimization with cache headers
- **Feature Access**: Memoized checks to reduce computation

## Security Architecture

### Authentication & Authorization
```typescript
// 1. OAuth Integration (Replit)
// Secure token-based authentication
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Token refresh logic...
};

// 2. Multi-Layer Access Control
// Feature gates with audit logging
<FeatureGate feature="enterprise_reports" roles={["admin"]}>
  <EnterpriseReports />
</FeatureGate>

// 3. Workspace Isolation
// Every query must include workspace context
const userProjects = await storage.getProjectsByWorkspaceId(workspaceId);
```

### Data Protection
- **Workspace Isolation**: No cross-tenant data access
- **Session Security**: HttpOnly cookies with secure flags
- **API Protection**: All endpoints require authentication
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Zod schemas for all API inputs

### Security Headers
```typescript
// CSP Configuration
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'"
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
```

## Responsive Design Architecture

### Mobile-First Approach
```css
/* Tailwind Responsive Classes */
<div className="
  grid grid-cols-1          /* Mobile: Single column */
  md:grid-cols-2           /* Tablet: Two columns */
  xl:grid-cols-3           /* Desktop: Three columns */
  gap-4 md:gap-6           /* Progressive spacing */
">
```

### Adaptive Components
```typescript
// Dynamic layout based on screen size
const { isMobile } = useIsMobile();

return isMobile ? (
  <MobileLayout>{content}</MobileLayout>
) : (
  <DesktopLayout>{content}</DesktopLayout>
);
```

### Performance on Mobile
- **Progressive Loading**: Critical content first
- **Touch Optimization**: 44px minimum touch targets
- **Network Awareness**: Graceful degradation for slow connections
- **Bundle Splitting**: Load mobile-specific code only when needed

## Accessibility (a11y) Architecture

### WCAG 2.1 AA Compliance
```typescript
// 1. Semantic HTML Structure
<main role="main" aria-label="Dashboard">
  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading">Performance Statistics</h2>
  </section>
</main>

// 2. Keyboard Navigation
<Button 
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
  aria-describedby="action-description"
>
  Execute Test
</Button>

// 3. Screen Reader Support
<div aria-live="polite" aria-atomic="true">
  {status === 'loading' && 'Test execution in progress'}
  {status === 'complete' && 'Test completed successfully'}
</div>
```

### Color & Contrast
```css
/* High contrast color system */
:root {
  --text-primary: hsl(0, 0%, 9%);      /* 16.5:1 contrast ratio */
  --text-secondary: hsl(0, 0%, 32%);    /* 7:1 contrast ratio */
  --accent-blue: hsl(212, 100%, 45%);   /* WCAG AA compliant */
}

.dark {
  --text-primary: hsl(0, 0%, 95%);      /* High contrast in dark mode */
  --text-secondary: hsl(0, 0%, 70%);
}
```

### Focus Management
```typescript
// Focus trap for modals
import { Dialog } from '@radix-ui/react-dialog';

<Dialog>
  <DialogContent 
    onOpenAutoFocus={(e) => firstInput.current?.focus()}
    onCloseAutoFocus={(e) => triggerButton.current?.focus()}
  >
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

## Component Architecture

### Atomic Design Pattern
```
/components
├── ui/              # Base components (Button, Input, Card)
├── /                # Composite components (Header, Sidebar)
└── /pages           # Page-level components

/contexts/           # React context providers
/hooks/             # Custom React hooks
/lib/               # Utility functions
```

### Feature-Based Organization
```typescript
// Feature gates with clear boundaries
interface FeatureGateProps {
  feature: string;           // Feature identifier
  roles?: string[];         // Required roles
  fallback?: ReactNode;     // Fallback UI for denied access
  showUpgrade?: boolean;    // Show upgrade prompt
}

// Clean separation of concerns
const hasAccess = hasFeatureAccess(feature) && hasRoleAccess(roles);
```

## Database Architecture

### Multi-Tenant Schema Design
```sql
-- Workspace isolation at table level
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,  -- Every table has workspace_id
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_executions_project ON executions(project_id, created_at);
```

### Type-Safe Queries
```typescript
// Drizzle ORM with full TypeScript support
const userProjects = await db
  .select({
    id: projects.id,
    name: projects.name,
    testCount: count(testSuites.id)
  })
  .from(projects)
  .leftJoin(testSuites, eq(projects.id, testSuites.projectId))
  .where(eq(projects.workspaceId, workspaceId))
  .groupBy(projects.id);
```

## Error Handling & Monitoring

### Client-Side Error Boundaries
```typescript
// Global error boundary for unhandled errors
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    console.error('App Error:', error, errorInfo);
  }
}

// API error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['/api/projects'],
  retry: (failureCount, error) => {
    // Don't retry on 401/403
    if (error.message.includes('401') || error.message.includes('403')) {
      return false;
    }
    return failureCount < 3;
  }
});
```

### Server-Side Error Handling
```typescript
// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  
  if (err.code === 'UNAUTHORIZED') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Development Guidelines

### Code Quality Standards
1. **TypeScript Strict Mode**: Enable all strict type checking
2. **ESLint Configuration**: Enforce consistent code style
3. **Component Testing**: Unit tests for critical business logic
4. **Performance Monitoring**: React DevTools and Lighthouse audits

### Development Workflow
1. **Feature Branches**: All development in feature branches
2. **Type Safety**: Shared schema definitions prevent API mismatches
3. **Hot Reload**: Vite HMR for instant development feedback
4. **Database Migrations**: Drizzle Kit for schema changes

### Deployment Considerations
- **Environment Variables**: Separate configs for dev/staging/prod
- **Database Migrations**: Automated via `npm run db:push`
- **Asset Optimization**: Vite production builds with code splitting
- **Health Checks**: Ready for container orchestration

## Monitoring & Observability

### Application Metrics
- **Performance**: React Query dev tools for cache analysis
- **User Experience**: Core Web Vitals monitoring
- **Database**: Query performance and connection pool metrics
- **Security**: Failed authentication attempts and audit logs

### Error Tracking
- **Client Errors**: Unhandled promise rejections and React errors
- **Server Errors**: API failures and database connection issues
- **Performance Issues**: Slow queries and high memory usage

This architecture ensures Optraflow remains performant, secure, and accessible as it scales to serve enterprise customers with mission-critical API testing needs.