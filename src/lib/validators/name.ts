// Shared, framework-agnostic person-name validation. Pure (no server deps) so
// it runs identically on the client (instant feedback), on the server (the
// authoritative check), at the signup name-gate, and when vetting AI-extracted
// names before auto-filling a profile.

// Obvious placeholder / keyboard-mash values that are never real names. Matched
// per whole word (case-insensitive), so "Test User" and "asdf" are caught but a
// real name that merely contains these letters is not.
const TEST_VALUES = new Set([
  "test",
  "testing",
  "tester",
  "abc",
  "abcd",
  "abcde",
  "xyz",
  "asdf",
  "asdfgh",
  "qwerty",
  "qwe",
  "user",
  "username",
  "admin",
  "demo",
  "example",
  "sample",
  "none",
  "null",
  "undefined",
  "name",
  "fullname",
  "firstname",
  "lastname",
  "foo",
  "bar",
  "baz",
  "lorem",
  "ipsum",
  "unknown",
  "anonymous",
  "dummy",
  "temp",
  "temporary",
  "xxx",
  "zzz",
]);

export type NameValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Collapse internal whitespace runs and trim the ends. */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Validate a human name. Returns the normalized value on success, or a
 * user-facing error message describing the first rule that failed.
 *
 * Permissive enough for real-world names (O'Brien, Smith-Jones, José, mononyms,
 * "Li") while rejecting numbers, symbols, single characters, keyboard mashing,
 * and obvious test/placeholder values.
 */
export function validateName(raw: string | null | undefined): NameValidation {
  const value = normalizeName(raw ?? "");

  if (!value) return { ok: false, error: "Please enter your name." };

  // Reject single-character names; keep a sane upper bound.
  if (value.replace(/\s/g, "").length < 2) {
    return { ok: false, error: "Name must be at least 2 letters." };
  }
  if (value.length > 80) {
    return { ok: false, error: "Name is too long (max 80 characters)." };
  }

  // No digits.
  if (/\d/.test(value)) {
    return { ok: false, error: "Name can't contain numbers." };
  }

  // Allowed characters only: any unicode letter, plus space, hyphen,
  // apostrophe, and period. Must start with a letter.
  if (!/^\p{L}[\p{L} .'-]*$/u.test(value)) {
    return {
      ok: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes.",
    };
  }

  // At least two actual letters (guards against ". -" style input).
  const letters = (value.match(/\p{L}/gu) ?? []).length;
  if (letters < 2) {
    return { ok: false, error: "Name must contain at least 2 letters." };
  }

  // Three or more identical letters in a row → keyboard mashing (aaa, llll).
  if (/(\p{L})\1{2,}/u.test(value)) {
    return { ok: false, error: "Please enter your real name." };
  }

  // Obvious placeholder / test values, checked per word and as a whole.
  const words = value.toLowerCase().split(/[ .'-]+/).filter(Boolean);
  if (words.some((w) => TEST_VALUES.has(w)) || TEST_VALUES.has(words.join(""))) {
    return { ok: false, error: "Please enter your real name." };
  }

  return { ok: true, value };
}

/** True when the value passes validation — handy for guards/redirects. */
export function isValidName(raw: string | null | undefined): boolean {
  return validateName(raw).ok;
}

/**
 * Split a validated full name into Clerk's first/last fields. The first token
 * is the first name; everything after is the last name (empty for mononyms).
 */
export function splitName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = normalizeName(fullName).split(" ");
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}
