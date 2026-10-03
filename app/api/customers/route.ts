import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers
export async function GET() {
  try {
    const customers = await prisma.customers.findMany({
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customers",
      },
      { status: 500 }
    );
  }
}