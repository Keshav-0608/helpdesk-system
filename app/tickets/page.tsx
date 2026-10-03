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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [search, setSearch] = useState("");

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

async function assignTicket(
  ticketId: string,
  agentId: string
) {
  try {
    const response = await fetch(
      `/api/tickets/${ticketId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to assign ticket"
      );
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              agent_id: agentId || null,
            }
          : ticket
      )
    );
  } catch (err) {
    console.error("Failed to assign ticket:", err);
    alert("Failed to assign ticket");
  }
}

async function updateTicketStatus(
  ticketId: string,
  status: Ticket["status"]
) {
  try {
    const response = await fetch(
      `/api/tickets/${ticketId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to update ticket status"
      );
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status,
            }
          : ticket
      )
    );
  } catch (err) {
    console.error(
      "Failed to update ticket status:",
      err
    );

    alert("Failed to update ticket status");
  }
}

async function updateTicketPriority(
  ticketId: string,
  priority: Ticket["priority"]
) {
  try {
    const response = await fetch(
      `/api/tickets/${ticketId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to update ticket priority"
      );
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              priority,
              sla_due_at: data.ticket?.sla_due_at ?? ticket.sla_due_at,
            }
          : ticket
      )
    );
  } catch (err) {
    console.error(
      "Failed to update ticket priority:",
      err
    );

    alert("Failed to update ticket priority");
  }
}

  async function loadTickets() {
    try {
      setLoading(true);

      const response = await fetch("/api/tickets");

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch tickets");
      }

      setTickets(data.tickets || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    loadAgents();
    loadCustomers();
  }, []);
  function getCustomerName(customerId: string) {
  const customer = customers.find(
    (customer) => customer.id === customerId
  );

  return customer ? customer.name : customerId.slice(0, 8);
}

function getAgentName(agentId: string | null) {
  if (!agentId) {
    return "Unassigned";
  }

  const agent = agents.find(
    (agent) => agent.id === agentId
  );

  return agent ? agent.name : agentId.slice(0, 8);
}

  const filteredTickets = tickets.filter((ticket) => {
  const matchesStatus =
    statusFilter === "ALL" ||
    ticket.status === statusFilter;

  const matchesPriority =
    priorityFilter === "ALL" ||
    ticket.priority === priorityFilter;

  const matchesSla =
    slaFilter === "ALL" ||
    (slaFilter === "BREACHED" && ticket.sla_breached) ||
    (slaFilter === "WITHIN_SLA" && !ticket.sla_breached);

  const matchesSearch =
    search.trim() === "" ||
    ticket.subject
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    ticket.id
      .toLowerCase()
      .includes(search.toLowerCase());

  return (
    matchesStatus &&
    matchesPriority &&
    matchesSla &&
    matchesSearch
  ); 
});

  return (
      
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <a
              href="/"
              className="text-2xl font-bold tracking-tight hover:text-slate-300"
            >
              Support Helpdesk
            </a>

            <p className="mt-1 text-sm text-slate-400">
              Ticket Management
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Dashboard
            </a>

            <button
              onClick={loadTickets}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">All Tickets</h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage customer support requests and monitor SLA status.
          </p>
        </div>
       {/* Agent Console Summary */}
  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <SummaryCard
      label="Total Tickets"
      value={tickets.length}
    />

    <SummaryCard
      label="Open"
      value={
        tickets.filter(
          (ticket) => ticket.status === "OPEN"
        ).length
      }
    />

    <SummaryCard
      label="In Progress"
      value={
        tickets.filter(
          (ticket) => ticket.status === "IN_PROGRESS"
        ).length
      }
    />

    <SummaryCard
      label="SLA Breached"
      value={
        tickets.filter(
          (ticket) => ticket.sla_breached
        ).length
      }
    />
  </div>


{/* Filters */}
{!loading && !error && (
  <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900 p-4">
    <div className="grid gap-4 md:grid-cols-4">
      {/* Search */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Search
        </label>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tickets..."
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Status
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Priority */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Priority
        </label>

        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
        </select>
      </div>

      {/* SLA */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
          SLA
        </label>

        <select
          value={slaFilter}
          onChange={(event) => setSlaFilter(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All SLA</option>
          <option value="BREACHED">Breached</option>
          <option value="WITHIN_SLA">Within SLA</option>
        </select>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-slate-400">
        Showing{" "}
        <span className="font-semibold text-white">
          {filteredTickets.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-white">
          {tickets.length}
        </span>{" "}
        tickets
      </p>

      <button
        onClick={() => {
          setSearch("");
          setStatusFilter("ALL");
          setPriorityFilter("ALL");
          setSlaFilter("ALL");
        }}
        className="text-sm text-slate-400 hover:text-white"
      >
        Clear filters
      </button>
    </div>
  </div>
)}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center text-slate-400">
            Loading tickets...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-300">{error}</p>

            <button
              onClick={loadTickets}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tickets */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ticket
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Priority
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      SLA
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Agent
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      {/* Ticket */}
                      <td className="px-5 py-5">
                        <a
                          href={`/tickets/${ticket.id}`}
                          className="font-medium hover:text-slate-300"
                        >
                          {ticket.subject}
                        </a>

                        <p className="mt-1 text-xs text-slate-500">
                          #{ticket.id.slice(0, 8)}
                        </p>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-5">
  <select
    value={ticket.priority}
    onChange={(event) =>
      updateTicketPriority(
        ticket.id,
        event.target.value as Ticket["priority"]
      )
    }
    className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500"
  >
    <option value="URGENT">Urgent</option>
    <option value="HIGH">High</option>
    <option value="NORMAL">Normal</option>
  </select>
</td>

                      {/* Status */}
                     <td className="px-5 py-5">
                        <select
                          value={ticket.status}
                          onChange={(event) =>
                          updateTicketStatus(
                          ticket.id,
                          event.target.value as Ticket["status"]
                          )
                        }
                        className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500"
                       >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>

                      {/* SLA */}
                      <td className="px-5 py-5">
                        <SlaCountdown
                          dueAt={ticket.sla_due_at}
                          breached={ticket.sla_breached}
                          status={ticket.status}
                        />
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-5">
                        <span className="text-sm text-slate-300">
                          {getCustomerName(ticket.customer_id)}
                        </span>
                      </td>

                      {/* Agent */}
                      <td className="px-5 py-5">
                        <select
                          value={ticket.agent_id || ""}
                          onChange={(event) =>
                          assignTicket(ticket.id, event.target.value)
                          }
                          className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500"
>
                          <option value="">Unassigned</option>

                          {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                          {agent.name}
                          </option>
                        ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tickets.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                No tickets found.
              </div>
            )}
          </div>
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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[priority]}`}
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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
function SlaCountdown({
  dueAt,
  breached,
  status,
}: {
  dueAt: string;
  breached: boolean;
  status: Ticket["status"];
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateCountdown() {
      const due = new Date(dueAt).getTime();
      const now = Date.now();
      const difference = due - now;

      if (status === "RESOLVED" || status === "CLOSED") {
        setTimeLeft(
          breached
            ? "SLA was breached"
            : "SLA met"
        );
        return;
      }

      const absoluteDifference = Math.abs(difference);

      const hours = Math.floor(
        absoluteDifference / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (absoluteDifference % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (absoluteDifference % (1000 * 60)) /
          1000
      );

      if (difference < 0 || breached) {
        setTimeLeft(
          `Overdue by ${hours}h ${minutes}m ${seconds}s`
        );
      } else {
        setTimeLeft(
          `${hours}h ${minutes}m ${seconds}s remaining`
        );
      }
    }

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, [dueAt, breached, status]);

  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
            breached
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {breached ? "SLA Breached" : "SLA Met"}
        </span>

        <p className="mt-1 text-xs text-slate-500">
          {timeLeft}
        </p>
      </div>
    );
  }

  return (
    <div>
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
          differenceIsOverdue(dueAt, breached)
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        }`}
      >
        {differenceIsOverdue(dueAt, breached)
          ? "SLA Breached"
          : "Within SLA"}
      </span>

      <p className="mt-1 text-xs text-slate-400">
        {timeLeft}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        Due {new Date(dueAt).toLocaleString()}
      </p>
    </div>
  );

function differenceIsOverdue(
  dueAt: string,
  breached: boolean
) {
  return (
    breached ||
    new Date(dueAt).getTime() < Date.now()
  );
}
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

