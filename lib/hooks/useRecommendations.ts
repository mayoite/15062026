import { useQuery } from "@tanstack/react-query";
import {
  createAnonymousUserId,
  normalizeAnonymousUserId,
} from "@/lib/tracking/anonymousUserId";

export type RecommendationResult = {
  mode: "personalized" | "popular";
  summary: string;
  recommendations: Array<{
    productId: string;
    productName: string;
    category: string;
    why: string;
    budgetEstimate: string;
    href: string;
  }>;
};

const getOrCreateUserId = () => {
  if (typeof window === "undefined") return "";

  let userId = normalizeAnonymousUserId(localStorage.getItem("oando_user_id"));
  if (!userId) {
    userId = createAnonymousUserId();
    localStorage.setItem("oando_user_id", userId);
  }
  return userId;
};

export function useRecommendations(enabled = true) {
  return useQuery<RecommendationResult>({
    queryKey: ["recommendations", enabled],
    queryFn: async () => {
      const userId = getOrCreateUserId();
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, limit: 4 }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      return res.json();
    },
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}
