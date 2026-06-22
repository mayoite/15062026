"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

import { HOMEPAGE_PROJECTS_CONTENT } from "@/lib/site-data/homepage";

export function Projects() {
  const { titleLead, titleAccent, cta, cards } = HOMEPAGE_PROJECTS_CONTENT;

  return (
    <section className="home-section--soft border-t border-b border-theme-soft section-y-sm">
      <div className="home-shell-xl">
        <h2 className="home-heading mb-8">
          {titleLead}{" "}
          <span className="text-accent-italic">{titleAccent}</span>
        </h2>

        <div className="home-feature-grid">
          {cards.map((project) => (
            <Link key={project.name} href={cta.href} className="group block min-w-0">
              <div className="home-feature-card__media relative aspect-[4/3] overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="home-feature-card__caption">
                <h3 className="typ-label text-strong">{project.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href={cta.href}
          className="home-section-cta typ-label inline-flex items-center gap-2 text-muted hover:text-strong"
        >
          {cta.label}
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </section>
  );
}
