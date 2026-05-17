import ThemeSwitcher from "@/components/common/theme-switcher";
import AuthButtons from "@/components/navigation/auth-buttons";
import HomeIconLink from "@/components/navigation/home-icon-link";
import NavLinks from "@/components/navigation/nav-links";
import NavSideSheet from "@/components/navigation/side-sheet";

export default function TopNav() {
  return (
    <header className="sticky top-0 h-(--nav-height) w-full border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 [&_*]:no-underline">
      <div className="container mx-auto flex h-full max-w-screen-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <HomeIconLink />
          <NavLinks />
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <AuthButtons />
          <NavSideSheet />
        </div>
      </div>
    </header>
  );
}
