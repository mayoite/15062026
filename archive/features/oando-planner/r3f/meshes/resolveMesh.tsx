"use client";

import type { MeshFamily, MeshDimensions, MeshPalette } from "./types";
import { TaskChairMesh } from "./TaskChairMesh";
import { LoungeChairMesh } from "./LoungeChairMesh";
import { RectSurfaceMesh } from "./RectSurfaceMesh";
import { LDeskMesh } from "./LDeskMesh";
import { StorageMesh } from "./StorageMesh";
import { ScreenMesh } from "./ScreenMesh";
import { ColumnMesh } from "./ColumnMesh";
import { PlantMesh } from "./PlantMesh";
import { DeskMesh } from "./DeskMesh";
import { TableMesh } from "./TableMesh";
import { CollaborativeMesh } from "./CollaborativeMesh";
import { EducationalMesh } from "./EducationalMesh";
import { GenericMesh } from "./GenericMesh";

export function resolveMesh(
  family: MeshFamily,
  dimensions: MeshDimensions,
  palette: MeshPalette,
) {
  switch (family) {
    case "task-chair":
      return <TaskChairMesh {...dimensions} palette={palette} />;
    case "lounge-chair":
      return <LoungeChairMesh {...dimensions} palette={palette} />;
    case "sofa":
      return <CollaborativeMesh {...dimensions} palette={palette} />;
    case "desk-l":
      return <LDeskMesh {...dimensions} palette={palette} />;
    case "desk-rect":
      return <DeskMesh {...dimensions} palette={palette} />;
    case "table-round":
      return <TableMesh {...dimensions} palette={palette} />;
    case "table-rect":
      return <EducationalMesh {...dimensions} palette={palette} />;
    case "storage-locker":
      return <StorageMesh {...dimensions} palette={palette} locker />;
    case "storage-cabinet":
      return <StorageMesh {...dimensions} palette={palette} />;
    case "screen":
      return <ScreenMesh {...dimensions} palette={palette} />;
    case "column-round":
      return <ColumnMesh {...dimensions} palette={palette} round />;
    case "column-square":
      return <ColumnMesh {...dimensions} palette={palette} />;
    case "plant":
      return <PlantMesh {...dimensions} palette={palette} />;
    case "door":
    case "window":
      return <RectSurfaceMesh {...dimensions} palette={palette} pedestal={false} />;
    case "utility-box":
    default:
      return <GenericMesh {...dimensions} palette={palette} />;
  }
}
