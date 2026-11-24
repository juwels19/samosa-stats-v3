import { scoringAgent } from "@/agents/scoring";

export async function GET() {
  const result = await scoringAgent.generate({
    prompt:
      "how many times was the first pick of alliance one 2026 onbar selected?",
  });

  return Response.json(result.output);
}
