// @vitest-environment node
import { EventEmitter } from "node:events";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { closeSyncMock, mkdirSyncMock, openSyncMock, spawnMock } = vi.hoisted(() => ({
  closeSyncMock: vi.fn(),
  mkdirSyncMock: vi.fn(),
  openSyncMock: vi.fn(() => 42),
  spawnMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: spawnMock,
}));

vi.mock("node:fs", () => ({
  closeSync: closeSyncMock,
  mkdirSync: mkdirSyncMock,
  openSync: openSyncMock,
}));

import { startTheHarvesterWorker } from "./theharvester";

function createChildProcess() {
  const child = new EventEmitter() as EventEmitter & { unref: ReturnType<typeof vi.fn> };
  child.unref = vi.fn();
  return child;
}

describe("startTheHarvesterWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openSyncMock.mockReturnValue(42);
  });

  it("creates a scan log and resolves after the worker spawns", async () => {
    const child = createChildProcess();
    spawnMock.mockReturnValue(child);

    const started = startTheHarvesterWorker(7);
    child.emit("spawn");
    await started;

    const logDirectory = join(process.cwd(), ".osint", "theharvester", "logs");
    expect(mkdirSyncMock).toHaveBeenCalledWith(logDirectory, { recursive: true });
    expect(openSyncMock).toHaveBeenCalledWith(join(logDirectory, "scan-7.log"), "a");
    expect(spawnMock).toHaveBeenCalledWith(
      process.execPath,
      [join(process.cwd(), "scripts", "run-theharvester-scan.mjs"), "--scan-id", "7"],
      expect.objectContaining({
        cwd: process.cwd(),
        detached: true,
        stdio: ["ignore", 42, 42],
      }),
    );
    expect(closeSyncMock).toHaveBeenCalledWith(42);
    expect(child.unref).toHaveBeenCalled();
  });

  it("rejects an immediate worker spawn error", async () => {
    const child = createChildProcess();
    const spawnError = new Error("spawn failed");
    spawnMock.mockReturnValue(child);

    const started = startTheHarvesterWorker(8);
    child.emit("error", spawnError);

    await expect(started).rejects.toBe(spawnError);
    expect(closeSyncMock).toHaveBeenCalledWith(42);
    expect(child.unref).not.toHaveBeenCalled();
  });

  it("closes the scan log when spawn throws synchronously", async () => {
    const spawnError = new Error("spawn threw");
    spawnMock.mockImplementation(() => {
      throw spawnError;
    });

    await expect(startTheHarvesterWorker(9)).rejects.toBe(spawnError);
    expect(closeSyncMock).toHaveBeenCalledWith(42);
  });
});
