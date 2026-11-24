import ThemeSwitcher from "@/components/common/theme-switcher";
import AuthButtons from "@/components/navigation/auth-buttons";
import HomeIconLink from "@/components/navigation/home-icon-link";
import NavLinks from "@/components/navigation/nav-links";
import MobileMenu from "@/components/navigation/mobile-menu";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-separator bg-background/90 pt-safe backdrop-blur-lg">
      <div className="mx-auto flex h-(--nav-height) max-w-screen-2xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <HomeIconLink />
          <NavLinks />
        </div>
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <AuthButtons />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
