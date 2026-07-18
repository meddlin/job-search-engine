import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PeopleTable from "./PeopleTable";

describe("PeopleTable", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a loading state before data is loaded", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<PeopleTable />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders people returned by the API", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          first_name: "Jane",
          last_name: "Doe",
          email: "jane@example.com",
          phone: "555-0100",
          company: "Acme",
          notes: "Met at event",
        },
      ],
    } as Response);

    render(<PeopleTable />);

    expect(await screen.findByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "jane@example.com" })).toHaveAttribute(
      "href",
      "mailto:jane@example.com",
    );
    expect(fetch).toHaveBeenCalledWith("/api/people");
  });
});
