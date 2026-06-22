import OpengraphImage from "./opengraph-image";
import { SITE_BRAND } from "@/lib/site-data/brand";

export const runtime = "edge";
export const alt = SITE_BRAND.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
