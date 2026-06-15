import type { ClientBadgeData } from "@/components/ClientBadge";

export const TRUSTED_BY_STATS = [
  { value: "14+", label: "Years of experience" },
  { value: "120+", label: "Projects completed" },
  { value: "251+", label: "Corporate clients" },
  { value: "20+", label: "Locations serviced" },
] as const;

export const TRUSTED_BY_CLIENTS: ClientBadgeData[] = [
  { name: "Adani Power", sector: "Energy" },
  { name: "Adecco", sector: "Corporate" },
  { name: "Indian Bank", sector: "Finance" },
  { name: "Amara Raja", sector: "Manufacturing" },
  { name: "Ambuja Neotia", sector: "Corporate" },
  { name: "Annapurna Finance", sector: "Finance" },
  { name: "Asian Paints", sector: "FMCG" },
  { name: "Azim Premji Foundation", sector: "NGO / UN" },
  { name: "BBC Media Action", sector: "NGO / UN" },
  { name: "BHEL", sector: "Energy" },
  { name: "Bureau of Indian Standards", sector: "Government" },
  { name: "Hyundai", sector: "Automotive" },
  { name: "IDBI Bank", sector: "Finance" },
  { name: "ITC Limited", sector: "FMCG" },
  { name: "Income Tax Department", sector: "Government" },
  { name: "IndianOil", sector: "Energy" },
  { name: "JSW", sector: "Manufacturing" },
  { name: "L&T", sector: "Manufacturing" },
  { name: "Maruti Suzuki", sector: "Automotive" },
  { name: "NTPC", sector: "Energy" },
  { name: "SAIL", sector: "Manufacturing" },
  { name: "State Bank of India", sector: "Finance" },
  { name: "SITI Networks", sector: "Telecom" },
  { name: "Titan", sector: "Manufacturing", location: "Patna, Bihar" },
  { name: "United Nations", sector: "NGO / UN" },
  { name: "UNICEF", sector: "NGO / UN" },
  { name: "Vodafone", sector: "Telecom" },
  { name: "World Health Organization", sector: "NGO / UN" },
] as const satisfies ClientBadgeData[];
