import regionsMap from "./brasil-cinco-regioes.json";

// Reuse the CC0 cartography already used by challenge 1, without redrawing borders.
const paths = new Map(regionsMap.regions.flatMap((region) => region.paths).map((part) => [part.id, part.d]));
function contour(id: string) {
  const d = paths.get(id);
  if (!d) throw new Error("Missing state contour: " + id);
  return d;
}
export const acrePath = contour("path5046");
export const northPuzzleStates = [
  { id: "am", name: "Amazonas", color: "#a9d96d", x: 121, y: 137, paths: [contour("path5000")] },
  { id: "rr", name: "Roraima", color: "#f6b3c9", x: 169, y: 48, paths: [contour("path4936")] },
  { id: "ap", name: "Amapá", color: "#ffdf73", x: 298, y: 57, paths: [contour("path4918")] },
  { id: "pa", name: "Pará", color: "#8bcbea", x: 285, y: 141, paths: [contour("path4978"), contour("path4938")] },
  { id: "ro", name: "Rondônia", color: "#ffc57c", x: 151, y: 226, paths: [contour("path5076")] },
  { id: "to", name: "Tocantins", color: "#c6a4e4", x: 351, y: 231, paths: [contour("path5096")] },
] as const;
export const northPuzzlePieces = [
  { id: "bahia", name: "Bahia", viewBox: "369 188 132 144", d: contour("path5140") },
  { id: "acre", name: "Acre", viewBox: "-4 173 110 61", d: acrePath },
  { id: "parana", name: "Paraná", viewBox: "260 374 93 66", d: contour("path5284") },
  { id: "goias", name: "Goiás", viewBox: "278 242 108 98", d: contour("path5168") },
] as const;
export type NorthPuzzlePieceId = (typeof northPuzzlePieces)[number]["id"];

/** Uses the rendered geographic contour, with a small touch-friendly tolerance. */
export function isOverPuzzleSlot(path: SVGPathElement | null, clientX: number, clientY: number): boolean {
  if (!path) return false;
  const matrix = path.getScreenCTM();
  const svg = path.ownerSVGElement;
  if (matrix && svg && typeof path.isPointInFill === "function") {
    const inverse = matrix.inverse();
    return [[0, 0], [-10, 0], [10, 0], [0, -10], [0, 10]].some(([dx, dy]) => {
      const point = svg.createSVGPoint();
      point.x = clientX + dx;
      point.y = clientY + dy;
      return path.isPointInFill(point.matrixTransform(inverse));
    });
  }
  const box = path.getBoundingClientRect();
  return box.width > 0 && box.height > 0 && clientX >= box.left - 8 && clientX <= box.right + 8 && clientY >= box.top - 8 && clientY <= box.bottom + 8;
}
