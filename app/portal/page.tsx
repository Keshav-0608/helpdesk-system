"use client";

import { useEffect, useState } from "react";


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

type Customer = {
  id: string;
  name: string;
  email: string;
};

const CUSTOMER_ID =
  "33333333-3333-3333-3333-333333333333";

export default function CustomerPortal() {
  const [customer, setCustomer] = useState<Customer | null>(
    null
  );

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortal();
  }, []);

  async function loadPortal() {
    try {
      setLoading(true);

      const [customerResponse, ticketsResponse] =
        await Promise.all([
          fetch("/api/customers"),
          fetch("/api/tickets"),
        ]);

      const customerData =
        await customerResponse.json();

      const ticketsData =
        await ticketsResponse.json();

      if (customerData.success) {
        const currentCustomer =
          customerData.customers.find(
            (item: Customer) =>
              item.id === CUSTOMER_ID
          );

        setCustomer(currentCustomer || null);
      }

      if (ticketsData.success) {
        const customerTickets =
          ticketsData.tickets.filter(
            (ticket: Ticket) =>
              ticket.customer_id === CUSTOMER_ID
          );

        setTickets(customerTickets);
      }
    } catch (error) {
      console.error(
        "Failed to load customer portal:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <p className="text-slate-400">
            Loading customer portal...
          </p>
        </main>
    
    );

  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Customer Portal
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                View your support requests and SLA status
              </p>
            </div>

            <a
              href="/"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Customer profile */}
        {customer && (
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Signed in as
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {customer.name}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {customer.email}
            </p>
          </section>
        )}

        {/* Ticket list */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                My Tickets
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {tickets.length} support ticket
                {tickets.length !== 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={loadPortal}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Refresh
            </button>
            <a
                href="/portal/new"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
  >
                + New Ticket
            </a>
          </div>

          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
                <p className="text-slate-400">
                  You don't have any support tickets yet.
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <a
                  key={ticket.id}
                  href={`/portal/ticket/${ticket.id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-white/20 hover:bg-slate-800"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {ticket.subject}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        #{ticket.id}
                      </p>
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

                  <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500">
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
                </a>
              ))
            )}
          </div>
        </section>
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