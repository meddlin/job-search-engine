// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PUT } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    jobApplication: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const context = (id: string) => ({ params: Promise.resolve({ id }) });

describe("/api/jobs/[id]", () => {
  const job = {
    id: 1,
    companyName: "Acme",
    positionTitle: "Engineer",
    status: "initiation",
    remote: "hybrid",
    applied: false,
    notes: null,
    jobUrl: null,
    jobDescription: null,
    recruiterName: null,
    recruitingAgency: null,
    recruiterEmail: null,
    recruiterPhone: null,
    recruiterLinkedin: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing job application", async () => {
    prismaMock.jobApplication.findUnique.mockResolvedValue(job);
    prismaMock.jobApplication.update.mockResolvedValue({ ...job, status: "interviewing" });

    const response = await PUT(
      new Request("http://localhost/api/jobs/1", {
        method: "PUT",
        body: JSON.stringify({ status: "interviewing" }),
      }),
      context("1"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ...job, status: "interviewing" });
    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        companyName: job.companyName,
        positionTitle: job.positionTitle,
        status: "interviewing",
        remote: job.remote,
        applied: job.applied,
        notes: job.notes,
        jobUrl: job.jobUrl,
        jobDescription: job.jobDescription,
        recruiterName: job.recruiterName,
        recruitingAgency: job.recruitingAgency,
        recruiterEmail: job.recruiterEmail,
        recruiterPhone: job.recruiterPhone,
        recruiterLinkedin: job.recruiterLinkedin,
      },
    });
  });

  it("updates a job application to rejected", async () => {
    prismaMock.jobApplication.findUnique.mockResolvedValue(job);
    prismaMock.jobApplication.update.mockResolvedValue({ ...job, status: "rejected" });

    const response = await PUT(
      new Request("http://localhost/api/jobs/1", {
        method: "PUT",
        body: JSON.stringify({ status: "rejected" }),
      }),
      context("1"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ...job, status: "rejected" });
    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        status: "rejected",
      }),
    });
  });

  it("returns 400 for invalid IDs", async () => {
    const response = await PUT(
      new Request("http://localhost/api/jobs/not-a-number", {
        method: "PUT",
        body: JSON.stringify({ status: "interviewing" }),
      }),
      context("abc"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid ID" });
    expect(prismaMock.jobApplication.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the job application does not exist", async () => {
    prismaMock.jobApplication.findUnique.mockResolvedValue(null);

    const response = await PUT(
      new Request("http://localhost/api/jobs/999", {
        method: "PUT",
        body: JSON.stringify({ status: "interviewing" }),
      }),
      context("999"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Job application not found" });
  });

  it("rejects invalid status values", async () => {
    const response = await PUT(
      new Request("http://localhost/api/jobs/1", {
        method: "PUT",
        body: JSON.stringify({ status: "waiting" }),
      }),
      context("1"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid status" });
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("rejects invalid remote values", async () => {
    const response = await PUT(
      new Request("http://localhost/api/jobs/1", {
        method: "PUT",
        body: JSON.stringify({ remote: "sometimes" }),
      }),
      context("1"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid remote value" });
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("deletes a job application", async () => {
    prismaMock.jobApplication.delete.mockResolvedValue(job);

    const response = await DELETE(new Request("http://localhost/api/jobs/1"), context("1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(prismaMock.jobApplication.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 500 when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.jobApplication.delete.mockRejectedValue(new Error("missing row"));

    const response = await DELETE(new Request("http://localhost/api/jobs/1"), context("1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to delete job application" });
  });
});
