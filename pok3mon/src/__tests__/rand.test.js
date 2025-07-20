import { it, expect } from 'vitest';

const stub = new Proxy(
  {},
  { get: () => () => {}, set: () => true }
);

global.document = { querySelector: () => stub };

it("rand number ≥ 1", async () => {
  const { rand } = await import('../main.js');
  expect(rand()).toBeGreaterThanOrEqual(1);
});
