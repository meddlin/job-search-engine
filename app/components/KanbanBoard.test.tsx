import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KanbanBoard from "./KanbanBoard";

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({
    children,
  }: {
    children: (provided: {
      innerRef: () => void;
      droppableProps: Record<string, never>;
      placeholder: null;
    }, snapshot: { isDraggingOver: boolean }) => React.ReactNode;
  }) => (
    <div>
      {children(
        {
          innerRef: vi.fn(),
          droppableProps: {},
          placeholder: null,
        },
        { isDraggingOver: false },
      )}
    </div>
  ),
  Draggable: ({
    children,
  }: {
    children: (provided: {
      innerRef: () => void;
      draggableProps: Record<string, never>;
      dragHandleProps: Record<string, never>;
    }, snapshot: { isDragging: boolean }) => React.ReactNode;
  }) => (
    <div>
      {children(
        {
          innerRef: vi.fn(),
          draggableProps: {},
          dragHandleProps: {},
        },
        { isDragging: false },
      )}
    </div>
  ),
}));

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows a loading state before jobs are loaded", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}) as Promise<Response>);

    render(<KanbanBoard />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders jobs returned by the API in their status columns", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          companyName: "Acme",
          positionTitle: "Frontend Engineer",
          status: "interviewing",
          remote: "hybrid",
          applied: true,
          notes: null,
          jobUrl: null,
          jobDescription: null,
          recruiterName: "Sam Recruiter",
          recruitingAgency: null,
          recruiterEmail: null,
          recruiterPhone: null,
          recruiterLinkedin: null,
          dateAdded: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    } as Response);

    render(<KanbanBoard />);

    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
    expect(screen.getByText("Applied")).toBeInTheDocument();
    expect(screen.getByText("Recruiter: Sam Recruiter")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/jobs");
  });
});
