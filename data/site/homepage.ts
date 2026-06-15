/** Shared fallback when a category or page has no flagship image. */
export const DEFAULT_HERO_FALLBACK = "/images/hero/dmrc-hero.webp";

export const HOMEPAGE_HERO_IMAGES = [
  { src: "/images/hero/dmrc-hero.webp", alt: "DMRC office workstations installed by One&Only" },
  { src: "/images/hero/tvs-patna-hero.webp", alt: "TVS Motors regional office fit-out by One&Only" },
  { src: "/images/hero/usha-hero.webp", alt: "Usha Workspace collaboration zones by One&Only" },
  { src: "/images/hero/titan-patna-hq.webp", alt: "Titan corporate workspace by One&Only" },
  { src: "/images/hero/27-06-2025 Image 03.webp", alt: "Modern office installation by One&Only" },
  { src: "/images/hero/27-06-2025 Image 06.webp", alt: "Enterprise workspace fit-out by One&Only" },
] as const;

export const HOMEPAGE_HERO_CONTENT = {
  title: ["Spaces that work", "as hard as", "your team."],
  kicker: "Pan-India · Since 2011",
  primaryCta: { label: "Explore Products", href: "/products" },
  secondaryCta: { label: "Request a quote", href: "/contact" },
  glassProof: {
    badge: "Trusted by",
    lead: "Executed over 400+ workplace projects since 2011 — Fortune 500 and growing teams.",
    support: "Serving India's biggest companies and government.",
    href: "/trusted-by",
    cta: "View clients",
  },
} as const;

export const HOMEPAGE_PLANNER_SUITE_CONTENT = {
  titleLead: "Oando",
  titleAccent: "Planner",
  description: "Sketch a floor, place catalog furniture, and export a layout before you quote.",
  loginHref: "/login/?next=%2Fplanner%2Fcanvas%2F",
  loginLabel: "Member login",
  overviewHref: "/planner",
  overviewLabel: "Learn more",
} as const;

export const HOMEPAGE_TRUST_CONTENT = {
  logoLabel: "Selected organisations",
  logos: [
    { name: "Titan", src: "/images/client-logos/Titan.png" },
    { name: "L&T", src: "/images/client-logos/LandT.png" },
    { name: "JSW", src: "/images/client-logos/JSW.png" },
    { name: "Tata Motors", src: "/images/client-logos/TataMotors.jpg" },
    { name: "Maruti Suzuki", src: "/images/client-logos/MarutiSuzuki.png" },
    { name: "HDFC", src: "/images/client-logos/HDFCLogo.jpg" },
    { name: "Canara Bank", src: "/images/client-logos/CanaraBank.jpg" },
    { name: "Franklin Templeton", src: "/images/client-logos/FranklinTempleton.jpg" },
    { name: "Hyundai", src: "/images/client-logos/HyundaiLogo.jpg" },
    { name: "IDBI Bank", src: "/images/client-logos/IDBIBankLogo.png" },
    { name: "Usha", src: "/images/client-logos/USHA.png" },
    { name: "Bihar Government", src: "/images/client-logos/BiharGovernment.jpg" },
    { name: "SAIL", src: "/images/client-logos/SAIL.png" },
    { name: "BIS", src: "/images/client-logos/BIS.jpg" },
    { name: "Sonalika", src: "/images/client-logos/Sonalika.jpg" },
    { name: "Survey of India", src: "/images/client-logos/SurveyofIndia.jpg" },
    { name: "CRI Pumps", src: "/images/client-logos/CRIPumps.jpg" },
    { name: "MECON", src: "/images/client-logos/MECON.jpg" },
  ],
  projectsCta: "View projects",
} as const;

export const HOMEPAGE_BRAND_STATEMENT_CONTENT = {
  lead:
    "We have been designing and installing workplaces across India since 2011.",
  body:
    "Not just interiors, but working environments that help teams focus, collaborate, and stay productive. Built for organizations that cannot afford unclear planning or weak execution.",
} as const;

export const HOMEPAGE_COLLECTIONS_CONTENT = {
  titleLead: "What can",
  titleAccent: "you buy?",
  catalogCta: { label: "Browse catalog for more", href: "/products" },
  items: [
    {
      name: "Seating",
      image: "/images/products/seating-myel-1.webp",
      href: "/products/seating",
    },
    {
      name: "Workstations",
      image: "/images/products/deskpro-workstation-1.webp",
      href: "/products/workstations",
    },
    {
      name: "Tables",
      image: "/images/products/meeting-table-10pax.webp",
      href: "/products/tables",
    },
  ],
} as const;

export const HOMEPAGE_PROJECTS_CONTENT = {
  titleLead: "Recent",
  titleAccent: "projects",
  cta: { label: "View portfolio", href: "/portfolio" },
  cards: [
    { name: "DMRC", image: "/images/projects/DMRC/hero.webp" },
    { name: "Titan Limited", image: "/images/projects/Titan/hero.webp" },
    { name: "TVS Motors", image: "/images/projects/TVS/hero.webp" },
  ],
} as const;

export const HOMEPAGE_SHOWCASE_CONTENT = {
  sectionLabel: "Selected Projects",
  sectionTitle: "Delivered at scale for India's leading organizations.",
  items: [
    {
      id: "dmrc-patna",
      name: "DMRC Patna HQ",
      label: "Government",
      image: "/images/projects/DMRC/dmrc-hero.webp",
      description: "Complete workstation rollout for the Patna Metro project headquarters.",
      link: "/portfolio"
    },
    {
      id: "titan-hq",
      name: "Titan Bihar HQ",
      label: "Corporate",
      image: "/images/projects/Titan/titan-hero.webp",
      description: "Full-floor operations zone including executive cabins and staff zones.",
      link: "/portfolio"
    },
    {
      id: "green-desk-1",
      name: "Tata Steel Operations",
      label: "Industrial",
      image: "/images/projects/DMRC/dmrc-workspace-01.webp",
      description: "Custom layout optimized for durability and heavy-duty documentation flow.",
      link: "/portfolio"
    },
    {
      id: "tvs-bihar",
      name: "TVS Motors",
      label: "Automobile",
      image: "/images/projects/TVS/hero.webp",
      description: "Modular seating and desk systems for regional service hubs.",
      link: "/portfolio"
    },
    {
      id: "boardroom-client",
      name: "Executive Boardroom",
      label: "Corporate",
      image: "/images/projects/DMRC/dmrc-facility.webp",
      description: "Custom conference table with ergonomic high-back executive seating.",
      link: "/portfolio"
    },
    {
      id: "open-office-client",
      name: "Operations Hub",
      label: "Enterprise",
      image: "/images/projects/Titan/27-06-2025 Image 05_edited_edited.webp",
      description: "Scalable 100+ seater open plan layout with acoustic screening.",
      link: "/portfolio"
    },
    {
      id: "green-workstations-client",
      name: "Collaborative Zone",
      label: "Public Sector",
      image: "/images/projects/Usha/DSC_0077_edited.webp",
      description: "Modular workstations featuring integrated storage hubs and privacy dividers.",
      link: "/portfolio"
    },
    {
      id: "blue-workstations-client",
      name: "Technical Staff Wing",
      label: "Institutional",
      image: "/images/projects/Govenment/20140707_124458_compressed.webp",
      description: "Ergonomic linear workstations with task-focused layout optimization.",
      link: "/portfolio"
    }
  ]
} as const;

export const HOMEPAGE_CONTACT_CONTENT = {
  titleLead: "Contact",
  titleAccent: "us",
  description:
    "Share your city and scope. We scope customised furniture before quoting — expect a conversation, not an instant price.",
  directActions: [
    {
      type: "whatsapp",
      label: "WhatsApp now",
      detail: "Fastest response",
    },
    {
      type: "phone",
      label: "Call team",
      detail: "Talk to support",
    },
  ],
} as const;

export const HOMEPAGE_CLOSING_CTA_CONTENT = {
  kicker: "Start planning",
  titleLead: "Start with one",
  titleAccent: "clear brief.",
  description:
    "Share your city, scope, and timeline. We will route the right next step without forcing the whole brief into the home page.",
  actions: {
    primary: { label: "Launch planner", href: "/planning" },
    whatsapp: {
      label: "WhatsApp now",
      message: "I need help starting a workspace planning brief.",
    },
    phone: { label: "Call team" },
  },
} as const;

export const HOMEPAGE_STATS_CONTENT = [
  { value: "14+", label: "Years delivering workspaces" },
  { value: "500+", label: "Projects completed" },
  { value: "50+", label: "Partner brands and product lines" },
  { value: "24/7", label: "After-sales support routing" },
] as const;

export const HOMEPAGE_PROCESS_CONTENT = {
  kicker: "",
  titleLead: "A clear",
  titleAccent: "delivery system.",
  description: "",
  cta: { label: "Guided Planner", href: "/contact" },
  steps: [
    {
      title: "Scope",
      sla: "Day 1-2",
      deliverable: "Signed brief",
      description: "Needs workshop, headcount, zones, and bill of materials.",
    },
    {
      title: "Design",
      sla: "Day 3-7",
      deliverable: "Approved layout",
      description: "2D layout and material board submitted for sign-off.",
    },
    {
      title: "Deliver",
      sla: "Approved schedule",
      deliverable: "Installed workspace",
      description: "Factory-built, delivered, and installed to spec.",
    },
    {
      title: "Support",
      sla: "Ongoing",
      deliverable: "Service support",
      description: "Warranty coverage and dedicated after-sales contact.",
    },
  ],
} as const;

export type HomepageSectorIconName =
  | "Landmark"
  | "Building2"
  | "Factory"
  | "Car"
  | "Zap"
  | "Globe";

export const HOMEPAGE_SECTORS_CONTENT = {
  eyebrow: "Sectors we serve",
  titleLead: "Trusted across",
  titleAccent: "large-scale workplaces",
} as const;

export const HOMEPAGE_SECTORS = [
  {
    name: "Government",
    iconName: "Landmark",
    href: "/portfolio",
    displayCount: 24,
    clients: ["DMRC", "Patna Metro", "Bihar Government"],
  },
  {
    name: "Corporate",
    iconName: "Building2",
    href: "/portfolio",
    displayCount: 16,
    clients: ["Titan", "HDFC", "TVS Motors"],
  },
  {
    name: "Industrial",
    iconName: "Factory",
    href: "/portfolio",
    displayCount: 12,
    clients: ["Tata Steel", "JSW", "SAIL"],
  },
  {
    name: "Automotive",
    iconName: "Car",
    href: "/portfolio",
    displayCount: 9,
    clients: ["TVS", "Maruti Suzuki", "Tata Motors"],
  },
  {
    name: "Technology",
    iconName: "Zap",
    href: "/portfolio",
    displayCount: 8,
    clients: ["Usha", "Bihar Government", "Patna Metro"],
  },
  {
    name: "International",
    iconName: "Globe",
    href: "/portfolio",
    displayCount: 5,
    clients: ["Global partners", "Enterprise accounts", "Export workflows"],
  },
] as const;

export const HOMEPAGE_SOLUTIONS_CONTENT = {
  kicker: "Workspace routes",
  title: "Browse by workspace need.",
  description: "Explore office furniture and workspace systems by category.",
  compareCta: "Compare product options",
  catalogCta: "Browse full catalog",
  mobileHint: "Swipe to browse categories",
  capabilities: [
    {
      title: "Ergonomic Seating",
      outcome:
        "Task and executive seating tuned for posture support, long-hour comfort, and dependable after-sales coverage.",
      href: "/products/seating",
      image: "/images/catalog/oando-seating--fluid-x/image-01.webp",
    },
    {
      title: "Scalable Workstations",
      outcome:
        "Modular systems that scale team by team with practical cable management and planning-friendly layouts.",
      href: "/products/workstations",
      image: "/images/catalog/oando-workstations--deskpro/image-1.jpg",
    },
    {
      title: "Meeting Tables",
      outcome:
        "Table systems for collaboration, review, and client-facing discussion zones.",
      href: "/products/tables",
      image: "/images/products/meeting-table-10pax.webp",
    },
    {
      title: "Storage Systems",
      outcome:
        "Lockers, pedestals, and cabinets built for secure daily use with efficient footprint planning.",
      href: "/products/storages",
      image: "/images/catalog/oando-storage--metal-storages/image-1.jpg",
    },
  ],
} as const;

export const HOMEPAGE_TESTIMONIALS_CONTENT = {
  titleLead: "Client",
  titleAccent: "speak",
  items: [
    {
      quote:
        "The layout planning before production saved us significant rework. The team understood our floor constraints without us having to explain twice.",
      author: "Facilities Head",
      org: "Titan Limited, Patna",
    },
    {
      quote:
        "We needed a phased rollout across two floors with minimal downtime. The delivery and installation was coordinated well and completed on schedule.",
      author: "Admin Manager",
      org: "Government of Bihar",
    },
    {
      quote:
        "After-sales response time was faster than we expected. The warranty claim was resolved in one visit.",
      author: "Office Manager",
      org: "HDFC, Patna",
    },
  ],
} as const;

export const HOMEPAGE_FAQ_CONTENT = {
  titleLead: "FAQ",
  items: [
    {
      q: "Which cities do you serve?",
      a: "We are based in Patna and serve Bihar, Jharkhand, and multi-city rollout briefs across India. Delivery logistics are handled directly - no third-party intermediaries.",
    },
    {
      q: "How long does delivery and installation take?",
      a: "Scope and design is completed within 7 working days of brief sign-off. Delivery and installation timelines depend on order volume and are agreed in writing before production begins.",
    },
    {
      q: "Is installation included in the price?",
      a: "Yes. All orders include delivery to site and supervised installation by our team. Post-installation snag support is also covered.",
    },
    {
      q: "What warranty do you offer?",
      a: "Products carry manufacturer warranty (typically 2-5 years depending on the range). After-sales support is managed by our Patna team directly.",
    },
    {
      q: "Can you handle large or phased office rollouts?",
      a: "Yes. We have executed government and corporate rollouts across multiple floors and sites. Use the Guided Planner to share your brief and we will route the right next step.",
    },
  ],
} as const;

export const HOMEPAGE_PARTNERSHIP_CONTENT = {
  image: {
    src: "/catalog-logo-sharp.webp",
    alt: "AFC logo - Official Strategic Partner",
  },
  title: ["Official Strategic", "Partner"],
} as const;
