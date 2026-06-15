"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./BackendArchitecturePageView.module.css";

const summaryItems = [
  ["Identity", "Appwrite sessions, users, roles, and approved messaging."],
  ["Data", "DigitalOcean Postgres through Drizzle repositories."],
  ["Launch bar", "Login, quote persistence, and smoke checks before promotion."],
];

const platformCards = [
  {
    name: "Appwrite",
    role: "Identity and messaging",
    items: ["Email/password auth", "Users, roles, sessions", "Functions if needed", "Messaging through approved SMTP"],
    note: "Region aligned with the application.",
  },
  {
    name: "DigitalOcean Managed Postgres",
    role: "Primary data store",
    items: ["Quotes", "Products", "Users profile data", "Audit and events"],
    note: "Managed PostgreSQL with backups.",
  },
  {
    name: "Drizzle ORM",
    role: "Type-safe data access",
    items: ["SQL queries", "Migrations", "Schema as code", "Zod validation"],
    note: "Connection through DATABASE_URL.",
  },
  {
    name: "Cloudflare R2",
    role: "Object storage and CDN",
    items: ["Product images", "Documents", "Downloads", "Static assets"],
    note: "S3-compatible storage.",
  },
  {
    name: "Hosting",
    role: "Application runtime",
    items: ["Next.js SSR/ISR", "Node.js API routes", "CI/CD", "Observability hooks"],
    note: "Vercel now, DigitalOcean target path documented.",
  },
];

const packageMap = [
  ["appwrite", "Browser SDK for auth sessions and future messaging calls."],
  ["node-appwrite", "Server SDK for admin users, platform setup, and backend Appwrite calls."],
  ["drizzle-orm", "Type-safe SQL access layer for DigitalOcean Postgres."],
  ["postgres", "Database driver used by Drizzle through DATABASE_URL."],
  ["legacy Supabase bridge", "Temporary compatibility layer for unmigrated code paths."],
  ["Playwright smoke scripts", "Launch-critical route, console, and screenshot evidence."],
];

const flowItems = [
  {
    id: "login-page",
    title: "Login Page",
    detail: "Customer enters email and password.",
    tone: "neutral" as const,
    tooltip: "The only browser input for account entry. It should never expose raw provider errors.",
    founder:
      "This is the front door. If login fails, customers lose trust before they see the product suite.",
    engineer:
      "Uses the public Appwrite endpoint and project id. The SGP endpoint must be inlined at build time.",
  },
  {
    id: "login",
    title: "Login",
    detail: "Email/password request.",
    tone: "neutral" as const,
    tooltip: "A synchronous request from the browser to Appwrite.",
    founder: "The customer asks for access. The system must answer clearly.",
    engineer: "The browser SDK calls Appwrite account session creation with public client config.",
  },
  {
    id: "auth",
    title: "Auth",
    detail: "Sessions, users, roles.",
    tone: "appwrite" as const,
    tooltip: "Appwrite owns identity and session state.",
    founder: "Appwrite is the membership desk for the whole product.",
    engineer:
      "Appwrite owns users, sessions, roles, and future messaging calls. Server admin work uses node-appwrite.",
  },
  {
    id: "session",
    title: "Session Verified",
    detail: "Protected APIs check identity.",
    tone: "neutral" as const,
    tooltip: "Protected routes should verify before showing private surfaces.",
    founder: "The app confirms the visitor is allowed into private rooms.",
    engineer: "Session verification belongs at route/API boundaries, not scattered in UI branches.",
  },
  {
    id: "protected",
    title: "Protected APIs",
    detail: "Server-side checks.",
    tone: "neutral" as const,
    tooltip: "Server code decides what private data can load.",
    founder: "Private tools stay private even if someone guesses a URL.",
    engineer: "API and route guards should centralize access checks and customer-safe fallbacks.",
  },
  {
    id: "quote-form",
    title: "Quote Form",
    detail: "Contact and workspace brief.",
    tone: "neutral" as const,
    tooltip: "Quote capture starts as a useful commercial brief, not a generic message box.",
    founder: "This is the sales counter. It must collect enough context to act.",
    engineer: "The form should validate name, contact, context, source path, and preferred contact method.",
  },
  {
    id: "quote-request",
    title: "Quote Request",
    detail: "Validate, rate-limit, persist.",
    tone: "neutral" as const,
    tooltip: "The request is saved first, then optionally notified.",
    founder:
      "A lead is only real when the business can find it, assign it, and follow it up.",
    engineer:
      "Persist to customer_queries through a repository boundary; this keeps the current Supabase bridge replaceable by Drizzle.",
  },
  {
    id: "database",
    title: "Primary Database",
    detail: "Quotes, products, users, audit.",
    tone: "data" as const,
    tooltip: "DigitalOcean Managed Postgres is the target source of record.",
    founder: "The database is the memory of the business.",
    engineer: "Target is DigitalOcean Managed Postgres via DATABASE_URL and Drizzle repositories.",
  },
  {
    id: "assets",
    title: "Asset Delivery",
    detail: "Images and downloads.",
    tone: "storage" as const,
    tooltip: "R2 handles product assets and documents.",
    founder: "Images and downloads stay fast without tying business data to storage.",
    engineer: "R2 provides S3-compatible object storage; app routes should consume stable URLs.",
  },
  {
    id: "ops",
    title: "Admin Review",
    detail: "Ops query screen and SLA.",
    tone: "ops" as const,
    tooltip: "The monitored destination until Appwrite Messaging is configured.",
    founder: "A person owns the request and the response time.",
    engineer:
      "The ops/admin query screen is the interim monitored destination; Appwrite Messaging can notify after approved SMTP setup.",
  },
  {
    id: "product-pages",
    title: "Product Pages",
    detail: "SSR / ISR catalogue.",
    tone: "neutral" as const,
    tooltip: "Product routes should read through repositories, not provider-specific calls.",
    founder: "Product data should feel reliable and current.",
    engineer: "Product pages should read through Drizzle repositories after migration.",
  },
  {
    id: "drizzle-repository",
    title: "Drizzle Repository",
    detail: "Typed SQL boundary.",
    tone: "data" as const,
    tooltip: "The repository boundary is how Supabase exits without route rewrites.",
    founder: "This keeps the platform replaceable instead of trapped.",
    engineer: "Repository boundary isolates SQL access and makes the migration testable.",
  },
  {
    id: "do-postgres",
    title: "DigitalOcean Postgres",
    detail: "Source of record.",
    tone: "data" as const,
    tooltip: "Managed Postgres is the long-term business data home.",
    founder: "This is where the company keeps the durable record.",
    engineer: "Connect through DATABASE_URL; keep migrations in Drizzle.",
  },
  {
    id: "downloads",
    title: "Downloads",
    detail: "Signed or public asset URL.",
    tone: "neutral" as const,
    tooltip: "Assets should be served without leaking storage internals into app code.",
    founder: "Files should simply open quickly and reliably.",
    engineer: "Use stable CDN/R2 URLs and signed links when needed.",
  },
  {
    id: "customer-browser",
    title: "Customer Browser",
    detail: "Cached asset response.",
    tone: "neutral" as const,
    tooltip: "The customer receives a fast file response without knowing the provider.",
    founder: "The buyer sees the image, not the infrastructure.",
    engineer: "Cache headers and stable URLs matter more than provider names at the edge.",
  },
  {
    id: "appwrite-messaging",
    title: "Appwrite Messaging",
    detail: "Only with approved SMTP.",
    tone: "appwrite" as const,
    tooltip: "Messaging should not add direct Resend code to the app.",
    founder: "Notifications can happen without adding another platform to the app.",
    engineer: "The app calls Appwrite Messaging; Appwrite routes through approved SMTP/email provider.",
  },
  {
    id: "sales-owner",
    title: "Sales Owner",
    detail: "SLA and follow-up.",
    tone: "ops" as const,
    tooltip: "Technology does not close the lead; ownership does.",
    founder: "A named person must respond within the promised window.",
    engineer: "Record owner, status, response timestamp, and fallback path.",
  },
];

const migrationSteps = [
  ["1. Current", "Supabase Auth, Supabase data, partial Appwrite auth, existing app routes."],
  ["2. Bridge", "Appwrite auth, repository boundaries, Supabase only behind compatibility seams."],
  ["3. Target", "Appwrite identity, DigitalOcean Postgres data, Drizzle access, R2 storage."],
  ["4. Cutover Checks", "Data parity, auth verification, quote integrity, smoke pass, rollback ready."],
];

const runbookItems = [
  ["Env check", "Required public and server variables exist in local, preview, production, and development."],
  ["Valid login", "The Appwrite test user can create an email/password session with the SGP endpoint."],
  ["Quote test", "A contact or quote request persists to the customer query system of record."],
  ["Smoke test", "Launch-critical routes pass without critical console errors on desktop and mobile."],
  ["Rollback triggers", "Broken login, broken quote, missing env, blank page, raw backend exception."],
];

const pathGroups = [
  {
    id: "login-path",
    label: "Login Path",
    description: "Customer auth path from browser entry to protected access.",
    nodes: ["login-page", "auth", "protected"],
    arrows: ["Login", "Session verified"],
  },
  {
    id: "quote-path",
    label: "Quote Path",
    description: "Commercial request path from form capture to durable persistence.",
    nodes: ["quote-form", "quote-request", "database"],
    arrows: ["Quote request", "Persist"],
  },
  {
    id: "catalog-path",
    label: "Product Data",
    description: "Read path for catalog pages after the repository cutover.",
    nodes: ["product-pages", "drizzle-repository", "do-postgres"],
    arrows: ["Product data", "Read / write"],
  },
  {
    id: "asset-path",
    label: "Asset Delivery",
    description: "Static and signed file delivery without leaking provider details.",
    nodes: ["downloads", "assets", "customer-browser"],
    arrows: ["Asset delivery", "Serve"],
  },
  {
    id: "ops-path",
    label: "Ops Review",
    description: "Ownership and follow-up path for inbound commercial requests.",
    nodes: ["ops", "appwrite-messaging", "sales-owner"],
    arrows: ["Admin review", "Notify"],
  },
] as const;

function FlowNode({
  title,
  detail,
  tone = "neutral",
  selected,
  tooltip,
  onSelect,
}: {
  title: string;
  detail: string;
  tone?: "neutral" | "appwrite" | "data" | "storage" | "ops";
  selected: boolean;
  tooltip: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.flowNode} ${styles[tone]} ${selected ? styles.flowNodeActive : ""}`}
      aria-label={`Inspect ${title}`}
      onClick={onSelect}
    >
      <strong>{title}</strong>
      <span>{detail}</span>
      <em role="tooltip">{tooltip}</em>
    </button>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className={styles.flowArrow} aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

export function BackendArchitecturePageView() {
  const [selectedPathId, setSelectedPathId] = useState<(typeof pathGroups)[number]["id"]>("login-path");
  const [selectedFlowId, setSelectedFlowId] = useState("login-page");
  const [mode, setMode] = useState<"founder" | "engineer">("founder");
  const [checkedRunbook, setCheckedRunbook] = useState<Record<string, boolean>>({});
  const getFlow = (id: string) => flowItems.find((item) => item.id === id) ?? flowItems[0];
  const getPath = (id: (typeof pathGroups)[number]["id"]) =>
    pathGroups.find((item) => item.id === id) ?? pathGroups[0];
  const selectedPath = getPath(selectedPathId);
  const selectedFlow = getFlow(selectedFlowId);
  const checkedCount = runbookItems.filter(([title]) => checkedRunbook[title]).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          OANDO
          <span>Architecture</span>
        </Link>
        <nav className={styles.nav} aria-label="Backend architecture sections">
          <a href="#platform-boundary">Overview</a>
          <a href="#critical-paths">Flow</a>
          <a href="#migration">Migration</a>
          <a href="#runbook">Runbook</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>Launch architecture, reduced to the critical paths.</p>
          <h1>Oando Backend Architecture</h1>
          <p className={styles.lede}>
            <span>Appwrite for identity and messaging.</span> DigitalOcean Postgres for data.
            Drizzle for access. R2 for storage.
          </p>
          <div className={styles.actions}>
            <a href="#critical-paths" className={styles.primaryAction}>
              Walk the Flow
            </a>
            <a href="#migration" className={styles.secondaryAction}>
              Migration Plan
            </a>
          </div>
        </div>

        <aside className={styles.heroPanel} aria-label="Architecture summary">
          <span>Launch Summary</span>
          <div className={styles.summaryList}>
            {summaryItems.map(([title, body]) => (
              <article key={title} className={styles.summaryCard}>
                <strong>{title}</strong>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className={styles.flowBoard} id="critical-paths" aria-label="Architecture flowchart">
        <div className={styles.flowBoardHeader}>
          <div>
            <h2>Critical Paths</h2>
            <p>{selectedPath.description}</p>
          </div>
          <div className={styles.pathSwitch} aria-label="Critical architecture paths">
            {pathGroups.map((path) => (
              <button
                key={path.id}
                type="button"
                className={selectedPath.id === path.id ? styles.pathActive : ""}
                onClick={() => {
                  setSelectedPathId(path.id);
                  setSelectedFlowId(path.nodes[0]);
                }}
              >
                {path.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.flowBoardInner}>
          <div className={styles.flowGrid}>
            {selectedPath.nodes.map((nodeId, index) => (
              <div key={nodeId} className={styles.flowStep}>
                <FlowNode
                  {...getFlow(nodeId)}
                  selected={selectedFlowId === nodeId}
                  onSelect={() => setSelectedFlowId(nodeId)}
                />
                {index < selectedPath.arrows.length ? <Arrow label={selectedPath.arrows[index]} /> : null}
              </div>
            ))}
          </div>

          <aside className={styles.inspector} aria-live="polite">
            <div className={styles.modeSwitch} aria-label="Explanation depth">
              <button
                type="button"
                className={mode === "founder" ? styles.modeActive : ""}
                onClick={() => setMode("founder")}
              >
                Founder View
              </button>
              <button
                type="button"
                className={mode === "engineer" ? styles.modeActive : ""}
                onClick={() => setMode("engineer")}
              >
                Engineer View
              </button>
            </div>
            <h2>Selected flow: {selectedFlow.title}</h2>
            <p>{mode === "founder" ? selectedFlow.founder : selectedFlow.engineer}</p>
            <dl>
              <div>
                <dt>Current node</dt>
                <dd>{selectedFlow.detail}</dd>
              </div>
              <div>
                <dt>Tooltip</dt>
                <dd>{selectedFlow.tooltip}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className={styles.section} id="platform-boundary">
        <div className={styles.sectionIntro}>
          <h2>Platform Boundary</h2>
          <p>Each platform gets one job. The application should not scatter provider calls through unrelated routes.</p>
        </div>
        <div className={styles.platformGrid}>
          {platformCards.map((card) => (
            <article key={card.name} className={styles.platformCard}>
              <h3>{card.name}</h3>
              <p>{card.role}</p>
              <ul>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <span>{card.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="runtime-flow">
        <div className={styles.sectionIntro}>
          <h2>Runtime Request Flow</h2>
          <p>Two launch-critical paths are kept explicit: authentication and quote/contact submission.</p>
        </div>
        <div className={styles.runtimeGrid}>
          <article>
            <h3>Login Flow</h3>
            <ol>
              <li>Customer submits email and password from the login page.</li>
              <li>Browser calls Appwrite with the public SGP endpoint and project id.</li>
              <li>Appwrite creates the session and returns the account context.</li>
              <li>Protected surfaces verify session state before rendering customer data.</li>
            </ol>
          </article>
          <article>
            <h3>Quote Flow</h3>
            <ol>
              <li>Customer submits a contact or quote request with commercial context.</li>
              <li>Next.js API validates, rate-limits, and normalizes the payload.</li>
              <li>The request is persisted to the customer query system of record.</li>
              <li>Ops reviews the query screen now; Appwrite Messaging can notify later.</li>
            </ol>
          </article>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <h2>Package Map</h2>
          <p>Current package responsibilities, including the migration bridge.</p>
        </div>
        <div className={styles.packageGrid}>
          {packageMap.map(([name, role]) => (
            <article key={name} className={styles.packageCard}>
              <h3>{name}</h3>
              <p>{role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="migration">
        <div className={styles.sectionIntro}>
          <h2>Migration Walkthrough</h2>
          <p className={styles.transitionLabel}>Current -&gt; Bridge -&gt; Target</p>
        </div>
        <div className={styles.timeline}>
          {migrationSteps.map(([title, body], index) => (
            <article key={title} className={styles.timelineCard}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} id="runbook">
        <div className={styles.sectionIntro}>
          <h2>Launch Runbook</h2>
          <p>Operational checks that decide whether the system is safe to promote.</p>
        </div>
        <div className={styles.runbookGrid}>
          {runbookItems.map(([title, body]) => (
            <article key={title} className={`${styles.runbookCard} ${checkedRunbook[title] ? styles.runbookCardDone : ""}`}>
              <label>
                <input
                  type="checkbox"
                  checked={Boolean(checkedRunbook[title])}
                  onChange={(event) =>
                    setCheckedRunbook((current) => ({
                      ...current,
                      [title]: event.target.checked,
                    }))
                  }
                />
                <h3>{title}</h3>
              </label>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className={styles.checkProgress} role="status">
          {checkedCount} / {runbookItems.length} checks marked
        </div>
        <p className={styles.rollback}>Roll back if triggered</p>
      </section>

      <section className={styles.generatedReference} aria-label="Image generated architecture concept">
        <div>
          <h2>Image-Generated Concept Board</h2>
          <p>
            The production page above is code-native. This generated board is kept as the visual
            reference for the flowchart composition and section rhythm.
          </p>
          <a
            className={styles.referenceLink}
            href="/images/backend-architecture/generated-architecture-board.png"
          >
            Open concept board
          </a>
        </div>
        <div className={styles.referenceImageFrame}>
          <Image
            src="/images/backend-architecture/generated-architecture-board.png"
            alt="Generated visual concept for the Oando backend architecture website"
            width={1800}
            height={2600}
            className={styles.referenceImage}
            loading="lazy"
            sizes="(max-width: 980px) 100vw, 680px"
          />
        </div>
      </section>
    </main>
  );
}
