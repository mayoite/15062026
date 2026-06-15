export const PRODUCT_CATEGORY_SECTION = {
  eyebrow: "Our range",
  title: "Freedom of Movement",
  subtitle:
    "Designing spaces that adapt to you. Explore our curated configurations that support focus, collaboration, and everything in between.",
  tableTitle: "Configuration guide",
  tableColumns: ["Category", "Best for", "Common setup"],
  tableRows: [
    {
      category: "Seating",
      bestFor: "Daily ergonomic work",
      setup: "Task chairs, executive chairs",
    },
    {
      category: "Workstations",
      bestFor: "Focused team productivity",
      setup: "Linear and cluster desk systems",
    },
    {
      category: "Meeting",
      bestFor: "Collaboration and review",
      setup: "4 to 12 seater table variants",
    },
    {
      category: "Storage",
      bestFor: "Document and utility control",
      setup: "Pedestals, cabinets, lockers",
    },
  ],
  cta: {
    label: "Show all products",
    href: "/products",
  },
  items: [
    {
      name: "Workstations",
      description:
        "High-quality design, clear design language and technical innovation",
      image: "/images/products/deskpro-workstation-1.webp",
      href: "/products?category=workstations",
    },
    {
      name: "Office Chairs",
      description: "Ergonomic task and executive seating for every workspace",
      image: "/images/products/chair-mesh-office.webp",
      href: "/products?category=seating",
    },
    {
      name: "Soft Seating",
      description: "Lounge and collaborative seating for modern offices",
      image: "/images/products/softseating-solace-1.webp",
      href: "/products?category=seating",
    },
    {
      name: "Cafeteria",
      description: "Break room and dining furniture for every team",
      image: "/images/products/chair-cafeteria.webp",
      href: "/products?category=seating",
    },
    {
      name: "Meeting Tables",
      description: "Conference and collaboration tables for modern teams",
      image: "/images/products/meeting-table-8pax.webp",
      href: "/products?category=conference",
    },
    {
      name: "Storage",
      description: "Pedestals, cabinets and shelving with plenty of space",
      image: "/images/products/cabin drawer close up render.webp",
      href: "/products?category=storage",
    },
  ],
} as const;

export const NEWS_PAGE_CONTENT = {
  eyebrow: "Latest coverage",
  title: "Updates that matter to workspace decision-makers.",
  cta: {
    label: "Follow on social channels",
    href: "/social",
  },
  items: [
    {
      category: "Project update",
      title: "Expanded enterprise delivery capacity across North and East India",
      summary:
        "Operational capacity and partner network upgrades to support larger phased workspace rollouts.",
      date: "March 2026",
    },
    {
      category: "Product focus",
      title: "Ergonomic seating line updated with broader workstation compatibility",
      summary:
        "New configuration sets improve support for collaborative, executive, and task-based environments.",
      date: "February 2026",
    },
    {
      category: "Service update",
      title: "After-sales support workflow standardized for faster issue closure",
      summary:
        "Response routing and warranty handling updates now provide clearer communication timelines.",
      date: "January 2026",
    },
  ],
} as const;

export const SOCIAL_PAGE_CONTENT = {
  metadataTitle: "Social",
  metadataDescription: "Get inspired by our shoppable social feed.",
  title: "Inspired Living & Working",
  handle: "@OneAndOnlyFurn",
  ctaLabel: "Shop this Look",
  posts: [
    {
      id: 1,
      productSlug: "oando-workstations--curvivo",
      image: "/images/products/imported/cabin/image-1.webp",
      caption:
        "Elevating the workspace with minimalist curves. #OfficeDesign #Workspace",
    },
    {
      id: 2,
      productSlug: "oando-seating--fluid",
      image: "/images/products/imported/fluid/image-1.webp",
      caption: "Ergonomics meets aesthetics. Sit better, work better.",
    },
    {
      id: 3,
      productSlug: "oando-collaborative--pod",
      image: "/images/products/imported/pod/image-2.webp",
      caption: "Quiet zones for loud ideas. Acoustic pods now available.",
    },
    {
      id: 4,
      productSlug: "oando-tables--meeting",
      image: "/images/products/imported/meeting-table/image-33.webp",
      caption: "Where great decisions are made. Our premium meeting tables.",
    },
    {
      id: 5,
      productSlug: "oando-soft-seating--cocoon",
      image: "/images/products/imported/cocoon/image-1.webp",
      caption:
        "Soft seating that feels like home. Perfect for collaborative spaces.",
    },
    {
      id: 6,
      productSlug: "oando-storage--storage",
      image: "/images/products/imported/storage/image-14.webp",
      caption: "Keep it clean, keep it organized. Engineered storage systems.",
    },
  ],
} as const;
