import clsx from "clsx";

export interface ClientBadgeData {
  name: string;
  sector: string;
  location?: string;
}

interface ClientBadgeProps extends ClientBadgeData {
  featured?: boolean;
}

export function ClientBadge({
  name,
  sector,
  location,
  featured = false,
}: ClientBadgeProps) {
  return (
    <div className={clsx("client-badge group", featured && "client-badge--featured")}>
      <div className="flex items-start justify-between gap-2">
        <span className="client-badge__sector">{sector}</span>
      </div>
      <div>
        <h3 className="client-badge__name">{name}</h3>
        {location ? <p className="client-badge__location">{location}</p> : null}
      </div>
    </div>
  );
}
