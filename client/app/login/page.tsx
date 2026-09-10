"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import { saveToken, saveUser } from "@/src/lib/auth";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      saveToken(res.data.token);

      saveUser({
        id: res.data.user?.id,
        name: res.data.user?.name || "Admin User",
        email: res.data.user?.email || email,
        role: res.data.user?.role || "Admin",
      });

      toast.success("Login successful");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-black shadow-2xl">
        <h1 className="mb-6 text-3xl font-bold">Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block font-medium">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-6 py-3 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}