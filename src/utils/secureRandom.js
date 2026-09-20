export function randomUnit(
  getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto),
) {
  const values = new Uint32Array(1);
  getRandomValues(values);
  return values[0] / 2 ** 32;
}
