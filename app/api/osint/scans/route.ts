import { NextResponse } from "next/server";

import {
  DEFAULT_THEHARVESTER_SOURCES,
  SUPPORTED_THEHARVESTER_SOURCES,
  parseOsintScanInput,
  startTheHarvesterWorker,
} from "@/lib/osint/theharvester";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [scans, findings] = await Promise.all([
      prisma.companyOsintScan.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          findings: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      }),
      prisma.companyOsintFinding.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          scan: {
            select: {
              id: true,
              companyName: true,
              domain: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      scans,
      findings,
      defaultSources: DEFAULT_THEHARVESTER_SOURCES,
      supportedSources: SUPPORTED_THEHARVESTER_SOURCES,
    });
  } catch (error) {
    console.error("Error fetching OSINT scans:", error);
    return NextResponse.json({ error: "Failed to fetch OSINT scans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseOsintScanInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const scan = await prisma.companyOsintScan.create({
      data: {
        companyName: parsed.value.companyName,
        domain: parsed.value.domain,
        sources: parsed.value.sources,
        limit: parsed.value.limit,
        status: "queued",
        progressStage: "queued",
      },
    });

    try {
      await startTheHarvesterWorker(scan.id);
    } catch (error) {
      const completedAt = new Date();

      await prisma.companyOsintScan.update({
        where: { id: scan.id },
        data: {
          status: "failed",
          progressStage: "failed",
          heartbeatAt: completedAt,
          completedAt,
          errorMessage:
            error instanceof Error ? error.message : "Failed to start OSINT scan worker",
        },
      });

      return NextResponse.json(
        { error: "Failed to start OSINT scan worker" },
        { status: 500 },
      );
    }

    return NextResponse.json(scan, { status: 202 });
  } catch (error) {
    console.error("Error creating OSINT scan:", error);
    return NextResponse.json({ error: "Failed to create OSINT scan" }, { status: 500 });
  }
}
