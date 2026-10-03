import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SLA_HOURS = {
  URGENT: 1,
  HIGH: 4,
  NORMAL: 8,
};

export async function GET() {
  try {
    const tickets = await prisma.tickets.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tickets",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      org_id,
      customer_id,
      subject,
      description,
      priority = "NORMAL",
    } = body;

    // Basic validation
    if (!org_id || !customer_id || !subject || !description) {
      return NextResponse.json(
        {
          success: false,
          error:
            "org_id, customer_id, subject, and description are required",
        },
        {
          status: 400,
        }
      );
    }

    // Validate priority
    if (!["URGENT", "HIGH", "NORMAL"].includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Priority must be URGENT, HIGH, or NORMAL",
        },
        {
          status: 400,
        }
      );
    }

    // Calculate SLA deadline
    const now = new Date();
    const slaDueAt = new Date(
      now.getTime() + SLA_HOURS[priority as keyof typeof SLA_HOURS] * 60 * 60 * 1000
    );

    // Create ticket
    const ticket = await prisma.tickets.create({
      data: {
        org_id,
        customer_id,
        subject,
        description,
        priority,
        status: "OPEN",
        sla_due_at: slaDueAt,
        sla_breached: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ticket created successfully",
        ticket,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Failed to create ticket:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ticket",
      },
      {
        status: 500,
      }
    );
  }
}