export type HeroCarouselSlide = {
  src: string;
  location: string;
  headline: string;
  sub: string;
  ctas: Array<{
    label: string;
    href: string;
    variant: "primary" | "secondary";
  }>;
};

export const HERO_CAROUSEL_SLIDES: HeroCarouselSlide[] = [
  {
    src: "/images/hero/titan-patna-hero.webp",
    location: "Titan Patna",
    headline: "Titan Patna\nCollaborative Office Design",
    sub: "Premium seating, meeting, and planning systems tailored for Titan's day-to-day collaboration and leadership workflows.",
    ctas: [
      {
        label: "View products",
        href: "/products",
        variant: "primary",
      },
      {
        label: "Get a quote",
        href: "/contact",
        variant: "secondary",
      },
    ],
  },
  {
    src: "/images/hero/tvs-patna-hero.webp",
    location: "TVS Patna",
    headline: "TVS Patna\nEngineered Workspaces",
    sub: "High-performance workstation planning delivered for TVS teams in Patna with ergonomic execution at enterprise scale.",
    ctas: [
      {
        label: "View products",
        href: "/products",
        variant: "primary",
      },
      {
        label: "Get a quote",
        href: "/contact",
        variant: "secondary",
      },
    ],
  },
];


