"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, ChatCircleDots, ChatText, PhoneCall } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { buildWhatsAppHref, SITE_CONTACT, toTelHref } from "@/data/site/contact";
import { HOMEPAGE_CONTACT_CONTENT } from "@/data/site/homepage";
import {
  trackContactSubmission,
  trackSiteCtaClick,
} from "@/lib/analytics/siteEvents";
import { fadeUp } from "@/lib/helpers/motion";

export function ContactTeaser() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [brief, setBrief] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const directActions = HOMEPAGE_CONTACT_CONTENT.directActions.map((action) => ({
    ...action,
    href:
      action.type === "whatsapp"
        ? buildWhatsAppHref("Need a direct workspace response for my project brief.")
        : toTelHref(SITE_CONTACT.supportPhone),
    icon: action.type === "whatsapp" ? ChatCircleDots : PhoneCall,
    external: action.type === "whatsapp",
  }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setFormStatus({
        type: "error",
        message: "Please add a phone number or email so we can reach you.",
      });
      return;
    }

    const preferredContact =
      trimmedEmail && trimmedPhone ? "any" : trimmedEmail ? "email" : "phone";

    const payload = {
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      message: `${brief.trim()}\nCity: ${city.trim()}`,
      requirement: "Workspace planning",
      preferredContact,
      source: "homepage-quick-brief",
      sourcePath: window.location.pathname,
    };

    setIsSubmitting(true);
    setFormStatus({ type: "idle", message: "" });
    try {
      const response = await fetch("/api/customer-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to submit now.");
      }

      setName("");
      setCity("");
      setPhone("");
      setEmail("");
      setBrief("");
      trackContactSubmission({
        pathname: window.location.pathname,
        surface: "contact-teaser",
        source: "homepage-quick-brief",
        status: "success",
      });
      setFormStatus({ type: "success", message: "Brief received. Our team will contact you shortly." });
    } catch (error) {
      trackContactSubmission({
        pathname: window.location.pathname,
        surface: "contact-teaser",
        source: "homepage-quick-brief",
        status: "error",
      });
      setFormStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="contact"
      className="home-section home-section--soft border-t border-theme-soft section-y-sm scroll-mt-24"
    >
      <div className="home-shell-xl">
        <div className="contact-teaser contact-teaser__shell">
          <div className="contact-teaser__layout grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(220px,2fr)_minmax(0,3fr)] md:gap-6">
            <motion.div className="contact-teaser__intro" {...fadeUp(12, 0.06)}>
              <h2 className="home-heading">
                {HOMEPAGE_CONTACT_CONTENT.titleLead}{" "}
                <span className="text-accent-italic">{HOMEPAGE_CONTACT_CONTENT.titleAccent}</span>
              </h2>
              <p className="page-copy-sm mt-5 max-w-xl text-muted">
                {HOMEPAGE_CONTACT_CONTENT.subtitle}
              </p>
            </motion.div>

            <motion.form
              aria-label="Project brief enquiry"
              className="contact-teaser__form"
              onSubmit={handleSubmit}
              {...fadeUp(16, 0.14)}
            >
              <div className="contact-teaser__mini-grid grid grid-cols-1 gap-2 md:grid-cols-2">
                <label className="contact-teaser__field" htmlFor="contact-teaser-name">
                  <span className="typ-label text-muted">Name</span>
                  <input
                    id="contact-teaser-name"
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="contact-teaser__input"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={180}
                    placeholder="Your name"
                  />
                </label>
                <label className="contact-teaser__field" htmlFor="contact-teaser-city">
                  <span className="typ-label text-muted">City</span>
                  <input
                    id="contact-teaser-city"
                    name="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="contact-teaser__input"
                    type="text"
                    autoComplete="address-level2"
                    required
                    maxLength={120}
                    placeholder="Project city"
                  />
                </label>
                <label className="contact-teaser__field" htmlFor="contact-teaser-phone">
                  <span className="typ-label text-muted">Phone</span>
                  <input
                    id="contact-teaser-phone"
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="contact-teaser__input"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={50}
                    placeholder="+91 …"
                  />
                </label>
                <label className="contact-teaser__field" htmlFor="contact-teaser-email">
                  <span className="typ-label text-muted">Email</span>
                  <input
                    id="contact-teaser-email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="contact-teaser__input"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={180}
                    placeholder="you@company.com"
                  />
                </label>
              </div>
              <p className="contact-teaser__hint typ-body-sm text-subtle">
                Phone or email — at least one is required.
              </p>

              <label className="contact-teaser__field contact-teaser__field--brief" htmlFor="contact-teaser-brief">
                <div className="flex items-center justify-between gap-2">
                  <span className="typ-label text-muted">Brief</span>
                  <span className="typ-body-sm text-subtle" aria-live="polite" aria-atomic="true">
                    {brief.length}/5000
                  </span>
                </div>
                <textarea
                  id="contact-teaser-brief"
                  name="brief"
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  className="contact-teaser__input contact-teaser__input--textarea"
                  rows={2}
                  required
                  maxLength={5000}
                  placeholder="Team size, scope, or timeline — optional detail helps."
                />
              </label>

              <div className="contact-teaser__cta-stack">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  <ChatText size={16} weight="duotone" aria-hidden="true" />
                  {isSubmitting ? "Sending..." : "Send Brief"}
                </button>

                <div className="contact-teaser__support-row">
                  {directActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <a
                        key={action.label}
                        href={action.href}
                        target={action.external ? "_blank" : undefined}
                        rel={action.external ? "noopener noreferrer" : undefined}
                        className={`contact-teaser__support-link typ-cta${
                          action.type === "whatsapp" ? " contact-teaser__support-link--whatsapp" : ""
                        }`}
                        onClick={() =>
                          trackSiteCtaClick({
                            href: action.href,
                            label: action.label,
                            pathname: window.location.pathname,
                            surface: "contact-teaser",
                          })
                        }
                      >
                        <span className="contact-teaser__support-link-icon">
                          <Icon size={16} weight="duotone" />
                        </span>
                        <span>{action.label}</span>
                        <ArrowUpRight size={14} weight="bold" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {formStatus.type !== "idle" ? (
                <p className={`contact-teaser__status contact-teaser__status--${formStatus.type}`} role="status">
                  {formStatus.message}
                </p>
              ) : null}
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
