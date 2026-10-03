import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/tickets/[id]/rating
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const rating = await prisma.ratings.findUnique({
      where: {
        ticket_id: id,
      },
    });

    if (!rating) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error("Failed to fetch rating:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rating",
      },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/rating
export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      org_id,
      customer_id,
      rating,
      comment,
    } = body;

    if (!org_id || !customer_id || rating === undefined) {
      return NextResponse.json(
        {
          success: false,
          error:
            "org_id, customer_id, and rating are required",
        },
        { status: 400 }
      );
    }

    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Rating must be an integer between 1 and 5",
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

    if (ticket.customer_id !== customer_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer does not belong to this ticket",
        },
        { status: 403 }
      );
    }

    const customer = await prisma.customers.findUnique({
      where: {
        id: customer_id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
        },
        { status: 404 }
      );
    }

    const existingRating = await prisma.ratings.findUnique({
      where: {
        ticket_id: id,
      },
    });

    if (existingRating) {
      return NextResponse.json(
        {
          success: false,
          error: "This ticket has already been rated",
        },
        { status: 409 }
      );
    }

    const newRating = await prisma.ratings.create({
      data: {
        org_id,
        ticket_id: id,
        customer_id,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rating submitted successfully",
        rating: newRating,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create rating:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create rating",
      },
      { status: 500 }
    );
  }
}