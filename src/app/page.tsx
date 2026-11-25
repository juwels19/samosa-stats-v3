import { buttonVariants } from "@heroui/react";
import { ROUTES } from "@/lib/routes";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect(ROUTES.DASHBOARD);
  }

  return (
    <div className="px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_560px]">
        <div className="flex flex-col items-center gap-4 text-center text-balance lg:items-start lg:text-left">
          <h1 className="font-heading text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
            Welcome to Samosa Stats
          </h1>
          <p className="max-w-[600px] text-base text-muted md:text-xl">
            The home of degenerate FRC fantasy robotics. Talk to the taxman if
            you want in.
          </p>
          <p className="max-w-[600px] text-base text-muted md:text-xl">
            Note: Students are not allowed and will be rejected.
          </p>
          <div className="mt-2 grid w-full max-w-sm grid-cols-1 gap-2 sm:flex sm:w-auto sm:max-w-none">
            <Link
              href={ROUTES.SIGN_IN}
              className={buttonVariants({ size: "lg", fullWidth: true })}
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.WAITLIST}
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                fullWidth: true,
              })}
            >
              Request access
            </Link>
          </div>
        </div>
        <Image
          src="/hero.png"
          height={500}
          width={500}
          alt="Degenerate FRC robotics"
          className="w-full max-w-xs justify-self-center sm:max-w-sm lg:max-w-none"
          priority
        />
      </div>
    </div>
  );
}
