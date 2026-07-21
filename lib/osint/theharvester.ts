import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";

export const SUPPORTED_THEHARVESTER_SOURCES = [
  "baidu",
  "bevigil",
  "bitbucket",
  "brave",
  "bufferoverun",
  "builtwith",
  "censys",
  "certspotter",
  "chaos",
  "commoncrawl",
  "criminalip",
  "crtsh",
  "dehashed",
  "dnsdumpster",
  "duckduckgo",
  "dymo",
  "fofa",
  "fullhunt",
  "github-code",
  "gitlab",
  "hackertarget",
  "haveibeenpwned",
  "hudsonrock",
  "hunter",
  "hunterhow",
  "intelx",
  "leakix",
  "leaklookup",
  "mojeek",
  "netlas",
  "onyphe",
  "otx",
  "pentesttools",
  "projectdiscovery",
  "rapiddns",
  "robtex",
  "rocketreach",
  "securityscorecard",
  "securityTrails",
  "sherlockeye",
  "shodan",
  "shodanInternetDB",
  "subdomaincenter",
  "subdomainfinderc99",
  "thc",
  "threatcrowd",
  "tomba",
  "urlscan",
  "venacus",
  "virustotal",
  "waybackarchive",
  "whoisxml",
  "windvane",
  "yahoo",
  "zoomeye",
] as const;

export const DEFAULT_THEHARVESTER_SOURCES = [
  "crtsh",
  "certspotter",
  "hackertarget",
  "rapiddns",
  "urlscan",
] as const;

const supportedSourceSet = new Set<string>(SUPPORTED_THEHARVESTER_SOURCES);

export type OsintScanInput = {
  companyName: string;
  domain: string;
  sources: string[];
  limit: number;
};

export type ParsedOsintScanInput =
  | { ok: true; value: OsintScanInput }
  | { ok: false; error: string };

export function parseOsintScanInput(body: unknown): ParsedOsintScanInput {
  if (!isRecord(body)) {
    return { ok: false, error: "Request body must be an object" };
  }

  const companyName = cleanString(body.companyName);
  const domain = normalizeDomain(cleanString(body.domain));
  const sources = parseSources(body.sources);
  const limit = parseLimit(body.limit);

  if (!companyName) {
    return { ok: false, error: "Company name is required" };
  }

  if (!domain) {
    return { ok: false, error: "Company domain is required" };
  }

  if (!isValidDomain(domain)) {
    return { ok: false, error: "Company domain must be a valid domain name" };
  }

  if (sources.length === 0) {
    return {
      ok: false,
      error: "At least one supported theHarvester source is required",
    };
  }

  if (limit === null) {
    return { ok: false, error: "Limit must be a number between 1 and 1000" };
  }

  return {
    ok: true,
    value: {
      companyName,
      domain,
      sources,
      limit,
    },
  };
}

export async function startTheHarvesterWorker(scanId: number): Promise<void> {
  const workerPath = join(process.cwd(), "scripts", "run-theharvester-scan.mjs");
  const logDirectory = join(process.cwd(), ".osint", "theharvester", "logs");
  const logPath = join(logDirectory, `scan-${scanId}.log`);
  mkdirSync(logDirectory, { recursive: true });
  const logFile = openSync(logPath, "a");
  let child: ReturnType<typeof spawn>;

  try {
    child = spawn(process.execPath, [workerPath, "--scan-id", String(scanId)], {
      cwd: process.cwd(),
      detached: true,
      env: process.env,
      stdio: ["ignore", logFile, logFile],
    });
  } catch (error) {
    closeSync(logFile);
    throw error;
  }

  closeSync(logFile);

  return new Promise((resolve, reject) => {
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
    child.once("error", reject);
  });
}

function parseSources(value: unknown) {
  const rawSources = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : DEFAULT_THEHARVESTER_SOURCES;

  return Array.from(
    new Set(
      rawSources
        .map((source) => cleanString(source))
        .filter((source): source is string => Boolean(source))
        .filter((source) => supportedSourceSet.has(source)),
    ),
  );
}

function parseLimit(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 100;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    return null;
  }

  return parsed;
}

function cleanString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 255);
}

function normalizeDomain(value: string) {
  if (!value) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
    ? value
    : `https://${value}`;

  try {
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return value.toLowerCase().replace(/^www\./, "");
  }
}

function isValidDomain(value: string) {
  return /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
