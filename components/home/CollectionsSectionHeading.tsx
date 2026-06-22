import { HOMEPAGE_COLLECTIONS_CONTENT } from "@/lib/site-data/homepage";

type CollectionsSectionHeadingProps = {
  as?: "h1" | "h2";
  className?: string;
};

/** Shared “Browse workspace categories” lockup — homepage Collections + /products index. */
export function CollectionsSectionHeading({
  as: Tag = "h2",
  className = "home-heading max-w-2xl",
}: CollectionsSectionHeadingProps) {
  const { titleLead, titleAccent } = HOMEPAGE_COLLECTIONS_CONTENT;

  return (
    <Tag className={className}>
      {titleLead}{" "}
      <span className="text-accent-italic">{titleAccent}</span>
    </Tag>
  );
}
