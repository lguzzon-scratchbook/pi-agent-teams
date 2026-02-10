import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";

export type ContextMode = "fresh" | "branch";
export type WorkspaceMode = "shared" | "worktree";

export interface SpawnTeammateOptions {
	name: string;
	mode?: ContextMode;
	workspaceMode?: WorkspaceMode;
	planRequired?: boolean;
	/**
	 * Optional model override for the spawned teammate.
	 *
	 * Supported forms:
	 * - "<provider>/<modelId>"  (e.g. "anthropic/claude-sonnet-4")
	 * - "<modelId>"             (provider inherited from leader when available)
	 */
	model?: string;
	/** Optional thinking level override for the spawned teammate. */
	thinking?: ThinkingLevel;
}

export type SpawnTeammateResult =
	| {
			ok: true;
			name: string;
			mode: ContextMode;
			workspaceMode: WorkspaceMode;
			childCwd?: string;
			note?: string;
			warnings: string[];
	  }
	| { ok: false; error: string };

export type SpawnTeammateFn = (ctx: ExtensionContext, opts: SpawnTeammateOptions) => Promise<SpawnTeammateResult>;
