// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    person: {
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

describe("/api/people/[id]", () => {
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

  it("returns a person by ID", async () => {
    prismaMock.person.findUnique.mockResolvedValue(person);

    const response = await GET(new Request("http://localhost/api/people/1"), context("1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(person);
    expect(prismaMock.person.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 400 for invalid IDs", async () => {
    const response = await GET(new Request("http://localhost/api/people/not-a-number"), context("abc"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid ID" });
    expect(prismaMock.person.findUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when the person does not exist", async () => {
    prismaMock.person.findUnique.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/people/999"), context("999"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Person not found" });
  });

  it("updates an existing person", async () => {
    prismaMock.person.findUnique.mockResolvedValue(person);
    prismaMock.person.update.mockResolvedValue({ ...person, company: "Beta" });

    const response = await PUT(
      new Request("http://localhost/api/people/1", {
        method: "PUT",
        body: JSON.stringify({
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phone: person.phone,
          company: "Beta",
          notes: person.notes,
        }),
      }),
      context("1"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ...person, company: "Beta" });
    expect(prismaMock.person.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone,
        company: "Beta",
        notes: person.notes,
      },
    });
  });

  it("rejects updates with missing required fields", async () => {
    const response = await PUT(
      new Request("http://localhost/api/people/1", {
        method: "PUT",
        body: JSON.stringify({ firstName: person.firstName }),
      }),
      context("1"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing required fields" });
    expect(prismaMock.person.update).not.toHaveBeenCalled();
  });

  it("deletes a person", async () => {
    prismaMock.person.delete.mockResolvedValue(person);

    const response = await DELETE(new Request("http://localhost/api/people/1"), context("1"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(prismaMock.person.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("returns 500 when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.person.delete.mockRejectedValue(new Error("missing row"));

    const response = await DELETE(new Request("http://localhost/api/people/1"), context("1"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to delete person" });
  });
});
