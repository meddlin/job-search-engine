import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TopNavigation from "./TopNavigation";

const navigationMock = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

describe("TopNavigation", () => {
  beforeEach(() => {
    navigationMock.pathname = "/";
  });

  it("links to every top-level application page", () => {
    render(<TopNavigation />);

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(
      screen.getByRole("link", { name: /Job Search/i }),
    ).toHaveAttribute("href", "/");
    expect(
      within(navigation).getByRole("link", { name: /Dashboard/i }),
    ).toHaveAttribute("href", "/");
    expect(
      within(navigation).getByRole("link", { name: /Jobs/i }),
    ).toHaveAttribute("href", "/kanban");
    expect(
      within(navigation).getByRole("link", { name: /People/i }),
    ).toHaveAttribute("href", "/people");
    expect(
      within(navigation).getByRole("link", { name: /Data/i }),
    ).toHaveAttribute("href", "/data");
  });

  it("marks the current top-level page as active", () => {
    navigationMock.pathname = "/people";

    render(<TopNavigation />);

    expect(screen.getByRole("link", { name: /People/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
