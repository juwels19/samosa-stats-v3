import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "Sign In",
  description: "Sign in to Samosa Stats",
};

export default function SignInPage() {
  return (
    <div className="flex w-full justify-center px-4 pt-6 pb-10 sm:items-center sm:px-6 sm:pt-12">
      <SignIn
        forceRedirectUrl={ROUTES.DASHBOARD}
        signUpForceRedirectUrl={ROUTES.DASHBOARD}
        transferable={false}
        waitlistUrl={ROUTES.WAITLIST}
        withSignUp={false}
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            cardBox: "w-full max-w-none",
            footerAction: "hidden",
          },
        }}
      />
    </div>
  );
}
