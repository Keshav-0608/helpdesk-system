import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/agents
export async function GET() {
  try {
    const agents = await prisma.agents.findMany({
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    console.error("Failed to fetch agents:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agents",
      },
      { status: 500 }
    );
  }
}