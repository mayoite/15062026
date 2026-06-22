import { CareerPageView } from "@/components/career/CareerPageView";
import { CAREER_PAGE_METADATA } from "@/lib/site-data/routeMetadata";

export const metadata = CAREER_PAGE_METADATA;

export default function CareerPage() {
  return <CareerPageView />;
}
