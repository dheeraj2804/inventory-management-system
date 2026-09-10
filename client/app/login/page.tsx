"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api, { clearApiCache, startDemo } from "@/src/lib/api";
import { saveToken, saveUser } from "@/src/lib/auth";
import Icon from "@/components/Icon";
import toast from "react-hot-toast";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [loading, setLoading] = useState(false);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveToken(data.token);
      saveUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });
      clearApiCache();
      router.replace("/dashboard");
    } catch {
      toast.error(
        "Unable to sign in. Check your credentials and API connection.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="box" size={28} />
          </span>
          <span>StockSync</span>
        </div>
        <div className="login-story-content">
          <span className="login-label">YOUR OPERATIONS, IN SYNC</span>
          <h1>
            Less busywork.
            <br />
            More <em>business.</em>
          </h1>
          <p>
            A clear view of your stock, your sales, and what comes next. One
            workspace to keep it all moving.
          </p>
          <div className="login-illustration" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-package">
              <Icon name="box" size={90} />
            </div>
            <div className="float-label label-one">
              <span className="success-dot" /> Inventory in sync
            </div>
            <div className="float-label label-two">
              <Icon name="trend" size={18} /> Ready for what’s next
            </div>
          </div>
        </div>
        <p className="login-credit">Built for the way your business works.</p>
      </section>
      <section className="login-form-side">
        <div className="login-form-card">
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>Good to see you.</h2>
          <p>Sign in to keep things moving.</p>
          <form onSubmit={login}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              autoComplete="username"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              autoComplete="current-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="button primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to workspace"}
              <Icon name="arrow" size={17} />
            </button>
          </form>
          <div className="login-divider">
            <span>Just looking around?</span>
          </div>
          <button
            className="button demo-button"
            onClick={() => {
              try {
                startDemo();
                router.replace("/dashboard");
              } catch {
                toast.error("Allow browser storage to use the demo workspace.");
              }
            }}
          >
            <Icon name="sparkle" size={18} />
            Explore the demo
            <Icon name="arrow" size={17} />
          </button>
          <small className="demo-caption">
            48 products. 90 days of activity. No account needed.
            <br />
            Your demo edits stay in this browser.
          </small>
        </div>
      </section>
    </div>
  );
}
