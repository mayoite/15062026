import type { Point2D, Polygon } from "./types";

const EPSILON = 1e-6;

/** A node in the wall graph (junction or endpoint) */
export interface WallNode {
  id: string;
  position: Point2D;
  edges: string[]; // edge IDs
}

/** An edge in the wall graph (a wall segment) */
export interface WallEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
}

/** The wall graph structure */
export interface WallGraph {
  nodes: Map<string, WallNode>;
  edges: Map<string, WallEdge>;
}

function pointKey(p: Point2D): string {
  // Round to avoid floating-point key mismatches
  const rx = Math.round(p.x / EPSILON) * EPSILON;
  const ry = Math.round(p.y / EPSILON) * EPSILON;
  return `${rx.toFixed(4)},${ry.toFixed(4)}`;
}

/**
 * Build a wall graph from a list of wall segments.
 * Merges endpoints that are within EPSILON distance.
 */
export function buildWallGraph(walls: { start: Point2D; end: Point2D }[]): WallGraph {
  const nodes = new Map<string, WallNode>();
  const edges = new Map<string, WallEdge>();

  function getOrCreateNode(p: Point2D): WallNode {
    const key = pointKey(p);
    const existing = nodes.get(key);
    if (existing) {
      return existing;
    }
    const created: WallNode = { id: key, position: { x: p.x, y: p.y }, edges: [] };
    nodes.set(key, created);
    return created;
  }

  for (let i = 0; i < walls.length; i++) {
    const wall = walls[i];
    const startNode = getOrCreateNode(wall.start);
    const endNode = getOrCreateNode(wall.end);

    if (startNode.id === endNode.id) continue; // skip zero-length walls

    const edgeId = `edge_${i}`;
    edges.set(edgeId, {
      id: edgeId,
      startNodeId: startNode.id,
      endNodeId: endNode.id,
    });

    startNode.edges.push(edgeId);
    endNode.edges.push(edgeId);
  }

  return { nodes, edges };
}

/**
 * Find all minimal enclosed rooms (cycles) in the wall graph using DFS.
 * Returns polygons representing the enclosed rooms.
 */
export function findEnclosedRooms(graph: WallGraph): Polygon[] {
  const rooms: Polygon[] = [];
  const visitedEdges = new Set<string>();

  // Build adjacency: for each node, sorted adjacent nodes by angle
  const adjacency = new Map<string, { nodeId: string; edgeId: string; angle: number }[]>();

  for (const [nodeId, node] of graph.nodes) {
    const neighbors: { nodeId: string; edgeId: string; angle: number }[] = [];

    for (const edgeId of node.edges) {
      const edge = graph.edges.get(edgeId);
      if (!edge) {
        continue;
      }
      const otherNodeId = edge.startNodeId === nodeId ? edge.endNodeId : edge.startNodeId;
      const otherNode = graph.nodes.get(otherNodeId);
      if (!otherNode) {
        continue;
      }

      const angle = Math.atan2(
        otherNode.position.y - node.position.y,
        otherNode.position.x - node.position.x
      );

      neighbors.push({ nodeId: otherNodeId, edgeId, angle });
    }

    // Sort by angle for planar face traversal
    neighbors.sort((a, b) => a.angle - b.angle);
    adjacency.set(nodeId, neighbors);
  }

  // Traverse minimal faces using the "next edge" approach (planar face traversal)
  for (const [edgeId, edge] of graph.edges) {
    for (const direction of [0, 1] as const) {
      const dirKey = `${edgeId}_${direction}`;
      if (visitedEdges.has(dirKey)) continue;

      const startNodeId = direction === 0 ? edge.startNodeId : edge.endNodeId;
      const cycle: string[] = [startNodeId];
      let prevNodeId = startNodeId;
      let currentNodeId = direction === 0 ? edge.endNodeId : edge.startNodeId;

      visitedEdges.add(dirKey);
      let valid = true;

      // Walk around the face
      const maxSteps = graph.nodes.size + 1;
      let steps = 0;

      while (currentNodeId !== startNodeId && steps < maxSteps) {
        cycle.push(currentNodeId);
        steps++;

        const neighbors = adjacency.get(currentNodeId);
        if (!neighbors || neighbors.length === 0) {
          valid = false;
          break;
        }

        // Find the edge we came from
        const prevNode = graph.nodes.get(prevNodeId);
        const currentNode = graph.nodes.get(currentNodeId);
        if (!prevNode || !currentNode) {
          valid = false;
          break;
        }
        const incomingAngle = Math.atan2(
          prevNode.position.y - currentNode.position.y,
          prevNode.position.x - currentNode.position.x
        );

        // Find next edge (first edge clockwise after the incoming angle)
        let nextIdx = -1;
        for (let i = 0; i < neighbors.length; i++) {
          if (neighbors[i].angle > incomingAngle + EPSILON) {
            nextIdx = i;
            break;
          }
        }
        if (nextIdx === -1) nextIdx = 0; // wrap around

        const next = neighbors[nextIdx];
        const nextEdge = graph.edges.get(next.edgeId);
        if (!nextEdge) {
          valid = false;
          break;
        }
        const nextDirKey = `${next.edgeId}_${nextEdge.startNodeId === currentNodeId ? 0 : 1}`;
        visitedEdges.add(nextDirKey);

        prevNodeId = currentNodeId;
        currentNodeId = next.nodeId;
      }

      if (!valid || currentNodeId !== startNodeId || cycle.length < 3) continue;

      // Convert node IDs to polygon
      const vertices: Point2D[] = [];
      for (const nid of cycle) {
        const node = graph.nodes.get(nid);
        if (!node) {
          valid = false;
          break;
        }
        vertices.push(node.position);
      }
      if (!valid) continue;

      // Only add if area is positive (skip the outer boundary)
      let area = 0;
      for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
      }

      if (area > EPSILON) {
        rooms.push({ vertices });
      }
    }
  }

  return rooms;
}

/**
 * Find all junction points (nodes with degree > 2) in the wall graph.
 */
export function findJunctions(graph: WallGraph): Point2D[] {
  const junctions: Point2D[] = [];

  for (const [, node] of graph.nodes) {
    if (node.edges.length > 2) {
      junctions.push(node.position);
    }
  }

  return junctions;
}
