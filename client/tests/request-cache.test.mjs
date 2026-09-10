import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequestCache } from "../src/lib/request-cache.ts";
const config = (extra = {}) => ({
  method: "get",
  url: "/products",
  baseURL: "http://localhost/api",
  headers: { Authorization: "Bearer account-a" },
  ...extra,
});
const response = (c, data) => ({
  config: c,
  data,
  status: 200,
  headers: {},
  statusText: "OK",
});
test("concurrent requests deduplicate; cached values cannot be mutated by consumers", async () => {
  let calls = 0;
  const cache = createRequestCache(async (c) => {
    calls++;
    await Promise.resolve();
    return response(c, { stock: 10 });
  });
  const [a, b] = await Promise.all([
    cache.adapter(config()),
    cache.adapter(config()),
  ]);
  assert.equal(calls, 1);
  a.data.stock = 0;
  assert.equal(b.data.stock, 10);
  assert.equal((await cache.adapter(config())).data.stock, 10);
  assert.equal(calls, 1);
});
test("account and query changes never reuse another result", async () => {
  let calls = 0;
  const cache = createRequestCache(async (c) => response(c, ++calls));
  await cache.adapter(config());
  await cache.adapter(
    config({ headers: { Authorization: "Bearer account-b" } }),
  );
  await cache.adapter(config({ params: { page: 2 } }));
  assert.equal(calls, 3);
});
test("successful writes invalidate reads", async () => {
  let calls = 0;
  const cache = createRequestCache(async (c) => response(c, ++calls));
  await cache.adapter(config());
  await cache.adapter(config({ method: "post" }));
  await cache.adapter(config());
  assert.equal(calls, 3);
});
test("an old in-flight response cannot repopulate cache after invalidation", async () => {
  let resolve;
  let calls = 0;
  const cache = createRequestCache((c) => {
    calls++;
    if (calls === 1)
      return new Promise((r) => {
        resolve = () => r(response(c, "old"));
      });
    return Promise.resolve(response(c, "new"));
  });
  const first = cache.adapter(config());
  cache.clear();
  assert.equal((await cache.adapter(config())).data, "new");
  resolve();
  await first;
  assert.equal((await cache.adapter(config())).data, "new");
  assert.equal(calls, 2);
});
test("failed requests are not cached and expired values are fetched again", async () => {
  let calls = 0;
  const cache = createRequestCache(async (c) => {
    if (++calls === 1) throw Error("offline");
    return response(c, calls);
  }, 0);
  await assert.rejects(cache.adapter(config()));
  await cache.adapter(config());
  await cache.adapter(config());
  assert.equal(calls, 3);
});
