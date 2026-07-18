// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    dataEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("/api/data", () => {
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

  it("returns data entries ordered by creation date", async () => {
    prismaMock.dataEntry.findMany.mockResolvedValue([entry]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([entry]);
    expect(prismaMock.dataEntry.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns a 500 response when fetching entries fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.dataEntry.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to fetch data entries" });
  });

  it("creates a data entry when all required fields are present", async () => {
    prismaMock.dataEntry.create.mockResolvedValue(entry);

    const response = await POST(
      new Request("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({
          name: entry.name,
          companyInfo: entry.companyInfo,
          url: entry.url,
          industry: entry.industry,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(entry);
    expect(prismaMock.dataEntry.create).toHaveBeenCalledWith({
      data: {
        name: entry.name,
        companyInfo: entry.companyInfo,
        url: entry.url,
        industry: entry.industry,
      },
    });
  });

  it("rejects creation when required fields are missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({ name: "Jane Doe" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing required fields" });
    expect(prismaMock.dataEntry.create).not.toHaveBeenCalled();
  });
});
