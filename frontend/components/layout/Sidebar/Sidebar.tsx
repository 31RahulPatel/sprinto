"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Cloud, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssignedTasks } from "@/hooks/useAssignedTasks";
import { useAssignedGenericTasks } from "@/hooks/useAssignedGenericTasks";
import { useFindingsNeedingReview } from "@/hooks/useFindingsNeedingReview";
import { useTasksNeedingReview } from "@/hooks/useTasksNeedingReview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { SERVICE_NAV_ITEMS, getVisibleNav } from "../nav-items";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {!!badge && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1 text-xs font-semibold text-sidebar-primary-foreground">
          {badge}
        </span>
      )}
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
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
  open: boolean;
  onToggle: () => void;
  pathname: string | null;
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
            <NavLink key={href} href={href} label={itemLabel} icon={icon} active={pathname === href} />
          ))}
        </div>
      )}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const { navItems, showServices, dataLibraryItems, bottomNavItems } = getVisibleNav(currentUser?.role);
  const isOnServicesPage = pathname?.startsWith("/services") ?? false;
  const isOnDataLibraryPage = pathname?.startsWith("/data-library") ?? false;
  const [servicesOpen, setServicesOpen] = useState(isOnServicesPage);
  const [dataLibraryOpen, setDataLibraryOpen] = useState(isOnDataLibraryPage);
  const { pendingCount: findingPendingCount } = useAssignedTasks();
  const { pendingCount: genericPendingCount } = useAssignedGenericTasks();
  const { pendingCount: findingReviewCount } = useFindingsNeedingReview();
  const { pendingCount: taskReviewCount } = useTasksNeedingReview();
  const pendingCount =
    findingPendingCount + genericPendingCount + findingReviewCount + taskReviewCount;

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-6 text-lg font-semibold tracking-tight">
        Compliance Platform
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname?.startsWith(`${href}/`)}
            badge={href === "/tasks" ? pendingCount : undefined}
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
          />
        )}

        <NavGroup
          label="Data Library"
          icon={Library}
          items={dataLibraryItems}
          open={dataLibraryOpen}
          onToggle={() => setDataLibraryOpen((v) => !v)}
          pathname={pathname}
        />

        <div className="pt-1">
          {bottomNavItems.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || pathname?.startsWith(`${href}/`)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
