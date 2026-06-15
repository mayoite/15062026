import { TrackedLink } from "@/components/ui/TrackedLink";

type RouteActionCardVariant = "primary" | "outline";

interface RouteActionCardAction {
  href: string;
  label: string;
  variant?: RouteActionCardVariant;
}

interface RouteActionCardProps {
  kicker?: string;
  title: string;
  description: string;
  actions: RouteActionCardAction[];
  className?: string;
  panelClassName?: string;
}

const actionVariantClassName: Record<RouteActionCardVariant, string> = {
  primary: "btn-primary",
  outline: "btn-outline",
};

export function RouteActionCard({
  kicker,
  title,
  description,
  actions,
  className = "",
  panelClassName = "shell-card",
}: RouteActionCardProps) {
  return (
    <div className={`${panelClassName} ${className}`.trim()}>
      {kicker ? <p className="typ-label text-muted mb-3">{kicker}</p> : null}
      <h3 className="typ-section text-strong">{title}</h3>
      <p className="page-copy text-body mt-4 max-w-3xl">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map((action) => (
          <TrackedLink
            key={`${action.href}-${action.label}`}
            href={action.href}
            label={action.label}
            surface="route-action-card"
            className={actionVariantClassName[action.variant ?? "outline"]}
          >
            {action.label}
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}
