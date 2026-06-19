import { describe, it, expect } from 'vitest';
import {
  buildSiteMetadata,
  buildPageMetadata,
  buildPageJsonLd,
  buildBreadcrumbJsonLd,
  buildGlobalJsonLd,
} from '@/data/site/seo';
import { SITE_BRAND } from '@/data/site/brand';
import { SITE_CONTACT } from '@/data/site/contact';

const TEST_SITE_URL = 'https://example.com';

// ---------------------------------------------------------------------------
// buildSiteMetadata
// ---------------------------------------------------------------------------

describe('buildSiteMetadata', () => {
  it('returns metadataBase as a URL object', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.metadataBase).toBeInstanceOf(URL);
    expect(meta.metadataBase!.toString()).toBe(TEST_SITE_URL + '/');
  });

  it('has a title object with default and template', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.title).toBeDefined();
    expect(typeof meta.title).toBe('object');
  });

  it('has a non-empty description', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.description).toBeTruthy();
    expect(meta.description!.length).toBeGreaterThan(10);
  });

  it('has keywords array', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(Array.isArray(meta.keywords)).toBe(true);
    expect(meta.keywords!.length).toBeGreaterThan(0);
  });

  it('has openGraph configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph!.type).toBe('website');
    expect(meta.openGraph!.locale).toBe('en_IN');
  });

  it('has openGraph images with dimensions', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    const images = meta.openGraph!.images as Array<{ width: number; height: number }>;
    expect(images).toBeDefined();
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it('has twitter card configuration', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.twitter).toBeDefined();
    expect(meta.twitter!.card).toBe('summary_large_image');
  });

  it('has robots allowing index and follow', () => {
    const meta = buildSiteMetadata(TEST_SITE_URL);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });
});

// ---------------------------------------------------------------------------
// buildPageMetadata
// ---------------------------------------------------------------------------

describe('buildPageMetadata', () => {
  const input = {
    title: 'Test Page',
    description: 'A description for testing',
    path: '/about',
  };

  it('sets the title from input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.title).toBe('Test Page');
  });

  it('sets the description from input', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.description).toBe('A description for testing');
  });

  it('builds canonical URL from siteUrl and path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.alternates!.canonical).toBe('https://example.com/about/');
  });

  it('canonical URL has no double slashes in path', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, path: '/products/seating' });
    const canonical = meta.alternates!.canonical as string;
    // After protocol, no double slashes
    const afterProtocol = canonical.replace('https://', '');
    expect(afterProtocol).not.toContain('//');
  });

  it('openGraph url matches canonical', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.openGraph!.url).toBe('https://example.com/about/');
  });

  it('openGraph images have width 1200 and height 630', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    const images = meta.openGraph!.images as Array<{ width: number; height: number }>;
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
  });

  it('defaults type to website when not specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, input);
    expect(meta.openGraph!.type).toBe('website');
  });

  it('uses custom type when specified', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, type: 'article' });
    expect(meta.openGraph!.type).toBe('article');
  });

  it('includes custom keywords when provided', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, { ...input, keywords: ['test', 'page'] });
    expect(meta.keywords).toEqual(['test', 'page']);
  });
});

// ---------------------------------------------------------------------------
// buildPageJsonLd
// ---------------------------------------------------------------------------

describe('buildPageJsonLd', () => {
  const input = {
    path: '/about',
    title: 'About Us',
    description: 'Learn about our company',
    pageType: 'WebPage' as const,
  };

  it('has @context set to schema.org', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@context']).toBe('https://schema.org');
  });

  it('has @type matching input pageType', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@type']).toBe('WebPage');
  });

  it('builds url from siteUrl and path', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.url).toBe('https://example.com/about/');
  });

  it('sets name from title', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.name).toBe('About Us');
  });

  it('sets description from input', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.description).toBe('Learn about our company');
  });

  it('has @id with #webpage suffix', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld['@id']).toBe('https://example.com/about/#webpage');
  });

  it('sets inLanguage to en-IN', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, input);
    expect(ld.inLanguage).toBe('en-IN');
  });

  it('supports CollectionPage type', () => {
    const ld = buildPageJsonLd(TEST_SITE_URL, { ...input, pageType: 'CollectionPage' });
    expect(ld['@type']).toBe('CollectionPage');
  });
});

// ---------------------------------------------------------------------------
// buildBreadcrumbJsonLd
// ---------------------------------------------------------------------------

describe('buildBreadcrumbJsonLd', () => {
  it('has @type BreadcrumbList', () => {
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, [{ name: 'Home', path: '/' }]);
    expect(ld['@type']).toBe('BreadcrumbList');
  });

  it('creates list items with position starting at 1', () => {
    const items = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].position).toBe(1);
    expect(ld.itemListElement[1].position).toBe(2);
  });

  it('builds full URLs for each breadcrumb item', () => {
    const items = [{ name: 'Products', path: '/products' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].item).toBe('https://example.com/products/');
  });

  it('sets name for each breadcrumb item', () => {
    const items = [{ name: 'Seating', path: '/products/seating' }];
    const ld = buildBreadcrumbJsonLd(TEST_SITE_URL, items);
    expect(ld.itemListElement[0].name).toBe('Seating');
  });
});

// ---------------------------------------------------------------------------
// buildGlobalJsonLd
// ---------------------------------------------------------------------------

describe('buildGlobalJsonLd', () => {
  it('returns schema.org graph with organization, website, and local business', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@graph']).toHaveLength(3);
    const types = ld['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'FurnitureStore']);
  });

  it('organization node includes contact points and social sameAs links', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const org = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'Organization');
    expect(org.name).toBe(SITE_BRAND.companyName);
    expect(org.logo).toBe(`${TEST_SITE_URL}/logo-v2.webp`);
    expect(org.email).toBe(SITE_CONTACT.salesEmail);
    expect(org.contactPoint).toHaveLength(2);
    expect(org.sameAs).toContain(TEST_SITE_URL);
    expect(org.sameAs.length).toBeGreaterThan(SITE_CONTACT.socialLinks.length);
  });

  it('website node references organization publisher', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const website = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebSite');
    expect(website.inLanguage).toBe('en-IN');
    expect(website.publisher['@id']).toBe(`${TEST_SITE_URL}#organization`);
  });

  it('local business node includes address, geo, and hours', () => {
    const ld = buildGlobalJsonLd(TEST_SITE_URL);
    const store = ld['@graph'].find((node: { '@type': string }) => node['@type'] === 'FurnitureStore');
    expect(store.address.addressLocality).toBe(SITE_CONTACT.address.addressLocality);
    expect(store.geo.latitude).toBe(SITE_CONTACT.geo.latitude);
    expect(store.openingHours).toBe(SITE_CONTACT.openingHours);
    expect(store.priceRange).toBe(SITE_CONTACT.priceRange);
  });

  it('uses custom image when provided in buildPageMetadata', () => {
    const meta = buildPageMetadata(TEST_SITE_URL, {
      title: 'Custom',
      description: 'Custom page',
      path: '/custom',
      image: '/custom-og.webp',
    });
    const images = meta.openGraph!.images as Array<{ url: string }>;
    expect(images[0].url).toBe('/custom-og.webp');
  });
});
