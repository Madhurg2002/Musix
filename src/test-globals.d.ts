// Ambient types for the test globals supplied by Bun's built-in test runner.
//
// src/utils/musicTheory.test.ts runs with `bun test`, which provides `describe`,
// `test`, and `expect` as globals and needs no separate test dependency. Because
// tsconfig.json declares an explicit `types` array, these globals are typed here
// rather than by pulling in the full Bun runtime typings.

declare function describe(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

interface ExpectMatchers<T> {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeNull(): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toBeLessThan(expected: number): void;
  toBeGreaterThan(expected: number): void;
  toHaveProperty(property: string): void;
  toHaveLength(expected: number): void;
  /** Array membership, or substring for strings. */
  toContain(
    expected: T extends readonly (infer Item)[] ? Item : T extends string ? string : never
  ): void;
  /** Asserts the function throws, e.g. `expect(() => risky()).toThrow()`. */
  toThrow(message?: string | RegExp): void;
  /** Negated form, e.g. `expect(() => safe()).not.toThrow()`. */
  readonly not: ExpectMatchers<T>;
}

declare function expect<T>(actual: T): ExpectMatchers<T>;
