import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const result = await prisma.tickets.updateMany({
      where: {
        status: {
          notIn: ["RESOLVED", "CLOSED"],
        },
        sla_due_at: {
          lt: now,
        },
        sla_breached: false,
      },
      data: {
        sla_breached: true,
      },
    });

    return NextResponse.json({
      success: true,
      breached_count: result.count,
    });
  } catch (error) {
    console.error("SLA checker error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check SLA",
      },
      { status: 500 }
    );
  }
}