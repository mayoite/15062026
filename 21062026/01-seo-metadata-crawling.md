# SEO and Metadata Crawling Audit Report

**Audit Path:** `21062026/01-seo-metadata-crawling.md`  
**Date:** June 21, 2026  
**Auditor:** Agent 1 (UX & Accessibility Specialist)  

---

## Executive Scorecard

| Parameter | Description | Score (1-10) | Status |
|---|---|---|---|
| **1** | HTML Meta Tags completeness (meta description, keyword, title for all routes) | 9.5/10 | Excellent |
| **2** | Open Graph (OG) & Twitter card tags presence and dynamic configuration | 9.0/10 | Excellent |
| **3** | Sitemap.xml completeness, correctness, and dynamic building | 9.5/10 | Excellent |
| **4** | Robots.txt presence, structure, and path exclusions | 9.5/10 | Excellent |
| **5** | Semantic HTML structure (one <h1> per page, hierarchical headings, layout elements) | 9.0/10 | Excellent |

**Overall SEO & Crawlability Score:** **9.3 / 10**

---

## Detailed Audit Findings & Recommendations

### Parameter 1: HTML Meta Tags Completeness
**Score:** 9.5 / 10

#### Findings
The website implements a robust, centralized metadata schema utilizing Next.js App Router metadata conventions. 
- **Centralized Schema Definition:** Page-level metadata and static configuration tags are centralized in [seo.ts](file:///e:/16062026/data/site/seo.ts). This file exposes standard utility functions:
  - `buildSiteMetadata()`: Generates fallback site-wide metadata including core definitions, description, keywords, viewport icons, and manifests.
  - `buildPageMetadata()`: Helper for generating dynamic page-level titles and descriptions, ensuring page specificity.
- **Root Layout Integration:** The root layout [layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx#L18) imports and exports the output of `buildSiteMetadata()` directly as the static metadata export.
- **Dynamic Metadata Handling:** Dynamic routes, such as individual product pages, leverage the `generateMetadata` Next.js hook to generate page-specific title, description, and canonical URL tags based on the active product data.

#### Citations
- Site-wide metadata configuration: [seo.ts](file:///e:/16062026/data/site/seo.ts)
- Root layout static metadata: [layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx#L18)
- Product dynamic page metadata: [ProductViewer.tsx](file:///e:/16062026/app/\(site\)/products/%5Bcategory%5D/%5Bproduct%5D/ProductViewer.tsx)

#### Recommendations
- Ensure any future static pages (e.g. Terms of Service, Privacy Policy) define page-specific metadata using `buildPageMetadata()` instead of falling back to global site metadata, preventing duplicate page titles/descriptions in search index consoles.

---

### Parameter 2: Open Graph (OG) & Twitter Card Tags
**Score:** 9.0 / 10

#### Findings
Open Graph and Twitter Card schemas are fully integrated within the `buildSiteMetadata` helper, ensuring standard compliance across the repository.
- **Global Configs:** Metadata output includes `openGraph` and `twitter` structures declaring type (`website`), locale, site name, and standard Twitter card size (`summary_large_image`).
- **Dynamic Image Computing:** The metadata dynamically resolves image routes. For example, in dynamic product pages, the product's primary visual is injected into the Open Graph `images` list to serve as the card preview image.
- **Relative URL Resolution:** Next.js metadata API automatically handles absolute base URL resolution using the configured `metadataBase` parameter, avoiding broken relative paths in crawler previews.

#### Citations
- Open Graph definition details: [seo.ts](file:///e:/16062026/data/site/seo.ts#L48-L77)
- Viewport config and standard tags: [layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx#L20-L40)

#### Recommendations
- Verify that standard fallback social preview images (like `og-image.jpg`) exist inside the `/public` directory to prevent crawlers from experiencing 404s when loading fallback share previews for non-product routes.

---

### Parameter 3: Sitemap.xml Completeness and Dynamic Building
**Score:** 9.5 / 10

#### Findings
The sitemap is dynamically generated using the standard Next.js `sitemap.ts` convention at the root level.
- **Dynamic Product crawling:** The sitemap query fetches categories and products dynamically, generating absolute URLs for every product and index page.
- **Static Pages mapping:** Standard marketing pages (home, about, contact, and `/planner`) are manually declared with appropriate update frequencies (`weekly` or `monthly`) and prioritization weights (`1.0` for home and planner).
- **Proper URL Scheme:** Binds sitemaps to the canonical domain (`https://oando.co.in`), yielding correct crawl links.

#### Citations
- Sitemap dynamic builder: [sitemap.ts](file:///e:/16062026/app/\(site\)/sitemap.ts)

#### Recommendations
- Add error boundary wrappers inside the dynamic sitemap fetch block. If the database/API query fails during production build compilation, the sitemap builder should catch the error and fall back to rendering the static marketing pages rather than failing the entire build.

---

### Parameter 4: Robots.txt Exclusions and Path Structure
**Score:** 9.5 / 10

#### Findings
Crawl routing is controlled dynamically via [robots.ts](file:///e:/16062026/app/\(site\)/robots.ts).
- **Correct Exclusions:** The builder blocks crawlers (`User-Agent: *`) from accessing secure admin panels, user CRM interfaces, backend ops panels, and dynamic server API routes (`/admin`, `/crm`, `/ops`, `/api`).
- **Canonical Sitemap Binding:** Automatically points crawlers to the dynamically compiled sitemap at `https://oando.co.in/sitemap.xml`.

#### Citations
- Robots.txt definition: [robots.ts](file:///e:/16062026/app/\(site\)/robots.ts)

#### Recommendations
- Consistently review disallowed folders as new routes are introduced (e.g. user account pages or cart checkout pages) to ensure private or intermediate transactional screens are kept out of search index caches.

---

### Parameter 5: Semantic HTML Structure
**Score:** 9.0 / 10

#### Findings
Main application pages follow strict semantic markup principles:
- **Heading Hierarchy:** Pages generally respect a strict single `<h1>` tag requirement per page, followed by hierarchical `<h2>`, `<h3>` tags.
- **Structural Tags:** Standard landmarks like `<header>`, `<main>`, `<nav>`, and `<footer>` are used globally to outline major page segments.
- **Layout Landmarks:** The site layout wraps content in a main scroll block with `#main-content` IDs, allowing skip-link anchoring.

#### Citations
- Root layouts wrapping semantic blocks: [layout.tsx](file:///e:/16062026/app/\(site\)/layout.tsx#L52-L68)
- Content and landing headers: [page.tsx](file:///e:/16062026/app/\(site\)/page.tsx)

#### Recommendations
- Ensure that dynamic overlay elements (like dialog slide-outs) do not disrupt the heading hierarchy (e.g., using `<h3>` inside an overlay where the parent layout only goes down to `<h2>`).
