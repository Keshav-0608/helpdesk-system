import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      total,
      open,
      inProgress,
      resolved,
      closed,
      breached,
      urgent,
      high,
      normal,
      ratings,
    ] = await Promise.all([
      prisma.tickets.count(),

      prisma.tickets.count({
        where: {
          status: "OPEN",
        },
      }),

      prisma.tickets.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),

      prisma.tickets.count({
        where: {
          status: "RESOLVED",
        },
      }),

      prisma.tickets.count({
        where: {
          status: "CLOSED",
        },
      }),

      prisma.tickets.count({
        where: {
          sla_breached: true,
        },
      }),

      prisma.tickets.count({
        where: {
          priority: "URGENT",
        },
      }),

      prisma.tickets.count({
        where: {
          priority: "HIGH",
        },
      }),

      prisma.tickets.count({
        where: {
          priority: "NORMAL",
        },
      }),

      prisma.ratings.findMany({
        select: {
          rating: true,
        },
      }),
    ]);

    const averageCsat =
      ratings.length > 0
        ? ratings.reduce((sum, item) => sum + item.rating, 0) /
          ratings.length
        : 0;

    return NextResponse.json({
      success: true,
      dashboard: {
        tickets: {
          total,
          open,
          in_progress: inProgress,
          resolved,
          closed,
          breached,
        },

        priority: {
          urgent,
          high,
          normal,
        },

        csat: {
          average: Number(averageCsat.toFixed(2)),
          total_ratings: ratings.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}