export const standardTags = { Project: 'healthcare-rag-poc', Owner: 'demo', DataClassification: 'no-phi-demo', CostCenter: 'interview-demo' };
export function withTags<T extends Record<string, unknown>>(props: T, profile: string): T & { Tags: Array<{ Key: string; Value: string }> } {
  return { ...props, Tags: Object.entries({ ...standardTags, Profile: profile }).map(([Key, Value]) => ({ Key, Value })) };
}
