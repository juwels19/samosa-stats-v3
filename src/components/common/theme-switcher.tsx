"use client";

import { Button } from "@heroui/react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";

export default function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="ghost"
      className="size-11"
      aria-label="Toggle theme"
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="block size-5 dark:hidden" />
    </Button>
  );
}
