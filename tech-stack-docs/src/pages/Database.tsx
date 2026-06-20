import { MermaidDiagram } from '../components/MermaidDiagram'
import { CodeBlock } from '../components/CodeBlock'
import { CollapsibleSection } from '../components/CollapsibleSection'

const schemaDiagram = `erDiagram
    users ||--o{ plans : owns
    users ||--o{ leads : manages
    users ||--o{ activity : performs
    products ||--o{ plan_items : placed_in
    plans ||--o{ plan_items : contains
    products ||--o{ product_images : has
    products ||--o{ product_variants : has
    leads ||--o{ activity : tracks

    users {
        uuid id PK
        text email UK
        text role
        timestamptz created_at
    }
    plans {
        uuid id PK
        uuid user_id FK
        jsonb data
        text name
        timestamptz updated_at
    }
    products {
        uuid id PK
        text slug UK
        text name
        text category
        numeric price
        text image_path
        text model_path
        jsonb metadata
    }
    plan_items {
        uuid id PK
        uuid plan_id FK
        uuid product_id FK
        jsonb transform
    }
    leads {
        uuid id PK
        uuid assigned_to FK
        text name
        text email
        text stage
        numeric value
    }
    product_images {
        uuid id PK
        uuid product_id FK
        text path
        int sort_order
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        text name
        jsonb options
    }
    activity {
        uuid id PK
        uuid user_id FK
        uuid lead_id FK
        text type
        jsonb payload
    }`

const rlsDiagram = `flowchart LR
    Client["Client Request<br/>+ JWT"]
    Supa["Supabase API"]
    RLS["RLS Policies<br/>on each table"]
    DB[("PostgreSQL")]
    Result{"Filtered<br/>Rows"}

    Client --> Supa
    Supa --> RLS
    RLS --> DB
    DB --> Result

    Result -->|user owns| Pass["Rows returned"]
    Result -->|not owner| Empty["No rows"]

    style RLS fill:#052e16,stroke:#22c55e
    style Pass fill:#052e16,stroke:#22c55e
    style Empty fill:#2a0e0e,stroke:#ef4444`

const migrationCommands = [
  { cmd: 'npm.cmd run db:apply', desc: 'Apply pending migrations to linked Supabase' },
  { cmd: 'npm.cmd run db:sync-drizzle', desc: 'Sync Drizzle schema to Supabase' },
  { cmd: 'npm.cmd run db:types', desc: 'Generate TypeScript types from Supabase schema' },
  { cmd: 'npm.cmd run db:types:admin', desc: 'Generate admin-specific types' },
  { cmd: 'npm.cmd run db:advisors:security', desc: 'Run security advisor checks' },
  { cmd: 'npm.cmd run db:advisors:performance', desc: 'Run performance advisor checks' },
  { cmd: 'npm.cmd run db:test', desc: 'Test database connection' },
  { cmd: 'npm.cmd run db:ensure-plans', desc: 'Ensure plans table exists' },
  { cmd: 'npm.cmd run db:backup-dropped', desc: 'Backup dropped tables before changes' },
  { cmd: 'npm.cmd run seed', desc: 'Seed development data' },
]

export function Database() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Database</h1>
        <p className="section-subheading">
          PostgreSQL on Supabase — schema design, Drizzle ORM, migrations, and Row Level Security.
        </p>
      </header>

      {/* Schema */}
      <section id="schema" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">Schema Overview</h2>
        <p className="text-sm text-gray-400 mb-4">
          The database stores users (Supabase Auth), plans (planner save state), products (catalog), leads (CRM), 
          and supporting tables for images, variants, and activity tracking.
        </p>
        <MermaidDiagram chart={schemaDiagram} title="Entity Relationship Diagram" />
      </section>

      {/* RLS */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-2">Row Level Security (RLS)</h2>
        <p className="text-sm text-gray-400 mb-4">
          Every table with user-owned data has RLS enabled. Policies filter rows based on the authenticated user's 
          JWT claims — a user can only read/write their own plans, leads, and activity.
        </p>
        <MermaidDiagram chart={rlsDiagram} title="RLS Policy Enforcement" />

        <div className="mt-6">
          <CodeBlock
            title="Example RLS policy (SQL migration)"
            language="sql"
            code={`-- Enable RLS on plans table
alter table public.plans enable row level security;

-- Users can only see their own plans
create policy "plans_select_own"
  on public.plans for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can only insert plans they own
create policy "plans_insert_own"
  on public.plans for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only update their own plans
create policy "plans_update_own"
  on public.plans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can only delete their own plans
create policy "plans_delete_own"
  on public.plans for delete
  to authenticated
  using (auth.uid() = user_id);`}
          />
        </div>
      </section>

      {/* Drizzle ORM */}
      <section id="drizzle" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">Drizzle ORM</h2>
        <p className="text-sm text-gray-400 mb-4">
          Drizzle provides type-safe schema definitions and a query builder that compiles to SQL. It runs alongside 
          the Supabase client for direct DB access in scripts and server routes.
        </p>

        <CollapsibleSection title="Schema Definition (Drizzle)">
          <CodeBlock
            title="drizzle schema (pattern)"
            language="typescript"
            code={`import { pgTable, uuid, text, jsonb, numeric, timestamp } from 'drizzle-orm/pg-core'

export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  imagePath: text('image_path'),
  modelPath: text('model_path'),
  metadata: jsonb('metadata'),
})`}
          />
        </CollapsibleSection>

        <div className="mt-4">
          <CollapsibleSection title="Query Example" defaultOpen={false}>
            <CodeBlock
              title="drizzle query (pattern)"
              language="typescript"
              code={`import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and, desc } from 'drizzle-orm'
import postgres from 'postgres'
import { plans, planItems } from './schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client)

// Fetch a user's plans with items
export async function getUserPlans(userId: string) {
  return db
    .select({
      id: plans.id,
      name: plans.name,
      data: plans.data,
      updatedAt: plans.updatedAt,
    })
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.updatedAt))
}

// Insert a new plan
export async function createPlan(userId: string, name: string, data: unknown) {
  const [plan] = await db
    .insert(plans)
    .values({ userId, name, data })
    .returning()
  return plan
}`}
            />
          </CollapsibleSection>
        </div>
      </section>

      {/* Migrations */}
      <section id="migrations" className="mb-12 scroll-mt-4">
        <h2 className="text-xl font-bold text-white mb-2">Migrations</h2>
        <p className="text-sm text-gray-400 mb-4">
          Migrations are applied via dedicated scripts that connect to the linked Supabase instance. Drizzle Kit 
          generates migration SQL from schema changes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {migrationCommands.map(({ cmd, desc }) => (
            <div key={cmd} className="card flex flex-col gap-1">
              <code className="text-brand-400 text-xs font-mono">{cmd}</code>
              <span className="text-gray-500 text-xs font-sans">{desc}</span>
            </div>
          ))}
        </div>

        <CodeBlock
          title="scripts/db_apply_migrations.ts (pattern)"
          language="typescript"
          code={`import postgres from 'postgres'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function applyMigrations() {
  const migrationsDir = join(process.cwd(), 'config/database/migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const content = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(\`Applying \${file}...\`)
    await sql.unsafe(content)
  }

  console.log(\`Applied \${files.length} migrations\`)
  await sql.end()
}

applyMigrations().catch((err) => {
  console.error(err)
  process.exit(1)
})`}
        />
      </section>

      {/* Generated types */}
      <section className="mb-12">
        <CollapsibleSection title="Generated TypeScript Types" badge="Type Safety">
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              Supabase generates TypeScript types from the live database schema into 
              <code className="text-brand-400 bg-gray-900 px-1 rounded">config/database/types/database.types.ts</code>. 
              These power the typed Supabase client so queries are fully type-checked at compile time.
            </p>
            <CodeBlock
              title="Generated types (excerpt)"
              language="typescript"
              code={`export type Database = {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          user_id: string
          name: string
          data: JsonB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          data: JsonB
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          data?: JsonB
          updated_at?: string
        }
      }
    }
  }
}`}
            />
          </div>
        </CollapsibleSection>
      </section>
    </div>
  )
}
