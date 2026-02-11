const DEPRECATED_MODEL_IDS = new Set<string>(["claude-sonnet-4"]);

function normalizeModelId(modelId: string): string {
	return modelId.trim().toLowerCase();
}

export function isDeprecatedTeammateModelId(modelId: string): boolean {
	const normalized = normalizeModelId(modelId);
	if (!normalized) return false;
	return DEPRECATED_MODEL_IDS.has(normalized);
}
