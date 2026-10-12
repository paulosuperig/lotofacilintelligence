/** Canonical combination identity; does not mutate the supplied numbers. */
export const gameSignature = (numbers: number[]): string =>
  [...numbers].sort((a, b) => a - b).join(',');
