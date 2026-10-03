import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/tickets/[id]
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const ticket = await prisma.tickets.findUnique({
      where: {
        id,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("Failed to fetch ticket:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ticket",
      },
      {
        status: 500,
      }
    );
  }
}

// PATCH /api/tickets/[id]
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check that the ticket exists
    const existingTicket = await prisma.tickets.findUnique({
      where: {
        id,
      },
    });

    if (!existingTicket) {
      return NextResponse.json(
        {
          success: false,
          error: "Ticket not found",
        },
        {
          status: 404,
        }
      );
    }

    const {
      subject,
      description,
      priority,
      status,
      agent_id,
    } = body;

    // Validate priority if provided
    if (
      priority !== undefined &&
      !["URGENT", "HIGH", "NORMAL"].includes(priority)
    ) {
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

    // Validate status if provided
    if (
      status !== undefined &&
      !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED",
        },
        {
          status: 400,
        }
      );
    }

    // Build the fields we want to update
    const updateData: {
      subject?: string;
      description?: string;
      priority?: "URGENT" | "HIGH" | "NORMAL";
      status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
      agent_id?: string | null;
      sla_due_at?: Date;
      resolved_at?: Date | null;
      closed_at?: Date | null;
    } = {};

    if (subject !== undefined) {
      updateData.subject = subject;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (agent_id !== undefined) {
      updateData.agent_id = agent_id;
    }

    // Recalculate SLA if priority changes
    if (priority !== undefined) {
      const slaHours = {
        URGENT: 1,
        HIGH: 4,
        NORMAL: 8,
      };

      const hours =
        slaHours[priority as keyof typeof slaHours];

      updateData.sla_due_at = new Date(
        Date.now() + hours * 60 * 60 * 1000
      );
    }

    // Automatically set resolved_at
    if (status === "RESOLVED") {
      updateData.resolved_at = new Date();
    }

    // Automatically set closed_at
    if (status === "CLOSED") {
      updateData.closed_at = new Date();

      // If closing directly, also make sure resolved_at exists
      if (!existingTicket.resolved_at) {
        updateData.resolved_at = new Date();
      }
    }

    // If ticket is reopened, clear resolution/closure dates
    if (status === "OPEN" || status === "IN_PROGRESS") {
      updateData.resolved_at = null;
      updateData.closed_at = null;
    }

    const updatedTicket = await prisma.tickets.update({
      where: {
        id,
      },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Failed to update ticket:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update ticket",
      },
      {
        status: 500,
      }
    );
  }
}