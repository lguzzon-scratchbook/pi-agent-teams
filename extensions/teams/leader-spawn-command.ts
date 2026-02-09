import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { pickAgentNames, pickNamesFromPool } from "./names.js";
import type { TeammateRpc } from "./teammate-rpc.js";
import type { TeamsStyle } from "./teams-style.js";
import { formatMemberDisplayName, getTeamsNamingRules, getTeamsStrings } from "./teams-style.js";
import type { ContextMode, WorkspaceMode, SpawnTeammateFn } from "./spawn-types.js";

export async function handleTeamSpawnCommand(opts: {
	ctx: ExtensionCommandContext;
	rest: string[];
	teammates: Map<string, TeammateRpc>;
	style: TeamsStyle;
	spawnTeammate: SpawnTeammateFn;
}): Promise<void> {
	const { ctx, rest, teammates, style, spawnTeammate } = opts;
	const strings = getTeamsStrings(style);

	// Parse flags from any position
	let nameRaw: string | undefined;
	let mode: ContextMode = "fresh";
	let workspaceMode: WorkspaceMode = "shared";
	let planRequired = false;
	for (const a of rest) {
		if (a === "fresh" || a === "branch") mode = a;
		else if (a === "shared" || a === "worktree") workspaceMode = a;
		else if (a === "plan") planRequired = true;
		else if (!nameRaw) nameRaw = a;
	}

	// Auto-pick a name when the current style allows it.
	if (!nameRaw) {
		const naming = getTeamsNamingRules(style);
		if (naming.requireExplicitSpawnName) {
			ctx.ui.notify("Usage: /team spawn <name> [fresh|branch] [shared|worktree] [plan]", "error");
			return;
		}

		const taken = new Set(teammates.keys());
		const picked = (() => {
			if (naming.autoNameStrategy.kind === "agent") return pickAgentNames(1, taken).at(0);
			return pickNamesFromPool({
				pool: naming.autoNameStrategy.pool,
				count: 1,
				taken,
				fallbackBase: naming.autoNameStrategy.fallbackBase,
			}).at(0);
		})();
		if (!picked) {
			ctx.ui.notify(`Failed to pick a ${strings.memberTitle.toLowerCase()} name`, "error");
			return;
		}
		nameRaw = picked;
	}

	const res = await spawnTeammate(ctx, { name: nameRaw, mode, workspaceMode, planRequired });
	if (!res.ok) {
		ctx.ui.notify(res.error, "error");
		return;
	}

	for (const w of res.warnings) ctx.ui.notify(w, "warning");
	const displayName = formatMemberDisplayName(style, res.name);
	ctx.ui.notify(
		`${displayName} ${strings.joinedVerb} (${res.mode}${res.note ? ", " + res.note : ""} \u00b7 ${res.workspaceMode})`,
		"info",
	);
}
