"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

 function handleLogin(event: React.FormEvent) {
  event.preventDefault();

  if (!email || !password) {
    setError("Email and password are required.");
    return;
  }

  if (email === "rahul@supporthub.com" && password === "123456") {
    localStorage.setItem("user_role", "ADMIN");
    localStorage.setItem("user_email", email);
    window.location.href = "/";
    return;
  }

  if (email === "priya@supporthub.com" && password === "123456") {
    localStorage.setItem("user_role", "AGENT");
    localStorage.setItem("user_email", email);
    window.location.href = "/tickets";
    return;
  }

  if (email === "arjun@example.com" && password === "123456") {
    localStorage.setItem("user_role", "CUSTOMER");
    localStorage.setItem("user_email", email);
    window.location.href = "/portal";
    return;
  }

  setError("Invalid email or password.");
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold">
          Support Helpdesk
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to continue
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-950 p-4 text-xs text-slate-500">
          <p>Demo accounts:</p>
          <p className="mt-2">Admin: rahul@supporthub.com</p>
          <p>Agent: priya@supporthub.com</p>
          <p>Customer: arjun@example.com</p>
          <p className="mt-2">Password: 123456</p>
        </div>
      </div>
    </main>
  );
}