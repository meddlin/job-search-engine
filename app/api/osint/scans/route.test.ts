// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

const { prismaMock, startTheHarvesterWorkerMock } = vi.hoisted(() => ({
  prismaMock: {
    companyOsintScan: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    companyOsintFinding: {
      findMany: vi.fn(),
    },
  },
  startTheHarvesterWorkerMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/osint/theharvester", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/osint/theharvester")>();

  return {
    ...actual,
    startTheHarvesterWorker: startTheHarvesterWorkerMock,
  };
});

describe("/api/osint/scans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns scan history, findings, and source options", async () => {
    const scan = {
      id: 1,
      companyName: "Acme",
      domain: "acme.com",
      status: "completed",
      progressStage: "completed",
      heartbeatAt: new Date("2026-07-19T00:01:00.000Z"),
      startedAt: new Date("2026-07-19T00:00:00.000Z"),
      findings: [],
    };
    const finding = {
      id: 1,
      type: "host",
      value: "app.acme.com",
      scan: { id: 1, companyName: "Acme", domain: "acme.com" },
    };
    prismaMock.companyOsintScan.findMany.mockResolvedValue([scan]);
    prismaMock.companyOsintFinding.findMany.mockResolvedValue([finding]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      scans: [
        {
          ...scan,
          heartbeatAt: scan.heartbeatAt.toISOString(),
          startedAt: scan.startedAt.toISOString(),
        },
      ],
      findings: [finding],
      defaultSources: expect.arrayContaining(["crtsh"]),
      supportedSources: expect.arrayContaining(["hackertarget"]),
    });
    expect(prismaMock.companyOsintScan.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        findings: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  });

  it("creates a queued scan and starts the local worker", async () => {
    const scan = {
      id: 2,
      companyName: "Acme",
      domain: "acme.com",
      sources: ["crtsh"],
      limit: 100,
      status: "queued",
      progressStage: "queued",
      heartbeatAt: null,
    };
    prismaMock.companyOsintScan.create.mockResolvedValue(scan);

    const response = await POST(
      new Request("http://localhost/api/osint/scans", {
        method: "POST",
        body: JSON.stringify({
          companyName: "Acme",
          domain: "https://www.acme.com/careers",
          sources: ["crtsh"],
          limit: 100,
        }),
      }),
    );

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual(scan);
    expect(prismaMock.companyOsintScan.create).toHaveBeenCalledWith({
      data: {
        companyName: "Acme",
        domain: "acme.com",
        sources: ["crtsh"],
        limit: 100,
        status: "queued",
        progressStage: "queued",
      },
    });
    expect(startTheHarvesterWorkerMock).toHaveBeenCalledWith(2);
  });

  it("marks a scan failed when the local worker cannot start", async () => {
    const scan = {
      id: 3,
      companyName: "Acme",
      domain: "acme.com",
      sources: ["crtsh"],
      limit: 100,
      status: "queued",
      progressStage: "queued",
      heartbeatAt: null,
    };
    prismaMock.companyOsintScan.create.mockResolvedValue(scan);
    prismaMock.companyOsintScan.update.mockResolvedValue({});
    startTheHarvesterWorkerMock.mockImplementationOnce(() => {
      throw new Error("worker unavailable");
    });

    const response = await POST(
      new Request("http://localhost/api/osint/scans", {
        method: "POST",
        body: JSON.stringify({
          companyName: "Acme",
          domain: "acme.com",
          sources: ["crtsh"],
          limit: 100,
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(prismaMock.companyOsintScan.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: {
        status: "failed",
        progressStage: "failed",
        heartbeatAt: expect.any(Date),
        completedAt: expect.any(Date),
        errorMessage: "worker unavailable",
      },
    });
  });

  it("rejects invalid scan requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/osint/scans", {
        method: "POST",
        body: JSON.stringify({ companyName: "Acme", domain: "not-a-domain" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Company domain must be a valid domain name",
    });
    expect(prismaMock.companyOsintScan.create).not.toHaveBeenCalled();
    expect(startTheHarvesterWorkerMock).not.toHaveBeenCalled();
  });
});
