"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { hasConsentChoice } from "@/lib/consent";
import { sanitizeDisplayText } from "@/lib/displayText";
import { getCatalogProductHref } from '@/features/catalog/categories';
import {
  type AdvisorRecommendation,
  type AdvisorResult,
  type AdvisorStreamEvent,
} from '@/features/ai/aiAdvisor';
import {
  AI_ADVISOR_COPY,
  AI_ASSISTANT_REFINERS,
  AI_ASSISTANT_STARTERS,
  AI_ASSISTANT_WELCOME_MESSAGE,
  AI_CHATBOT_COPY,
  GUIDED_PLANNER_COPY,
  MOBILE_ASSISTANT_COPY,
} from "@/data/site/assistant";

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

type GuidedState = {
  useCase: UseCase | "";
  seats: string;
  company: string;
  city: string;
  timeline: Timeline | "";
  budget: string;
  notes: string;
  name: string;
  email: string;
  phone: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  result?: AdvisorResult;
  streaming?: boolean;
};

const INITIAL_GUIDED: GuidedState = {
  useCase: "",
  seats: "",
  company: "",
  city: "",
  timeline: "",
  budget: "",
  notes: "",
  name: "",
  email: "",
  phone: "",
};

const USE_CASE_LABEL: Record<UseCase, string> = {
  workstations: "Workstations",
  seating: "Seating",
  meeting: "Meeting and conference",
  storage: "Storage",
  acoustics: "Acoustics",
  reception: "Reception and lounge",
  cafeteria: "Cafeteria and breakout",
  "full-office": "Full office",
  other: "Other",
};

const TIMELINE_LABEL: Record<Timeline, string> = {
  immediately: "Immediate (0-4 weeks)",
  "one-to-three": "1-3 months",
  "three-to-six": "3-6 months",
  exploring: "Exploring options",
};

const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

function buildGuidedSummary(guided: GuidedState) {
  const lines = ["Guided planner intake"];
  if (guided.useCase) lines.push(`Use case: ${USE_CASE_LABEL[guided.useCase]}`);
  if (guided.seats.trim()) lines.push(`Seats/units: ${guided.seats.trim()}`);
  if (guided.company.trim()) lines.push(`Company: ${guided.company.trim()}`);
  if (guided.city.trim()) lines.push(`City: ${guided.city.trim()}`);
  if (guided.timeline) lines.push(`Timeline: ${TIMELINE_LABEL[guided.timeline]}`);
  if (guided.budget.trim()) lines.push(`Budget: ${guided.budget.trim()}`);
  if (guided.notes.trim()) lines.push(`Notes: ${guided.notes.trim()}`);
  return lines.join("\n");
}

function recommendationHref(rec: AdvisorRecommendation) {
  const key = rec.productUrlKey || rec.productId || "";
  return getCatalogProductHref(String(rec.category || "").trim().toLowerCase(), key);
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractSummaryFromStream(raw: string): string {
  const match = raw.match(/"summary"\s*:\s*"/);
  if (!match || match.index === undefined) return "";

  let value = "";
  let escaped = false;

  for (let index = match.index + match[0].length; index < raw.length; index += 1) {
    const character = raw[index];
    if (character === "\"" && !escaped) break;
    value += character;
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    }
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\")
    .trim();
}

export function UnifiedAssistant() {
  const pathname = usePathname();
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileLauncherOpen, setMobileLauncherOpen] = useState(false);
  const [consentChosen, setConsentChosen] = useState(true);

  const [guidedStep, setGuidedStep] = useState(0);
  const [guided, setGuided] = useState<GuidedState>(INITIAL_GUIDED);
  const [guidedSaving, setGuidedSaving] = useState(false);
  const [guidedError, setGuidedError] = useState("");
  const [guidedSubmittedId, setGuidedSubmittedId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateId("assistant"),
      role: "assistant",
      text: AI_ASSISTANT_WELCOME_MESSAGE,
    },
  ]);

  useEffect(() => {
    setConsentChosen(hasConsentChoice());

    const handleGuidedOpen = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: "guided" | "ai" }>;
      if (custom.detail?.tab === "ai") {
        setChatOpen(true);
      } else {
        setGuidedOpen(true);
      }
    };
    const handleChatbotOpen = () => setChatOpen(true);
    const handleConsent = () => setConsentChosen(true);

    window.addEventListener("oando-assistant:open", handleGuidedOpen as EventListener);
    window.addEventListener("oando-chatbot:open", handleChatbotOpen as EventListener);
    window.addEventListener("oando-cookie-consent", handleConsent as EventListener);
    return () => {
      window.removeEventListener("oando-assistant:open", handleGuidedOpen as EventListener);
      window.removeEventListener("oando-chatbot:open", handleChatbotOpen as EventListener);
      window.removeEventListener("oando-cookie-consent", handleConsent as EventListener);
    };
  }, []);

  const stepValid = useMemo(() => {
    if (guidedStep === 0) return Boolean(guided.useCase && guided.seats.trim());
    if (guidedStep === 1) return Boolean(guided.city.trim() && guided.timeline);
    return Boolean(guided.name.trim() && guided.email.trim());
  }, [guided, guidedStep]);

  const guidedSummary = useMemo(() => buildGuidedSummary(guided), [guided]);
  const lastUserQuery = useMemo(() => {
    const userMessages = chatMessages.filter((message) => message.role === "user");
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].text : "";
  }, [chatMessages]);

  function updateChatMessage(
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) {
    setChatMessages((prev) =>
      prev.map((message) => (message.id === messageId ? updater(message) : message)),
    );
  }

  function resetChatbot() {
    setQuery("");
    setAiError("");
    setChatMessages([
      {
        id: generateId("assistant"),
        role: "assistant",
        text: AI_ASSISTANT_WELCOME_MESSAGE,
      },
    ]);
  }

  async function completeGuidedFlow() {
    if (guidedSaving || guidedSubmittedId) return;
    setGuidedSaving(true);
    setGuidedError("");

    try {
      const response = await fetch("/api/customer-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: guided.name,
          company: guided.company || undefined,
          email: guided.email,
          phone: guided.phone || undefined,
          message: guidedSummary,
          requirement: guided.useCase || undefined,
          budget: guided.budget || undefined,
          timeline: guided.timeline ? TIMELINE_LABEL[guided.timeline] : undefined,
          preferredContact: guided.phone.trim() ? "phone" : "email",
          source: "homepage-chatbot",
          sourcePath: pathname,
        }),
      });

      const json = (await response.json()) as { queryId?: string; error?: string };
      if (!response.ok || !json.queryId) {
        setGuidedError(json.error || GUIDED_PLANNER_COPY.errors.saveFailed);
        return;
      }

      setGuidedSubmittedId(json.queryId);
    } catch {
      setGuidedError(GUIDED_PLANNER_COPY.errors.network);
    } finally {
      setGuidedSaving(false);
    }
  }

  function handleGuidedNext() {
    if (!stepValid || guidedSaving) return;
    if (guidedStep < 2) {
      setGuidedStep((prev) => prev + 1);
      return;
    }
    void completeGuidedFlow();
  }

  function resetGuided() {
    setGuided(INITIAL_GUIDED);
    setGuidedStep(0);
    setGuidedError("");
    setGuidedSubmittedId(null);
  }

  async function submitAiQuery(inputQuery: string) {
    const trimmed = inputQuery.trim();
    if (!trimmed || aiLoading) return;

    const assistantMessageId = generateId("assistant");
    setAiLoading(true);
    setAiError("");
    setQuery("");
    setChatMessages((prev) => [
      ...prev,
      {
        id: generateId("user"),
        role: "user",
        text: trimmed,
      },
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        streaming: true,
      },
    ]);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch("/api/ai-advisor/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query: trimmed,
          context: {
            source: "global",
            sourcePath: pathname,
          },
          stream: true,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/x-ndjson") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let raw = "";
        let finalResult: AdvisorResult | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as AdvisorStreamEvent;

            if (event.type === "delta") {
              raw += event.text;
              const streamedSummary =
                extractSummaryFromStream(raw) ||
                (raw.trimStart().startsWith("{") ? "" : raw.trim());
              if (streamedSummary) {
                updateChatMessage(assistantMessageId, (message) => ({
                  ...message,
                  text: streamedSummary,
                  streaming: true,
                }));
              }
            }

            if (event.type === "result") {
              finalResult = event.result;
              updateChatMessage(assistantMessageId, (message) => ({
                ...message,
                text: event.result.summary || AI_CHATBOT_COPY.summaryFallback,
                result: event.result,
                streaming: false,
              }));
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }

        if (!finalResult) {
          throw new Error(AI_CHATBOT_COPY.advisorUnavailable);
        }

        return;
      }

      const json = (await response.json()) as AdvisorResult & { error?: string };
      if (!response.ok || !json.recommendations) {
        throw new Error(json.error || AI_CHATBOT_COPY.advisorUnavailable);
      }

      updateChatMessage(assistantMessageId, (message) => ({
        ...message,
        text: json.summary || AI_CHATBOT_COPY.summaryFallback,
        result: {
          recommendations: json.recommendations,
          totalBudget: json.totalBudget,
          summary: json.summary,
          nextActions: json.nextActions,
          warnings: json.warnings,
          pricingMode: json.pricingMode,
          fallbackUsed: json.fallbackUsed,
        },
        streaming: false,
      }));
    } catch (error) {
      const errorText =
        error instanceof DOMException && error.name === "AbortError"
          ? "The advisor timed out after 10 seconds. Please try a shorter prompt."
          : error instanceof Error && error.message
            ? error.message
            : AI_CHATBOT_COPY.advisorNetwork;

      setAiError(errorText);
      updateChatMessage(assistantMessageId, (message) => ({
        ...message,
        text: `${AI_CHATBOT_COPY.networkPrefix} ${errorText}`,
        streaming: false,
      }));
    } finally {
      window.clearTimeout(timeoutId);
      setAiLoading(false);
    }
  }

  async function handleAiSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await submitAiQuery(query);
  }

  function applyStarter(text: string) {
    setAiError("");
    void submitAiQuery(text);
  }

  function useSurprisePrompt() {
    const index = Math.floor(Math.random() * AI_ASSISTANT_STARTERS.length);
    applyStarter(AI_ASSISTANT_STARTERS[index]);
  }

  const suppressFloatingLauncher =
    pathname.startsWith("/products") ||
    pathname === "/compare";
  const mobileFabAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom"
    : "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom-raised";
  const mobilePanelAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--inset-x site-fab-anchor--panel"
    : "site-fab-anchor site-fab-anchor--inset-x site-fab-anchor--panel-raised";
  const desktopFabAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom"
    : "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom-raised";

  return (
    <>
      <div className="sm:hidden">
        {!suppressFloatingLauncher ? (
          <button
            type="button"
            onClick={() => setMobileLauncherOpen((prev) => !prev)}
            aria-label={MOBILE_ASSISTANT_COPY.launcher}
            aria-expanded={mobileLauncherOpen}
            className={`site-fab-launcher site-fab-launcher--assistant ${mobileFabAnchor} ${FOCUS_RING}`}
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        {mobileLauncherOpen && !suppressFloatingLauncher ? (
          <div
            className={`${mobilePanelAnchor} z-50 rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl`}
          >
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileLauncherOpen(false);
                  setGuidedOpen(true);
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-normal text-white ${FOCUS_RING}`}
              >
                <MessageSquareText className="h-4 w-4" />
                {MOBILE_ASSISTANT_COPY.planner}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLauncherOpen(false);
                  setChatOpen(true);
                }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-normal text-white ${FOCUS_RING}`}
              >
                <Sparkles className="h-4 w-4" />
                {MOBILE_ASSISTANT_COPY.chatbot}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden sm:block">
        {!suppressFloatingLauncher ? (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Open AI chatbot"
            className={`${desktopFabAnchor} inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-3 text-white shadow-xl transition-colors hover:bg-primary-hover ${FOCUS_RING}`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden xl:inline text-xs font-semibold uppercase tracking-[0.14em]">
              {AI_CHATBOT_COPY.title}
            </span>
          </button>
        ) : null}
      </div>

      {guidedOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Guided planner"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{GUIDED_PLANNER_COPY.title}</p>
                  <p className="text-xs text-neutral-500">{GUIDED_PLANNER_COPY.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidedOpen(false)}
                className={`rounded-full bg-neutral-100 p-2 text-neutral-700 transition-colors hover:bg-neutral-200 ${FOCUS_RING}`}
                aria-label="Close guided planner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {guidedSubmittedId ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    {GUIDED_PLANNER_COPY.submittedTitle}
                  </p>
                  <p className="text-sm text-emerald-800">Reference: {guidedSubmittedId}</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGuidedOpen(false);
                        setChatOpen(true);
                      }}
                      className={`text-xs font-semibold uppercase tracking-wide text-neutral-900 underline ${FOCUS_RING}`}
                    >
                      {GUIDED_PLANNER_COPY.submittedFollowUp}
                    </button>
                    <button
                      type="button"
                      onClick={resetGuided}
                      className={`text-xs font-semibold uppercase tracking-wide text-neutral-500 underline ${FOCUS_RING}`}
                    >
                      {GUIDED_PLANNER_COPY.submittedReset}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {guidedStep === 0 ? (
                    <>
                      <p className="text-sm text-neutral-700">{GUIDED_PLANNER_COPY.stepOneIntro}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(USE_CASE_LABEL) as UseCase[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setGuided({ ...guided, useCase: key })}
                            className={`rounded-full border px-3 py-1.5 text-xs ${FOCUS_RING} ${
                              guided.useCase === key
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 text-neutral-700"
                            }`}
                          >
                            {USE_CASE_LABEL[key]}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.seats}
                        value={guided.seats}
                        onChange={(event) => setGuided({ ...guided, seats: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                    </>
                  ) : null}

                  {guidedStep === 1 ? (
                    <>
                      <p className="text-sm text-neutral-700">{GUIDED_PLANNER_COPY.stepTwoIntro}</p>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.company}
                        value={guided.company}
                        onChange={(event) => setGuided({ ...guided, company: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.city}
                        value={guided.city}
                        onChange={(event) => setGuided({ ...guided, city: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(TIMELINE_LABEL) as Timeline[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setGuided({ ...guided, timeline: key })}
                            className={`rounded-full border px-3 py-1.5 text-xs ${FOCUS_RING} ${
                              guided.timeline === key
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-300 text-neutral-700"
                            }`}
                          >
                            {TIMELINE_LABEL[key]}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.budget}
                        value={guided.budget}
                        onChange={(event) => setGuided({ ...guided, budget: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                      <textarea
                        rows={3}
                        placeholder={GUIDED_PLANNER_COPY.placeholders.notes}
                        value={guided.notes}
                        onChange={(event) => setGuided({ ...guided, notes: event.target.value })}
                        className={`w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                    </>
                  ) : null}

                  {guidedStep === 2 ? (
                    <>
                      <p className="text-sm text-neutral-700">{GUIDED_PLANNER_COPY.stepThreeIntro}</p>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.name}
                        value={guided.name}
                        onChange={(event) => setGuided({ ...guided, name: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                      <input
                        type="email"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.email}
                        value={guided.email}
                        onChange={(event) => setGuided({ ...guided, email: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                      <input
                        type="tel"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.phone}
                        value={guided.phone}
                        onChange={(event) => setGuided({ ...guided, phone: event.target.value })}
                        className={`w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                      />
                    </>
                  ) : null}

                  {guidedError ? <p className="text-sm text-red-600" aria-live="polite">{guidedError}</p> : null}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setGuidedStep((prev) => (prev > 0 ? prev - 1 : prev))}
                      className={`text-xs font-semibold uppercase tracking-wide text-neutral-500 ${FOCUS_RING}`}
                      disabled={guidedStep === 0 || guidedSaving}
                    >
                      {GUIDED_PLANNER_COPY.back}
                    </button>
                    <button
                      type="button"
                      onClick={handleGuidedNext}
                      disabled={!stepValid || guidedSaving}
                      className={`inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
                    >
                      {guidedSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {GUIDED_PLANNER_COPY.saving}
                        </>
                      ) : guidedStep === 2 ? (
                        <>
                          {GUIDED_PLANNER_COPY.finish}
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          {GUIDED_PLANNER_COPY.continue}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {chatOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="AI chatbot"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{AI_CHATBOT_COPY.title}</p>
                  <p className="text-xs text-neutral-500">{AI_CHATBOT_COPY.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className={`rounded-full bg-neutral-100 p-2 text-neutral-700 transition-colors hover:bg-neutral-200 ${FOCUS_RING}`}
                aria-label="Close AI chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-neutral-100 bg-primary/5 px-5 py-3">
              <div className="flex flex-wrap gap-2">
                {AI_ASSISTANT_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => applyStarter(starter)}
                    className={`rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary/50 hover:text-primary ${FOCUS_RING}`}
                  >
                    {starter}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={useSurprisePrompt}
                className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary ${FOCUS_RING}`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {AI_ADVISOR_COPY.surpriseLabel}
              </button>
            </div>

            <div
              className="flex-1 space-y-4 overflow-y-auto p-5"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="Assistant conversation"
            >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-800"
                    }`}
                  >
                    {message.streaming && !message.text && !message.result ? (
                      <div className="space-y-2" aria-hidden="true">
                        <div className="h-3 w-28 rounded-full bg-neutral-200" />
                        <div className="h-3 w-44 rounded-full bg-neutral-200" />
                        <div className="h-3 w-36 rounded-full bg-neutral-200" />
                      </div>
                    ) : (
                      <p>{sanitizeDisplayText(message.text)}</p>
                    )}

                    {message.streaming && message.text && !message.result ? (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                        Streaming reply
                      </p>
                    ) : null}

                    {message.result ? (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-neutral-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            {message.result.pricingMode === "band"
                              ? AI_CHATBOT_COPY.bandLabel
                              : AI_CHATBOT_COPY.totalLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-900">
                            {message.result.totalBudget}
                          </p>
                        </div>

                        {message.result.warnings?.length ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                              {AI_CHATBOT_COPY.warningsTitle}
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-amber-900">
                              {message.result.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {message.result.recommendations.map((item) => (
                          <div
                            key={`${message.id}-${item.productId}`}
                            className="rounded-lg border border-neutral-200 bg-white p-3"
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-neutral-900">
                                {item.productName}
                              </p>
                              <Link
                                href={recommendationHref(item)}
                                className={`text-xs font-semibold uppercase tracking-wide text-primary underline ${FOCUS_RING}`}
                              >
                                View
                              </Link>
                            </div>
                            <p className="text-xs text-neutral-700">{item.why}</p>
                          </div>
                        ))}

                        {message.result.nextActions?.length ? (
                          <div className="rounded-lg border border-neutral-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              {AI_CHATBOT_COPY.nextActionsTitle}
                            </p>
                            <div className="mt-2 space-y-1 text-xs text-neutral-700">
                              {message.result.nextActions.map((action) => (
                                <p key={action}>{action}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 p-4">
              {lastUserQuery ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {AI_ASSISTANT_REFINERS.map((refiner) => (
                    <button
                      key={refiner.label}
                      type="button"
                      onClick={() => void submitAiQuery(refiner.apply(lastUserQuery))}
                      className={`rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary/50 hover:text-primary ${FOCUS_RING}`}
                    >
                      {refiner.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setChatOpen(false);
                      setGuidedOpen(true);
                    }}
                    className={`rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary/50 hover:text-primary ${FOCUS_RING}`}
                  >
                    {AI_CHATBOT_COPY.switchToPlanner}
                  </button>
                  <button
                    type="button"
                    onClick={resetChatbot}
                    className={`rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary/50 hover:text-primary ${FOCUS_RING}`}
                  >
                    {AI_CHATBOT_COPY.reset}
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleAiSubmit} className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={AI_CHATBOT_COPY.placeholder}
                  className={`min-h-11 flex-1 resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900 ${FOCUS_RING}`}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || aiLoading}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {AI_CHATBOT_COPY.send}
                </button>
              </form>
              {aiError ? <p className="mt-2 text-xs text-red-600" aria-live="polite">{aiError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
