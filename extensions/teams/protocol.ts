export const TEAM_MAILBOX_NS = "team";

function safeParseJson(text: string): any | null {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

// Leader-side inbox messages

export function isIdleNotification(
	text: string,
): {
	from: string;
	timestamp?: string;
	completedTaskId?: string;
	completedStatus?: string;
	failureReason?: string;
} | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "idle_notification") return null;
	return {
		from: typeof obj.from === "string" ? obj.from : "unknown",
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
		completedTaskId: typeof obj.completedTaskId === "string" ? obj.completedTaskId : undefined,
		completedStatus: typeof obj.completedStatus === "string" ? obj.completedStatus : undefined,
		failureReason: typeof obj.failureReason === "string" ? obj.failureReason : undefined,
	};
}

export function isShutdownApproved(
	text: string,
): {
	from: string;
	requestId: string;
	timestamp?: string;
} | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "shutdown_approved") return null;
	if (typeof obj.requestId !== "string") return null;
	return {
		from: typeof obj.from === "string" ? obj.from : "unknown",
		requestId: obj.requestId,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

export function isShutdownRejected(
	text: string,
): {
	from: string;
	requestId: string;
	reason: string;
	timestamp?: string;
} | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "shutdown_rejected") return null;
	if (typeof obj.requestId !== "string") return null;
	return {
		from: typeof obj.from === "string" ? obj.from : "unknown",
		requestId: obj.requestId,
		reason: typeof obj.reason === "string" ? obj.reason : "",
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

export function isPlanApprovalRequest(
	text: string,
): {
	requestId: string;
	from: string;
	plan: string;
	taskId?: string;
	timestamp?: string;
} | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "plan_approval_request") return null;
	if (typeof obj.requestId !== "string") return null;
	if (typeof obj.from !== "string") return null;
	if (typeof obj.plan !== "string") return null;
	return {
		requestId: obj.requestId,
		from: obj.from,
		plan: obj.plan,
		taskId: typeof obj.taskId === "string" ? obj.taskId : undefined,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

export function isPeerDmSent(
	text: string,
): {
	from: string;
	to: string;
	summary: string;
	timestamp?: string;
} | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "peer_dm_sent") return null;
	if (typeof obj.from !== "string") return null;
	if (typeof obj.to !== "string") return null;
	if (typeof obj.summary !== "string") return null;
	return {
		from: obj.from,
		to: obj.to,
		summary: obj.summary,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

// Worker-side inbox messages

export function isTaskAssignmentMessage(
	text: string,
): { taskId: string; subject?: string; description?: string; assignedBy?: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "task_assignment") return null;
	if (typeof obj.taskId !== "string") return null;
	return {
		taskId: obj.taskId,
		subject: typeof obj.subject === "string" ? obj.subject : undefined,
		description: typeof obj.description === "string" ? obj.description : undefined,
		assignedBy: typeof obj.assignedBy === "string" ? obj.assignedBy : undefined,
	};
}

export function isShutdownRequestMessage(
	text: string,
): { requestId: string; from?: string; reason?: string; timestamp?: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "shutdown_request") return null;
	if (typeof obj.requestId !== "string") return null;
	return {
		requestId: obj.requestId,
		from: typeof obj.from === "string" ? obj.from : undefined,
		reason: typeof obj.reason === "string" ? obj.reason : undefined,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

export function isSetSessionNameMessage(text: string): { name: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "set_session_name") return null;
	if (typeof obj.name !== "string") return null;
	return { name: obj.name };
}

export function isAbortRequestMessage(
	text: string,
): { requestId: string; from?: string; taskId?: string; reason?: string; timestamp?: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "abort_request") return null;
	if (typeof obj.requestId !== "string") return null;
	return {
		requestId: obj.requestId,
		from: typeof obj.from === "string" ? obj.from : undefined,
		taskId: typeof obj.taskId === "string" ? obj.taskId : undefined,
		reason: typeof obj.reason === "string" ? obj.reason : undefined,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : undefined,
	};
}

export function isPlanApprovedMessage(text: string): { requestId: string; from: string; timestamp: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "plan_approved") return null;
	if (typeof obj.requestId !== "string" || typeof obj.from !== "string") return null;
	return {
		requestId: obj.requestId,
		from: obj.from,
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : "",
	};
}

export function isPlanRejectedMessage(
	text: string,
): { requestId: string; from: string; feedback: string; timestamp: string } | null {
	const obj = safeParseJson(text);
	if (!obj || typeof obj !== "object") return null;
	if (obj.type !== "plan_rejected") return null;
	if (typeof obj.requestId !== "string" || typeof obj.from !== "string") return null;
	return {
		requestId: obj.requestId,
		from: obj.from,
		feedback: typeof obj.feedback === "string" ? obj.feedback : "",
		timestamp: typeof obj.timestamp === "string" ? obj.timestamp : "",
	};
}
