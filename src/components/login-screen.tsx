"use client";

import { useState, type FormEvent } from "react";

export function LoginScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(body?.error ?? "ログインに失敗しました。");
        return;
      }

      window.location.reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">Private Access</p>
        <h1 id="auth-title">App Hub</h1>
        <p className="auth-copy">Dive into your personal apps.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="APP_PASSWORD"
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button
            className="primary-button full-width"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "確認中..." : "入る"}
          </button>
        </form>
      </section>
    </main>
  );
}
