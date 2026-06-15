/**
 * Layout Optimizer - Optimization modes for distancing, accessibility, and circulation
 * Provides intelligent furniture rearrangement based on different optimization criteria
 */

import type { FurnitureItem } from "../data/plannerStore";

export type OptimizationMode = "distancing" | "accessibility" | "circulation" | "efficiency";

export interface OptimizationResult {
  success: boolean;
  optimized: boolean;
  changes: LayoutChange[];
  score: number;
  message: string;
}

export interface LayoutChange {
  furnitureId: string;
  type: "move" | "rotate" | "remove" | "add";
  from: { x: number; y: number; rotation?: number };
  to: { x: number; y: number; rotation?: number };
  reason: string;
}

export interface OptimizationConstraints {
  minClearance: number; // mm
  maxCapacity: number;
  accessibilityPaths: boolean;
  emergencyExits: boolean;
}

/**
 * Layout Optimizer
 */
export class LayoutOptimizer {
  /**
   * Optimize layout based on mode
   */
  optimizeLayout(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
    mode: OptimizationMode,
    constraints?: Partial<OptimizationConstraints>
  ): OptimizationResult {
    const defaultConstraints: OptimizationConstraints = {
      minClearance: 1000,
      maxCapacity: 50,
      accessibilityPaths: true,
      emergencyExits: true,
      ...constraints,
    };

    switch (mode) {
      case "distancing":
        return this.optimizeForDistancing(furniture, roomWidth, roomDepth, defaultConstraints);
      case "accessibility":
        return this.optimizeForAccessibility(furniture, roomWidth, roomDepth, defaultConstraints);
      case "circulation":
        return this.optimizeForCirculation(furniture, roomWidth, roomDepth, defaultConstraints);
      case "efficiency":
        return this.optimizeForEfficiency(furniture, roomWidth, roomDepth, defaultConstraints);
      default:
        return {
          success: false,
          optimized: false,
          changes: [],
          score: 0,
          message: "Unknown optimization mode",
        };
    }
  }

  /**
   * Optimize for social distancing
   */
  private optimizeForDistancing(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const changes: LayoutChange[] = [];
    const minDistance = constraints.minClearance;
    
    // Sort furniture by priority (workstations first)
    const sortedFurniture = [...furniture].sort((a, b) => {
      if (a.name.includes("workstation") && !b.name.includes("workstation")) return -1;
      if (!a.name.includes("workstation") && b.name.includes("workstation")) return 1;
      return 0;
    });

    // Calculate optimal grid spacing
    const gridSpacing = minDistance + 200; // furniture size + clearance
    const cols = Math.floor(roomWidth / gridSpacing);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows = Math.floor(roomDepth / gridSpacing);

    // Reassign positions in grid pattern
    let currentCol = 0;
    let currentRow = 0;

    for (const item of sortedFurniture) {
      const newX = (currentCol * gridSpacing) + (gridSpacing / 2);
      const newY = (currentRow * gridSpacing) + (gridSpacing / 2);

      if (newX + item.width / 2 > roomWidth || newY + item.height / 2 > roomDepth) {
        // Skip if position would be outside room
        currentCol++;
        if (currentCol >= cols) {
          currentCol = 0;
          currentRow++;
        }
        continue;
      }

      if (Math.abs(item.x - newX) > 10 || Math.abs(item.y - newY) > 10) {
        changes.push({
          furnitureId: item.id,
          type: "move",
          from: { x: item.x, y: item.y },
          to: { x: newX, y: newY },
          reason: "Repositioned for optimal distancing",
        });
      }

      currentCol++;
      if (currentCol >= cols) {
        currentCol = 0;
        currentRow++;
      }
    }

    const score = this.calculateDistancingScore(sortedFurniture, minDistance);

    return {
      success: true,
      optimized: changes.length > 0,
      changes,
      score,
      message: `Optimized for ${Math.round(minDistance / 1000)}m distancing. ${changes.length} items repositioned.`,
    };
  }

  /**
   * Optimize for accessibility
   */
  private optimizeForAccessibility(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const changes: LayoutChange[] = [];
    const pathWidth = 1200; // 1.2m minimum for wheelchair access

    // Create clear paths along walls and center
    const mainPathX = roomWidth / 2;
    const mainPathY = roomDepth / 2;

    // Move furniture away from main circulation paths
    for (const item of furniture) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(item.x - mainPathX, 2) + Math.pow(item.y - mainPathY, 2)
      );

      // If furniture is blocking main path, move it
      if (distanceFromCenter < pathWidth) {
        const angle = Math.atan2(item.y - mainPathY, item.x - mainPathX);
        const newX = mainPathX + Math.cos(angle) * (pathWidth + 100);
        const newY = mainPathY + Math.sin(angle) * (pathWidth + 100);

        if (newX > 0 && newX < roomWidth && newY > 0 && newY < roomDepth) {
          changes.push({
            furnitureId: item.id,
            type: "move",
            from: { x: item.x, y: item.y },
            to: { x: newX, y: newY },
            reason: "Moved to clear accessibility path",
          });
        }
      }

      // Ensure clear paths to walls (1200mm from walls)
      const wallClearance = 1200;
      if (item.x < wallClearance) {
        changes.push({
          furnitureId: item.id,
          type: "move",
          from: { x: item.x, y: item.y },
          to: { x: wallClearance + 50, y: item.y },
          reason: "Moved to maintain wall clearance for accessibility",
        });
      }
      if (item.y < wallClearance) {
        changes.push({
          furnitureId: item.id,
          type: "move",
          from: { x: item.x, y: item.y },
          to: { x: item.x, y: wallClearance + 50 },
          reason: "Moved to maintain wall clearance for accessibility",
        });
      }
    }

    const score = this.calculateAccessibilityScore(furniture, roomWidth, roomDepth, pathWidth);

    return {
      success: true,
      optimized: changes.length > 0,
      changes,
      score,
      message: `Optimized for wheelchair accessibility (${pathWidth / 1000}m paths). ${changes.length} items adjusted.`,
    };
  }

  /**
   * Optimize for circulation
   */
  private optimizeForCirculation(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const changes: LayoutChange[] = [];
    const circulationWidth = 1000; // 1m minimum circulation

    // Identify clusters of furniture that might block circulation
    const clusters = this.identifyFurnitureClusters(furniture, 500);

    // Create circulation paths (main aisles)
    const numAisles = Math.max(2, Math.floor(roomWidth / 3000));
    const aislePositions: number[] = [];
    
    for (let i = 0; i < numAisles; i++) {
      aislePositions.push((roomWidth / (numAisles + 1)) * (i + 1));
    }

    // Move furniture away from aisle positions
    for (const item of furniture) {
      for (const aisleX of aislePositions) {
        if (Math.abs(item.x - aisleX) < circulationWidth / 2) {
          const direction = item.x < aisleX ? -1 : 1;
          const newX = aisleX + (direction * (circulationWidth / 2 + 100));

          if (newX > 0 && newX < roomWidth) {
            changes.push({
              furnitureId: item.id,
              type: "move",
              from: { x: item.x, y: item.y },
              to: { x: newX, y: item.y },
              reason: "Moved to clear circulation aisle",
            });
          }
        }
      }
    }

    // Break up dense clusters
    for (const cluster of clusters) {
      if (cluster.items.length > 4) {
        // Spread out cluster
        const clusterCenter = this.calculateClusterCenter(cluster.items);
        const spreadRadius = 800;

        for (let i = 0; i < cluster.items.length; i++) {
          const angle = (2 * Math.PI * i) / cluster.items.length;
          const newX = clusterCenter.x + Math.cos(angle) * spreadRadius;
          const newY = clusterCenter.y + Math.sin(angle) * spreadRadius;

          if (newX > 0 && newX < roomWidth && newY > 0 && newY < roomDepth) {
            changes.push({
              furnitureId: cluster.items[i].id,
              type: "move",
              from: { x: cluster.items[i].x, y: cluster.items[i].y },
              to: { x: newX, y: newY },
              reason: "Spread from dense cluster to improve circulation",
            });
          }
        }
      }
    }

    const score = this.calculateCirculationScore(furniture, roomWidth, aislePositions, circulationWidth);

    return {
      success: true,
      optimized: changes.length > 0,
      changes,
      score,
      message: `Optimized for circulation with ${numAisles} main aisles. ${changes.length} items adjusted.`,
    };
  }

  /**
   * Optimize for space efficiency
   */
  private optimizeForEfficiency(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
    constraints: OptimizationConstraints
  ): OptimizationResult {
    const changes: LayoutChange[] = [];

    // Pack furniture efficiently while maintaining minimum clearance
    const minClearance = constraints.minClearance;
    const sortedBySize = [...furniture].sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaB - areaA; // Largest first
    });

    // Simple bin packing approach
    let currentX = minClearance;
    let currentY = minClearance;
    let rowHeight = 0;

    for (const item of sortedBySize) {
      // Check if item fits in current row
      if (currentX + item.width + minClearance > roomWidth) {
        currentX = minClearance;
        currentY += rowHeight + minClearance;
        rowHeight = 0;
      }

      // Check if item fits vertically
      if (currentY + item.height + minClearance > roomDepth) {
        // Skip if doesn't fit
        continue;
      }

      if (Math.abs(item.x - currentX) > 10 || Math.abs(item.y - currentY) > 10) {
        changes.push({
          furnitureId: item.id,
          type: "move",
          from: { x: item.x, y: item.y },
          to: { x: currentX, y: currentY },
          reason: "Repositioned for space efficiency",
        });
      }

      rowHeight = Math.max(rowHeight, item.height);
      currentX += item.width + minClearance;
    }

    const efficiencyScore = this.calculateEfficiencyScore(sortedBySize, roomWidth, roomDepth);

    return {
      success: true,
      optimized: changes.length > 0,
      changes,
      score: efficiencyScore,
      message: `Optimized for space efficiency. ${changes.length} items repositioned.`,
    };
  }

  /**
   * Calculate distancing score
   */
  private calculateDistancingScore(furniture: FurnitureItem[], minDistance: number): number {
    let violations = 0;
    let totalPairs = 0;

    for (let i = 0; i < furniture.length; i++) {
      for (let j = i + 1; j < furniture.length; j++) {
        totalPairs++;
        const distance = Math.sqrt(
          Math.pow(furniture[i].x - furniture[j].x, 2) +
          Math.pow(furniture[i].y - furniture[j].y, 2)
        );
        if (distance < minDistance) {
          violations++;
        }
      }
    }

    return totalPairs > 0 ? Math.round((1 - violations / totalPairs) * 100) : 100;
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number,
    pathWidth: number
  ): number {
    const mainPathX = roomWidth / 2;
    const mainPathY = roomDepth / 2;
    let blockedPoints = 0;

    for (const item of furniture) {
      const distanceFromCenter = Math.sqrt(
        Math.pow(item.x - mainPathX, 2) + Math.pow(item.y - mainPathY, 2)
      );
      if (distanceFromCenter < pathWidth) {
        blockedPoints++;
      }
    }

    return furniture.length > 0 
      ? Math.round((1 - blockedPoints / furniture.length) * 100) 
      : 100;
  }

  /**
   * Calculate circulation score
   */
  private calculateCirculationScore(
    furniture: FurnitureItem[],
    roomWidth: number,
    aislePositions: number[],
    circulationWidth: number
  ): number {
    let blockedAisles = 0;

    for (const item of furniture) {
      for (const aisleX of aislePositions) {
        if (Math.abs(item.x - aisleX) < circulationWidth / 2) {
          blockedAisles++;
          break;
        }
      }
    }

    return furniture.length > 0 
      ? Math.round((1 - blockedAisles / furniture.length) * 100) 
      : 100;
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiencyScore(
    furniture: FurnitureItem[],
    roomWidth: number,
    roomDepth: number
  ): number {
    const totalArea = roomWidth * roomDepth;
    const furnitureArea = furniture.reduce((sum, item) => sum + (item.width * item.height), 0);
    return Math.round((furnitureArea / totalArea) * 100);
  }

  /**
   * Identify furniture clusters
   */
  private identifyFurnitureClusters(
    furniture: FurnitureItem[],
    threshold: number
  ): Array<{ center: { x: number; y: number }; items: FurnitureItem[] }> {
    const clusters: Array<{ center: { x: number; y: number }; items: FurnitureItem[] }> = [];
    const visited = new Set<string>();

    for (const item of furniture) {
      if (visited.has(item.id)) continue;

      const cluster: FurnitureItem[] = [item];
      visited.add(item.id);

      // Find nearby items
      for (const other of furniture) {
        if (visited.has(other.id)) continue;

        const distance = Math.sqrt(
          Math.pow(item.x - other.x, 2) + Math.pow(item.y - other.y, 2)
        );

        if (distance < threshold) {
          cluster.push(other);
          visited.add(other.id);
        }
      }

      if (cluster.length > 1) {
        clusters.push({
          center: this.calculateClusterCenter(cluster),
          items: cluster,
        });
      }
    }

    return clusters;
  }

  /**
   * Calculate cluster center
   */
  private calculateClusterCenter(items: FurnitureItem[]): { x: number; y: number } {
    const avgX = items.reduce((sum, item) => sum + item.x, 0) / items.length;
    const avgY = items.reduce((sum, item) => sum + item.y, 0) / items.length;
    return { x: avgX, y: avgY };
  }
}

// Singleton instance
const layoutOptimizer = new LayoutOptimizer();

export default layoutOptimizer;