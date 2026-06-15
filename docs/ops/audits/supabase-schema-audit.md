# Supabase Schema Audit

- Generated at: 2026-06-14T12:44:20.314Z
- Supabase host: erpweaiypimorcunaimz.supabase.co

## Table Probes
- categories: present, rows=11
- products: present, rows=85
- product_specs: present, rows=0
- product_images: present, rows=0
- product_slug_aliases: present, rows=0
- business_stats_current: present, rows=1
- customer_queries: present, rows=0
- catalog_categories: present, rows=11
- catalog_products: present, rows=85
- catalog_product_specs: present, rows=0
- catalog_product_images: present, rows=0
- catalog_product_slug_aliases: present, rows=0

## Runtime Query Checks
- Products list: ok (ok)
- Categories list: ok (ok)
- Product specs: ok (ok)
- Product images: ok (ok)
- Alias table: ok (ok)
- Business stats: ok (ok)
- Customer queries: fail (Could not find the table 'public.customer_queries' in the schema cache)

## Data Quality Summary
- products: 85
- categories: 11
- blank slugs: 0
- duplicate slugs: 0
- missing category IDs: 0
- missing subcategory slug/id: 85
- missing alt text: 85
- missing primary image: 43
- duplicate normalized name keys by category: 1
- alias rows: 0
- blank alias rows: 0
- self alias rows: 0
- missing business stats rows: 0
- active business stats rows: 1

## Duplicate Name Keys By Category
- oando-storage / prelam: 2 (pedestal, prelam-storage)
