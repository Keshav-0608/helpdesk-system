"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  priority: "URGENT" | "HIGH" | "NORMAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  sla_due_at: string;
  sla_breached: boolean;
  created_at: string;
  customer_id: string;
  agent_id: string | null;
};

type Message = {
  id: string;
  body: string;
  type: "PUBLIC" | "INTERNAL";
  sender_type: "CUSTOMER" | "AGENT";
  created_at: string;
};

const CUSTOMER_ID =
  "33333333-3333-3333-3333-333333333333";

const ORG_ID =
  "11111111-1111-1111-1111-111111111111";

export default function CustomerTicketPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [existingRating, setExistingRating] = useState<number | null>(
    null
  );
  const [ratingLoading, setRatingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) return;

    loadTicket();
    loadMessages();
    loadRating();
  }, [ticketId]);

  async function loadTicket() {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to load ticket"
        );
      }

      const loadedTicket = data.ticket;

      if (loadedTicket.customer_id !== CUSTOMER_ID) {
        throw new Error("You do not have access to this ticket.");
      }

      setTicket(loadedTicket);
      setError("");
    } catch (err) {
      console.error("Failed to load ticket:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load ticket"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/messages`
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(
        "Failed to load messages:",
        err
      );
    }
  }

  async function loadRating() {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/rating`
      );

      const data = await response.json();

      if (data.success && data.rating) {
        setExistingRating(data.rating.rating);
        setRating(data.rating.rating);
      }
    } catch (err) {
      console.error(
        "Failed to load rating:",
        err
      );
    }
  }

  async function submitRating() {
    if (!rating) return;

    try {
      setRatingLoading(true);

      const response = await fetch(
        `/api/tickets/${ticketId}/rating`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
             org_id: ORG_ID,
            customer_id: CUSTOMER_ID,
            rating,
            comment: ratingComment.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to submit feedback"
        );
      }

      setExistingRating(rating);
    } catch (err) {
      console.error(
        "Failed to submit rating:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to submit feedback"
      );
    } finally {
      setRatingLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading ticket...
        </p>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold">
            Unable to Load Ticket
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <a
            href="/portal"
            className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Back to Portal
          </a>
        </div>
      </main>
    );
  }

  const canRate =
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Customer Portal
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Support ticket
            </p>
          </div>

          <a
            href="/portal"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            ← Back to Tickets
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Ticket details */}
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Ticket #{ticket.id}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {ticket.subject}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <PriorityBadge
                priority={ticket.priority}
              />

              <StatusBadge
                status={ticket.status}
              />

              <SlaBadge
                breached={ticket.sla_breached}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm leading-6 text-slate-300">
              {ticket.description}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-xs text-slate-500">
            <span>
              Created:{" "}
              {new Date(
                ticket.created_at
              ).toLocaleString()}
            </span>

            <span>
              SLA due:{" "}
              {new Date(
                ticket.sla_due_at
              ).toLocaleString()}
            </span>
          </div>
        </section>

        {/* Conversation */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">
            Conversation
          </h3>

          <div className="mt-5 space-y-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">
                No messages yet.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl border p-4 ${
                    message.sender_type === "CUSTOMER"
                      ? "border-blue-500/20 bg-blue-500/5"
                      : "border-white/10 bg-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {message.sender_type === "CUSTOMER"
                        ? "You"
                        : "Support Agent"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {new Date(
                        message.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {message.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Customer CSAT */}
        {canRate && (
          <section className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
            <h3 className="text-lg font-semibold">
              Customer Feedback
            </h3>

            {existingRating ? (
              <div className="mt-4">
                <p className="text-sm text-slate-400">
                  Thanks for your feedback!
                </p>

                <div className="mt-3 text-3xl tracking-wide">
                  {"★".repeat(existingRating)}

                  <span className="text-slate-700">
                    {"★".repeat(
                      5 - existingRating
                    )}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Your rating: {existingRating}/5
                </p>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-400">
                  How was your support experience?
                </p>

                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRating(star)
                      }
                      className={`text-3xl transition ${
                        star <= rating
                          ? "text-yellow-400"
                          : "text-slate-700"
                      } hover:text-yellow-300`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={ratingComment}
                  onChange={(event) =>
                    setRatingComment(
                      event.target.value
                    )
                  }
                  placeholder="Optional feedback..."
                  className="mt-4 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600"
                />

                <button
                  onClick={submitRating}
                  disabled={
                    rating === 0 ||
                    ratingLoading
                  }
                  className="mt-3 w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {ratingLoading
                    ? "Submitting..."
                    : "Submit Feedback"}
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: Ticket["priority"];
}) {
  const styles = {
    URGENT:
      "border-red-500/30 bg-red-500/10 text-red-300",
    HIGH:
      "border-orange-500/30 bg-orange-500/10 text-orange-300",
    NORMAL:
      "border-slate-500/30 bg-slate-500/10 text-slate-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: Ticket["status"];
}) {
  const styles = {
    OPEN:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
    IN_PROGRESS:
      "border-purple-500/30 bg-purple-500/10 text-purple-300",
    RESOLVED:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    CLOSED:
      "border-slate-500/30 bg-slate-500/10 text-slate-300",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function SlaBadge({
  breached,
}: {
  breached: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        breached
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      }`}
    >
      {breached ? "SLA BREACHED" : "WITHIN SLA"}
    </span>
  );
}