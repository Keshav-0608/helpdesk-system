"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  sender_id: string;
  sender_type: "CUSTOMER" | "AGENT";
  body: string;
  type: "PUBLIC" | "INTERNAL";
  created_at: string;
};

type Agent = {
  id: string;
  name: string;
  email: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
};

export default function TicketDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [ticketId, setTicketId] = useState("");

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const [existingRating, setExistingRating] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState("");

  const searchParams = useSearchParams();
  const fromPortal = searchParams.get("from") === "portal";

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setTicketId(resolvedParams.id);
    }

    getParams();
  }, [params]);

  useEffect(() => {
    if (!ticketId) return;

    loadTicket();
    loadMessages();
    loadAgents();
    loadCustomers();
    loadRating();
  }, [ticketId]);

  useEffect(() => {
  if (!ticket?.sla_due_at) return;

  // Completed tickets should not keep counting down.
  if (
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED"
  ) {
    if (ticket.sla_breached) {
      setTimeLeft("SLA was breached");
    } else {
      setTimeLeft("SLA met");
    }

    return;
  }

  function updateCountdown() {
    const dueTime = new Date(ticket!.sla_due_at).getTime();
    const now = Date.now();
    const difference = dueTime - now;

    if (difference <= 0) {
      const overdue = Math.abs(difference);

      const hours = Math.floor(
        overdue / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (overdue % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (overdue % (1000 * 60)) / 1000
      );

      setTimeLeft(
        `Overdue by ${hours}h ${minutes}m ${seconds}s`
      );

      return;
    }

    const hours = Math.floor(
      difference / (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (difference % (1000 * 60 * 60)) /
        (1000 * 60)
    );

    const seconds = Math.floor(
      (difference % (1000 * 60)) / 1000
    );

    setTimeLeft(
      `${hours}h ${minutes}m ${seconds}s remaining`
    );
  }

  updateCountdown();

  const interval = setInterval(
    updateCountdown,
    1000
  );

  return () => clearInterval(interval);
}, [ticket?.sla_due_at, ticket?.status, ticket?.sla_breached]);
  async function loadTicket() {
    try {
      setLoading(true);

      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load ticket");
      }

      setTicket(data.ticket || data.data);

      const loadedTicket = data.ticket || data.data;

      if (loadedTicket?.agent_id) {
        setSelectedAgent(loadedTicket.agent_id);
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load ticket");
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
      console.error("Failed to load messages:", err);
    }
  }

  async function loadAgents() {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    }
  }

  async function loadCustomers() {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
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
    }
  } catch (err) {
    console.error("Failed to load rating:", err);
  }
}

async function sendMessage(type: "PUBLIC" | "INTERNAL") {
    const message =
      type === "PUBLIC" ? reply.trim() : internalNote.trim();

    if (!message || !ticket) return;

    try {
      setSending(true);

      const senderId =
        type === "INTERNAL"
          ? selectedAgent || ticket.agent_id
          : selectedAgent || ticket.agent_id;

      if (!senderId) {
        alert("Please assign an agent first.");
        return;
      }

      const response = await fetch(
        `/api/tickets/${ticketId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            org_id: "11111111-1111-1111-1111-111111111111",
            sender_id: senderId,
            sender_type: "AGENT",
            message,
            type,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }

      if (type === "PUBLIC") {
        setReply("");
      } else {
        setInternalNote("");
      }

      await loadMessages();
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function updateTicket(updates: Record<string, unknown>) {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update ticket");
      }

      await loadTicket();
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket");
    }
  }

  function getCustomer() {
    if (!ticket) return null;

    return customers.find(
      (customer) => customer.id === ticket.customer_id
    );
  }

  function getAgent() {
    if (!ticket?.agent_id) return null;

    return agents.find(
      (agent) => agent.id === ticket.agent_id
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading ticket...</p>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold">
            Ticket not found
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error}
          </p>

          <a
  href={fromPortal ? "/portal" : "/tickets"}
  className="text-sm text-slate-400 hover:text-white"
>
  ← Back to Tickets
</a>
          
        </div>
      </main>
    );
  }

  const customer = getCustomer();
  const agent = getAgent();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <a
  href={fromPortal ? "/portal" : "/tickets"}
  className="text-sm text-slate-400 hover:text-white"
>
  ← Back to Tickets
</a>

            <h1 className="mt-2 text-2xl font-bold">
              {ticket.subject}
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              #{ticket.id}
            </p>
          </div>

          <div className="flex gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div>
            {/* Description */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="text-lg font-semibold">
                Ticket Description
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                {ticket.description}
              </p>
            </section>

            {/* Conversation */}
            <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Conversation
                </h2>

                <button
                  onClick={loadMessages}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {messages.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No public messages yet.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-xl p-4 ${
                        message.sender_type === "AGENT"
                          ? "ml-8 bg-blue-500/10 border border-blue-500/20"
                          : "mr-8 bg-slate-800 border border-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          {message.sender_type === "AGENT"
                            ? "Support Agent"
                            : "Customer"}
                        </span>

                        <span className="text-[11px] text-slate-500">
                          {new Date(
                            message.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {message.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Public reply */}
            {ticket.status !== "CLOSED" && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h2 className="text-lg font-semibold">
                  Reply to Customer
                </h2>

                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(event.target.value)
                  }
                  placeholder="Write a reply to the customer..."
                  className="mt-4 min-h-32 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-white/30"
                />

                <button
                  onClick={() => sendMessage("PUBLIC")}
                  disabled={sending || !reply.trim()}
                  className="mt-3 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </section>
            )}

            {/* Internal note */}
            {ticket.status !== "CLOSED" && (
              <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h2 className="text-lg font-semibold text-amber-300">
                  Internal Note
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  This note is visible to agents only.
                </p>

                <textarea
                  value={internalNote}
                  onChange={(event) =>
                    setInternalNote(event.target.value)
                  }
                  placeholder="Write an internal note..."
                  className="mt-4 min-h-28 w-full rounded-xl border border-amber-500/20 bg-slate-950 p-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/40"
                />

                <button
                  onClick={() => sendMessage("INTERNAL")}
                  disabled={sending || !internalNote.trim()}
                  className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add Internal Note
                </button>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* CSAT */}
{ticket.status === "CLOSED" && (
  <section className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
    <h2 className="font-semibold">Customer Satisfaction</h2>

    {existingRating ? (
  <div className="mt-4">
    <p className="text-sm text-slate-400">
      Customer Feedback
    </p>

    <div className="mt-3 text-3xl tracking-wide">
      {"★".repeat(existingRating)}
      <span className="text-slate-700">
        {"★".repeat(5 - existingRating)}
      </span>
    </div>

    <p className="mt-2 text-xs text-slate-500">
      Customer rating: {existingRating}/5
    </p>
  </div>
) : (
  <div className="mt-4">
    <p className="text-sm text-slate-500">
      No customer feedback submitted yet.
    </p>
  </div>
)}
  </section>
)}
            {/* SLA */}
            <section
              className={`rounded-2xl border p-6 ${
                ticket.sla_breached
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}
            >
              <h2 className="font-semibold">SLA Status</h2>

              <p
                className={`mt-3 text-xl font-bold ${
                  ticket.sla_breached
                    ? "text-red-300"
                    : "text-emerald-300"
                }`}
              >
                {ticket.sla_breached
                  ? "SLA Breached"
                  : "Within SLA"}
              </p>
            {timeLeft && (
                 <p className="mt-2 text-sm font-medium text-white">
                    {timeLeft}
                 </p>
                )}

              <p className="mt-2 text-xs text-slate-400">
                Due:{" "}
                {new Date(ticket.sla_due_at).toLocaleString()}
              </p>
            </section>

            {/* Customer */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="font-semibold">Customer</h2>

              {customer ? (
                <div className="mt-4">
                  <p className="font-medium">{customer.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {customer.email}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Customer information unavailable
                </p>
              )}
            </section>

            {/* Assignment */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="font-semibold">Assignment</h2>

              <select
                value={selectedAgent}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedAgent(value);

                  updateTicket({
                    agent_id: value || null,
                  });
                }}
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="">Unassigned</option>

                {agents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {agent && (
                <p className="mt-3 text-xs text-slate-500">
                  Current: {agent.name}
                </p>
              )}
            </section>

            {/* Ticket controls */}
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
              <h2 className="font-semibold">
                Ticket Actions
              </h2>

              <div className="mt-4 space-y-2">
                {ticket.status === "OPEN" && (
                  <button
                    onClick={() =>
                      updateTicket({
                        status: "IN_PROGRESS",
                      })
                    }
                    className="w-full rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20"
                  >
                    Start Working
                  </button>
                )}

                {ticket.status !== "RESOLVED" &&
                  ticket.status !== "CLOSED" && (
                    <button
                      onClick={() =>
                        updateTicket({
                          status: "RESOLVED",
                        })
                      }
                      className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Resolve Ticket
                    </button>
                  )}

                {ticket.status === "RESOLVED" && (
                  <button
                    onClick={() =>
                      updateTicket({
                        status: "CLOSED",
                      })
                    }
                    className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                  >
                    Close Ticket
                  </button>
                )}
              </div>
            </section>
          </aside>
        </div>
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