import axios from "axios";
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  return fallback;
}
