import { gateway } from "ai";
import { withDevTools } from "./with-dev-tools";

const sonarModel = withDevTools(gateway("perplexity/sonar"));

export { sonarModel };
