import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import Image from "next/image";

const logo = "/ss_logo.png";

export default function HomeIconLink() {
  return (
    <Link href={ROUTES.HOME} className="flex gap-2 items-center">
      <Image
        src={logo}
        alt="Samosa stats logo"
        width={50}
        height={50}
        className="rounded-lg"
      />

      <p className="font-bold text-inherit text-lg md:text-xl tracking-tight">
        Samosa Stats
      </p>
    </Link>
  );
}
