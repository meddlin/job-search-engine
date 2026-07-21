import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PeopleTable from "./PeopleTable";

const recruiter = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  email: null,
  phone: null,
  company: "Acme",
  notes: "Met at event",
  isRecruiter: true,
  linkedinUrl: "https://www.linkedin.com/in/jane-doe",
};

function response(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

describe("PeopleTable", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });

  it("shows a loading state before data is loaded", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<PeopleTable />);

    expect(screen.getByText("Loading people...")).toBeInTheDocument();
  });

  it("renders camelCase people with recruiter and LinkedIn details", async () => {
    vi.mocked(fetch).mockResolvedValue(response([recruiter]));

    render(<PeopleTable />);

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Recruiter")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LinkedIn profile for Jane Doe" })).toHaveAttribute(
      "href",
      recruiter.linkedinUrl,
    );
    expect(screen.getAllByLabelText("Not provided")).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith("/api/people");
  });

  it("adds a name-only recruiter with a scheme-less LinkedIn URL", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(recruiter));

    render(<PeopleTable />);
    await screen.findByText("No people have been added yet.");
    await user.click(screen.getByRole("button", { name: "Add Person" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("First name"), "Jane");
    await user.type(within(dialog).getByLabelText("Last name"), "Doe");
    await user.type(within(dialog).getByLabelText("LinkedIn profile"), "linkedin.com/in/jane-doe");
    await user.click(within(dialog).getByRole("switch", { name: "Recruiter" }));
    await user.click(within(dialog).getByRole("button", { name: "Add Person" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const request = vi.mocked(fetch).mock.calls[1];
    expect(request[0]).toBe("/api/people");
    expect(request[1]).toMatchObject({ method: "POST" });
    expect(JSON.parse(request[1]?.body as string)).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      isRecruiter: true,
      linkedinUrl: "linkedin.com/in/jane-doe",
      email: "",
      phone: "",
      company: "",
    });
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
  });

  it("loads and updates recruiter state in the edit dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response([recruiter]))
      .mockResolvedValueOnce(response({ ...recruiter, isRecruiter: false }));

    render(<PeopleTable />);
    await screen.findByText("Jane Doe");
    await user.click(screen.getByRole("button", { name: "Edit Jane Doe" }));

    const dialog = screen.getByRole("dialog");
    const recruiterSwitch = within(dialog).getByRole("switch", { name: "Recruiter" });
    expect(recruiterSwitch).toBeChecked();
    await user.click(recruiterSwitch);
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]?.body as string)).toMatchObject({
      isRecruiter: false,
    });
  });

  it("shows API validation errors inside the dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ error: "Enter a LinkedIn profile URL on linkedin.com." }, false));

    render(<PeopleTable />);
    await screen.findByText("No people have been added yet.");
    await user.click(screen.getByRole("button", { name: "Add Person" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("First name"), "Jane");
    await user.type(within(dialog).getByLabelText("Last name"), "Doe");
    await user.type(within(dialog).getByLabelText("LinkedIn profile"), "example.com/jane");
    await user.click(within(dialog).getByRole("button", { name: "Add Person" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Enter a LinkedIn profile URL on linkedin.com.",
    );
  });
});
