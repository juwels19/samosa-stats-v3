"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MoonIcon, SunIcon } from "lucide-react";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Skeleton className="size-9 rounded-md" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (theme === "light" ? setTheme("dark") : setTheme("light"))}
      aria-label="Toggle theme"
    >
      <SunIcon className="hidden dark:block size-5" />
      <MoonIcon className="block dark:hidden size-5" />
    </Button>
  );
}
