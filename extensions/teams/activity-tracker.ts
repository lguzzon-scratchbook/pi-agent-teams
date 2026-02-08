import type { AgentEvent } from "@mariozechner/pi-agent-core";

type TrackedEventType = "tool_execution_start" | "tool_execution_end" | "agent_end" | "message_end";

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

export interface TeammateActivity {
	toolUseCount: number;
	currentToolName: string | null;
	lastToolName: string | null;
	turnCount: number;
	totalTokens: number;
	recentEvents: Array<{ type: TrackedEventType; toolName?: string; timestamp: number }>;
}

const MAX_RECENT = 10;

function emptyActivity(): TeammateActivity {
	return {
		toolUseCount: 0,
		currentToolName: null,
		lastToolName: null,
		turnCount: 0,
		totalTokens: 0,
		recentEvents: [],
	};
}

export class ActivityTracker {
	private data = new Map<string, TeammateActivity>();

	handleEvent(name: string, ev: AgentEvent): void {
		const a = this.getOrCreate(name);
		const now = Date.now();

		if (ev.type === "tool_execution_start") {
			a.currentToolName = ev.toolName;
			a.recentEvents.push({ type: ev.type, toolName: ev.toolName, timestamp: now });
			if (a.recentEvents.length > MAX_RECENT) a.recentEvents.shift();
			return;
		}

		if (ev.type === "tool_execution_end") {
			const toolName = a.currentToolName ?? ev.toolName;
			a.toolUseCount++;
			a.lastToolName = toolName;
			a.currentToolName = null;
			a.recentEvents.push({ type: ev.type, toolName, timestamp: now });
			if (a.recentEvents.length > MAX_RECENT) a.recentEvents.shift();
			return;
		}

		if (ev.type === "agent_end") {
			a.turnCount++;
			a.recentEvents.push({ type: ev.type, timestamp: now });
			if (a.recentEvents.length > MAX_RECENT) a.recentEvents.shift();
			return;
		}

		if (ev.type === "message_end") {
			const msg: unknown = ev.message;
			if (!isRecord(msg)) return;
			const usage = msg.usage;
			if (!isRecord(usage)) return;
			const totalTokens = usage.totalTokens;
			if (typeof totalTokens === "number") a.totalTokens += totalTokens;
		}
	}

	get(name: string): TeammateActivity {
		return this.data.get(name) ?? emptyActivity();
	}

	reset(name: string): void {
		this.data.delete(name);
	}

	private getOrCreate(name: string): TeammateActivity {
		const existing = this.data.get(name);
		if (existing) return existing;

		const created = emptyActivity();
		this.data.set(name, created);
		return created;
	}
}
