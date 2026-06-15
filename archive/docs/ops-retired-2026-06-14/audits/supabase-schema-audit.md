# Supabase Schema Audit

- Generated at: 2026-06-04T18:09:16.341Z
- Supabase host: erpweaiypimorcunaimz.supabase.co

## Table Probes
- categories: present, rows=13
- products: present, rows=279
- product_specs: present, rows=0
- product_images: present, rows=0
- product_slug_aliases: present, rows=93
- business_stats_current: present, rows=1
- customer_queries: present, rows=0
- catalog_categories: present, rows=13
- catalog_products: present, rows=279
- catalog_product_specs: present, rows=0
- catalog_product_images: present, rows=0
- catalog_product_slug_aliases: present, rows=93

## Runtime Query Checks
- Products list: ok (ok)
- Categories list: ok (ok)
- Product specs: ok (ok)
- Product images: ok (ok)
- Alias table: ok (ok)
- Business stats: ok (ok)
- Customer queries: fail (Could not find the table 'public.customer_queries' in the schema cache)

## Data Quality Summary
- products: 279
- categories: 13
- blank slugs: 0
- duplicate slugs: 0
- missing category IDs: 0
- missing subcategory slug/id: 279
- missing alt text: 279
- missing primary image: 0
- duplicate normalized name keys by category: 91
- alias rows: 93
- blank alias rows: 0
- self alias rows: 0
- missing business stats rows: 0
- active business stats rows: 1

## Duplicate Name Keys By Category
- oando-storage / prelam: 4 (oando-storage--pedestal, oando-storage--prelam-storage, pedestal, prelam-storage)
- oando-collaborative / cocoon-pod: 2 (cocoon-pod, oando-collaborative--cocoon-pod)
- oando-collaborative / solace-pod: 2 (oando-collaborative--solace-pod, solace-pod)
- oando-educational / academia: 2 (academia, oando-educational--academia)
- oando-educational / audi-chair: 2 (audi-chair, oando-educational--audi-chair)
- oando-educational / classcraft: 2 (classcraft, oando-educational--classcraft)
- oando-educational / connecta: 2 (connecta, oando-educational--connecta)
- oando-educational / forma: 2 (forma, oando-educational--forma)
- oando-educational / learnix: 2 (learnix, oando-educational--learnix)
- oando-educational / magazine-rack: 2 (magazine-rack, oando-educational--magazine-rack)
- oando-educational / metal-bed: 2 (metal-bed, oando-educational--metal-bed)
- oando-educational / performer: 2 (oando-educational--performer, performer)
- oando-educational / podium: 2 (oando-educational--podium, podium)
- oando-educational / wooden-bed: 2 (oando-educational--wooden-bed, wooden-bed)
- oando-educational / xplorer: 2 (oando-educational--xplorer, xplorer)
- oando-soft-seating / accent: 2 (accent, oando-soft-seating--accent)
- oando-soft-seating / adam: 2 (adam, oando-soft-seating--adam)
- oando-soft-seating / alonzo: 2 (alonzo, oando-soft-seating--alonzo)
- oando-soft-seating / arcana: 2 (arcana, oando-soft-seating--arcana)
- oando-soft-seating / arco: 2 (arco, oando-soft-seating--arco)
- oando-soft-seating / armora: 2 (armora, oando-soft-seating--armora)
- oando-soft-seating / brim: 2 (brim, oando-soft-seating--brim)
- oando-soft-seating / ceda: 2 (ceda, oando-soft-seating--ceda)
- oando-soft-seating / cirq: 2 (cirq, oando-soft-seating--cirq)
- oando-soft-seating / cocoon: 2 (cocoon, oando-soft-seating--cocoon)
