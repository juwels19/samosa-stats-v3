import { createEnv } from "@t3-oss/env-nextjs";
import * as z from 'zod/v4';

export const serverEnv = createEnv({
  server: {
    CONVEX_DEPLOYMENT: z.string(),
    CLERK_SECRET_KEY: z.string()
  },
  experimental__runtimeEnv: process.env
})