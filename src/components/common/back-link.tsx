import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

/** Small "‹ Label" link for the top of a detail page. 44px tap target. */
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-xl px-2 text-sm font-medium text-muted transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
    >
      <ChevronLeftIcon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}
