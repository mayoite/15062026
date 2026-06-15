import { TrackedLink } from "@/components/ui/TrackedLink";
import type { ReactNode } from "react";

type RouteCtaActionVariant = "primary" | "outline-light";

interface RouteCtaAction {
  href: string;
  label: string;
  variant?: RouteCtaActionVariant;
}

interface RouteCtaBandProps {
  kicker?: string;
  title: ReactNode;
  description: ReactNode;
  actions: RouteCtaAction[];
  className?: string;
}

const actionVariantClassName: Record<RouteCtaActionVariant, string> = {
  primary: "btn-primary",
  "outline-light": "btn-outline-light",
};

export function RouteCtaBand({
  kicker,
  title,
  description,
  actions,
  className = "",
}: RouteCtaBandProps) {
  return (
    <div className={`shell-dark-cta-panel grid gap-6 lg:grid-cols-[1.1fr_auto] lg:items-end ${className}`.trim()}>
      <div className="max-w-2xl">
        {kicker ? <p className="typ-label text-inverse-muted">{kicker}</p> : null}
        <h2 className="typ-section mt-4 text-inverse">{title}</h2>
        <p className="page-copy text-inverse-body mt-4">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <TrackedLink
            key={`${action.href}-${action.label}`}
            href={action.href}
            label={action.label}
            surface="route-cta-band"
            className={actionVariantClassName[action.variant ?? "outline-light"]}
          >
            {action.label}
          </TrackedLink>
        ))}
      </div>
    </div>
  );
}
