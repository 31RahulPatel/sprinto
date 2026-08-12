"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Cloud, Library, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SERVICE_NAV_ITEMS, getVisibleNav } from "../nav-items";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function NavGroup({
  label,
  icon: Icon,
  items,
  open,
  onToggle,
  pathname,
  onNavigate,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  open: boolean;
  onToggle: () => void;
  pathname: string | null;
  onNavigate: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-1 pl-3">
          {items.map(({ href, label: itemLabel, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={itemLabel}
              icon={icon}
              active={pathname === href}
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const { navItems, showServices, dataLibraryItems, bottomNavItems } = getVisibleNav(currentUser?.role);
  const [servicesOpen, setServicesOpen] = useState(pathname?.startsWith("/services") ?? false);
  const [dataLibraryOpen, setDataLibraryOpen] = useState(
    pathname?.startsWith("/data-library") ?? false,
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="left" className="w-64 border-none bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border">
          <SheetTitle className="text-sidebar-foreground">Compliance Platform</SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 px-3 py-2">
          {navItems.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || pathname?.startsWith(`${href}/`)}
              onClick={() => setOpen(false)}
            />
          ))}

          {showServices && (
            <NavGroup
              label="AWS Services"
              icon={Cloud}
              items={SERVICE_NAV_ITEMS}
              open={servicesOpen}
              onToggle={() => setServicesOpen((v) => !v)}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          )}

          <NavGroup
            label="Data Library"
            icon={Library}
            items={dataLibraryItems}
            open={dataLibraryOpen}
            onToggle={() => setDataLibraryOpen((v) => !v)}
            pathname={pathname}
            onNavigate={() => setOpen(false)}
          />

          <div className="pt-1">
            {bottomNavItems.map(({ href, label, icon }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname === href || pathname?.startsWith(`${href}/`)}
                onClick={() => setOpen(false)}
              />
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
