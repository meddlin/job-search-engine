// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  markQueuedScanFailed,
  normalizeTheHarvesterResults,
  parseArgs,
  startScanHeartbeat,
} from "./run-theharvester-scan.mjs";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("normalizeTheHarvesterResults", () => {
  it("normalizes exported theHarvester JSON into typed findings", () => {
    const result = normalizeTheHarvesterResults(
      {
        cmd: "-d acme.com -b crtsh -f /results/theharvester",
        emails: ["security@acme.com"],
        hosts: ["app.acme.com:203.0.113.10", "www.acme.com"],
        ips: ["203.0.113.11"],
        vhosts: ["dev.acme.com"],
        interesting_urls: ["https://acme.com/admin"],
        asns: ["AS64500"],
        people: [{ name: "Jane Doe", email: "jane@acme.com" }],
        shodan: {
          "203.0.113.10": {
            ip_str: "203.0.113.10",
            org: "Acme Hosting",
          },
        },
      },
      ["crtsh"],
    );

    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "email", value: "security@acme.com" }),
        expect.objectContaining({ type: "host", value: "app.acme.com" }),
        expect.objectContaining({ type: "host", value: "www.acme.com" }),
        expect.objectContaining({ type: "vhost", value: "dev.acme.com" }),
        expect.objectContaining({ type: "ip", value: "203.0.113.10" }),
        expect.objectContaining({ type: "ip", value: "203.0.113.11" }),
        expect.objectContaining({ type: "url", value: "https://acme.com/admin" }),
        expect.objectContaining({ type: "asn", value: "AS64500" }),
        expect.objectContaining({ type: "person", value: "Jane Doe" }),
        expect.objectContaining({ type: "shodan", value: "203.0.113.10" }),
      ]),
    );
    expect(result.counts).toMatchObject({
      hostCount: 3,
      emailCount: 1,
      ipCount: 2,
      urlCount: 1,
      personCount: 1,
    });
    expect(result.metadata).toEqual({
      sourcesUsed: ["crtsh"],
      command: "-d acme.com -b crtsh -f /results/theharvester",
    });
  });
});

describe("startScanHeartbeat", () => {
  it("updates the scan on schedule and stops cleanly", async () => {
    vi.useFakeTimers();
    const update = vi.fn().mockResolvedValue({});
    const prisma = { companyOsintScan: { update } };
    const stop = startScanHeartbeat(prisma, 7, 1_000);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { heartbeatAt: expect.any(Date) },
    });

    stop();
    await vi.advanceTimersByTimeAsync(2_000);

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("logs heartbeat failures without rejecting the scan", async () => {
    vi.useFakeTimers();
    const heartbeatError = new Error("database unavailable");
    const update = vi.fn().mockRejectedValue(heartbeatError);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const stop = startScanHeartbeat({ companyOsintScan: { update } }, 8, 1_000);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to update heartbeat for OSINT scan 8:",
      heartbeatError,
    );
    stop();
  });
});

describe("parseArgs", () => {
  it("normalizes kebab-case option names", () => {
    expect(
      parseArgs([
        "--scan-id",
        "42",
        "--company-name",
        "Acme Corp",
        "--sources",
        "crtsh,urlscan",
        "--limit",
        "100",
      ]),
    ).toEqual({
      scanId: "42",
      companyName: "Acme Corp",
      sources: "crtsh,urlscan",
      limit: "100",
    });
  });

  it("rejects options without values", () => {
    expect(() => parseArgs(["--scan-id"])).toThrow("--scan-id requires a value");
    expect(() => parseArgs(["--scan-id", "--limit", "100"])).toThrow(
      "--scan-id requires a value",
    );
  });
});

describe("markQueuedScanFailed", () => {
  it("only targets the queued scan and records the startup error", async () => {
    const completedAt = new Date("2026-07-19T16:00:00.000Z");
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const error = new Error("worker startup failed");

    await markQueuedScanFailed(
      { companyOsintScan: { updateMany } },
      12,
      error,
      completedAt,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 12,
        status: "queued",
      },
      data: {
        status: "failed",
        progressStage: "failed",
        heartbeatAt: completedAt,
        completedAt,
        errorMessage: "worker startup failed",
      },
    });
  });
});
