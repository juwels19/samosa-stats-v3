import { Waitlist } from "@clerk/nextjs";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "Join Waitlist",
  description: "Join the Samosa Stats waitlist",
};

export default function WaitlistPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <Waitlist signInUrl={ROUTES.SIGN_IN} />
    </div>
  );
}
