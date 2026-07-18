// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    person: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("/api/people", () => {
  const person = {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "555-0100",
    company: "Acme",
    notes: "Met at event",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns people ordered by creation date", async () => {
    prismaMock.person.findMany.mockResolvedValue([person]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([person]);
    expect(prismaMock.person.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns a 500 response when fetching people fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.person.findMany.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to fetch people" });
  });

  it("creates a person when all required fields are present", async () => {
    prismaMock.person.create.mockResolvedValue(person);

    const response = await POST(
      new Request("http://localhost/api/people", {
        method: "POST",
        body: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phone: person.phone,
          company: person.company,
          notes: person.notes,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(person);
    expect(prismaMock.person.create).toHaveBeenCalledWith({
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone,
        company: person.company,
        notes: person.notes,
      },
    });
  });

  it("rejects creation when required fields are missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/people", {
        method: "POST",
        body: JSON.stringify({ firstName: "Jane" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing required fields" });
    expect(prismaMock.person.create).not.toHaveBeenCalled();
  });
});
