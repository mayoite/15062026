import { describe, expect, it, vi } from "vitest";

import { analyzeSpace, autoFurnishRoom, callAI } from "@/features/planner/lib/aiService";

const room = {
  id: "room-1",
  name: "Focus Room",
  points: [
    { x: 0, y: 0 },
    { x: 500, y: 0 },
    { x: 500, y: 400 },
    { x: 0, y: 400 },
  ],
};

describe("planner ai service", () => {
  it("parses structured advisor responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify({
          message: "Added a desk",
          actions: [{ type: "add", catalogId: "ws-linear-140", x: 100, y: 100 }],
          warnings: [{ type: "general", message: "Looks good", severity: "warning" }],
        }),
      }),
    } as Response);

    const response = await callAI(
      "Add a desk",
      [],
      {
        rooms: [room],
        furniture: [
          {
            id: "desk-1",
            catalogId: "ws-linear-140",
            x: 120,
            y: 80,
            width: 140,
            height: 70,
            rotation: 0,
            name: "Linear Desk",
          },
        ],
        selectedRoomId: "room-1",
      },
      "Modern",
    );

    expect(response.message).toBe("Added a desk");
    expect(response.actions).toHaveLength(1);
    expect(response.warnings?.[0]?.type).toBe("general");
  });

  it("auto-furnishes rooms and returns placement suggestions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify({
          message: "Suggested layout",
          placements: [{ catalogId: "ws-linear-140", name: "Desk", x: 120, y: 80, rotation: 0, width: 140, height: 70, color: "#ccc", shape: "workstation-linear" }],
        }),
      }),
    } as Response);

    const response = await autoFurnishRoom(room, [], "Minimalist");
    expect(response.placements?.[0]?.catalogId).toBe("ws-linear-140");
  });

  it("analyzes space and falls back to plain-text responses", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            message: "Tight walkway",
            warnings: [{ type: "narrow-walkway", message: "Only 40cm", severity: "warning" }],
          }),
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: "Plain answer" }),
      } as Response);

    const analysis = await analyzeSpace({ rooms: [room], furniture: [] }, "Traditional");
    expect(analysis.warnings?.[0]?.type).toBe("narrow-walkway");

    const plain = await callAI("Explain layout", [], { rooms: [room], furniture: [] }, "Modern");
    expect(plain.message).toBe("Plain answer");
  });

  it("builds prompts for each style preset and includes selected room context", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify({ message: "Traditional layout ready" }),
      }),
    } as Response);

    const room = {
      id: "room-1",
      name: "Board Room",
      points: [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 300 },
        { x: 0, y: 300 },
      ],
    };

    const traditional = await callAI(
      "Suggest seating",
      [{ role: "assistant", content: "Prior answer" }],
      { rooms: [room], furniture: [], selectedRoomId: "room-1" },
      "Traditional",
    );
    expect(traditional.message).toBe("Traditional layout ready");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        content: JSON.stringify({ message: "Minimal shell" }),
      }),
    } as Response);
    const minimalist = await autoFurnishRoom(room, [], "Minimalist");
    expect(minimalist.message).toBe("Minimal shell");
  });

  it("throws when the advisor endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "Advisor unavailable" }),
    } as Response);

    await expect(
      callAI("Help", [], { rooms: [room], furniture: [] }, "Modern"),
    ).rejects.toThrow("Advisor unavailable");
  });

  it("covers HTTP fallbacks, empty context, and default parsed messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error("bad json");
      },
    } as Response);

    await expect(autoFurnishRoom(room, [], "Modern")).rejects.toThrow("Network error");
    await expect(analyzeSpace({ rooms: [], furniture: [] }, "Modern")).rejects.toThrow("Network error");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ content: JSON.stringify({}) }),
    } as Response);

    const emptyContext = await callAI(
      "Plan",
      Array.from({ length: 10 }, (_, index) => ({
        role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: `turn-${index}`,
      })),
      { rooms: [], furniture: [] },
      "Modern",
    );
    expect(emptyContext.message).toBe("Done.");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ content: JSON.stringify({ warnings: [] }) }),
    } as Response);

    const furnished = await autoFurnishRoom(
      room,
      [{ id: "desk-1", catalogId: "ws-linear-140", x: 50, y: 50, width: 140, height: 70, rotation: 0, name: "Desk" }],
      "Traditional",
    );
    expect(furnished.message).toBe("Here's a suggested layout.");

    const analyzed = await analyzeSpace({ rooms: [room], furniture: [] }, "Minimalist");
    expect(analyzed.message).toBe("Analysis complete.");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as Response);
    await expect(callAI("Help", [], { rooms: [room], furniture: [] }, "Modern")).rejects.toThrow("HTTP 502");
  });
});