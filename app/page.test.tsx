import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DashboardSummary } from "./dashboard-data";
import { HomeDashboard } from "./page";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/app/components/DashboardPipelineChart", () => ({
  default: () => <div>Pipeline chart</div>,
}));

const summary: DashboardSummary = {
  metrics: {
    totalApplications: 4,
    activePipeline: 3,
    interviewing: 1,
    applied: 2,
    recruiters: 2,
    targetCompanies: 5,
  },
  pipeline: [
    { id: "initiation", label: "Initiation", count: 1, percentage: 25 },
    { id: "phone_screen", label: "Phone screen", count: 1, percentage: 25 },
    { id: "apply", label: "Apply", count: 1, percentage: 25 },
    { id: "interviewing", label: "Interviewing", count: 1, percentage: 25 },
    { id: "offer_accept", label: "Offer/accept", count: 0, percentage: 0 },
    { id: "rejected", label: "Rejected", count: 0, percentage: 0 },
  ],
  priorityApplications: [
    {
      id: 1,
      companyName: "Acme",
      positionTitle: "Frontend Engineer",
      status: "interviewing",
      remote: "hybrid",
      applied: true,
      notes: null,
      jobUrl: null,
      recruiterName: "Sam Recruiter",
      recruitingAgency: "Talent Co",
      recruiterEmail: "sam@example.com",
      recruiterPhone: null,
      recruiterLinkedin: null,
      dateAdded: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    },
  ],
  recruiters: [
    {
      id: "sam",
      name: "Sam Recruiter",
      company: "Talent Co",
      email: "sam@example.com",
      phone: null,
      linkedinUrl: null,
      source: "application",
    },
    {
      id: "priya",
      name: "Priya Sourcer",
      company: "Search Partners",
      email: "priya@example.com",
      phone: null,
      linkedinUrl: null,
      source: "contact",
    },
  ],
};

describe("HomeDashboard", () => {
  it("renders dashboard metrics, actions, recruiters, applications, and resume status", () => {
    render(<HomeDashboard summary={summary} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Active pipeline")).toBeInTheDocument();
    expect(screen.getByText("Target companies")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Sam Recruiter")).toBeInTheDocument();
    expect(screen.getByText("Priya Sourcer")).toBeInTheDocument();
    expect(screen.getByText("Last tailored resume")).toBeInTheDocument();
    expect(screen.getByText("Needs refresh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Manage jobs/i })).toHaveAttribute(
      "href",
      "/kanban",
    );
    expect(screen.getByRole("link", { name: "Recruiters" })).toHaveAttribute(
      "href",
      "/people",
    );
    expect(screen.getByRole("link", { name: "Research" })).toHaveAttribute(
      "href",
      "/data",
    );
  });
});
