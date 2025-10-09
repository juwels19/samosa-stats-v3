import AuthButtons from "@/components/navigation/auth-buttons";
import HomeIconLink from "@/components/navigation/home-icon-link";
import NavLinks from "@/components/navigation/nav-links";
import NavSideSheet from "@/components/navigation/side-sheet";

export default function TopNav() {
  return (
    <header className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
        <div className="flex gap-6 items-center">
          <HomeIconLink />
          <NavLinks />
        </div>
        <div className="flex gap-2 items-center">
          <AuthButtons />
          <NavSideSheet />
        </div>
      </div>
    </header>
  );
}
