import { SignIn } from "@clerk/nextjs";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "Sign In",
  description: "Sign in to Samosa Stats",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <SignIn
        waitlistUrl={ROUTES.WAITLIST}
        appearance={{
          elements: {
            footerAction: "hidden",
          },
        }}
      />
    </div>
  );
}
