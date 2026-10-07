/**
 * Circular menu positioning and animation utilities
 * Positions modules in a circle around a center point
 */

interface CirclePosition {
  x: number;
  y: number;
}

export const calculateArcPositions = (
  count: number,
  radius: number,
  startAngle = 210,
  endAngle = 330,
): CirclePosition[] => {
  if (count <= 0) return [];

  const start = (startAngle * Math.PI) / 180;
  const end = (endAngle * Math.PI) / 180;
  const angleStep = count === 1 ? 0 : (end - start) / (count - 1);

  return Array.from({ length: count }, (_, index) => {
    const angle = count === 1 ? -Math.PI / 2 : start + angleStep * index;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });
};
