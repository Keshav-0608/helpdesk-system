"use client";

import { useState } from "react";

const CUSTOMER_ID =
  "33333333-3333-3333-3333-333333333333";

const ORG_ID =
  "11111111-1111-1111-1111-111111111111";

export default function NewTicketPage() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "URGENT" | "HIGH" | "NORMAL"
  >("NORMAL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createTicket(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setError(
        "Subject and description are required."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org_id: ORG_ID,
          customer_id: CUSTOMER_ID,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to create ticket"
        );
      }

      window.location.href = "/portal";
    } catch (err) {
      console.error(
        "Failed to create ticket:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create ticket"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <a
            href="/portal"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Customer Portal
          </a>

          <h1 className="mt-4 text-2xl font-bold">
            Create Support Ticket
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Tell us what you need help with.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <form
          onSubmit={createTicket}
          className="rounded-2xl border border-white/10 bg-slate-900 p-6"
        >
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              Subject
            </label>

            <input
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              placeholder="What do you need help with?"
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium">
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as
                    | "URGENT"
                    | "HIGH"
                    | "NORMAL"
                )
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="NORMAL">
                Normal — 8 hour SLA
              </option>

              <option value="HIGH">
                High — 4 hour SLA
              </option>

              <option value="URGENT">
                Urgent — 1 hour SLA
              </option>
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the issue in detail..."
              className="mt-2 min-h-40 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <a
              href="/portal"
              className="rounded-lg border border-white/10 px-5 py-3 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </a>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}