"use client";
import { useState } from "react";
import Link from "next/link";
import api from "@/src/lib/api";
import { errorMessage } from "@/src/lib/errors";
import Icon from "@/components/Icon";

export default function SignupPage() {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [created, setCreated] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Your passwords do not match.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Your password is too long. Use at most 72 UTF-8 bytes.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setPassword("");
      setConfirmation("");
      setCreated(true);
    } catch (failure) {
      setError(
        errorMessage(failure, "Could not reach the server. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="login-page signup-page">
      <section className="login-story">
        <Link href="/login" className="brand">
          <span className="brand-mark">
            <Icon name="box" size={28} />
          </span>
          <span>StockSync</span>
        </Link>
        <div className="login-story-content">
          <span className="login-label">MAKE ROOM FOR BETTER DAYS</span>
          <h1>
            Everything in
            <br />
            its <em>right place.</em>
          </h1>
          <p>
            Start with a clearer view of your inventory. Keep your products,
            purchases, and sales moving together.
          </p>
          <div className="signup-benefits">
            <p>
              <Icon name="check" size={18} /> A home for every product
            </p>
            <p>
              <Icon name="check" size={18} /> Purchases and sales in one view
            </p>
            <p>
              <Icon name="check" size={18} /> Stock insights that make sense
            </p>
          </div>
        </div>
        <p className="login-credit">A little more organized, from day one.</p>
      </section>
      <section className="login-form-side">
        <div className="login-form-card">
          {created ? (
            <div className="signup-success" role="status">
              <span className="signup-success-icon">
                <Icon name="check" size={28} />
              </span>
              <span className="eyebrow">YOU’RE ALL SET</span>
              <h2>Account created.</h2>
              <p>
                Sign in with <strong>{email.trim().toLowerCase()}</strong> and
                your password to open your workspace.
              </p>
              <Link href="/login" className="button primary">
                Go to sign in
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          ) : (
            <>
              <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
              <h2>Create your account.</h2>
              <p>A few details, and you’re ready to go.</p>
              <form onSubmit={submit} aria-busy={loading}>
                <label htmlFor="signup-name">Full name</label>
                <input
                  id="signup-name"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={loading}
                />
                <label htmlFor="signup-email">Email address</label>
                <input
                  id="signup-email"
                  autoComplete="username"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  required
                  disabled={loading}
                />
                <div className="password-label">
                  <label htmlFor="signup-password">Password</label>
                  <button
                    type="button"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide passwords" : "Show passwords"}
                  </button>
                </div>
                <input
                  id="signup-password"
                  aria-describedby="password-guidance"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                />
                <small id="password-guidance" className="password-guidance">
                  Use at least 8 characters. A longer, unique password is best.
                </small>
                <label htmlFor="signup-confirm">Confirm password</label>
                <input
                  id="signup-confirm"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  minLength={8}
                  maxLength={72}
                  required
                  disabled={loading}
                  aria-invalid={!!error && password !== confirmation}
                />
                {error && (
                  <p className="signup-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button primary"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Creating your account…" : "Create account"}
                  <Icon name="arrow" size={17} />
                </button>
              </form>
              <p className="account-link">
                Already have an account? <Link href="/login">Sign in</Link>
              </p>
              <p className="demo-caption">
                Just exploring?{" "}
                <Link href="/demo">Try the demo without an account.</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
