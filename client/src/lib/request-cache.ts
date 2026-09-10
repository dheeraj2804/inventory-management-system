import type { AxiosAdapter, AxiosResponse } from "axios";

/** A small, account-scoped cache; mutations invalidate both cached and in-flight reads. */
export function createRequestCache(transport: AxiosAdapter, ttl = 15_000) {
  const cache = new Map<string, { expires: number; response: AxiosResponse }>();
  const pending = new Map<string, Promise<AxiosResponse>>();
  let generation = 0;
  function clear() {
    generation++;
    cache.clear();
    pending.clear();
  }
  const adapter: AxiosAdapter = async (config) => {
    if (config.method !== "get") {
      const result = await transport(config);
      clear();
      return result;
    }
    const key = `${config.headers.Authorization || ""}:${config.baseURL}:${config.url}:${JSON.stringify(config.params || {})}`;
    const found = cache.get(key);
    if (found && found.expires > Date.now())
      return {
        ...found.response,
        config,
        data: structuredClone(found.response.data),
      };
    const epoch = generation;
    let request = pending.get(key);
    if (!request) {
      request = transport(config)
        .then((response) => {
          if (epoch === generation) {
            if (cache.size > 80) cache.clear();
            cache.set(key, {
              expires: Date.now() + ttl,
              response: { ...response, data: structuredClone(response.data) },
            });
          }
          return response;
        })
        .finally(() => {
          if (generation === epoch) pending.delete(key);
        });
      pending.set(key, request);
    }
    const response = await request;
    return { ...response, config, data: structuredClone(response.data) };
  };
  return { adapter, clear };
}
