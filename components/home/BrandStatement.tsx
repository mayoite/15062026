import { Reveal } from "@/components/shared/Reveal";
import { HOMEPAGE_BRAND_STATEMENT_CONTENT } from "@/lib/site-data/homepage";

export function BrandStatement() {
  return (
    <section className="scheme-section-soft scheme-border w-full border-y py-20 md:py-24">
      <div className="home-shell-xl">
        <Reveal y={25}>
          <div className="max-w-4xl">
            <p className="typ-section text-strong">
              {HOMEPAGE_BRAND_STATEMENT_CONTENT.lead}
            </p>
            <p className="page-copy text-body mt-5 max-w-3xl">
              {HOMEPAGE_BRAND_STATEMENT_CONTENT.body}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
