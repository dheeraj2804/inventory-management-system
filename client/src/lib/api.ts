import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from "axios";
import { expandDemoStore } from "./demo-expansion";
import { createRequestCache } from "./request-cache";
import { TOKEN_KEY, USER_KEY } from "./auth";
import {
  createDemoStore,
  demoRequest,
  DEMO_KEY,
  DEMO_TOKEN,
  type DemoStore,
} from "./demo";

const network = createRequestCache(axios.getAdapter(axios.defaults.adapter));
export const isDemoMode = () =>
  typeof window !== "undefined" &&
  localStorage.getItem(TOKEN_KEY) === DEMO_TOKEN;
export const clearApiCache = network.clear;
export function startDemo() {
  const saved = localStorage.getItem(DEMO_KEY);
  const store: DemoStore = saved ? JSON.parse(saved) : createDemoStore();
  localStorage.setItem(DEMO_KEY, JSON.stringify(expandDemoStore(store)));
  localStorage.setItem(TOKEN_KEY, DEMO_TOKEN);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: 1,
      name: "Alex Morgan",
      email: "demo@inventory.example",
      role: "Demo workspace",
    }),
  );
  clearApiCache();
  window.dispatchEvent(new Event("auth-changed"));
}
export function resetDemo() {
  localStorage.setItem(
    DEMO_KEY,
    JSON.stringify(expandDemoStore(createDemoStore())),
  );
  clearApiCache();
}

const adapter: AxiosAdapter = async (config) => {
  // Account creation and sign-in always use the real API, even from a demo session.
  if (config.url?.startsWith("/auth/")) return network.adapter(config);
  if (isDemoMode()) {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      const store: DemoStore = raw ? JSON.parse(raw) : createDemoStore();
      if (store.version !== 1)
        throw new Error("Reset demo data to use this workspace version.");
      const result = demoRequest(
        store,
        config.method || "get",
        config.url || "/",
        typeof config.data === "string" ? JSON.parse(config.data) : config.data,
      );
      if (config.method !== "get")
        localStorage.setItem(DEMO_KEY, JSON.stringify(store));
      return {
        data: result,
        status: config.method === "post" ? 201 : 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        config,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Demo action failed";
      throw new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, {
        data: { message },
        status: 400,
        statusText: "Bad Request",
        headers: new AxiosHeaders(),
        config,
      });
    }
  }
  return network.adapter(config);
};
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  timeout: 15_000,
  adapter,
});
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token !== DEMO_TOKEN)
      config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use((response) => {
  if (response.config.method !== "get") {
    clearApiCache();
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("inventory-updated"));
  }
  return response;
});
export function prefetchData(href: string) {
  const paths = href.startsWith("/purchases")
    ? ["/products", "/suppliers"]
    : href.startsWith("/products")
      ? ["/products", "/categories", "/suppliers"]
      : href.startsWith("/sales")
        ? ["/products"]
        : [href];
  if (href.endsWith("/history"))
    paths.push(href.startsWith("/sales") ? "/sales" : "/purchases");
  if (!href.startsWith("/dashboard"))
    paths.forEach((path) => {
      void api.get(path).catch(() => {});
    });
}
export default api;
