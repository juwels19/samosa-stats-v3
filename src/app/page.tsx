import TestSignIn from "@/components/test-sign-in";
import Image from "next/image";

const hero = "/hero.png";

export default function Home() {
  return (
    <div className="container px-4 md:px-6 lg:px-10 py-4 self-center">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
        <div className="flex flex-col justify-center items-center lg:items-start space-y-4 text-center text-balance lg:text-left">
          <h1 className="font-bold tracking-tighter text-4xl xl:text-6xl/none">
            Welcome to Samosa Stats
          </h1>
          <p className="max-w-[600px] text-zinc-500 md:text-xl dark:text-zinc-400">
            The home of degenerate FRC fantasy robotics... Talk to the taxman if
            you want in.
          </p>
          <p className="max-w-[600px] text-zinc-500 md:text-xl dark:text-zinc-400">
            Note: Students are not allowed and will be rejected.
          </p>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <TestSignIn />
          </div>
        </div>
        <Image
          src={hero}
          height={500}
          width={500}
          alt="Degenerate FRC robotics"
          className="justify-self-center"
        />
      </div>
    </div>
  );
}
