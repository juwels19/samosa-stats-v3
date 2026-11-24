import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import Image from "next/image";

export default function HomeIconLink() {
  return (
    <Link href={ROUTES.HOME} className="flex items-center gap-2">
      <Image
        src="/ss_logo.png"
        alt="Samosa Stats logo"
        width={40}
        height={40}
        className="size-9 rounded-lg md:size-10"
        priority
      />
      <span className="font-heading text-lg font-bold tracking-tight md:text-xl">
        Samosa Stats
      </span>
    </Link>
  );
}
