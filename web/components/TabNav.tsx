"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/chat", label: "Chat" },
  { href: "/guide", label: "Guide" },
  { href: "/admin", label: "Admin" },
] as const;

export function TabNav({ showAdmin = true, showGuide = true }: { showAdmin?: boolean; showGuide?: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => (t.href === "/admin" ? showAdmin : true)).filter(
    (t) => (t.href === "/guide" ? showGuide : true)
  );

  return (
    <div className="tabs">
      <Image src="/logo.jpg" alt="Shoot & Scale" width={3961} height={2217} style={{ height: 64, width: "auto" }} priority />
      <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: 6 }}>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            className={`tab${pathname.startsWith(tab.href) ? " on" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
