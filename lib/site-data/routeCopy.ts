import type { ClientBadgeData } from "@/components/ClientBadge";
import { buildWhatsAppHref } from "@/lib/site-data/contact";

export const ABOUT_PAGE_COPY = {
  heroTitle: "About One&Only",
  heroSubtitle:
    "We design and deliver workspace systems that stay practical, durable, and scalable as teams grow.",
  sectionKicker: "Who we are",
  sectionTitle: "A planning-first furniture partner for modern offices.",
  paragraphs: [
    "We combine workplace planning, product selection, and execution support so teams can move from concept to handover with fewer delays and better outcomes.",
    "Our projects cover ergonomic seating, modular workstations, meeting environments, storage, and support services tailored to enterprise and institutional needs.",
    "Every engagement is managed for clarity: documented scope, practical timelines, and accountable after-sales support.",
  ],
  confidenceKicker: "Client confidence",
  confidenceTitle: "Trusted by enterprise and institutional teams.",
  confidenceCta: "View all clients",
  modelKicker: "Operating model",
  modelTitle: "One team from planning brief to post-installation support.",
  modelDescription:
    "We keep planning, sourcing, execution, and support connected so projects stay clear from early decisions through handover.",
  modelPillars: [
    {
      title: "Planning-led recommendations",
      detail:
        "Category, budget, and layout decisions are tied to how teams actually use the space.",
    },
    {
      title: "Execution clarity",
      detail:
        "Commercial scope, timelines, delivery coordination, and installation readiness stay visible throughout the project.",
    },
    {
      title: "Support after handover",
      detail:
        "Warranty references, service routing, and follow-up support remain part of the same delivery relationship.",
    },
  ],
  processKicker: "How we work",
  processTitle: "A practical sequence for office projects.",
  processSteps: [
    {
      title: "Brief and site context",
      detail:
        "We map headcount, workspace type, commercial priorities, and the timing that matters for your team.",
    },
    {
      title: "Specification and alignment",
      detail:
        "Products, finishes, and quantity mixes are translated into a clear planning and approval path.",
    },
    {
      title: "Delivery and support",
      detail:
        "Installation, service routing, and after-sales follow-through stay connected to the original brief.",
    },
  ],
  supportTitle: "Need planning or documentation before you decide?",
  supportDescription:
    "Use the planning or Resource Desk lanes when your team needs layout guidance, category packs, technical sheets, or a clearer next step before procurement.",
  supportPrimaryCta: "Request planning call",
  supportSecondaryCta: "Open Resource Desk",
} as const;

export const CONTACT_PAGE_COPY = {
  heroTitle: "Contact us",
  heroSubtitle: "Share your workspace requirement and our team will respond with next steps.",
  sectionTitle: "Office and support contacts",
  introTitle: "Start with the right team.",
  introDescription:
    "Share your requirement, timeline, or category mix. We will route it to the right planning or sales contact and respond with practical next steps.",
  resourceDeskLead:
    "Need category packs, technical sheets, or planning references first?",
  resourceDeskCta: "Use the Resource Desk",
  resourceDeskTail: "and we will send the right documentation set for your brief.",
  quickDeskKicker: "Fastest routing",
  quickDeskTitle: "Use the right lane from the start.",
  quickDeskDescription:
    "Planning discussions, document requests, and quote conversations move faster when the request reaches the right team first.",
  quickDeskPrimaryCta: "Open Resource Desk",
  quickDeskSecondaryCta: "Request planning call",
  offices: [
    {
      title: "Corporate office",
      lines: ["401, Jagat Trade Centre", "Frazer Road", "Patna - 800 013", "India"],
    },
    {
      title: "Showroom",
      lines: [
        "One and Only Furniture Pvt Ltd",
        "Opp Patliputra Telephone Exchange",
        "North Industrial Estate Road",
        "Patna - 800 010",
        "India",
      ],
    },
  ],
} as const;

export const CONTACT_FORM_CONTEXT_COPY = {
  quote: {
    compare: {
      eyebrow: "Compare shortlist",
      title: "Quote request from compared products",
      description:
        "You came from the compare flow. Keep the shortlist context and tell us what commercial next step you need.",
      requirement: "Quote request from compare shortlist",
      seededMessage:
        "I need a quote for the products I compared and want the right next commercial step.",
    },
    "quote-cart": {
      eyebrow: "Quote cart",
      title: "Quote request from saved cart",
      description:
        "You came from the quote cart. Keep the shortlisted products together and tell us what you need next.",
      requirement: "Quote request from quote cart",
      seededMessage:
        "I need a quote for the products saved in my quote cart and want the next commercial step.",
    },
  },
} as const;

export const TRUSTED_BY_PAGE_COPY = {
  heroTitle: "Trusted by",
  heroSubtitle:
    "Trusted by industry leaders across government, manufacturing, finance, automotive, IT, and institutional sectors.",
  overviewKicker: "Proof of delivery",
  overviewTitle: "A client roster earned through repeatable execution.",
  overviewDescription:
    "Our projects span enterprise offices, public institutions, financial networks, industrial sites, and multi-city workplace rollouts where planning clarity, delivery control, and after-sales support all matter.",
  statsKicker: "Trust at a glance",
  sectorsKicker: "Sector spread",
  sectorsTitle: "Cross-sector trust with practical project fit.",
  sectorsDescription:
    "From government procurement and banking operations to manufacturing offices and NGO programs, the shared requirement is the same: durable products, accountable delivery, and support after handover.",
  rosterKicker: "Selected organisations",
  rosterTitle: "Clients who rely on One&Only.",
} as const;

export const PROJECTS_PAGE_COPY = {
  heroTitle: "Projects",
  heroSubtitleTemplate:
    "{clients} organisations across government, finance, energy, manufacturing, and more.",
  featuredLabel: "Selected organisations",
  featuredTitle: "Client roster",
  allLabel: "Extended roster",
} as const;

export const PROJECTS_PAGE_CLIENTS: ClientBadgeData[] = [
  { name: "Adani Power", sector: "Energy" },
  { name: "Adecco", sector: "Corporate" },
  { name: "Ambuja Neotia", sector: "Corporate" },
  { name: "Annapurna Finance", sector: "Finance" },
  { name: "Asian Paints", sector: "FMCG" },
  { name: "Azim Premji Foundation", sector: "NGO / UN" },
  { name: "BBC Media Action", sector: "NGO / UN" },
  { name: "BHEL", sector: "Energy" },
  { name: "Bureau of Indian Standards", sector: "Government" },
  { name: "BNP Paribas", sector: "Finance" },
  { name: "BSPHCL", sector: "Energy", location: "Bihar" },
  { name: "Bandhan Bank", sector: "Finance" },
  { name: "Big Bazaar", sector: "FMCG" },
  { name: "Government of Bihar", sector: "Government", location: "Patna" },
  { name: "Indian Army", sector: "Government" },
  { name: "Birla School", sector: "Education" },
  { name: "CIMP", sector: "Education", location: "Patna" },
  { name: "CRI Pumps", sector: "Manufacturing" },
  { name: "Canara Bank", sector: "Finance" },
  { name: "Coca-Cola", sector: "FMCG" },
  { name: "DMRC", sector: "Government", location: "New Delhi" },
  { name: "Dalmia Bharat Cement", sector: "Manufacturing" },
  { name: "Essel Utilities", sector: "Energy" },
  { name: "FHI 360", sector: "NGO / UN" },
  { name: "Franklin Templeton Investments", sector: "Finance" },
  { name: "D. Goenka School", sector: "Education" },
  { name: "Government of India", sector: "Government" },
  { name: "HDFC", sector: "Finance" },
  { name: "HelpAge India", sector: "NGO / UN" },
  { name: "Hyundai", sector: "Automotive" },
  { name: "IDBI Bank", sector: "Finance" },
  { name: "ITC Limited", sector: "FMCG" },
  { name: "Income Tax Department", sector: "Government" },
  { name: "Indian Bank", sector: "Finance" },
  { name: "IndianOil", sector: "Energy" },
  { name: "Amara Raja", sector: "Manufacturing" },
  { name: "JSW", sector: "Manufacturing" },
  { name: "Janalakshmi", sector: "Finance" },
  { name: "L&T", sector: "Manufacturing" },
  { name: "Maruti Suzuki", sector: "Automotive" },
  { name: "NTPC", sector: "Energy" },
  { name: "NABARD", sector: "Finance" },
  { name: "SAIL", sector: "Manufacturing" },
  { name: "State Bank of India", sector: "Finance" },
  { name: "SITI Networks", sector: "Telecom" },
  { name: "Shriram", sector: "Finance" },
  { name: "Sonalika International", sector: "Manufacturing" },
  { name: "Survey of India", sector: "Government" },
  { name: "Syndicate Bank", sector: "Finance" },
  { name: "Tata Steel", sector: "Manufacturing" },
  { name: "Tata Motors", sector: "Automotive" },
  { name: "Titan", sector: "Manufacturing", location: "Patna, Bihar" },
  { name: "TVS Group", sector: "Automotive" },
  { name: "United Nations", sector: "NGO / UN" },
  { name: "Usha International", sector: "Manufacturing", location: "New Delhi" },
  { name: "Ujjivan Small Finance Bank", sector: "Finance" },
  { name: "UNICEF", sector: "NGO / UN" },
  { name: "United Spirits", sector: "FMCG" },
  { name: "Vodafone", sector: "Telecom" },
  { name: "World Health Organization", sector: "NGO / UN" },
  { name: "ZTE", sector: "Telecom" },
];

export const PORTFOLIO_PAGE_COPY = {
  heroTitle: "Portfolio",
  heroSubtitle: "Real delivery photos grouped by client projects.",
  eyebrow: "Project gallery",
  title: "Excellence.",
  totalTemplate: "{clients} clients - {photos} photos",
} as const;

export const PORTFOLIO_CLIENTS = [
  {
    id: "titan",
    folder: "Titan",
    name: "Titan",
    location: "Patna, Bihar",
    summary: "Collaborative office zones with modular seating and meeting layouts.",
  },
  {
    id: "tvs",
    folder: "TVS",
    name: "TVS",
    location: "Patna, Bihar",
    summary: "Workspace planning across leadership cabins, desking, and collaboration bays.",
  },
  {
    id: "usha",
    folder: "Usha",
    name: "Usha",
    location: "Patna, Bihar",
    summary: "End-to-end supply and on-site setup with execution-ready furniture systems.",
  },
  {
    id: "dmrc",
    folder: "DMRC",
    name: "DMRC",
    location: "New Delhi",
    summary: "Operational office furniture delivery built for high-use enterprise teams.",
  },
  {
    id: "franklin-templeton",
    folder: "FranklinTempleton",
    name: "Franklin Templeton",
    location: "India",
    summary: "Formal workspace setups with consistent finishes and executive-ready detailing.",
  },
  {
    id: "government",
    folder: "Govenment",
    name: "Government",
    location: "Patna, Bihar",
    summary: "Durable institutional deployments with practical day-to-day usability.",
  },
] as const;

export const GALLERY_PAGE_COPY = {
  heroTitle: "Project Gallery",
  heroSubtitle:
    "Selected workspace deliveries across corporate, public, and institutional environments.",
  kicker: "Recent visual highlights",
  title: "Real projects, real installations.",
  description:
    "Browse completed site photos to understand finish quality, layout styles, and delivery scale across different project types.",
} as const;

export const GALLERY_PROJECTS = [
  {
    title: "Titan Workspace",
    location: "Patna",
    image: "/images/projects/Titan/27-06-2025 Image 05_edited_edited.webp",
    category: "Corporate fit-out",
  },
  {
    title: "TVS Office",
    location: "Patna",
    image: "/images/projects/TVS/27-06-2025 Image 03.webp",
    category: "Operations floor",
  },
  {
    title: "DMRC Facility",
    location: "New Delhi",
    image: "/images/projects/DMRC/dmrc-facility.webp",
    category: "Institutional workspace",
  },
  {
    title: "Usha Setup",
    location: "Patna",
    image: "/images/projects/Usha/DSC_0077_edited.webp",
    category: "Workspace modernization",
  },
  {
    title: "Government Office",
    location: "Patna",
    image: "/images/projects/Govenment/20140707_124458_compressed.webp",
    category: "Public sector project",
  },
  {
    title: "Franklin Templeton",
    location: "India",
    image: "/images/projects/FranklinTempleton/franklin-templeton-office.webp",
    category: "Enterprise deployment",
  },
] as const;

export const SHOWROOMS_PAGE_COPY = {
  heroTitle: "Showrooms, journey, and client delivery.",
  heroSubtitle:
    "A closer look at our execution model, project footprint, and the teams who trust us.",
  trustedKicker: "Trusted at a glance",
  aboutKicker: "About us",
  aboutTitle:
    "Building workspaces with clear planning, reliable supply, and accountable delivery.",
  aboutDescription:
    "We started with regional office projects and expanded into multi-city execution. Our operating model remains consistent: defined scope, practical timelines, and strong after-sales support.",
  clientsKicker: "Clients we have served",
  clientsCta: "View full client list",
  highlightsKicker: "Signature deliveries",
  highlightsCta: "Explore portfolio",
  sustainabilityTitle: "Designed responsibly, delivered practically.",
  sustainabilitySubtitle: "Sustainability",
  sustainabilityDescription:
    "From material choices to long-life product planning, we focus on workspace systems that reduce waste and improve lifecycle value.",
  sustainabilityCta: "Read sustainability commitments",
} as const;

export const SHOWROOMS_CLIENTS = [
  "DMRC",
  "Tata Steel",
  "HDFC",
  "IndianOil",
  "L&T",
  "NTPC",
  "Titan",
  "Bihar Tourism",
] as const;

export const SHOWROOMS_HIGHLIGHTS = [
  {
    title: "DMRC Offices",
    detail: "Workspace systems delivered with phase-wise planning and installation handover.",
  },
  {
    title: "Titan Patna HQ",
    detail: "Ergonomic seating and workstation deployment aligned to team-level needs.",
  },
  {
    title: "Enterprise Fit-outs",
    detail: "Turnkey planning, supply, and execution for large office and institutional spaces.",
  },
] as const;

export const SOLUTIONS_PAGE_COPY = {
  metadataTitle: "Workspace Planning Approach",
  metadataDescription:
    "See how One&Only plans, specifies, and delivers workspace projects from brief to after-sales support.",
  heroTitle: "How we deliver workspace projects",
  heroTitleLead: "How we deliver",
  heroTitleAccent: "workspace projects",
  heroSubtitle:
    "A structured approach for planning, procurement alignment, execution, and support.",
  deliveryKicker: "Delivery model",
  deliveryTitle: "Built for teams that need predictability and speed.",
  deliveryDescription:
    "Every project is managed through clear scope definition, practical planning outputs, and accountable on-site execution. The result is smoother approvals and fewer surprises during rollout.",
  stats: [
    { value: "14+", label: "Years in workspace projects" },
    { value: "120+", label: "Projects delivered" },
    { value: "250+", label: "Client organizations served" },
    { value: "20+", label: "Cities supported" },
  ],
  processKicker: "Process detail",
  processTitle: "Three phases from brief to handover.",
  planningKicker: "Start planning",
  planningTitle: "Discuss your project brief with our planning team.",
  planningDescription:
    "Share site details, timelines, and seat count. We will suggest a practical approach for products, layout, and execution.",
  planningPrimaryCta: "Request planning call",
  planningSecondaryCta: "Browse product categories",
  planningTertiaryCta: "Open Resource Desk",
} as const;

export const SOLUTIONS_DELIVERY_STEPS = [
  {
    title: "Brief and business requirements",
    detail:
      "We align on team structure, workflow priorities, budget range, and decision checkpoints.",
    image: "/images/catalog/oando-workstations--deskpro/image-1.webp",
  },
  {
    title: "Layout, specification, and BOQ",
    detail:
      "Design options are translated into practical category selections and quantity plans for approval.",
    image: "/images/catalog/oando-tables--curvivo-meet/image-1.webp",
  },
  {
    title: "Execution and handover support",
    detail:
      "Delivery, installation, and warranty onboarding are managed with clear communication and accountability.",
    image: "/images/catalog/oando-soft-seating--accent/image-1.webp",
  },
] as const;

export const SUSTAINABILITY_PAGE_COPY = {
  heroTitle: "Sustainability in practice.",
  heroSubtitle:
    "We focus on durable workspace systems, practical material choices, and lower rework across planning and delivery.",
  introTitleLead: "Our approach for ",
  introTitleEmphasis: "long-life workspaces.",
  introDescription:
    "Sustainability in office projects depends on material choice, maintainability, and planning discipline from specification to after-sales support.",
  introKicker: "Sustainability in practice",
  introTitle: "Long-life workspace systems with lower lifecycle waste.",
  introPoints: [
    "We prioritize durable categories, replaceable components, and planning choices that reduce unnecessary product churn.",
    "Material selection, transport efficiency, and long-term maintenance all matter because sustainability is tied to how the product actually gets used.",
    "We avoid promising unsupported certifications or metrics where the current repo does not provide formal evidence.",
  ],
  pillars: [
    {
      title: "Material-aware specification",
      detail:
        "We prioritize options with clearer material information and stronger service-life fit for each use case.",
      icon: "leaf",
    },
    {
      title: "Repair and replacement mindset",
      detail:
        "We prefer categories and configurations that can be maintained, repaired, or reconfigured instead of replaced early.",
      icon: "recycle",
    },
    {
      title: "Planning that reduces waste",
      detail:
        "Clear quantity planning and fit checks help reduce mismatch, returns, and avoidable on-site rework.",
      icon: "lightbulb",
    },
  ],
  ecoScoreTitle: "Our Eco-Score System",
  ecoScoreDescription:
    "Where score data is available, Eco-Score (1 to 10) is used as a directional planning signal alongside specifications and use-case fit.",
  ecoScoreItems: [
    {
      index: "1",
      title: "Materials",
      detail:
        "Material composition, recycled-content signals, and durability-related fit where data is available.",
    },
    {
      index: "2",
      title: "Manufacturing",
      detail:
        "Manufacturing and sourcing context captured in current product records or partner documentation.",
    },
    {
      index: "3",
      title: "Longevity",
      detail:
        "Expected service life, maintenance practicality, and replacement risk in active use.",
    },
  ],
  badges: [
    {
      title: "Eco-Score: 8+",
      detail:
        "Higher-scoring products generally show stronger lifecycle signals in the current catalog data.",
    },
    {
      title: "Eco-Score: 5-7",
      detail:
        "Mid-range scores indicate partial sustainability signals and should be reviewed with full technical context.",
    },
  ],
  verifiedTitle: "Sustainability signals",
  verifiedDescription:
    "We present catalog-backed sustainability signals and avoid unsupported certification or impact claims.",
  verifiedLabels: ["Catalog-backed", "Data reviewed", "Long-life focus"],
  commitmentsKicker: "What we prioritize",
  commitmentsTitle: "Practical commitments over generic claims.",
  commitments: [
    {
      title: "Long service life",
      detail:
        "Products and layouts should stay usable longer so teams do not replace fit-outs prematurely.",
    },
    {
      title: "Responsible specification",
      detail:
        "We prefer materials and product structures that balance durability, maintenance, and lower environmental impact.",
    },
    {
      title: "Planning efficiency",
      detail:
        "Better upfront planning reduces rework, mismatch, and waste during delivery and installation.",
    },
  ],
  routeNoteTitle: "Need sustainability information for a live project?",
  routeNoteDescription:
    "Ask for the current product pack or planning support when you need material guidance, category recommendations, or project-fit clarification.",
  routeNotePrimaryCta: "Open Resource Desk",
  routeNoteSecondaryCta: "Request planning call",
} as const;

export const CAREER_PAGE_COPY = {
  heroTitle: "Careers",
  heroSubtitle:
    "Join a team that builds practical, high-impact workspaces for organizations across India.",
  introKicker: "Why join us",
  introTitle: "Build your career in workspace delivery.",
  introDescription:
    "We work across planning, product consulting, project delivery, and support. If you care about reliable execution and customer outcomes, you will fit well here.",
  pillars: [
    {
      title: "Collaborative teams",
      detail:
        "Sales, planning, and operations work closely so decisions are clear and execution stays fast.",
      icon: "users",
    },
    {
      title: "Learning-focused work",
      detail:
        "You gain practical exposure to real client briefs, procurement cycles, and installation realities.",
      icon: "graduation-cap",
    },
    {
      title: "Meaningful responsibility",
      detail:
        "We give ownership early, with mentorship and clear accountability standards.",
      icon: "briefcase",
    },
  ],
  openingsTitle: "Current openings",
  openingsAvailableTemplate: "{count} roles available",
  processKicker: "How careers grow here",
  processTitle: "Work that stays close to real projects and real ownership.",
  processDescription:
    "The team works across planning, product consultation, commercial coordination, site execution, and after-sales support. That means roles stay connected to actual client outcomes instead of isolated internal handoffs.",
  processSteps: [
    {
      title: "Client-facing learning",
      detail:
        "You learn from active workspace briefs, approvals, and on-ground delivery realities instead of only internal training material.",
    },
    {
      title: "Cross-functional exposure",
      detail:
        "Sales, planning, operations, and support stay close enough for faster decisions and clearer accountability.",
    },
    {
      title: "Measured ownership",
      detail:
        "Responsibility increases with performance, but expectations stay explicit around response quality, execution, and professionalism.",
    },
  ],
  fallbackTitle: "No matching role yet?",
  fallbackDescription:
    "Send your profile and let us know where you can contribute. We review applications for sales, operations, planning, and support functions on a rolling basis.",
  careersEmail: "careers@oando.co.in",
  supportTitle: "Not sure which role fits your background?",
  supportDescription:
    "Send a short note with your experience area and preferred function. We can route you toward the most relevant planning, sales, operations, or support lane.",
  supportPrimaryCta: "Contact the team",
  supportSecondaryCta: "Open planning page",
} as const;

export const CAREER_PAGE_JOBS = [
  {
    title: "Project Sales Manager",
    department: "Enterprise Sales",
    location: "Patna",
  },
  {
    title: "Workspace Planner",
    department: "Planning and Design",
    location: "Patna",
  },
  {
    title: "Site Execution Coordinator",
    department: "Operations",
    location: "Patna and travel",
  },
  {
    title: "Customer Support Executive",
    department: "After-sales Support",
    location: "Patna",
  },
] as const;

export const SOCIAL_PAGE_COPY = {
  heroTitle: "Social Highlights",
  heroSubtitle:
    "Project moments, workspace ideas, and product-use inspiration tied back to real categories and live route truth.",
  introKicker: "Social proof and inspiration",
  introTitle: "A cleaner bridge between project inspiration and real product routes.",
  introDescription:
    "This route highlights workplace ideas and completed environments without pretending to be a live social API. Every tile points back to a real route in the current catalog or product surface.",
  handleLabel: "@OneAndOnlyFurn",
  feedKicker: "Selected highlights",
  feedTitle: "Ideas grounded in real workspace categories.",
  feedDescription:
    "Use this page to move from visual inspiration into planning, products, or proof pages without broken links or fabricated social integrations.",
  ctaTitle: "Need help turning a reference into a real workspace plan?",
  ctaDescription:
    "Move from inspiration into category shortlists, planning support, and documentation requests through the same live product and Resource Desk routes.",
  primaryCta: "Browse products",
  secondaryCta: "Open Resource Desk",
} as const;

export const SOCIAL_PAGE_POSTS = [
  {
    id: "curvivo-workstation",
    productSlug: "oando-workstations--curvivo",
    image: "/images/products/imported/cabin/image-1.webp",
    title: "Focused workstation layouts",
    caption: "Curved workstation systems built for concentrated team bays and cleaner planning geometry.",
  },
  {
    id: "fluid-seating",
    productSlug: "oando-seating--fluid",
    image: "/images/products/imported/fluid/image-1.webp",
    title: "Ergonomic task seating",
    caption: "Everyday seating that balances comfort, movement, and visual restraint in active office zones.",
  },
  {
    id: "pod-collaboration",
    productSlug: "oando-collaborative--pod",
    image: "/images/products/imported/pod/image-2.webp",
    title: "Quiet collaboration zones",
    caption: "Acoustic and semi-private setups that help teams create focus without isolating the floor.",
  },
  {
    id: "meeting-table",
    productSlug: "oando-tables--meeting",
    image: "/images/products/imported/meeting-table/image-33.webp",
    title: "Meeting environments",
    caption: "Formal discussion tables designed for leadership rooms, shared review spaces, and client conversations.",
  },
  {
    id: "cocoon-soft-seating",
    productSlug: "oando-soft-seating--cocoon",
    image: "/images/products/imported/cocoon/image-1.webp",
    title: "Soft seating for shared spaces",
    caption: "Lounge-ready seating that softens collaborative spaces without losing workplace durability.",
  },
  {
    id: "storage-systems",
    productSlug: "oando-storage--storage",
    image: "/images/products/imported/storage/image-14.webp",
    title: "Organized storage systems",
    caption: "Storage modules that keep project, personal, and operational material easy to manage at scale.",
  },
] as const;

export const NEWS_PAGE_COPY = {
  heroTitle: "News and Updates",
  heroSubtitle:
    "Workspace guidance, project themes, and service updates presented without pretending to be a live newsroom.",
  introKicker: "What belongs here",
  introTitle: "A route for current direction, not fabricated announcements.",
  introDescription:
    "This page should help visitors understand what the team is focusing on across products, planning, support, and project delivery. It stays grounded in real categories and live support routes instead of synthetic press content.",
  cards: [
    {
      category: "Planning focus",
      title: "How teams are approaching phased workplace upgrades",
      summary:
        "More projects are moving in phases, with planning, approvals, and category decisions split across multiple operational milestones.",
    },
    {
      category: "Product guidance",
      title: "Choosing categories that stay useful longer",
      summary:
        "Task seating, modular workstations, collaboration furniture, and storage systems are being selected with longer replacement cycles in mind.",
    },
    {
      category: "Support workflow",
      title: "Clearer routing for documentation, tracking, and after-sales requests",
      summary:
        "The live route system now pushes visitors toward the right contact and Resource Desk lanes instead of forcing guesswork.",
    },
  ],
  ctaTitle: "Need a current product, planning, or support update?",
  ctaDescription:
    "Use the contact and Resource Desk routes when you need the latest category packs, service routing, or planning context for a live project.",
  primaryCta: "Open Resource Desk",
  secondaryCta: "Contact the team",
} as const;

export const TRACKING_PAGE_COPY = {
  heroTitle: "Order and Delivery Tracking",
  heroSubtitle:
    "Use the correct support lane for order-reference, delivery-status, installation, or after-sales follow-up requests.",
  introKicker: "Tracking with the right inputs",
  introTitle: "A truthful route for delivery-status support.",
  introDescription:
    "This page does not pretend to expose a live logistics system. Instead, it explains how to share the right order or project reference so the support team can respond accurately.",
  referenceTitle: "What to include in your request",
  referenceItems: [
    "Order reference number or quotation ID",
    "Project or company name",
    "Delivery city or installation location",
    "Your main question: dispatch, delivery timing, installation, or service follow-up",
  ],
  lanesTitle: "Choose the right route",
  lanes: [
    {
      title: "Delivery status",
      detail:
        "Use this when you need dispatch timing, expected delivery sequence, or a shipment-status update.",
    },
    {
      title: "Installation coordination",
      detail:
        "Use this when the question relates to site readiness, installation timing, or handover support.",
    },
    {
      title: "Service or issue follow-up",
      detail:
        "Use this when you already received delivery and need after-sales support or issue routing.",
    },
  ],
  supportTitle: "Ready to share your order reference?",
  supportDescription:
    "The fastest path is to send the reference and request summary directly to the support team instead of relying on a fake public tracker.",
  primaryCta: "Raise a support request",
  secondaryCta: "Call support",
  tertiaryCta: "Open Resource Desk",
} as const;

export const SUPPORT_IVR_PAGE_COPY = {
  heroTitle: "Support Routing",
  heroSubtitle:
    "Use the visual support menu to reach the right lane for documents, tracking, service, or planning follow-up.",
  introKicker: "Support menu",
  introTitle: "A clearer route into the right support conversation.",
  introDescription:
    "This page works best when it routes visitors quickly into the right support lane instead of forcing generic contact requests. It should stay aligned to service, tracking, and Resource Desk flows.",
  noteTitle: "Best use",
  noteDescription:
    "Start here when you know you need help, but you are not yet sure whether the request belongs to service, documentation, delivery tracking, or planning support.",
} as const;

export const PLANNING_PAGE_COPY = {
  heroTitle: "Planning Service",
  heroSubtitle:
    "Workspace planning that balances workflow, budget, and execution timelines.",
  workflowKicker: "Planning workflow",
  workflowTitle: "From intent to implementation-ready plans.",
  deliverablesKicker: "What you receive",
  deliverablesTitle: "Clear deliverables your team can execute.",
  bestForKicker: "Best for",
  bestForDescription:
    "New offices, floor expansions, workspace modernization, and enterprise fit-outs where planning quality directly impacts cost and timeline.",
  deskKicker: "Support inputs",
  deskTitle: "Bring documents, plans, and product questions into one workflow.",
  deskDescription:
    "If your team needs category packs, technical sheets, or layout references before the planning call, start at the Resource Desk and we will route the right material into the same discussion.",
  primaryCta: "Request planning call",
  secondaryCta: "View products",
  tertiaryCta: "Open Resource Desk",
} as const;

export const PLANNING_PAGE_STEPS = [
  {
    title: "Discovery and brief alignment",
    detail:
      "We map team structure, workflow patterns, budget constraints, and approval checkpoints before design begins.",
  },
  {
    title: "Layout and specification",
    detail:
      "Our team develops 2D/3D concepts and furniture specifications tailored to headcount, zoning, and performance targets.",
  },
  {
    title: "Execution readiness",
    detail:
      "You receive BOQ-ready documentation, phased implementation options, and a clear handover plan for procurement and fit-out teams.",
  },
] as const;

export const PLANNING_PAGE_DELIVERABLES = [
  "Workplace planning workshop",
  "Space zoning and furniture layout",
  "Category-wise furniture recommendations",
  "Budget-aligned BOQ draft",
  "Implementation roadmap",
] as const;

export const SERVICE_PAGE_COPY = {
  heroTitle: "Service and Support",
  heroSubtitle:
    "After-sales support designed for reliability, accountability, and long-term performance.",
  frameworkKicker: "Support framework",
  frameworkTitle:
    "One service partner from installation through after-sales support.",
  channelsKicker: "Service channels",
  channelsTitle: "Reach our support team directly.",
  supportKicker: "Need immediate support?",
  supportDescription:
    "Share your project or service reference number and issue summary. Our support team will route it to the right specialist and respond with next steps.",
  supportDeskKicker: "Support routing",
  supportDeskTitle: "Need documents, warranty references, or planning records first?",
  supportDeskDescription:
    "Use the Resource Desk when the fastest next step is a document pack, technical sheet, warranty reference, or planning record tied to your workspace setup.",
  primaryCta: "Raise a support request",
  secondaryCta: "Track order",
  tertiaryCta: "Open Resource Desk",
} as const;

export const SERVICE_PAGE_PILLARS = [
  {
    title: "Installation and commissioning",
    detail:
      "On-site assembly, placement, and functional checks coordinated with your facility and project teams.",
  },
  {
    title: "Warranty and issue management",
    detail:
      "Structured support for warranty claims, replacements, and corrective service actions with clear tracking.",
  },
  {
    title: "Preventive care",
    detail:
      "Periodic inspection and maintenance guidance to preserve ergonomics, finish quality, and long-term performance.",
  },
] as const;

export const SERVICE_PAGE_CHANNELS = [
  {
    label: "Phone support",
    kind: "supportPhone",
  },
  {
    label: "Email support",
    kind: "salesEmail",
  },
  {
    label: "WhatsApp support",
    kind: "whatsapp",
    value: "Start chat",
    href: buildWhatsAppHref(
      "Hi, I need support for an installed workspace project.",
    ),
  },
] as const;

export const DOWNLOADS_PAGE_COPY = {
  metadataTitle: "Resource Desk",
  metadataDescription:
    "Request product catalogs, technical sheets, and planning references tailored to your workspace brief.",
  heroTitle: "Resource Desk",
  heroSubtitle:
    "Request the right product packs, technical sheets, and planning references for your workspace brief.",
  resourceKicker: "Resource routing",
  resourceTitle: "Tell us what you are planning and we will send the right documentation pack.",
  resourceDescription:
    "Our catalog keeps evolving across categories, finishes, and planning requirements. Instead of serving stale public downloads, we route each request to the latest pack for your project scope.",
  processKicker: "How it works",
  processTitle: "A request-based desk built for active projects.",
  processSteps: [
    {
      title: "Share your workspace brief",
      detail: "Tell us the categories, seat count, city, and timeline so we can match the right product set.",
    },
    {
      title: "We curate the latest pack",
      detail: "Our team sends current catalogs, technical sheets, and planning references that fit your requirement.",
    },
    {
      title: "Review with planning support",
      detail: "If needed, we help narrow options, clarify specifications, and connect the files to your layout or BOQ discussion.",
    },
  ],
  noteTitle: "What you can request",
  noteBody:
    "Request packs may include category catalogs, technical sheets, planning references, finish options, warranty details, and model-specific support documents where available.",
  notePoints: [
    "Product catalogs grouped by category and use case",
    "Technical sheets with dimensions, materials, and warranty guidance",
    "Planning references for workstation density, layouts, and execution flow",
  ],
  urgentKicker: "Need a quick response?",
  urgentDescription:
    "Send your requirement and the categories you need. We will reply with the latest available pack and the right follow-up contact for your project.",
  primaryCta: "Request a documentation pack",
  secondaryCta: "Email the sales desk",
  tertiaryCta: "Talk on WhatsApp",
} as const;

export const DOWNLOADS_RESOURCE_CATEGORIES = [
  {
    title: "Product catalogs",
    detail: "Collection overviews, category snapshots, and recommended product mixes.",
    cta: "Request catalog pack",
    href: "/contact",
  },
  {
    title: "Technical sheets",
    detail: "Material specifications, dimensions, warranty terms, and usage guidance.",
    cta: "Request technical sheets",
    href: "/contact",
  },
  {
    title: "Planning references",
    detail: "Layout examples, workstation densities, and execution best practices.",
    cta: "Request planning references",
    href: "/planning",
  },
] as const;

export const LEGAL_PAGE_COPY = {
  privacy: {
    title: "Privacy Policy",
    heroSubtitle:
      "How we handle enquiry data, attribution cookies, and communication records across planning, sales, and support flows.",
    overviewKicker: "Privacy and consent",
    overviewTitle: "A practical privacy policy for active workspace enquiries.",
    overviewDescription:
      "We collect only the information needed to respond to project requests, route support conversations, and maintain service records around active client relationships.",
    intro: [
      "One&Only is operated by One and Only Furniture Private Limited (\"OOFPL\"). This policy explains what personal data we collect, how we use it, and what cookies we set when you browse our website or submit an enquiry.",
      "Personal information includes data that can identify or contact you, such as your name, company, email address, phone number, IP address, and any enquiry details you share through our forms.",
    ],
    commitmentsTitle: "What this policy covers",
    commitments: [
      "What information we collect when you browse, enquire, or request support.",
      "How we use submitted information for routing, follow-up, and service quality.",
      "Which cookies support consent storage and attribution reporting.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    heroSubtitle:
      "Website, enquiry, quotation, delivery, warranty, and support terms for One&Only.",
    overviewKicker: "Commercial terms",
    overviewTitle: "The operating terms behind quotations, orders, delivery, and support.",
    overviewDescription:
      "These terms explain how website information, commercial quotations, project execution, and warranty-backed support are handled in practice.",
    sections: [
      {
        heading: "General Terms and Conditions",
        body: "These Terms and Conditions govern the use of this website and all commercial dealings with One&Only, including product enquiries, quotations, supply, and support services.",
      },
      {
        heading: "1. Scope",
        body: "These terms apply to all business relationships with customers, subject to any project-specific written agreement executed between both parties.",
      },
      {
        heading: "2. Quotations and acceptance",
        body: "Product and service information on this website is informational. A binding transaction occurs only after written quote acceptance and order confirmation.",
      },
      {
        heading: "3. Delivery and installation",
        body: "Delivery schedules are shared at order confirmation and may vary by project scope, site readiness, and material availability.",
      },
      {
        heading: "4. Warranty and support",
        body: "Warranty applicability follows the specific product line and agreed terms. Service and support requests are handled through our official channels.",
      },
      {
        heading: "5. Liability",
        body: "Liability is limited to the extent permitted by law and the value or terms agreed in the corresponding commercial contract.",
      },
    ],
  },
  imprint: {
    title: "Imprint",
    heroSubtitle:
      "Business identity, representative details, and official contact information for One&Only.",
    overviewKicker: "Business information",
    overviewTitle: "Official company and contact details.",
    overviewDescription:
      "Use this page when you need legal business identification, the official office address, or the named management and contact lines behind the website.",
    sections: [
      {
        heading: "Legal Information",
        lines: ["One and Only Furniture", "401, Jagat Trade Centre", "Frazer Road", "Patna - 800 001, Bihar", "India"],
      },
      {
        heading: "Represented by",
        lines: ["Management: Arvind Kumar Singh"],
      },
      {
        heading: "Contact",
        lines: ["Phone: +91 90310 22875", "Email: sales@oando.co.in"],
      },
      {
        heading: "Business Identification",
        lines: ["Authorized Dealer for leading office furniture brands.", "Registered in Patna, Bihar."],
      },
    ],
  },
  refund: {
    metadataTitle: "Refund and Return Policy",
    metadataDescription: "Refund, return, replacement, and cancellation policy for One&Only.",
    heroTitle: "Refund and return policy",
    heroSubtitle: "Terms for returns, replacements, cancellations, and refunds.",
    overviewKicker: "Returns and replacement terms",
    overviewTitle: "Clear guidance for damaged goods, cancellation windows, and refund eligibility.",
    overviewDescription:
      "This policy sets the expectations for product damage reporting, replacement handling, cancellation timing, and the conditions under which refunds are processed.",
    sections: [
      {
        title: "General policy",
        tone: "white",
        items: [
          "Change requests are not accepted after delivery is completed, except for damaged or defective products.",
          "Exchanges are only provided for products that arrive damaged or defective.",
          "Product images on the website are representational and a few features may vary on the final product.",
          "Cancellation is allowed before shipment. Discounted purchases are not eligible for cancellation.",
        ],
      },
      {
        title: "Damaged or defective products",
        tone: "soft",
        items: [
          "Report damage within 24 hours of delivery by email with product photos.",
          "Contact: sales@oando.co.in",
          "Reverse pickup and replacement for damaged product cases are arranged by our team.",
          "Replaceable faulty parts are usually arranged within 7 days; full replacement can take up to 15 days depending on availability.",
        ],
      },
      {
        title: "Returns and refunds",
        tone: "white",
        items: [
          "Returns are accepted only when products are damaged on arrival.",
          "Refund is issued only if replacement or replacement parts are not available for the same product.",
          "For non-damage refund requests, repackaging and transport charges may apply.",
          "Refunds are processed via NEFT or back to the original payment method, usually within 7 working days.",
        ],
      },
      {
        title: "How to initiate return or cancellation",
        tone: "soft",
        items: [],
        contactLines: [
          "Email: sales@oando.co.in",
          "Phone: +91 90310 22875",
          "Corporate Office: 401, Jagat Trade Centre, Frazer Road, Patna - 800 001, Bihar, India",
        ],
      },
    ],
  },
} as const;

export const PRODUCTS_PAGE_COPY = {
  heroSubtitle:
    "Furniture categories built for real office workflows, long-term durability, and scalable growth.",
  headlineLead: "Products selected for",
  headlineAccent: "performance, not just presentation.",
  pillars: [
    {
      title: "Specification-led guidance",
      detail:
        "We map headcount, usage patterns, and budget so product choices are practical from day one.",
      icon: "check-circle",
    },
    {
      title: "Reliable timelines",
      detail:
        "Modular categories and structured planning help teams move from approval to installation with control.",
      icon: "clock",
    },
    {
      title: "After-sales confidence",
      detail:
        "Warranty coverage and service support are built into every proposal, not handled as an afterthought.",
      icon: "shield",
    },
  ],
} as const;

export const CATEGORY_ROUTE_COPY = {
  metadataSuffix: "One&Only",
  metadataTail: "Browse our full range of {category} for practical office planning and delivery.",
  browseAllCta: "Browse all categories",
  resourceDeskCta: "Open Resource Desk",
  compareIdleLabel: "Select up to 4 products to compare",
  compareActiveLabel: "Compare {count} selected",
  pricingFallback: "Pricing shared on request",
  pricingBandSuffix: "price band",
  filterSummaryTitle: "Filter the current category",
  filterSummaryDescription:
    "Use a few focused filters to narrow the list, then compare or request the right options.",
  activeFiltersLabel: "Active filters",
  activeSearchLabel: "Search",
  activeCountLabel: "{count} active",
  clearFiltersCta: "Clear all",
  resultsSummaryLabel: "{shown} of {total} products",
  drawerResultsCta: "View {count} results",
  drawerResultsHint: "Filters update the current category only.",
  filterFallbackMessage:
    "Live filter sync is temporarily unavailable. Showing the current category snapshot instead.",
  emptyTitle: "No products match this filter set",
  emptyDescription:
    "Clear filters, adjust your search, or return to the full category list.",
  emptyPrimaryCta: "Clear all filters",
  emptySecondaryCta: "Browse all categories",
  offlineTitle: "Workspace product catalog temporarily unavailable",
  offlineDescription:
    "Product data is temporarily unavailable while the catalog reconnects. Please try again shortly.",
} as const;

export const COMPARE_ROUTE_COPY = {
  kicker: "Compare products",
  title: "Compare selected workspace options",
  description:
    "Review key category, material, warranty, and feature signals side by side before you request a quote or documentation pack.",
  countLabel: "Comparing {count} products",
  mobileHint: "Swipe horizontally on smaller screens to read every specification column.",
  browseCta: "Browse all categories",
  resourceDeskCta: "Open Resource Desk",
  primaryCta: "Request quote",
  viewProductCta: "View product",
  addToQuoteCta: "Add to quote cart",
  emptyTitle: "No products selected yet.",
  emptyDescription:
    "Add up to 4 products from category listings or product pages, then return here to compare the details side by side.",
  emptyPrimaryCta: "Browse all categories",
  emptySecondaryCta: "Open Resource Desk",
} as const;

export const QUOTE_CART_ROUTE_COPY = {
  kicker: "Quote cart",
  title: "Quote cart built for procurement follow-through.",
  description:
    "Keep shortlisted products, quantities, and the next planning or documentation step together before you contact sales.",
  browseCta: "Browse products",
  compareCta: "Compare selected",
  resourceDeskCta: "Open Resource Desk",
  planningCta: "Request planning call",
  primaryCta: "Submit quote request",
  summaryTitle: "Request summary",
  summaryDescription:
    "Use the quote lane when the shortlist is ready, Planning when the layout still needs work, and the Resource Desk when documentation is the next blocker.",
  summaryQuantityLabel: "Selected quantity",
  summaryProductsLabel: "Unique products",
  summaryCompareHint: "Need a side-by-side review first?",
  summaryDeskHint: "Need packs, technical sheets, or warranty references?",
  emptyTitle: "Your quote cart is empty.",
  emptyDescription:
    "Add products from category or product pages to keep procurement options together before you request pricing or documentation.",
  emptyPrimaryCta: "Browse products",
  emptySecondaryCta: "Open Resource Desk",
  clearCta: "Clear all",
  removeCta: "Remove",
} as const;

export const PDP_ROUTE_COPY = {
  fallbackDescription: "{name} from One&Only.",
  productBrand: "One&Only",
  summary: {
    title: "Decision snapshot",
    description:
      "Review the core fit, configuration, and support signals before you request a quote or documentation pack.",
    visualCoverage: "{count} verified images",
    galleryOnly: "Image gallery available",
    modelReady: "3D / AR ready",
    modelConditional: "3D by model",
    bestFor: "Best for",
    dimensions: "Dimensions",
    materials: "Materials",
    supportTitle: "Planning and documentation support",
    supportDescription:
      "Use Planning for layout guidance and the Resource Desk for technical sheets, finish options, and category packs where available.",
    supportQuote: "Add this model to your quote cart to keep procurement options together.",
    supportPlanning: "Use Planning when seat count, layout density, or workstation mix still needs work.",
    supportResources:
      "Use the Resource Desk when your team needs technical sheets, finish references, or documentation support.",
    useCases: "Best-fit spaces",
  },
  trustBadges: {
    madeInIndia: "Made in India",
    madeInIndiaDescription: "Local manufacturing details are shared by model where available.",
    certificationFallback: "Certification details by model",
    certificationDescription: "Certification details are shown where provided.",
    warrantyDescription: "Warranty terms vary by model and proposal.",
  },
  ctas: {
    addToQuote: "Add to Quote Cart",
    addToCompare: "Add To Compare",
    addedToCompare: "Added To Compare",
    requestQuote: "Request Quote",
    consultation: "Book a Consultation",
    planning: "Open Planning Service",
    resourceDesk: "Open Resource Desk",
    returnToResults: "Return to filtered results",
    returnToCategory: "Back to category",
    copyLink: "Copy Link",
    configuration: "Configuration",
    specifications: "Specifications",
    keyFeatures: "Key Features",
    technicalDetails: "Technical Details",
    materialOptions: "Material Options",
    modelUnavailable: "3D model currently unavailable for this product.",
    modelChecking: "Checking 3D model availability...",
    viewImage: "View Image",
    view3d: "View in 3D/AR",
  },
} as const;

