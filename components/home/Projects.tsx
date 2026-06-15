"use client";

import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import { TrackedLink } from "@/components/ui/TrackedLink";

import {
  HOMEPAGE_PROJECTS_CONTENT,
  HOMEPAGE_SHOWCASE_CONTENT,
} from "@/data/site/homepage";

const PROJECT_LAYOUT_CLASSNAMES = [
  "projects-card--primary",
  "projects-card--secondary",
  "projects-card--tertiary",
  "projects-card--quaternary",
] as const;

export function Projects() {
  const { titleLead, titleAccent, cta } = HOMEPAGE_PROJECTS_CONTENT;
  const cards = HOMEPAGE_SHOWCASE_CONTENT.items.slice(0, 4);

  return (
    <section className="projects-section home-section--soft">
      <div className="home-shell-xl">
        <div className="projects-section__header">
          <div className="projects-section__intro">
            <h2 className="home-heading">
              {titleLead} <span className="text-accent-italic">{titleAccent}</span>
            </h2>
            <p className="typ-body-sm text-muted mt-3">
              A tighter look at recent workplace installs across government, corporate, and
              industrial teams.
            </p>
          </div>

          <TrackedLink
            href={cta.href}
            label={cta.label}
            surface="home-projects"
            className="projects-section__cta"
          >
            {cta.label}
            <ArrowRight size={14} weight="bold" />
          </TrackedLink>
        </div>

        <div className="projects-grid">
          {cards.map((project, index) => (
            <TrackedLink
              key={project.id}
              href={project.link}
              label={project.name}
              surface="home-projects-card"
              className={`projects-card group ${PROJECT_LAYOUT_CLASSNAMES[index] ?? "projects-card--secondary"}`}
            >
              <div className="projects-card__media">
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 42vw"
                  className="projects-card__image"
                />
                <div className="projects-card__veil" />
              </div>

              <div className="projects-card__body">
                <div className="projects-card__meta">
                  <span className="projects-card__category">{project.label}</span>
                  <span className="projects-card__eyebrow">Featured project</span>
                </div>
                <h3 className="projects-card__title">{project.name}</h3>
                <p className="projects-card__outcome">{project.description}</p>
                <span className="projects-card__link">
                  See project
                  <ArrowRight size={14} weight="bold" />
                </span>
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>
    </section>
  );
}
