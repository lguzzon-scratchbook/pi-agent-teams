import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import type { Component, TUI } from "@mariozechner/pi-tui";
import type { Theme, ThemeColor } from "@mariozechner/pi-coding-agent";
import type { TeammateRpc, TeammateStatus } from "./teammate-rpc.js";
import type { ActivityTracker } from "./activity-tracker.js";
import type { TeamTask } from "./task-store.js";
import type { TeamConfig, TeamMember } from "./team-config.js";

export interface WidgetDeps {
	getTeammates(): Map<string, TeammateRpc>;
	getTracker(): ActivityTracker;
	getTasks(): TeamTask[];
	getTeamConfig(): TeamConfig | null;
	isDelegateMode(): boolean;
}

export type WidgetFactory = (tui: TUI, theme: Theme) => Component;

// Status icon and color mapping
const STATUS_ICON: Record<TeammateStatus, string> = {
	streaming: "◉",
	idle: "●",
	starting: "○",
	stopped: "✗",
	error: "✗",
};

const STATUS_COLOR: Record<TeammateStatus, ThemeColor> = {
	streaming: "accent",
	idle: "success",
	starting: "muted",
	stopped: "dim",
	error: "error",
};

function padRight(str: string, targetWidth: number): string {
	const w = visibleWidth(str);
	return w >= targetWidth ? str : str + " ".repeat(targetWidth - w);
}

function resolveStatus(rpc: TeammateRpc | undefined, cfg: TeamMember | undefined): TeammateStatus {
	if (rpc) return rpc.status;
	return cfg?.status === "online" ? "idle" : "stopped";
}

export function createTeamsWidget(deps: WidgetDeps): WidgetFactory {
	return (_tui: TUI, theme: Theme): Component => {
		return {
			render(width: number): string[] {
				const teammates = deps.getTeammates();
				const tasks = deps.getTasks();
				const teamConfig = deps.getTeamConfig();
				const delegateMode = deps.isDelegateMode();

				// Hide when no active team state
				const hasOnlineMembers = (teamConfig?.members ?? []).some(
					(m) => m.role === "worker" && m.status === "online",
				);
				if (teammates.size === 0 && tasks.length === 0 && !hasOnlineMembers) {
					return [];
				}

				const lines: string[] = [];

				// ── Header line ──
				let header = " " + theme.bold(theme.fg("accent", "Teams"));
				if (delegateMode) header += " " + theme.fg("warning", "[delegate]");
				lines.push(truncateToWidth(header, width));

				// ── Teammate rows ──
				const cfgWorkers = (teamConfig?.members ?? []).filter((m) => m.role === "worker");
				const cfgByName = new Map<string, TeamMember>();
				for (const m of cfgWorkers) cfgByName.set(m.name, m);

				const visibleNames = new Set<string>();
				for (const name of teammates.keys()) visibleNames.add(name);
				for (const m of cfgWorkers) {
					if (m.status === "online") visibleNames.add(m.name);
				}
				for (const t of tasks) {
					if (t.owner && t.status === "in_progress") visibleNames.add(t.owner);
				}

				if (visibleNames.size === 0) {
					lines.push(
						truncateToWidth(" " + theme.fg("dim", "(no comrades)  /team spawn <name>"), width),
					);
				} else {
					const sortedNames = Array.from(visibleNames).sort();
					const nameColWidth = Math.max(...sortedNames.map((n) => visibleWidth(`Comrade ${n}`)));

					// Per-comrade task counts
					const perOwner = new Map<string, { pending: number; completed: number }>();
					for (const name of sortedNames) {
						const owned = tasks.filter((t) => t.owner === name);
						perOwner.set(name, {
							pending: owned.filter((t) => t.status === "pending").length,
							completed: owned.filter((t) => t.status === "completed").length,
						});
					}
					const totalPending = tasks.filter((t) => t.status === "pending").length;
					const totalCompleted = tasks.filter((t) => t.status === "completed").length;

					// Column widths for number alignment
					const allPendingNums = [...Array.from(perOwner.values()).map((v) => v.pending), totalPending];
					const allCompletedNums = [...Array.from(perOwner.values()).map((v) => v.completed), totalCompleted];
					const pW = Math.max(...allPendingNums.map((n) => String(n).length));
					const cW = Math.max(...allCompletedNums.map((n) => String(n).length));

					for (const name of sortedNames) {
						const rpc = teammates.get(name);
						const cfg = cfgByName.get(name);
						const statusKey = resolveStatus(rpc, cfg);

						const icon = theme.fg(STATUS_COLOR[statusKey], STATUS_ICON[statusKey]);
						const styledName = theme.bold(`Comrade ${name}`);
						const statusLabel = theme.fg(STATUS_COLOR[statusKey], padRight(statusKey, 9));

						const counts = perOwner.get(name) ?? { pending: 0, completed: 0 };
						const pNum = String(counts.pending).padStart(pW);
						const cNum = String(counts.completed).padStart(cW);
						const countsSuffix = theme.fg("dim", ` \u00b7 ${pNum} pending \u00b7 ${cNum} complete`);

						const row = ` ${icon} ${padRight(styledName, nameColWidth)} ${statusLabel}${countsSuffix}`;
						lines.push(truncateToWidth(row, width));
					}

					// ── Total row ──
					// Left portion of comrade row: " icon name status" = 1+1+1+nameColWidth+1+9
					const leftWidth = nameColWidth + 13;
					const totalLabel = theme.bold("Total");
					const tpNum = String(totalPending).padStart(pW);
					const tcNum = String(totalCompleted).padStart(cW);
					const totalCounts = theme.fg("dim", ` \u00b7 ${tpNum} pending \u00b7 ${tcNum} complete`);
					const totalRow = ` ${padRight(totalLabel, leftWidth - 1)}${totalCounts}`;
					lines.push(truncateToWidth(totalRow, width));
				}

				// ── Hints line ──
				const hints = theme.fg(
					"dim",
					" /team panel \u00b7 /team dm <name> <msg> \u00b7 /team task list",
				);
				lines.push(truncateToWidth(hints, width));

				return lines;
			},
			invalidate() {},
		};
	};
}
