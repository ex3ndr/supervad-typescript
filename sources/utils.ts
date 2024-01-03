export const EMPTY = Float32Array.from([]);
export function concat(a: Float32Array, b: Float32Array) {
    const c = new Float32Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}