const config = {
  providers: [
    {
      // This needs to be process.env since this is executed on convex
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ]
};
export default config;