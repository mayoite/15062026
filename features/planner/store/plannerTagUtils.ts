export interface TagAddResult {
  success: boolean;
  error?: string;
}

export function sanitizeTags(tags: string[], maxTags: number, maxTagLength: number): string[] {
  const sanitized = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.length <= maxTagLength)
    .slice(0, maxTags);

  const seen = new Set<string>();
  return sanitized.filter((tag) => {
    const lower = tag.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

export function validateTagAddition(
  existingTags: string[],
  tag: string,
  maxTags: number,
  maxTagLength: number
): TagAddResult {
  const trimmed = tag.trim();

  if (!trimmed) {
    return { success: false, error: "Tag cannot be empty" };
  }
  if (trimmed.length > maxTagLength) {
    return { success: false, error: `Tag must be ${maxTagLength} characters or less` };
  }
  if (existingTags.length >= maxTags) {
    return { success: false, error: `Maximum ${maxTags} tags allowed` };
  }

  const lowerTag = trimmed.toLowerCase();
  if (existingTags.some((existingTag) => existingTag.toLowerCase() === lowerTag)) {
    return { success: false, error: "Tag already exists" };
  }

  return { success: true };
}

export function removeTagCaseInsensitive(tags: string[], tag: string): string[] {
  const lowerTag = tag.toLowerCase();
  return tags.filter((existingTag) => existingTag.toLowerCase() !== lowerTag);
}
