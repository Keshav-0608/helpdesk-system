import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/tickets/[id]/messages
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
        { status: 404 }
      );
    }

    const messages = await prisma.messages.findMany({
      where: {
        ticket_id: id,
        type: "PUBLIC",
      },
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/messages
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      org_id,
      sender_id,
      sender_type,
      message,
      type = "PUBLIC",
    } = body;

    if (!org_id || !sender_id || !sender_type || !message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "org_id, sender_id, sender_type, and message are required",
        },
        { status: 400 }
      );
    }

    if (!["CUSTOMER", "AGENT"].includes(sender_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "sender_type must be CUSTOMER or AGENT",
        },
        { status: 400 }
      );
    }

    if (!["PUBLIC", "INTERNAL"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "type must be PUBLIC or INTERNAL",
        },
        { status: 400 }
      );
    }

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
        { status: 404 }
      );
    }

    const newMessage = await prisma.messages.create({
      data: {
        org_id,
        ticket_id: id,
        sender_id,
        sender_type,
        body: message,
        type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Message created successfully",
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create message:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create message",
      },
      { status: 500 }
    );
  }
}