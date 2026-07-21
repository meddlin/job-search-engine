import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OsintScanPanel from "./OsintScanPanel";

const osintResponse = {
  defaultSources: ["crtsh", "certspotter"],
  supportedSources: ["crtsh", "certspotter", "hackertarget"],
  scans: [
    {
      id: 1,
      companyName: "Acme",
      domain: "acme.com",
      sources: ["crtsh"],
      limit: 100,
      status: "completed",
      progressStage: "completed",
      heartbeatAt: "2026-07-19T00:01:00.000Z",
      hostCount: 2,
      emailCount: 1,
      ipCount: 1,
      urlCount: 3,
      personCount: 0,
      errorMessage: null,
      createdAt: "2026-07-19T00:00:00.000Z",
      startedAt: "2026-07-19T00:00:00.000Z",
      completedAt: "2026-07-19T00:01:00.000Z",
    },
  ],
  findings: [
    {
      id: 1,
      type: "host",
      value: "app.acme.com",
      source: "hosts",
      createdAt: "2026-07-19T00:01:00.000Z",
      scan: {
        id: 1,
        companyName: "Acme",
        domain: "acme.com",
        status: "completed",
        createdAt: "2026-07-19T00:00:00.000Z",
      },
    },
  ],
};

describe("OsintScanPanel", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders existing OSINT scans and findings", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => osintResponse,
    } as Response);

    render(<OsintScanPanel />);

    expect(await screen.findAllByText("Acme")).toHaveLength(2);
    expect(screen.getAllByText("acme.com")[0]).toBeInTheDocument();
    expect(screen.getByText("app.acme.com")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Finished in 1m")).toBeInTheDocument();
  });

  it("queues a scan from the form", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => osintResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          companyName: "Globex",
          domain: "globex.com",
          sources: ["crtsh", "certspotter"],
          limit: 100,
          status: "queued",
          progressStage: "queued",
          heartbeatAt: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...osintResponse,
          scans: [
            {
              ...osintResponse.scans[0],
              id: 2,
              companyName: "Globex",
              domain: "globex.com",
              status: "queued",
              progressStage: "queued",
              heartbeatAt: null,
              startedAt: null,
              completedAt: null,
            },
            ...osintResponse.scans,
          ],
        }),
      } as Response);

    render(<OsintScanPanel />);

    await screen.findAllByText("Acme");
    await user.type(screen.getByLabelText("Company name"), "Globex");
    await user.type(screen.getByLabelText("Company domain"), "globex.com");
    await user.click(screen.getByRole("button", { name: /Start scan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/osint/scans",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            companyName: "Globex",
            domain: "globex.com",
            sources: ["crtsh", "certspotter"],
            limit: 100,
          }),
        }),
      );
    });
    expect(await screen.findByText("Queued OSINT scan for Globex")).toBeInTheDocument();
  });

  it("shows live phases and warns when a worker heartbeat is stale", async () => {
    const now = Date.now();
    const activeScan = {
      ...osintResponse.scans[0],
      id: 2,
      companyName: "Globex",
      domain: "globex.com",
      status: "running",
      progressStage: "harvesting",
      heartbeatAt: new Date(now).toISOString(),
      startedAt: new Date(now - 65_000).toISOString(),
      completedAt: null,
    };
    const staleScan = {
      ...activeScan,
      id: 3,
      companyName: "Initech",
      domain: "initech.com",
      heartbeatAt: new Date(now - 45_000).toISOString(),
    };
    const ingestingScan = {
      ...activeScan,
      id: 4,
      companyName: "Umbrella",
      domain: "umbrella.example",
      progressStage: "ingesting",
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...osintResponse,
        scans: [activeScan, staleScan, ingestingScan],
        findings: [],
      }),
    } as Response);

    render(<OsintScanPanel />);

    const activeProgress = await screen.findByRole("progressbar", {
      name: "Globex: harvesting sources",
    });
    const staleProgress = screen.getByRole("progressbar", {
      name: "Initech: harvesting sources",
    });
    const ingestingProgress = screen.getByRole("progressbar", {
      name: "Umbrella: saving findings",
    });

    expect(activeProgress).not.toHaveAttribute("aria-valuenow");
    expect(staleProgress).toHaveAttribute("aria-valuenow", "20");
    expect(ingestingProgress).toHaveAttribute("aria-valuenow", "90");
    expect(screen.getByText("Worker heartbeat delayed")).toBeInTheDocument();
    expect(screen.getByText("Saving findings")).toBeInTheDocument();
  });

  it("distinguishes a fresh queued scan from a worker that did not start", async () => {
    const now = Date.now();
    const freshScan = {
      ...osintResponse.scans[0],
      id: 5,
      companyName: "Fresh Co",
      domain: "fresh.example",
      status: "queued",
      progressStage: "queued",
      heartbeatAt: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(now).toISOString(),
    };
    const staleScan = {
      ...freshScan,
      id: 6,
      companyName: "Stale Co",
      domain: "stale.example",
      createdAt: new Date(now - 31_000).toISOString(),
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...osintResponse,
        scans: [freshScan, staleScan],
        findings: [],
      }),
    } as Response);

    render(<OsintScanPanel />);

    expect(await screen.findByText("Waiting to start")).toBeInTheDocument();
    expect(screen.getByText("Worker did not start")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Stale Co: worker did not start" }),
    ).toHaveAttribute("aria-valuenow", "0");
  });
});
