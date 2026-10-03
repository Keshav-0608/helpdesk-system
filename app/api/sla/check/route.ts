import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Find unresolved tickets whose SLA deadline has passed
    const breachedTickets = await prisma.tickets.findMany({
      where: {
        status: {
          notIn: ["RESOLVED", "CLOSED"],
        },
        sla_due_at: {
          lt: now,
        },
        sla_breached: false,
      },
      select: {
        id: true,
        subject: true,
        priority: true,
        status: true,
        sla_due_at: true,
      },
    });

    // Mark those tickets as breached
    if (breachedTickets.length > 0) {
      await prisma.tickets.updateMany({
        where: {
          id: {
            in: breachedTickets.map((ticket) => ticket.id),
          },
        },
        data: {
          sla_breached: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      checked_at: now,
      breached_count: breachedTickets.length,
      breached_tickets: breachedTickets,
    });
  } catch (error) {
    console.error("SLA check failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check SLA",
      },
      { status: 500 }
    );
  }
}