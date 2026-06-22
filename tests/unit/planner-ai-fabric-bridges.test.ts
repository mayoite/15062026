import { afterEach, describe, expect, it } from "vitest";

import {
  applySuggestedLayout,
  buildShapesFromSuggestedLayout,
} from "@/features/planner/ai/applySuggestedLayout";
import { extractCanvasPlacements } from "@/features/planner/ai/extractCanvasPlacements";
import type { SuggestedLayoutJson } from "@/features/planner/ai/types";
import {
  resetFabricRuntimeState,
  seedFabricRuntime,
} from "../integration/planner-fabric-mockRuntime";
import { setPlannerFabricRuntimeState } from "@/features/planner/canvas-fabric";
import { catalogMmToCanvasCm } from "@/features/planner/catalog/catalogBlockBridge";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";

const SAMPLE_LAYOUT: SuggestedLayoutJson = {
  version: 1,
  source: "grid-pack",
  summary: "Starter office shell",
  room: {
    label: "Support office shell",
    x: 120,
    y: 120,
    widthMm: 8000,
    depthMm: 6000,
  },
  walls: [],
  zones: [
    {
      label: "Focus zone",
      x: 180,
      y: 180,
      widthMm: 3000,
      heightMm: 2200,
      zoneType: "focus",
    },
  ],
  furniture: [
    {
      catalogItemId: "room-meeting-8",
      label: "Meeting room",
      x: 240,
      y: 240,
    },
  ],
};

describe("planner ai fabric bridges", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("extracts placeable Fabric objects from the serialized runtime draft", () => {
    setPlannerFabricRuntimeState({
      serializedDraft: JSON.stringify({
        objects: [
          { name: "WALL:1", left: 0, top: 0, width: 100, height: 4 },
          {
            id: "desk-1",
            name: "GENERIC:Linear Desk",
            left: 10,
            top: 20,
            width: 120,
            height: 60,
            scaleX: 1.5,
            catalogId: "ws-linear-120",
          },
          {
            id: "chair-1",
            name: "CHAIR:Visitor",
            left: 60,
            top: 40,
            width: 20,
            height: 20,
          },
          {
            id: "storage-1",
            name: "MISCELLANEOUS:Storage Cabinet",
            left: 80,
            top: 50,
            width: 48,
            height: 18,
          },
        ],
      }),
    });

    expect(extractCanvasPlacements()).toEqual([
      {
        shapeId: "desk-1",
        kind: "workstation",
        label: "Linear Desk",
        widthMm: 1800,
        heightMm: 600,
        catalogItemId: "ws-linear-120",
      },
      {
        shapeId: "chair-1",
        kind: "chair",
        label: "Visitor",
        widthMm: 200,
        heightMm: 200,
        catalogItemId: undefined,
      },
      {
        shapeId: "storage-1",
        kind: "storage",
        label: "Storage Cabinet",
        widthMm: 480,
        heightMm: 180,
        catalogItemId: undefined,
      },
    ]);
  });

  it("builds Fabric-friendly planner shapes with converted room and furniture sizes", () => {
    const shapes = buildShapesFromSuggestedLayout(SAMPLE_LAYOUT);

    expect(shapes[0]).toMatchObject({
      type: "planner-room",
      x: SAMPLE_LAYOUT.room.x,
      y: SAMPLE_LAYOUT.room.y,
      props: {
        widthMm: catalogMmToCanvasCm(
          SAMPLE_LAYOUT.room.widthMm,
          SAMPLE_LAYOUT.room.depthMm,
        ),
      },
    });

    const furniture = shapes.find((shape) => shape.type === "planner-furniture");
    expect(furniture?.props).toMatchObject({
      catalogItemId: "room-meeting-8",
      widthMm: catalogMmToCanvasCm(350, 280),
      heightMm: catalogMmToCanvasCm(280, 350),
    });
  });

  it("applies suggested layouts through the Fabric runtime contract", () => {
    const meetingRoom = PLANNER_CATALOG_ITEMS.find((item) => item.id === "room-meeting-8");
    expect(meetingRoom).toBeTruthy();

    const { insertObject } = seedFabricRuntime();

    const deskItem = PLANNER_CATALOG_ITEMS.find((item) => item.category === "desks");
    expect(deskItem).toBeTruthy();

    applySuggestedLayout(null, {
      ...SAMPLE_LAYOUT,
      furniture: [
        {
          catalogItemId: deskItem!.id,
          label: deskItem!.name,
          x: 320,
          y: 220,
        },
        {
          catalogItemId: "room-meeting-8",
          label: "Meeting room",
          x: 240,
          y: 240,
        },
      ],
    });

    expect(insertObject).toHaveBeenNthCalledWith(1, {
      type: "ROOM",
      object: {
        title: "Support office shell",
        width: Math.round(SAMPLE_LAYOUT.room.widthMm / 25.4),
        height: Math.round(SAMPLE_LAYOUT.room.depthMm / 25.4),
      },
    });
    expect(insertObject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: "ZONE",
      }),
    );
    expect(insertObject).toHaveBeenNthCalledWith(3, {
      type: "GENERIC",
      object: {
        title: deskItem!.name,
        width: 120,
        height: 60,
        left: 320,
        top: 220,
      },
    });
    expect(insertObject).toHaveBeenLastCalledWith({
      type: "GENERIC",
      object: {
        title: "Meeting room",
        width: 35,
        height: 28,
        left: 240,
        top: 240,
      },
    });
  });
});

