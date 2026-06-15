"use client";

import type { KeyboardEvent } from "react";
import { useState, useRef } from "react";
import { usePlannerStore, MAX_TAGS, MAX_TAG_LENGTH } from "@/features/oando-planner/data/plannerStore";

const inputClass =
  "flex-1 bg-white/[0.06] text-white text-[12px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:border-[var(--color-accent)] outline-none transition-colors min-w-0";
const labelClass =
  "text-[10px] uppercase tracking-wider text-[var(--color-accent)] block mb-1.5 font-semibold";

interface TagEditorProps {
  className?: string;
}

export function TagEditor({ className = "" }: TagEditorProps) {
  const tags = usePlannerStore((s) => s.tags);
  const addTag = usePlannerStore((s) => s.addTag);
  const removeTag = usePlannerStore((s) => s.removeTag);

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (!inputValue.trim()) return;

    const result = addTag(inputValue);
    if (result.success) {
      setInputValue("");
      setError(null);
    } else {
      setError(result.error || "Failed to add tag");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setInputValue("");
      setError(null);
    }
  };

  const handleRemoveTag = (tag: string) => {
    removeTag(tag);
    setError(null);
  };

  const remainingTags = MAX_TAGS - tags.length;
  const remainingChars = MAX_TAG_LENGTH - inputValue.length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className={labelClass}>Tags</label>
        <span className="text-[9px] text-white/30">
          {tags.length}/{MAX_TAGS}
        </span>
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-focus-ring)] rounded-full"
                aria-label={`Remove tag ${tag}`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input for new tags */}
      {remainingTags > 0 && (
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Add a tag..."
            maxLength={MAX_TAG_LENGTH}
            className={inputClass}
            aria-label="Add new tag"
            aria-describedby={error ? "tag-error" : undefined}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!inputValue.trim()}
            className="px-2.5 py-1.5 rounded-lg text-[11px] bg-[var(--color-accent)]/15 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-[var(--color-accent)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
            aria-label="Add tag"
          >
            Add
          </button>
        </div>
      )}

      {/* Character count indicator */}
      {inputValue.length > 0 && (
        <div className="text-[9px] text-white/30 text-right">
          {remainingChars} characters remaining
        </div>
      )}

      {/* Error message */}
      {error && (
        <p id="tag-error" className="text-[10px] text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Empty state */}
      {tags.length === 0 && (
        <p className="text-[10px] text-white/30">
          Add tags to organize and filter your projects
        </p>
      )}
    </div>
  );
}
