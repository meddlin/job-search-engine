// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    jobApplication: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("/api/jobs", () => {
  const job = {
    id: 1,
    companyName: "Acme",
    positionTitle: "Engineer",
    status: "initiation",
    remote: "hybrid",
    applied: false,
    notes: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns job applications ordered by date added", async () => {
    prismaMock.jobApplication.findMany.mockResolvedValue([job]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([job]);
    expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
      orderBy: { dateAdded: "desc" },
    });
  });

  it("returns a 500 response when fetching jobs fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.jobApplication.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to fetch job applications" });
  });

  it("creates a job application with defaults", async () => {
    prismaMock.jobApplication.create.mockResolvedValue(job);

    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          companyName: job.companyName,
          positionTitle: job.positionTitle,
          remote: job.remote,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(job);
    expect(prismaMock.jobApplication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyName: job.companyName,
        positionTitle: job.positionTitle,
        status: "initiation",
        remote: job.remote,
        applied: false,
      }),
    });
  });

  it("rejects invalid status values", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({ status: "waiting" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid status" });
    expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
  });

  it("rejects invalid remote values", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({ remote: "sometimes" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid remote value" });
    expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
  });
});
