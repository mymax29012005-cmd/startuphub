/** Основная навигация сайта — те же пункты, что в шапке (Header). */
export const SITE_MAIN_NAV = [
  { href: "/marketplace", labelKey: "nav.marketplace" },
  { href: "/auction", labelKey: "nav.auctions" },
  { href: "/favorites", labelKey: "nav.favorites" },
  { href: "/chats", labelKey: "nav.chats", chatsUnread: true },
  { href: "/startup-analyzer", labelKey: "nav.analyzer" },
] as const;

export type SiteMainNavItem = (typeof SITE_MAIN_NAV)[number];

export function isMainNavActive(pathname: string, href: string): boolean {
  if (href === "/chats") return pathname === "/chats" || pathname.startsWith("/chat/");
  if (href === "/auction") return pathname === "/auction" || pathname.startsWith("/auction/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
