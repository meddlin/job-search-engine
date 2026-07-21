"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OsintScanStatus = "queued" | "running" | "completed" | "failed";
type OsintScanProgressStage =
  | "queued"
  | "harvesting"
  | "ingesting"
  | "completed"
  | "failed";

type OsintFinding = {
  id: number;
  type: string;
  value: string;
  source: string | null;
  createdAt: string;
  scan: {
    id: number;
    companyName: string;
    domain: string;
    status: OsintScanStatus;
    createdAt: string;
  };
};

type OsintScan = {
  id: number;
  companyName: string;
  domain: string;
  sources: string[];
  limit: number;
  status: OsintScanStatus;
  progressStage: OsintScanProgressStage;
  heartbeatAt: string | null;
  hostCount: number;
  emailCount: number;
  ipCount: number;
  urlCount: number;
  personCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type OsintResponse = {
  scans: OsintScan[];
  findings: OsintFinding[];
  defaultSources: string[];
  supportedSources: string[];
};

const visibleSourceOptions = [
  "crtsh",
  "certspotter",
  "hackertarget",
  "rapiddns",
  "urlscan",
  "duckduckgo",
  "subdomaincenter",
  "thc",
];
const scanPollIntervalMs = 5_000;
const staleHeartbeatMs = 30_000;

export default function OsintScanPanel() {
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [limit, setLimit] = useState(100);
  const [data, setData] = useState<OsintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const hasActiveScan = useMemo(
    () => data?.scans.some((scan) => scan.status === "queued" || scan.status === "running") ?? false,
    [data?.scans],
  );

  const loadScans = useCallback(async () => {
    const response = await fetch("/api/osint/scans");

    if (!response.ok) {
      throw new Error("Failed to load OSINT scans");
    }

    const result = (await response.json()) as OsintResponse;
    setData(result);
    setCurrentTime(Date.now());
    setSources((currentSources) =>
      currentSources.length === 0 ? result.defaultSources : currentSources,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        await loadScans();
      } catch (scanError) {
        if (!cancelled) {
          setError(scanError instanceof Error ? scanError.message : "Failed to load OSINT scans");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loadScans]);

  useEffect(() => {
    if (!hasActiveScan) {
      return;
    }

    const interval = window.setInterval(() => {
      loadScans().catch((scanError) => {
        setError(scanError instanceof Error ? scanError.message : "Failed to refresh OSINT scans");
      });
    }, scanPollIntervalMs);

    return () => window.clearInterval(interval);
  }, [hasActiveScan, loadScans]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/osint/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          domain,
          sources,
          limit,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start OSINT scan");
      }

      setMessage(`Queued OSINT scan for ${result.companyName}`);
      setCompanyName("");
      setDomain("");
      await loadScans();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Failed to start OSINT scan");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSource(source: string) {
    setSources((currentSources) =>
      currentSources.includes(source)
        ? currentSources.filter((item) => item !== source)
        : [...currentSources, source],
    );
  }

  return (
    <section aria-labelledby="osint-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit">
          OSINT reconnaissance
        </Badge>
        <div className="flex flex-col gap-1">
          <h2 id="osint-heading" className="text-2xl font-semibold tracking-tight">
            Company scans
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Run manual theHarvester scans against prospective company domains and review
            discovered hosts, emails, URLs, people, and network details.
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="flex items-center gap-2 rounded-md border bg-accent px-3 py-2 text-sm text-accent-foreground">
          <CheckCircle2 aria-hidden="true" />
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Start a scan</CardTitle>
            <CardDescription>Manual scans run locally through Docker.</CardDescription>
            <CardAction>
              <Search className="size-5 text-muted-foreground" aria-hidden="true" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Company name
                <input
                  required
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Acme Corp"
                  className="h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                Company domain
                <input
                  required
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="acme.com"
                  className="h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium">
                Result limit per source
                <input
                  min={1}
                  max={1000}
                  type="number"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="h-9 rounded-md border bg-background px-3 text-sm font-normal outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium">Sources</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibleSourceOptions.map((source) => (
                    <label
                      key={source}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={sources.includes(source)}
                        onChange={() => toggleSource(source)}
                        className="size-4 accent-current"
                      />
                      <span className="font-mono text-xs">{source}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" disabled={submitting || sources.length === 0}>
                {submitting ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Play data-icon="inline-start" />
                )}
                Start scan
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan history</CardTitle>
            <CardDescription>Latest manual company reconnaissance runs.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                Loading scans...
              </div>
            ) : data?.scans.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead className="text-right">Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="min-w-52">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{scan.companyName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {scan.domain}
                          </span>
                          {scan.errorMessage ? (
                            <span className="max-w-72 truncate text-xs text-destructive">
                              {scan.errorMessage}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={scan.status} />
                      </TableCell>
                      <TableCell className="min-w-48">
                        <ScanProgress scan={scan} currentTime={currentTime} />
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          H {scan.hostCount} / E {scan.emailCount} / IP {scan.ipCount} / U{" "}
                          {scan.urlCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(scan.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                No OSINT scans yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent findings</CardTitle>
          <CardDescription>Normalized theHarvester data from completed scans.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
              Loading findings...
            </div>
          ) : data?.findings.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Finding</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Observed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.findings.map((finding) => (
                  <TableRow key={finding.id}>
                    <TableCell>
                      <Badge variant="outline">{finding.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[28rem] truncate font-mono text-xs">
                      {finding.value}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{finding.scan.companyName}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {finding.scan.domain}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {finding.source || "theHarvester"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(finding.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
              Findings appear here after a scan completes.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatusBadge({ status }: { status: OsintScanStatus }) {
  const statusConfig = {
    queued: { label: "Queued", icon: Clock, variant: "secondary" as const },
    running: { label: "Running", icon: Loader2, variant: "default" as const },
    completed: { label: "Completed", icon: CheckCircle2, variant: "outline" as const },
    failed: { label: "Failed", icon: AlertCircle, variant: "destructive" as const },
  }[status];
  const Icon = statusConfig.icon;

  return (
    <Badge variant={statusConfig.variant}>
      <Icon
        aria-hidden="true"
        className={status === "running" ? "animate-spin" : undefined}
      />
      {statusConfig.label}
    </Badge>
  );
}

function ScanProgress({
  scan,
  currentTime,
}: {
  scan: OsintScan;
  currentTime: number;
}) {
  const startedAt = scan.startedAt || scan.createdAt;

  if (scan.status === "queued") {
    const queuedAge = getAgeInMilliseconds(scan.createdAt, currentTime);
    const workerDidNotStart = queuedAge !== null && queuedAge > staleHeartbeatMs;

    return (
      <div
        className="flex flex-col gap-1.5"
        role={workerDidNotStart ? "status" : undefined}
        aria-live={workerDidNotStart ? "polite" : undefined}
      >
        <Progress
          value={0}
          aria-label={
            workerDidNotStart
              ? `${scan.companyName}: worker did not start`
              : `${scan.companyName}: waiting to start`
          }
        />
        <span
          className={cn(
            "text-xs text-muted-foreground",
            workerDidNotStart && "text-destructive",
          )}
        >
          {workerDidNotStart ? "Worker did not start" : "Waiting to start"}
        </span>
      </div>
    );
  }

  if (scan.status === "completed") {
    return (
      <div className="flex flex-col gap-1.5">
        <Progress value={100} aria-label={`${scan.companyName}: scan completed`} />
        <span className="text-xs text-muted-foreground">
          Finished in {formatDuration(startedAt, scan.completedAt)}
        </span>
      </div>
    );
  }

  if (scan.status === "failed") {
    return (
      <div className="flex flex-col gap-1.5">
        <Progress value={0} aria-label={`${scan.companyName}: scan failed`} />
        <span className="text-xs text-destructive">
          Stopped after {formatDuration(startedAt, scan.completedAt)}
        </span>
      </div>
    );
  }

  const heartbeatAge = getAgeInMilliseconds(scan.heartbeatAt, currentTime);
  const startedAge = getAgeInMilliseconds(startedAt, currentTime);
  const heartbeatIsStale =
    heartbeatAge === null
      ? startedAge !== null && startedAge > staleHeartbeatMs
      : heartbeatAge > staleHeartbeatMs;
  const isIngesting = scan.progressStage === "ingesting";
  const phaseLabel = isIngesting ? "Saving findings" : "Harvesting sources";
  const progressValue = heartbeatIsStale ? (isIngesting ? 90 : 20) : isIngesting ? 90 : null;
  const duration = formatDuration(startedAt, currentTime);
  const activityLabel = heartbeatIsStale
    ? "Worker heartbeat delayed"
    : formatHeartbeatActivity(heartbeatAge);

  return (
    <div
      className="flex flex-col gap-1.5"
      role={heartbeatIsStale ? "status" : undefined}
      aria-live={heartbeatIsStale ? "polite" : undefined}
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">{phaseLabel}</span>
        <span className="font-mono text-muted-foreground">{duration}</span>
      </div>
      <Progress
        value={progressValue}
        aria-label={`${scan.companyName}: ${phaseLabel.toLowerCase()}`}
        aria-valuetext={activityLabel}
      />
      <span
        className={cn(
          "text-xs text-muted-foreground",
          heartbeatIsStale && "text-destructive",
        )}
      >
        {activityLabel}
      </span>
    </div>
  );
}

function getAgeInMilliseconds(value: string | null, currentTime: number) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return Math.max(0, currentTime - timestamp);
}

function formatHeartbeatActivity(heartbeatAge: number | null) {
  if (heartbeatAge === null || heartbeatAge < 5_000) {
    return "Active now";
  }

  return `Active ${Math.floor(heartbeatAge / 1_000)}s ago`;
}

function formatDuration(startValue: string, endValue: string | number | null) {
  const start = new Date(startValue).getTime();
  const end =
    typeof endValue === "number"
      ? endValue
      : endValue
        ? new Date(endValue).getTime()
        : Number.NaN;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "unknown";
  }

  const totalSeconds = Math.max(0, Math.floor((end - start) / 1_000));

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (totalMinutes < 60) {
    return seconds ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
