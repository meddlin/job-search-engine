import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DataTable from "./DataTable";

describe("DataTable", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a loading state before data is loaded", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<DataTable />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders data entries returned by the API", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "Jane Doe",
          company_info: "Acme",
          url: "https://example.com",
          industry: "Technology",
        },
      ],
    } as Response);

    render(<DataTable />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
    expect(fetch).toHaveBeenCalledWith("/api/data");
  });

  it("renders an error state when the API request fails", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText("Error: Failed to fetch data")).toBeInTheDocument();
    });
  });
});
