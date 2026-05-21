import { Logo } from "@/components/atoms/logo";
import { DesktopNav } from "@/components/molecules/globals/desktop-nav";
import { MobileNav } from "@/components/molecules/globals/mobile-nav";

export const Header = () => {
  return (
    <header className="border-border/40 bg-card sticky top-0 z-50 w-full border-b shadow-sm backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Name */}
          <Logo size={20} fill />

          {/* Desktop Nav */}
          <DesktopNav />

          <div className="flex items-center gap-4">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
};
