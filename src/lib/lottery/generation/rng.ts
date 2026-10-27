/** Fontes de aleatoriedade do gerador: criptográfica (produção) e semeável (testes). */
export type Rng = () => number;

/** RNG criptográfico padrão (uniforme em [0,1)). */
export const cryptoRng: Rng = () => {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
};

/** mulberry32: RNG determinístico e semeável, para testes reprodutíveis. */
export const seededRng = (seed: number): Rng => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};
