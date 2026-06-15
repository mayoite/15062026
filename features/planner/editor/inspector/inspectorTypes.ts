/** Shared inspector panel data — used by shapeInspectorBridge and PropertiesInspector. */

export interface InspectorData {
  id: string;
  type: string;
  label: string;
  widthMm: number;
  heightMm: number;
  rotation: number;
  isLocked: boolean;
  teamId?: string;
  teamName?: string;
  seatCount?: number;
  capacity?: number;
  zoneType?: string;
  color?: string;
}
