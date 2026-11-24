import { wrapLanguageModel, type LanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";

type WrappableModel = Parameters<typeof wrapLanguageModel>[0]["model"];

/** Adds AI SDK devtools in development only. The package throws in production. */
export function withDevTools(model: WrappableModel): LanguageModel {
  if (process.env.NODE_ENV !== "development") return model;
  return wrapLanguageModel({ model, middleware: devToolsMiddleware() });
}
