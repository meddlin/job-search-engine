const FIELD_LIMITS = {
  firstName: 255,
  lastName: 255,
  email: 255,
  phone: 50,
  company: 255,
  linkedinUrl: 500,
} as const;

type PersonInputObject = Record<string, unknown>;

export type PersonCreateInput = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  isRecruiter: boolean;
  linkedinUrl: string | null;
};

export type PersonUpdateInput = Pick<PersonCreateInput, "firstName" | "lastName"> &
  Partial<Omit<PersonCreateInput, "firstName" | "lastName">>;

export class PersonInputError extends Error {}

export function parsePersonCreateInput(input: unknown): PersonCreateInput {
  const body = requireObject(input);

  return {
    firstName: requiredString(body, "firstName", FIELD_LIMITS.firstName),
    lastName: requiredString(body, "lastName", FIELD_LIMITS.lastName),
    email: optionalString(body, "email", FIELD_LIMITS.email) ?? null,
    phone: optionalString(body, "phone", FIELD_LIMITS.phone) ?? null,
    company: optionalString(body, "company", FIELD_LIMITS.company) ?? null,
    notes: optionalString(body, "notes") ?? null,
    isRecruiter: optionalBoolean(body, "isRecruiter") ?? false,
    linkedinUrl: optionalLinkedInUrl(body) ?? null,
  };
}

export function parsePersonUpdateInput(input: unknown): PersonUpdateInput {
  const body = requireObject(input);
  const data: PersonUpdateInput = {
    firstName: requiredString(body, "firstName", FIELD_LIMITS.firstName),
    lastName: requiredString(body, "lastName", FIELD_LIMITS.lastName),
  };

  assignIfPresent(data, body, "email", () => optionalString(body, "email", FIELD_LIMITS.email));
  assignIfPresent(data, body, "phone", () => optionalString(body, "phone", FIELD_LIMITS.phone));
  assignIfPresent(data, body, "company", () => optionalString(body, "company", FIELD_LIMITS.company));
  assignIfPresent(data, body, "notes", () => optionalString(body, "notes"));
  assignIfPresent(data, body, "isRecruiter", () => optionalBoolean(body, "isRecruiter"));
  assignIfPresent(data, body, "linkedinUrl", () => optionalLinkedInUrl(body));

  return data;
}

export function normalizeLinkedInUrl(value: string): string {
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new PersonInputError("Enter a valid LinkedIn profile URL.");
  }

  const hostname = url.hostname.toLowerCase();
  const isLinkedInHost = hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");

  if (!isLinkedInHost || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new PersonInputError("Enter a LinkedIn profile URL on linkedin.com.");
  }

  url.protocol = "https:";
  url.hash = "";

  const normalized = url.toString();
  if (normalized.length > FIELD_LIMITS.linkedinUrl) {
    throw new PersonInputError("LinkedIn URL must be 500 characters or fewer.");
  }

  return normalized;
}

function requireObject(input: unknown): PersonInputObject {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new PersonInputError("Enter valid person details.");
  }

  return input as PersonInputObject;
}

function requiredString(body: PersonInputObject, key: string, maxLength: number) {
  const value = optionalString(body, key, maxLength);
  if (!value) {
    throw new PersonInputError(`${fieldLabel(key)} is required.`);
  }

  return value;
}

function optionalString(body: PersonInputObject, key: string, maxLength?: number) {
  const value = body[key];
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new PersonInputError(`${fieldLabel(key)} must be text.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (maxLength && trimmed.length > maxLength) {
    throw new PersonInputError(`${fieldLabel(key)} must be ${maxLength} characters or fewer.`);
  }

  return trimmed;
}

function optionalBoolean(body: PersonInputObject, key: string) {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "boolean") {
    throw new PersonInputError(`${fieldLabel(key)} must be true or false.`);
  }

  return value;
}

function optionalLinkedInUrl(body: PersonInputObject) {
  const value = optionalString(body, "linkedinUrl", FIELD_LIMITS.linkedinUrl);
  return value ? normalizeLinkedInUrl(value) : value;
}

function assignIfPresent<K extends keyof PersonUpdateInput>(
  data: PersonUpdateInput,
  body: PersonInputObject,
  key: K,
  getValue: () => PersonUpdateInput[K],
) {
  if (Object.prototype.hasOwnProperty.call(body, key)) {
    data[key] = getValue();
  }
}

function fieldLabel(key: string) {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
