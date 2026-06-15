"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, X } from "lucide-react";
import { buildMailtoHref, buildWhatsAppHref } from "@/data/site/contact";

type UseCase =
  | "workstations"
  | "seating"
  | "meeting"
  | "storage"
  | "acoustics"
  | "reception"
  | "cafeteria"
  | "full-office"
  | "other";

type Timeline = "immediately" | "one-to-three" | "three-to-six" | "exploring";

type ContactMethod = "whatsapp" | "email";

interface BotState {
  useCase: UseCase | null;
  companyName: string;
  seats: string;
  city: string;
  budget: string;
  timeline: Timeline | null;
  contactMethod: ContactMethod | null;
  contactValue: string;
  notes: string;
}

const initialState: BotState = {
  useCase: null,
  companyName: "",
  seats: "",
  city: "",
  budget: "",
  timeline: null,
  contactMethod: null,
  contactValue: "",
  notes: "",
};

export function AdvancedBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BotState>(initialState);

  const canGoNext = useMemo(() => {
    if (step === 0) return state.useCase !== null;
    if (step === 1) return state.seats.trim().length > 0;
    if (step === 2)
      return (
        state.companyName.trim().length > 0 &&
        state.city.trim().length > 0 &&
        state.timeline !== null
      );
    if (step === 3)
      return (
        state.contactMethod !== null && state.contactValue.trim().length > 0
      );
    return true;
  }, [step, state]);

  const summary = useMemo(() => {
    const lines = [];
    lines.push("Enquiry for One&Only via Website Bot");
    if (state.useCase) {
      const labels: Record<UseCase, string> = {
        workstations: "Workstations",
        seating: "Seating",
        meeting: "Meeting and conference",
        storage: "Storage",
        acoustics: "Acoustic solutions",
        reception: "Reception and lounge",
        cafeteria: "Cafeteria and breakout",
        "full-office": "Full office fitout",
        other: "Other",
      };
      lines.push(`Product family / project type: ${labels[state.useCase]}`);
    }
    if (state.companyName.trim()) {
      lines.push(`Company: ${state.companyName.trim()}`);
    }
    if (state.seats.trim())
      lines.push(`Approx seats / units: ${state.seats.trim()}`);
    if (state.city.trim()) lines.push(`City: ${state.city.trim()}`);
    if (state.timeline) {
      const labels: Record<Timeline, string> = {
        immediately: "Immediate (0–4 weeks)",
        "one-to-three": "1–3 months",
        "three-to-six": "3–6 months",
        exploring: "Just exploring / no fixed date",
      };
      lines.push(`Timeline: ${labels[state.timeline]}`);
    }
    if (state.budget.trim()) lines.push(`Budget range: ${state.budget.trim()}`);
    if (state.contactMethod && state.contactValue.trim()) {
      const label = state.contactMethod === "whatsapp" ? "WhatsApp" : "Email";
      lines.push(`${label}: ${state.contactValue.trim()}`);
    }
    if (state.notes.trim()) lines.push(`Notes: ${state.notes.trim()}`);
    return lines.join("\n");
  }, [state]);

  const whatsappUrl = useMemo(() => {
    return buildWhatsAppHref(
      `One&Only workspace enquiry via website bot\n\n${summary}`,
    );
  }, [summary]);

  const mailtoUrl = useMemo(() => {
    return buildMailtoHref(
      "One&Only workspace enquiry via website bot",
      summary,
    );
  }, [summary]);

  const resetBot = () => {
    setState(initialState);
    setStep(0);
  };

  const closeBot = () => {
    setIsOpen(false);
  };

  const openBot = () => {
    setIsOpen(true);
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      closeBot();
      return;
    }
    setStep(step - 1);
  };

  return (
    <>
      <motion.button
        onClick={() => {
          if (!isOpen) {
            resetBot();
            openBot();
          } else {
            closeBot();
          }
        }}
        className="whatsapp-cta fixed bottom-20 right-3 z-40 inline-flex h-11 items-center gap-1.5 px-3 text-white shadow-xl transition-colors sm:bottom-24 sm:right-6 sm:h-12 sm:gap-2 sm:px-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open WhatsApp project assistant"
        title="Open WhatsApp project assistant"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline text-xs font-semibold tracking-wide">
          WhatsApp
        </span>
        <span className="hidden sm:inline h-2 w-2 rounded-full bg-white/90" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed z-40 right-3 bottom-32 sm:right-6 sm:bottom-40 w-[min(22rem,calc(100vw-1.5rem))] sm:w-80 rounded-2xl bg-white shadow-2xl border border-neutral-200"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  WhatsApp Project Assistant
                </p>
                <p className="text-xs text-neutral-500">
                  Share your requirement in under 60 seconds
                </p>
              </div>
              <button
                onClick={closeBot}
                aria-label="Close chat assistant"
                title="Close chat assistant"
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-3 text-sm">
              {step === 0 && (
                <div className="space-y-3">
                  <p className="text-neutral-800">
                    Which product family or project type is this for?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setState({ ...state, useCase: "workstations" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "workstations"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Workstations
                    </button>
                    <button
                      onClick={() => setState({ ...state, useCase: "seating" })}
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "seating"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Seating
                    </button>
                    <button
                      onClick={() => setState({ ...state, useCase: "meeting" })}
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "meeting"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Meeting tables
                    </button>
                    <button
                      onClick={() => setState({ ...state, useCase: "storage" })}
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "storage"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Storage
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, useCase: "acoustics" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "acoustics"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Acoustics
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, useCase: "reception" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "reception"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Reception & lounge
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, useCase: "cafeteria" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "cafeteria"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Cafeteria
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, useCase: "full-office" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "full-office"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Full office
                    </button>
                    <button
                      onClick={() => setState({ ...state, useCase: "other" })}
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.useCase === "other"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Other
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-neutral-800">
                    Roughly how many seats or units do you need?
                  </p>
                  <input
                    type="text"
                    value={state.seats}
                    onChange={(e) =>
                      setState({ ...state, seats: e.target.value })
                    }
                    placeholder="e.g. 12 workstations, 30 chairs"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-neutral-800">
                    Tell us about your company and project timing.
                  </p>
                  <input
                    type="text"
                    value={state.companyName}
                    onChange={(e) =>
                      setState({ ...state, companyName: e.target.value })
                    }
                    placeholder="Company name"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={state.city}
                    onChange={(e) =>
                      setState({ ...state, city: e.target.value })
                    }
                    placeholder="City and state"
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setState({ ...state, timeline: "immediately" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.timeline === "immediately"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      ASAP (0–4 weeks)
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, timeline: "one-to-three" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.timeline === "one-to-three"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      1–3 months
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, timeline: "three-to-six" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.timeline === "three-to-six"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      3–6 months
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, timeline: "exploring" })
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs ${
                        state.timeline === "exploring"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Just exploring
                    </button>
                  </div>
                  <input
                    type="text"
                    value={state.budget}
                    onChange={(e) =>
                      setState({ ...state, budget: e.target.value })
                    }
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                    aria-label="Your approximate budget"
                    placeholder="e.g. ₹5,00,000"
                    title="Your approximate budget"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-neutral-800">How should we contact you?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setState({ ...state, contactMethod: "whatsapp" })
                      }
                      className={`flex-1 px-3 py-1.5 rounded-full border text-xs ${
                        state.contactMethod === "whatsapp"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() =>
                        setState({ ...state, contactMethod: "email" })
                      }
                      className={`flex-1 px-3 py-1.5 rounded-full border text-xs ${
                        state.contactMethod === "email"
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                  <input
                    type="text"
                    value={state.contactValue}
                    onChange={(e) =>
                      setState({ ...state, contactValue: e.target.value })
                    }
                    placeholder={
                      state.contactMethod === "email"
                        ? "Your email address"
                        : "Your WhatsApp number with country code"
                    }
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-neutral-800">
                    Any additional notes or special requirements?
                  </p>
                  <textarea
                    value={state.notes}
                    onChange={(e) =>
                      setState({ ...state, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Optional details about layout, timelines, or brands."
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <div className="rounded-md bg-neutral-50 border border-neutral-200 px-3 py-2 text-[11px] leading-snug text-neutral-700">
                    <p className="font-medium mb-1">
                      Preview of what we receive:
                    </p>
                    <pre className="whitespace-pre-wrap text-[10px] text-neutral-700">
                      {summary}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-cta inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      Send via WhatsApp
                      <ArrowRight className="w-3 h-3" />
                    </a>
                    <a
                      href={mailtoUrl}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      Send via Email
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <button
                onClick={handleBack}
                className="text-xs text-neutral-600 hover:text-neutral-900"
              >
                {step === 0 ? "Close" : "Back"}
              </button>
              {step < 4 && (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                    canGoNext
                      ? "bg-neutral-900 text-white hover:bg-neutral-800"
                      : "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Next
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={resetBot}
                  className="text-xs text-neutral-500 hover:text-neutral-800"
                >
                  Start over
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

