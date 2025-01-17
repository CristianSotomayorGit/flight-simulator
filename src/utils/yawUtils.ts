export const getYawDisplay = (angle: number): string => {
  const normalizedAngle =
    ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const degrees = (normalizedAngle * 180) / Math.PI;

  if (degrees >= 337.5 || degrees < 22.5) return `${Math.round(degrees)}° N`;
  if (degrees >= 22.5 && degrees < 67.5) return `${Math.round(degrees)}° NW`;
  if (degrees >= 67.5 && degrees < 112.5) return `${Math.round(degrees)}° E`;
  if (degrees >= 112.5 && degrees < 157.5) return `${Math.round(degrees)}° SW`;
  if (degrees >= 157.5 && degrees < 202.5) return `${Math.round(degrees)}° S`;
  if (degrees >= 202.5 && degrees < 247.5) return `${Math.round(degrees)}° SE`;
  if (degrees >= 247.5 && degrees < 292.5) return `${Math.round(degrees)}° W`;
  if (degrees >= 292.5 && degrees < 337.5) return `${Math.round(degrees)}° NE`;

  return `${Math.round(degrees)}°`;
};
