import { gateway } from "ai";
import { withDevTools } from "./with-dev-tools";

const gpt4_1Nano = withDevTools(gateway("openai/gpt-4.1-nano"));

export { gpt4_1Nano };
