import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { getTeamDir } from "./paths.js";
import { loadTeamConfig } from "./team-config.js";
import { listDiscoveredTeams } from "./team-discovery.js";
import type { TeammateRpc } from "./teammate-rpc.js";
import type { TeamsStyle } from "./teams-style.js";

export async function handleTeamAttachCommand(opts: {
	ctx: ExtensionCommandContext;
	rest: string[];
	defaultTeamId: string;
	teammates: Map<string, TeammateRpc>;
	getActiveTeamId: () => string;
	setActiveTeamId: (teamId: string) => void;
	setStyle: (style: TeamsStyle) => void;
	setTaskListId: (id: string) => void;
	refreshTasks: () => Promise<void>;
	renderWidget: () => void;
}): Promise<void> {
	const {
		ctx,
		rest,
		defaultTeamId,
		teammates,
		getActiveTeamId,
		setActiveTeamId,
		setStyle,
		setTaskListId,
		refreshTasks,
		renderWidget,
	} = opts;

	const arg = rest[0];
	const activeTeamId = getActiveTeamId();
	if (!arg || arg === "help") {
		ctx.ui.notify(
			[
				"Usage:",
				"  /team attach list",
				"  /team attach <teamId>",
				"",
				`current: ${activeTeamId}${activeTeamId === defaultTeamId ? " (session)" : " (attached)"}`,
				`session: ${defaultTeamId}`,
			].join("\n"),
			"info",
		);
		return;
	}

	if (arg === "list") {
		const teams = await listDiscoveredTeams();
		if (teams.length === 0) {
			ctx.ui.notify("No existing teams found", "info");
			return;
		}

		const lines: string[] = ["Known teams:"];
		for (const t of teams.slice(0, 30)) {
			const marks: string[] = [];
			if (t.teamId === activeTeamId) marks.push("current");
			if (t.teamId === defaultTeamId) marks.push("session");
			const mark = marks.length ? ` [${marks.join(",")}]` : "";
			lines.push(
				`- ${t.teamId}${mark} · style=${t.style} · workers=${t.onlineWorkerCount}/${t.workerCount} · taskList=${t.taskListId}`,
			);
		}
		if (teams.length > 30) lines.push(`... +${teams.length - 30} more`);
		ctx.ui.notify(lines.join("\n"), "info");
		return;
	}

	const targetTeamId = arg.trim();
	if (!targetTeamId) {
		ctx.ui.notify("Usage: /team attach <teamId>", "error");
		return;
	}
	if (targetTeamId === activeTeamId) {
		ctx.ui.notify(`Already attached to team: ${targetTeamId}`, "info");
		return;
	}

	if (teammates.size > 0) {
		ctx.ui.notify(
			`Refusing to attach while ${teammates.size} RPC teammate(s) are running. Run /team shutdown first.`,
			"error",
		);
		return;
	}

	const targetDir = getTeamDir(targetTeamId);
	const cfg = await loadTeamConfig(targetDir);
	if (!cfg) {
		ctx.ui.notify(`Team not found: ${targetTeamId}\nExpected config at: ${targetDir}/config.json`, "error");
		return;
	}

	if (process.stdout.isTTY && process.stdin.isTTY) {
		const ok = await ctx.ui.confirm(
			"Attach to team",
			[
				`Attach this session to team ${cfg.teamId}?`,
				"",
				`taskListId: ${cfg.taskListId}`,
				`style: ${cfg.style ?? "normal"}`,
				`workers: ${cfg.members.filter((m) => m.role === "worker").length}`,
			].join("\n"),
		);
		if (!ok) return;
	}

	setActiveTeamId(cfg.teamId);
	setTaskListId(cfg.taskListId);
	setStyle(cfg.style ?? "normal");
	await refreshTasks();
	renderWidget();

	ctx.ui.notify(
		[
			`Attached to team: ${cfg.teamId}`,
			`taskListId: ${cfg.taskListId}`,
			`style: ${cfg.style ?? "normal"}`,
		].join("\n"),
		"info",
	);
}

export async function handleTeamDetachCommand(opts: {
	ctx: ExtensionCommandContext;
	defaultTeamId: string;
	teammates: Map<string, TeammateRpc>;
	getActiveTeamId: () => string;
	setActiveTeamId: (teamId: string) => void;
	setTaskListId: (id: string) => void;
	refreshTasks: () => Promise<void>;
	renderWidget: () => void;
}): Promise<void> {
	const { ctx, defaultTeamId, teammates, getActiveTeamId, setActiveTeamId, setTaskListId, refreshTasks, renderWidget } = opts;

	const activeTeamId = getActiveTeamId();
	if (activeTeamId === defaultTeamId) {
		ctx.ui.notify("Already using this session's team", "info");
		return;
	}
	if (teammates.size > 0) {
		ctx.ui.notify(
			`Refusing to detach while ${teammates.size} RPC teammate(s) are running. Run /team shutdown first.`,
			"error",
		);
		return;
	}

	setActiveTeamId(defaultTeamId);
	setTaskListId(defaultTeamId);
	await refreshTasks();
	renderWidget();
	ctx.ui.notify(`Detached from external team. Back to session team: ${defaultTeamId}`, "info");
}
