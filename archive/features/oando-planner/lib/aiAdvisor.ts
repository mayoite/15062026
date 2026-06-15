export type AiSuggestionType =
  | "furnish"
  | "optimize"
  | "accessibility"
  | "social-distancing"
  | "reception"
  | "meeting-room"
  | "custom";

export interface AiLayoutSuggestion {
  id: string;
  type: AiSuggestionType;
  prompt: string;
  description: string;
  items: AiPlacementItem[];
  confidence: number;
}

export interface AiPlacementItem {
  name: string;
  category: string;
  widthMm: number;
  depthMm: number;
  xMm: number;
  yMm: number;
  rotationDeg: number;
}

export const AI_PROMPT_TEMPLATES: Record<AiSuggestionType, {
  label: string;
  promptTemplate: string;
  icon: string;
}> = {
  furnish: {
    label: "Auto-Furnish",
    promptTemplate: "Furnish this {areaSqm}m² {roomType} room for {capacity} people with standard office furniture including desks, chairs, and storage.",
    icon: "sofa",
  },
  optimize: {
    label: "Optimize Layout",
    promptTemplate: "Optimize the current layout of {itemCount} items in this {areaSqm}m² space for better flow and ergonomics.",
    icon: "sparkles",
  },
  accessibility: {
    label: "ADA Compliance",
    promptTemplate: "Review and adjust the layout to ensure full ADA compliance with minimum {clearanceMm}mm wheelchair clearance throughout.",
    icon: "accessibility",
  },
  "social-distancing": {
    label: "Social Distancing",
    promptTemplate: "Rearrange workstations in this {areaSqm}m² space to maintain 1.8m minimum distance between each seat.",
    icon: "users",
  },
  reception: {
    label: "Add Reception",
    promptTemplate: "Design a reception area in the front portion of this {areaSqm}m² space with a reception desk, visitor seating, and signage area.",
    icon: "building",
  },
  "meeting-room": {
    label: "Meeting Room Setup",
    promptTemplate: "Set up a {capacity}-person meeting configuration with a conference table, chairs, and a presentation area.",
    icon: "presentation",
  },
  custom: {
    label: "Custom Request",
    promptTemplate: "",
    icon: "message-circle",
  },
};

export function buildAiPrompt(
  type: AiSuggestionType,
  context: {
    areaSqm: number;
    roomType: string;
    capacity: number;
    itemCount: number;
    clearanceMm: number;
    customPrompt?: string;
  },
): string {
  if (type === "custom" && context.customPrompt) {
    return context.customPrompt;
  }

  const template = AI_PROMPT_TEMPLATES[type];
  if (!template) return "";

  return template.promptTemplate
    .replace("{areaSqm}", context.areaSqm.toFixed(1))
    .replace("{roomType}", context.roomType)
    .replace("{capacity}", context.capacity.toString())
    .replace("{itemCount}", context.itemCount.toString())
    .replace("{clearanceMm}", context.clearanceMm.toString());
}

export function generateOfflineLayoutSuggestion(
  type: AiSuggestionType,
  roomWidthMm: number,
  roomDepthMm: number,
  capacity: number,
): AiLayoutSuggestion {
  const items: AiPlacementItem[] = [];
  const id = `ai-${type}-${Date.now()}`;

  switch (type) {
    case "furnish": {
      const rows = Math.ceil(capacity / 3);
      const cols = Math.min(3, capacity);
      const deskSpacingX = Math.min(2000, (roomWidthMm - 1000) / cols);
      const deskSpacingY = Math.min(2000, (roomDepthMm - 1000) / rows);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols && row * cols + col < capacity; col++) {
          const xMm = 500 + col * deskSpacingX;
          const yMm = 500 + row * deskSpacingY;

          items.push({
            name: `Workstation ${row * cols + col + 1}`,
            category: "Workstations",
            widthMm: 1400,
            depthMm: 700,
            xMm,
            yMm,
            rotationDeg: 0,
          });

          items.push({
            name: "Task Chair",
            category: "Seating",
            widthMm: 500,
            depthMm: 500,
            xMm: xMm + 450,
            yMm: yMm + 900,
            rotationDeg: 0,
          });
        }
      }
      break;
    }

    case "reception": {
      items.push({
        name: "Reception Desk",
        category: "Workstations",
        widthMm: 2000,
        depthMm: 800,
        xMm: roomWidthMm / 2 - 1000,
        yMm: 500,
        rotationDeg: 0,
      });

      for (let i = 0; i < 3; i++) {
        items.push({
          name: "Visitor Chair",
          category: "Seating",
          widthMm: 500,
          depthMm: 500,
          xMm: 500 + i * 700,
          yMm: 2000,
          rotationDeg: 0,
        });
      }

      items.push({
        name: "Coffee Table",
        category: "Tables",
        widthMm: 800,
        depthMm: 500,
        xMm: 800,
        yMm: 2800,
        rotationDeg: 0,
      });
      break;
    }

    case "meeting-room": {
      const tableWidth = Math.min(3000, capacity * 400);
      const tableDepth = Math.min(1200, 800 + capacity * 30);

      items.push({
        name: `Conference Table (${capacity}-Seat)`,
        category: "Tables",
        widthMm: tableWidth,
        depthMm: tableDepth,
        xMm: (roomWidthMm - tableWidth) / 2,
        yMm: (roomDepthMm - tableDepth) / 2,
        rotationDeg: 0,
      });

      const chairsPerSide = Math.ceil(capacity / 2);
      const chairSpacing = tableWidth / (chairsPerSide + 1);

      for (let i = 0; i < chairsPerSide; i++) {
        const xMm = (roomWidthMm - tableWidth) / 2 + chairSpacing * (i + 1) - 250;

        items.push({
          name: "Meeting Chair",
          category: "Seating",
          widthMm: 500,
          depthMm: 500,
          xMm,
          yMm: (roomDepthMm - tableDepth) / 2 - 600,
          rotationDeg: 0,
        });

        if (i < capacity - chairsPerSide) {
          items.push({
            name: "Meeting Chair",
            category: "Seating",
            widthMm: 500,
            depthMm: 500,
            xMm,
            yMm: (roomDepthMm + tableDepth) / 2 + 100,
            rotationDeg: 180,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return {
    id,
    type,
    prompt: buildAiPrompt(type, {
      areaSqm: (roomWidthMm * roomDepthMm) / 1_000_000,
      roomType: "office",
      capacity,
      itemCount: 0,
      clearanceMm: 900,
    }),
    description: AI_PROMPT_TEMPLATES[type]?.label ?? "AI Suggestion",
    items,
    confidence: 0.75,
  };
}

export function buildAiSystemPrompt(): string {
  return `You are an expert office space planner and interior designer. You help users design efficient, ergonomic, and compliant office layouts. When suggesting furniture placements, you should:

1. Maintain minimum 900mm aisle widths for ADA compliance
2. Ensure 1200mm clearance around fire exits
3. Place desks facing windows when possible for natural light
4. Group related functions (e.g., meeting rooms near collaboration spaces)
5. Consider traffic flow patterns
6. Follow local building codes for occupancy limits
7. Maintain minimum 600mm spacing between workstations

Respond with a JSON array of furniture placements. Each item should have: name, category, widthMm, depthMm, xMm, yMm, rotationDeg.`;
}
