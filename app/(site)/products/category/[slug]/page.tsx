import { normalizeRequestedCategoryId } from '@/features/catalog/categories';
import { notFound } from "next/navigation";
import { CategoryPageView } from "../../[category]/CategoryPageView";

export default async function LegacyCategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryId = normalizeRequestedCategoryId(slug);

  if (!categoryId) {
    notFound();
  }

  return CategoryPageView({ categoryId });
}
