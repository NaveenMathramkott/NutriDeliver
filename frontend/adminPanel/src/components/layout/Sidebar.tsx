"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Utensils,
  Package,
  CreditCard,
  Tag,
  Bell,
  Truck,
  Shield,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { toggleSidebarCollapsed } from "@/store/slices/uiSlice";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Restaurants", href: "/restaurants", icon: Store },
  { name: "Food Items", href: "/food", icon: Utensils },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Orders", href: "/orders", icon: Package },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Offers", href: "/offers", icon: Tag },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Riders", href: "/riders", icon: Truck },
  { name: "Admins", href: "/admins", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
        sidebarCollapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="NutriDeliver Admin"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Utensils className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold text-foreground">
                NutriDeliver
              </span>
            )}
          </Link>
          {/* <button
            onClick={() => dispatch(toggleSidebarCollapsed())}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button> */}
        </div>

        <nav
          className="flex-1 overflow-y-auto p-4 space-y-1"
          aria-label="Main navigation"
        >
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2",
              sidebarCollapsed && "justify-center",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              {user?.profile?.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium text-primary-foreground">
                  {user?.profile?.firstName?.charAt(0).toUpperCase() || "A"}
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => dispatch(logoutUser())}
              className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
