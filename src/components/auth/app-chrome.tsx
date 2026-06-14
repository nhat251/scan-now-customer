"use client";

import { usePathname } from "next/navigation";

import { ScrollToTopButton } from "@/components/atoms/scroll-to-top-button";
import { Footer } from "@/components/molecules/globals/footer";
import { Header } from "@/components/molecules/globals/header";
import { PATH } from "@/constants/path";

const HIDE_PUBLIC_CHROME_PREFIXES = [
  PATH.owner.root,
  PATH.manager.root,
  PATH.me.root,
  PATH.staff.root,
  PATH.kitchen.root,
  PATH.cashier.root,
  PATH.customer.tablesRoot,
  PATH.customer.sessionsRoot,
  PATH.payment.root,
];
const HIDE_PUBLIC_CHROME_PATHS = [PATH.auth.login];

const shouldHidePublicChrome = (pathname: string) => {
  return (
    HIDE_PUBLIC_CHROME_PATHS.includes(pathname as (typeof HIDE_PUBLIC_CHROME_PATHS)[number]) ||
    HIDE_PUBLIC_CHROME_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
};

export const AppChrome = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const hidePublicChrome = shouldHidePublicChrome(pathname);

  return (
    <>
      {!hidePublicChrome ? <Header /> : null}
      {children}
      {!hidePublicChrome ? <Footer /> : null}
      {!hidePublicChrome ? <ScrollToTopButton /> : null}
    </>
  );
};
