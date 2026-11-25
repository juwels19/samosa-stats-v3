import { gateway, generateText } from "ai";

import { MAX_PICK_DISPLAY_NAME_LENGTH } from "./constants";

/**
 * AI display names for picks. Bad names are fine: they are part of the fun.
 * The model is set in this AI Gateway router, so it changes without a
 * redeploy. Admins turn suggestions on or off in Settings > AI.
 */
const DISPLAY_NAME_MODEL = "router/ss-display-name";

/** Suggestions each player can ask for on one submission (one event). */
export const SUGGESTIONS_PER_SUBMISSION = 25;

/** The longest name to ask for. The saved limit is longer. */
const TARGET_LENGTH = 40;

export type DisplayNameContext = {
  eventName: string;
  teams: { number: number; name: string }[];
  categories: string[];
};

export function getDisplayNamePrompt({ eventName, teams, categories }: DisplayNameContext) {
  const lines = [`Event: ${eventName}`];
  if (teams.length > 0) {
    lines.push(`Teams picked: ${teams.map((team) => `${team.number} ${team.name}`).join("; ")}`);
  }
  if (categories.length > 0) {
    lines.push(`Categories picked: ${categories.join("; ")}`);
  }
  return lines.join("\n");
}

const SYSTEM = `You name a player's picks in an FRC robotics fantasy game.
Write one funny, short display name for the picks, at most ${TARGET_LENGTH} characters.
You can play on the team names, team numbers, categories or event.
Reply with the name only: no quotes, no explanation, no emoji.`;

/** Makes a model reply a usable name: one line, no quotes, not too long. */
export function cleanDisplayName(text: string) {
  const firstLine = text.trim().split("\n")[0] ?? "";
  return firstLine
    .replace(/^(display name|name)\s*:\s*/i, "")
    .replace(/^["'`*]+|["'`*.]+$/g, "")
    .trim()
    .slice(0, MAX_PICK_DISPLAY_NAME_LENGTH);
}

const LOW_THINKING = { google: { thinkingConfig: { thinkingLevel: "low" } } } as const;

export async function generateDisplayName(context: DisplayNameContext) {
  const request = {
    model: gateway(DISPLAY_NAME_MODEL),
    system: SYSTEM,
    prompt: getDisplayNamePrompt(context),
    temperature: 1,
    // Room for models that think before they answer. Most names use under 20.
    maxOutputTokens: 2000,
  };

  // Gemini thinks a lot by default: about 10 s a name. Low is about 1 s.
  // Other providers ignore this option. A model that refuses it gets the
  // request again without it.
  let text: string;
  try {
    ({ text } = await generateText({ ...request, providerOptions: LOW_THINKING }));
  } catch {
    ({ text } = await generateText(request));
  }

  const name = cleanDisplayName(text);
  if (name === "") {
    throw new Error("The model did not suggest a name. Try again.");
  }
  return name;
}
