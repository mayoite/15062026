import Image from "next/image";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { GALLERY_PAGE_COPY, GALLERY_PROJECTS } from "@/data/site/routeCopy";
import { Masonry, MasonryItem } from "@/components/ui/Masonry";

export default function GalleryPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={GALLERY_PAGE_COPY.heroTitle}
        subtitle={GALLERY_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/projects/titan-gallery.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="shell-card mb-12 max-w-4xl p-8 md:p-10">
          <p className="typ-label mb-4 text-body">{GALLERY_PAGE_COPY.kicker}</p>
          <h2 className="typ-section text-strong">{GALLERY_PAGE_COPY.title}</h2>
          <p className="page-copy mt-4 max-w-3xl text-body">
            {GALLERY_PAGE_COPY.description}
          </p>
        </div>

        <Masonry columns={2} gap="2rem">
          {GALLERY_PROJECTS.map((project) => (
            <MasonryItem key={`${project.title}-${project.location}`}>
              <article className="shell-media-frame group relative mb-8">
                <Image
                  src={project.image}
                  alt={`${project.title} project`}
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="typ-label text-inverse-muted">
                    {project.category}
                  </p>
                  <h3 className="typ-h3 mt-2 text-inverse">{project.title}</h3>
                  <p className="text-inverse-body mt-1 text-sm">{project.location}</p>
                </div>
              </article>
            </MasonryItem>
          ))}
        </Masonry>
      </section>

      <ContactTeaser />
    </section>
  );
}

