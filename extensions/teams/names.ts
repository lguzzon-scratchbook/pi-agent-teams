/**
 * Shared name sanitization.
 *
 * Must be stable across leader/worker/mailbox so file paths and mailbox ids match.
 */
export function sanitizeName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}
