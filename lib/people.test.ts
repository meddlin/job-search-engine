import { describe, expect, it } from "vitest";

import {
  normalizeLinkedInUrl,
  parsePersonCreateInput,
  PersonInputError,
} from "./people";

describe("person input", () => {
  it("trims names and converts empty optional values to null", () => {
    expect(parsePersonCreateInput({
      firstName: " Jane ",
      lastName: " Doe ",
      email: " ",
      phone: "",
      company: null,
      notes: " Met at a conference ",
    })).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      email: null,
      phone: null,
      company: null,
      notes: "Met at a conference",
      isRecruiter: false,
      linkedinUrl: null,
    });
  });

  it("normalizes LinkedIn subdomains to HTTPS and removes fragments", () => {
    expect(normalizeLinkedInUrl("www.linkedin.com/in/jane-doe#about")).toBe(
      "https://www.linkedin.com/in/jane-doe",
    );
  });

  it("rejects malformed and unrelated URLs", () => {
    expect(() => normalizeLinkedInUrl("not a url")).toThrow(PersonInputError);
    expect(() => normalizeLinkedInUrl("https://notlinkedin.com/in/jane")).toThrow(
      "Enter a LinkedIn profile URL on linkedin.com.",
    );
  });
});
