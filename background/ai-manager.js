const toneMap = {
  friendly: "Warm and friendly",
  professional: "Professional yet approachable",
  casual: "Relaxed and conversational",
  formal: "Polished and formal",
};

const lengthMap = {
  short: "keep it concise (max 2 sentences)",
  medium: "2-3 sentences with clarity",
  long: "a detailed but focused paragraph",
};

export async function generateDraft({ prompt, tone = "friendly", length = "short" }) {
  const safePrompt = prompt?.trim();
  if (!safePrompt) return "Please provide a prompt.";
  const intro = toneMap[tone] || toneMap.friendly;
  const sizing = lengthMap[length] || lengthMap.short;
  // Placeholder generation: this formats a prompt but does not call an external AI provider.
  return `[PLACEHOLDER] ${intro} message: ${safePrompt}. Please ${sizing}, stay empathetic, and keep it WhatsApp-ready.`;
}
