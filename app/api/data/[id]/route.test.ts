// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    dataEntry: {
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

describe("/api/data/[id]", () => {
  const entry = {
    id: 1,
    name: "Jane Doe",
    companyInfo: "Acme",
    url: "https://example.com",
    industry: "Technology",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a data entry by ID", async () => {
    prismaMock.dataEntry.findUnique.mockResolvedValue(entry);

    const response = await GET(new Request("http://localhost/api/data/1"), context("1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(entry);
    expect(prismaMock.dataEntry.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 400 for invalid IDs", async () => {
    const response = await GET(new Request("http://localhost/api/data/not-a-number"), context("abc"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid ID" });
    expect(prismaMock.dataEntry.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the entry does not exist", async () => {
    prismaMock.dataEntry.findUnique.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/data/999"), context("999"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Entry not found" });
  });

  it("updates an existing entry", async () => {
    prismaMock.dataEntry.findUnique.mockResolvedValue(entry);
    prismaMock.dataEntry.update.mockResolvedValue({ ...entry, industry: "Software" });

    const response = await PUT(
      new Request("http://localhost/api/data/1", {
        method: "PUT",
        body: JSON.stringify({
          name: entry.name,
          companyInfo: entry.companyInfo,
          url: entry.url,
          industry: "Software",
        }),
      }),
      context("1"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ...entry, industry: "Software" });
    expect(prismaMock.dataEntry.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        name: entry.name,
        companyInfo: entry.companyInfo,
        url: entry.url,
        industry: "Software",
      },
    });
  });

  it("rejects updates with missing required fields", async () => {
    const response = await PUT(
      new Request("http://localhost/api/data/1", {
        method: "PUT",
        body: JSON.stringify({ name: entry.name }),
      }),
      context("1"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing required fields" });
    expect(prismaMock.dataEntry.update).not.toHaveBeenCalled();
  });

  it("deletes a data entry", async () => {
    prismaMock.dataEntry.delete.mockResolvedValue(entry);

    const response = await DELETE(new Request("http://localhost/api/data/1"), context("1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(prismaMock.dataEntry.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 500 when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.dataEntry.delete.mockRejectedValue(new Error("missing row"));

    const response = await DELETE(new Request("http://localhost/api/data/1"), context("1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to delete data entry" });
  });
});
