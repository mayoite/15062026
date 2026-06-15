import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CollaborationSection() {
  return (
    <section className="w-full py-0">
      {/* Full-bleed editorial layout: Image left, text right */}
      <div className="flex flex-col lg:flex-row min-h-[520px]">

        {/* Image panel â€” full-bleed, no container padding */}
        <div className="relative w-full lg:w-[55%] aspect-[16/10] lg:aspect-auto overflow-hidden bg-soft">
          <Image
            src="/images/hero/tvs-patna-hq.webp"
            alt="Collaborative office workspace designed by One&Only"
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>

        {/* Text panel */}
        <div className="section-ink flex w-full flex-col justify-center px-8 py-16 md:px-16 lg:w-[45%] lg:py-20">
          <p className="typ-label text-inverse-muted mb-6">Workspace Solutions</p>
          <h2 className="typ-section text-inverse mb-6 leading-tight">
            Space for{" "}
            <em className="italic text-inverse-muted">collaboration.</em>
          </h2>
          <p className="text-inverse-body text-base leading-relaxed font-light max-w-sm mb-10">
            Plan breakout, meeting and lounge zones that help teams connect,
            discuss and decide faster â€” without leaving the building.
          </p>
          <Link
            href="/solutions"
            className="typ-label inline-flex items-center gap-3 text-inverse border-b border-inverse pb-2 hover:border-inverse/60 transition-colors w-fit"
          >
            Explore workspace solutions <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}




