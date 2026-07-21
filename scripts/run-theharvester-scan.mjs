#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const SUPPORTED_SOURCES = new Set([
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
]);

const DEFAULT_SOURCES = ["crtsh", "certspotter", "hackertarget", "rapiddns", "urlscan"];
const DEFAULT_IMAGE = "ghcr.io/laramies/theharvester:latest";
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 10_000;
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function normalizeTheHarvesterResults(rawResult, sources = []) {
  const findings = [];
  const seen = new Set();

  function addFinding(type, value, source, metadata = {}) {
    const normalizedValue = normalizeValue(value);

    if (!normalizedValue) {
      return;
    }

    const { value: safeValue, metadata: valueMetadata } = trimValue(normalizedValue);
    const key = `${type}:${safeValue.toLowerCase()}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    findings.push({
      type,
      value: safeValue,
      source: source || null,
      metadata: safeMetadata({
        ...metadata,
        ...valueMetadata,
      }),
    });
  }

  for (const item of asArray(rawResult?.emails)) {
    addFinding("email", item, "emails");
  }

  for (const item of asArray(rawResult?.ips)) {
    addFinding("ip", item, "ips");
  }

  for (const item of asArray(rawResult?.hosts)) {
    addHostFinding(item, "host", "hosts", addFinding);
  }

  for (const item of asArray(rawResult?.vhosts)) {
    addHostFinding(item, "vhost", "vhosts", addFinding);
  }

  for (const item of asArray(rawResult?.interesting_urls)) {
    addFinding("url", item, "interesting_urls");
  }

  for (const item of asArray(rawResult?.trello_urls)) {
    addFinding("url", item, "trello_urls");
  }

  for (const item of asArray(rawResult?.linkedin_links)) {
    addFinding("url", item, "linkedin_links");
  }

  for (const item of asArray(rawResult?.asns)) {
    addObjectFinding("asn", item, "asns", addFinding, ["asn", "number", "name"]);
  }

  for (const item of asArray(rawResult?.people)) {
    addObjectFinding("person", item, "people", addFinding, [
      "name",
      "full_name",
      "fullName",
      "email",
      "linkedin",
    ]);
  }

  for (const item of asArray(rawResult?.twitter_people)) {
    addObjectFinding("person", item, "twitter_people", addFinding, [
      "name",
      "handle",
      "username",
      "url",
    ]);
  }

  for (const item of asArray(rawResult?.linkedin_people)) {
    addObjectFinding("person", item, "linkedin_people", addFinding, [
      "name",
      "full_name",
      "fullName",
      "linkedin",
      "url",
    ]);
  }

  for (const item of asArray(rawResult?.takeover_results)) {
    addObjectFinding("takeover", item, "takeover_results", addFinding, [
      "host",
      "hostname",
      "domain",
      "service",
      "url",
    ]);
  }

  addShodanFindings(rawResult?.shodan, addFinding);

  const counts = {
    hostCount: findings.filter((finding) => finding.type === "host" || finding.type === "vhost").length,
    emailCount: findings.filter((finding) => finding.type === "email").length,
    ipCount: findings.filter((finding) => finding.type === "ip").length,
    urlCount: findings.filter((finding) => finding.type === "url").length,
    personCount: findings.filter((finding) => finding.type === "person").length,
  };

  return {
    findings,
    counts,
    metadata: {
      sourcesUsed: sources,
      command: typeof rawResult?.cmd === "string" ? rawResult.cmd : null,
    },
  };
}

export function startScanHeartbeat(
  prisma,
  scanId,
  intervalMs = HEARTBEAT_INTERVAL_MS,
) {
  let stopped = false;
  let heartbeatInFlight = false;

  const timer = setInterval(async () => {
    if (stopped || heartbeatInFlight) {
      return;
    }

    heartbeatInFlight = true;

    try {
      await prisma.companyOsintScan.update({
        where: { id: scanId },
        data: { heartbeatAt: new Date() },
      });
    } catch (error) {
      console.error(`Failed to update heartbeat for OSINT scan ${scanId}:`, error);
    } finally {
      heartbeatInFlight = false;
    }
  }, intervalMs);

  timer.unref?.();

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  let scanId = parseScanId(args.scanId);
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const scan = args.scanId
      ? await loadExistingScan(prisma, scanId)
      : await createScanFromArgs(prisma, args);
    scanId = scan.id;

    await runScan(prisma, scan);
    console.log(`Completed OSINT scan ${scan.id} for ${scan.domain}`);
  } catch (error) {
    if (scanId !== null) {
      try {
        await markQueuedScanFailed(prisma, scanId, error);
      } catch (updateError) {
        console.error(`Failed to record startup error for OSINT scan ${scanId}:`, updateError);
      }
    }

    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

function parseScanId(value) {
  if (value === undefined) {
    return null;
  }

  const scanId = Number(value);

  if (!Number.isInteger(scanId) || scanId < 1) {
    throw new Error("--scan-id must be a positive integer");
  }

  return scanId;
}

export function markQueuedScanFailed(prisma, scanId, error, completedAt = new Date()) {
  return prisma.companyOsintScan.updateMany({
    where: {
      id: scanId,
      status: "queued",
    },
    data: {
      status: "failed",
      progressStage: "failed",
      heartbeatAt: completedAt,
      completedAt,
      errorMessage: error instanceof Error ? error.message.slice(0, 4000) : String(error),
    },
  });
}

async function loadExistingScan(prisma, scanId) {
  const scan = await prisma.companyOsintScan.findUnique({
    where: { id: scanId },
  });

  if (!scan) {
    throw new Error(`OSINT scan ${scanId} was not found`);
  }

  return scan;
}

async function createScanFromArgs(prisma, args) {
  const companyName = cleanString(args.company || args.companyName);
  const domain = normalizeDomain(cleanString(args.domain));
  const sources = parseSources(args.sources);
  const limit = parseLimit(args.limit);

  if (!companyName || !domain) {
    throw new Error("--company and --domain are required when --scan-id is not provided");
  }

  if (!isValidDomain(domain)) {
    throw new Error("--domain must be a valid domain name");
  }

  return prisma.companyOsintScan.create({
    data: {
      companyName,
      domain,
      sources,
      limit,
      status: "queued",
      progressStage: "queued",
    },
  });
}

async function runScan(prisma, scan) {
  const outputDirectory = getOutputDirectory(scan);
  const outputJsonPath = join(outputDirectory, "theharvester.json");
  const outputXmlPath = join(outputDirectory, "theharvester.xml");

  await fs.mkdir(outputDirectory, { recursive: true });

  const startedAt = new Date();

  await prisma.companyOsintScan.update({
    where: { id: scan.id },
    data: {
      status: "running",
      progressStage: "harvesting",
      heartbeatAt: startedAt,
      startedAt,
      completedAt: null,
      outputDirectory,
      outputJsonPath,
      outputXmlPath,
      errorMessage: null,
    },
  });

  const stopHeartbeat = startScanHeartbeat(prisma, scan.id);

  try {
    const dockerResult = await runTheHarvesterContainer(scan, outputDirectory);

    if (dockerResult.exitCode !== 0) {
      throw new Error(
        `theHarvester exited with code ${dockerResult.exitCode}: ${dockerResult.output}`,
      );
    }

    if (!existsSync(outputJsonPath)) {
      throw new Error(`theHarvester did not write ${outputJsonPath}`);
    }

    await prisma.companyOsintScan.update({
      where: { id: scan.id },
      data: {
        progressStage: "ingesting",
        heartbeatAt: new Date(),
      },
    });

    const rawResult = JSON.parse(await fs.readFile(outputJsonPath, "utf8"));
    const normalized = normalizeTheHarvesterResults(rawResult, scan.sources);
    const completedAt = new Date();

    await prisma.$transaction([
      prisma.companyOsintFinding.deleteMany({
        where: { scanId: scan.id },
      }),
      ...chunk(normalized.findings, 500).map((findings) =>
        prisma.companyOsintFinding.createMany({
          data: findings.map((finding) => ({
            scanId: scan.id,
            type: finding.type,
            value: finding.value,
            source: finding.source,
            metadata: finding.metadata,
          })),
          skipDuplicates: true,
        }),
      ),
      prisma.companyOsintScan.update({
        where: { id: scan.id },
        data: {
          status: "completed",
          progressStage: "completed",
          heartbeatAt: completedAt,
          completedAt,
          hostCount: normalized.counts.hostCount,
          emailCount: normalized.counts.emailCount,
          ipCount: normalized.counts.ipCount,
          urlCount: normalized.counts.urlCount,
          personCount: normalized.counts.personCount,
          rawResult: {
            ...rawResult,
            ingestion: normalized.metadata,
          },
        },
      }),
    ]);
  } catch (error) {
    const completedAt = new Date();

    await prisma.companyOsintScan.update({
      where: { id: scan.id },
      data: {
        status: "failed",
        progressStage: "failed",
        heartbeatAt: completedAt,
        completedAt,
        errorMessage: error instanceof Error ? error.message.slice(0, 4000) : String(error),
      },
    });

    throw error;
  } finally {
    stopHeartbeat();
  }
}

async function runTheHarvesterContainer(scan, outputDirectory) {
  const image = process.env.THEHARVESTER_IMAGE || DEFAULT_IMAGE;
  const timeoutMs = parseTimeout(process.env.THEHARVESTER_SCAN_TIMEOUT_MS);
  const containerName = `job-search-theharvester-${scan.id}`;
  const dockerArgs = [
    "run",
    "--rm",
    "--name",
    containerName,
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "-v",
    `${outputDirectory}:/results`,
    "--entrypoint",
    "theHarvester",
  ];

  const apiKeysPath = join(repoRoot, ".osint", "theharvester", "config", "api-keys.yaml");
  const proxiesPath = join(repoRoot, ".osint", "theharvester", "config", "proxies.yaml");

  if (existsSync(apiKeysPath)) {
    dockerArgs.push("-v", `${apiKeysPath}:/etc/theHarvester/api-keys.yaml:ro`);
    dockerArgs.push("-v", `${apiKeysPath}:/home/theharvester/.theHarvester/api-keys.yaml:ro`);
  }

  if (existsSync(proxiesPath)) {
    dockerArgs.push("-v", `${proxiesPath}:/etc/theHarvester/proxies.yaml:ro`);
    dockerArgs.push("-v", `${proxiesPath}:/home/theharvester/.theHarvester/proxies.yaml:ro`);
  }

  dockerArgs.push(
    image,
    "-d",
    scan.domain,
    "-b",
    scan.sources.join(","),
    "-l",
    String(scan.limit),
    "-f",
    "/results/theharvester",
    "-q",
  );

  return runProcess("docker", dockerArgs, {
    timeoutMs,
    onTimeout: () => stopContainer(containerName),
  });
}

function runProcess(command, args, { timeoutMs, onTimeout } = {}) {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let timedOut = false;

    const timeout = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill("SIGTERM");
          onTimeout?.();
        }, timeoutMs)
      : null;

    const append = (chunkValue) => {
      output = `${output}${chunkValue.toString()}`.slice(-200_000);
    };

    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      if (timedOut) {
        reject(new Error(`theHarvester Docker scan timed out after ${timeoutMs}ms`));
        return;
      }

      resolveProcess({
        exitCode: exitCode ?? 1,
        output: output.trim(),
      });
    });
  });
}

function stopContainer(containerName) {
  const child = spawn("docker", ["rm", "-f", containerName], {
    cwd: repoRoot,
    env: process.env,
    stdio: "ignore",
  });
  child.unref();
}

function addHostFinding(item, type, source, addFinding) {
  if (typeof item === "string") {
    const parsed = splitHostAndIp(item);
    addFinding(type, parsed.host, source, parsed.ip ? { raw: item, ip: parsed.ip } : { raw: item });

    if (parsed.ip) {
      addFinding("ip", parsed.ip, source, { raw: item, from: type });
    }

    return;
  }

  if (isRecord(item)) {
    const value = pickObjectValue(item, ["host", "hostname", "domain", "name", "ip"]);
    addFinding(type, value, source, { raw: item });
  }
}

function addObjectFinding(type, item, source, addFinding, keys) {
  if (typeof item === "string") {
    addFinding(type, item, source, { raw: item });
    return;
  }

  if (!isRecord(item)) {
    return;
  }

  addFinding(type, pickObjectValue(item, keys), source, { raw: item });
}

function addShodanFindings(shodanResult, addFinding) {
  if (!shodanResult) {
    return;
  }

  if (Array.isArray(shodanResult)) {
    for (const item of shodanResult) {
      addObjectFinding("shodan", item, "shodan", addFinding, ["ip", "ip_str", "hostnames", "org"]);
    }
    return;
  }

  if (!isRecord(shodanResult)) {
    return;
  }

  for (const [key, value] of Object.entries(shodanResult)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        addObjectFinding("shodan", item, "shodan", addFinding, ["ip", "ip_str", "hostnames", "org"]);
      }
      continue;
    }

    if (isRecord(value)) {
      addFinding("shodan", pickObjectValue(value, ["ip", "ip_str", "hostnames", "org"]) || key, "shodan", {
        raw: value,
      });
      continue;
    }

    addFinding("shodan", key, "shodan", { raw: value });
  }
}

function splitHostAndIp(value) {
  const trimmed = value.trim();
  const separatorIndex = trimmed.lastIndexOf(":");

  if (separatorIndex === -1) {
    return { host: trimmed };
  }

  const host = trimmed.slice(0, separatorIndex).trim();
  const ip = trimmed.slice(separatorIndex + 1).trim();

  if (!host || !isLikelyIp(ip)) {
    return { host: trimmed };
  }

  return { host, ip };
}

function isLikelyIp(value) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[a-f0-9:]{3,}$/i.test(value);
}

function pickObjectValue(item, keys) {
  for (const key of keys) {
    const value = item[key];

    if (Array.isArray(value)) {
      const first = value.map(normalizeValue).find(Boolean);

      if (first) {
        return first;
      }
    }

    const normalized = normalizeValue(value);

    if (normalized) {
      return normalized;
    }
  }

  return JSON.stringify(item);
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue).find(Boolean) || "";
  }

  if (isRecord(value)) {
    return JSON.stringify(value);
  }

  return "";
}

function trimValue(value) {
  if (value.length <= 1000) {
    return { value, metadata: {} };
  }

  return {
    value: value.slice(0, 1000),
    metadata: {
      fullValue: value,
      truncatedValue: true,
    },
  };
}

function safeMetadata(metadata) {
  const serialized = JSON.stringify(metadata);

  if (serialized.length <= 20_000) {
    return metadata;
  }

  return {
    truncated: true,
    summary: serialized.slice(0, 20_000),
  };
}

function getOutputDirectory(scan) {
  return join(
    repoRoot,
    ".osint",
    "theharvester",
    `scan-${scan.id}-${slugify(scan.domain)}`,
  );
}

export function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token
      .slice(2)
      .replace(/-([a-z])/g, (_, character) => character.toUpperCase());
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      throw new Error(`${token} requires a value`);
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function parseSources(value) {
  const sources = value ? String(value).split(",") : DEFAULT_SOURCES;
  return Array.from(
    new Set(
      sources
        .map((source) => source.trim())
        .filter((source) => SUPPORTED_SOURCES.has(source)),
    ),
  );
}

function parseLimit(value) {
  const parsed = value === undefined ? 100 : Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    throw new Error("--limit must be a number between 1 and 1000");
  }

  return parsed;
}

function parseTimeout(value) {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim().slice(0, 255) : "";
}

function normalizeDomain(value) {
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

function isValidDomain(value) {
  return /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i.test(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function chunk(values, size) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-|-$/g, "");
}

function printUsage() {
  console.log(`Usage:
  node scripts/run-theharvester-scan.mjs --scan-id 1
  node scripts/run-theharvester-scan.mjs --company "Acme Corp" --domain acme.com --sources crtsh,hackertarget --limit 100

Environment:
  DATABASE_URL                    PostgreSQL connection string
  THEHARVESTER_IMAGE              Docker image, default ${DEFAULT_IMAGE}
  THEHARVESTER_SCAN_TIMEOUT_MS    Scan timeout, default ${DEFAULT_TIMEOUT_MS}
`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
