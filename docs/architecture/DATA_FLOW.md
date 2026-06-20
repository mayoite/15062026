# Data Flow Diagrams

## 1. Plan Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant PlannerWorkspace
    participant FabricCanvas
    participant PlannerStore as PlannerStore (Zustand)
    participant DocumentBridge
    participant PersistenceAPI
    participant Supabase

    User->>PlannerWorkspace: Opens planner
    PlannerWorkspace->>FabricCanvas: Mounts 2D canvas
    FabricCanvas->>PlannerStore: Initializes room state
    User->>FabricCanvas: Draws walls, places furniture
    FabricCanvas->>PlannerStore: Updates objects array
    User->>PlannerWorkspace: Clicks Save
    PlannerWorkspace->>DocumentBridge: buildPlannerDocumentFromFabric()
    DocumentBridge->>PersistenceAPI: savePlannerDraftDocument()
    PersistenceAPI->>Supabase: INSERT/UPDATE plan
    Supabase-->>PersistenceAPI: Saved plan
    PersistenceAPI-->>PlannerWorkspace: Success + savedAt
```

## 2. Product Catalog Query Flow

```mermaid
sequenceDiagram
    participant User
    participant CategoryPage
    participant GetCatalog
    participant SupabaseClient
    participant Postgres
    participant FilterGrid

    User->>CategoryPage: Navigates to /products/{category}
    CategoryPage->>GetCatalog: getCatalog()
    GetCatalog->>SupabaseClient: SELECT from products
    SupabaseClient->>Postgres: Query with category filter
    Postgres-->>SupabaseClient: Product rows
    SupabaseClient-->>GetCatalog: Raw products
    GetCatalog-->>CategoryPage: Normalized catalog
    CategoryPage->>FilterGrid: Renders with products
    FilterGrid-->>User: Product grid displayed
```

## 3. Customer Query Submission Flow

```mermaid
sequenceDiagram
    participant User
    participant ContactForm
    participant APIRoute as /api/customer-queries
    participant ZodValidation
    participant SupabaseAdmin
    participant Postgres
    participant Resend

    User->>ContactForm: Fills and submits form
    ContactForm->>APIRoute: POST {name, email, message}
    APIRoute->>ZodValidation: Validate input schema
    ZodValidation-->>APIRoute: Valid data
    APIRoute->>SupabaseAdmin: INSERT customer_queries
    SupabaseAdmin->>Postgres: Store query
    Postgres-->>SupabaseAdmin: Saved
    APIRoute->>Resend: Send staff notification email
    Resend-->>APIRoute: Email sent
    APIRoute-->>ContactForm: {success: true}
    ContactForm-->>User: Confirmation message
```

## 4. Recommendation Engine Flow

```mermaid
sequenceDiagram
    participant User
    participant ProductPage
    participant APIRoute as /api/recommendations
    participant OpenRouter
    participant CatalogData
    participant ProductGrid

    User->>ProductPage: Views product
    ProductPage->>APIRoute: GET /api/recommendations?product_id=X
    APIRoute->>CatalogData: Fetch related products
    CatalogData-->>APIRoute: Candidate products
    APIRoute->>OpenRouter: AI ranking request
    OpenRouter-->>APIRoute: Ranked recommendations
    APIRoute-->>ProductPage: Recommendation list
    ProductPage->>ProductGrid: Renders recommendations
    ProductGrid-->>User: Related products shown
```

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant SupabaseClient
    participant SupabaseAuth
    participant AuthProvider
    participant ProtectedRoute

    User->>LoginForm: Enters email + password
    LoginForm->>SupabaseClient: signInWithPassword()
    SupabaseClient->>SupabaseAuth: POST /auth/v1/token
    SupabaseAuth-->>SupabaseClient: {access_token, refresh_token}
    SupabaseClient-->>LoginForm: Session created
    LoginForm->>LoginForm: Sets session cookie
    LoginForm-->>User: Redirect to dashboard
    User->>ProtectedRoute: Navigates to protected page
    ProtectedRoute->>AuthProvider: useSession()
    AuthProvider->>SupabaseClient: getSession()
    SupabaseClient-->>AuthProvider: Valid session
    AuthProvider-->>ProtectedRoute: {status: 'authenticated'}
    ProtectedRoute-->>User: Page rendered
```

## 6. Audit Logging Flow

```mermaid
sequenceDiagram
    participant Action
    participant APIRoute
    participant AuditLogger
    participant DrizzleDB
    participant Postgres

    Action->>APIRoute: User performs action
    APIRoute->>AuditLogger: Log event
    AuditLogger->>AuditLogger: Build audit record
    AuditLogger->>DrizzleDB: INSERT audit_events
    DrizzleDB->>Postgres: Store audit row
    Postgres-->>DrizzleDB: Saved
    DrizzleDB-->>AuditLogger: Confirmed
    AuditLogger-->>APIRoute: Audit logged
```

## 7. Offline-First Sync Flow (Planner)

```mermaid
sequenceDiagram
    participant User
    participant FabricCanvas
    participant OfflineStorage as IndexedDB
    participant SyncQueue
    participant Navigator
    participant PlannerPersistence
    participant Supabase

    User->>FabricCanvas: Edits plan (offline)
    FabricCanvas->>OfflineStorage: savePlan()
    OfflineStorage->>SyncQueue: enqueue(create/update/delete)
    SyncQueue-->>OfflineStorage: Queued

    Note over Navigator: Connection restored

    Navigator->>SyncQueue: online event
    SyncQueue->>SyncQueue: processSyncQueue()
    loop For each queued item
        SyncQueue->>PlannerPersistence: savePlannerDocument()
        PlannerPersistence->>Supabase: API call
        Supabase-->>PlannerPersistence: Success
        PlannerPersistence-->>SyncQueue: Synced
        SyncQueue->>OfflineStorage: removeSyncQueueItem()
    end
    SyncQueue-->>OfflineStorage: Queue cleared
```

## Data Validation Layers

1. **Client-side**: React form validation, Zod schemas in components
2. **API boundary**: Zod schema validation in route handlers
3. **Database**: PostgreSQL constraints, Drizzle schema types
4. **Supabase RLS**: Row-level security policies

## Error Handling Patterns

- **API routes**: Try/catch with standardized error responses
- **Supabase queries**: `fetchWithSupabaseRetry` with exponential backoff
- **Canvas operations**: Error boundaries around Fabric/Three.js components
- **Offline sync**: Retry queue with max 3 attempts, conflict detection
