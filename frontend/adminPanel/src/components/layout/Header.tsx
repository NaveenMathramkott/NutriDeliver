"use client";

import React from "react";
import { Menu, Search, Bell, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-72 rounded-lg border border-input bg-background px-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  3
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-2">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm">
                  Mark all read
                </Button>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {[
                  {
                    title: "New Order",
                    description: "Order #12345 received",
                    time: "2 min ago",
                  },
                  {
                    title: "Payment Received",
                    description: "$45.00 from Order #12344",
                    time: "15 min ago",
                  },
                  {
                    title: "New Restaurant",
                    description: "Pizza Palace requested verification",
                    time: "1 hour ago",
                  },
                ].map((notif, i) => (
                  <DropdownMenuItem
                    key={i}
                    className="px-2 py-2 hover:bg-accent"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.description}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {notif.time}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center py-2">
                <a
                  href="/notifications"
                  className="text-sm text-primary hover:underline"
                >
                  View all notifications
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage
                    src={user?.profile?.avatar}
                    alt={`${user?.profile?.firstName ?? ""} ${user?.profile?.lastName ?? ""}`.trim()}
                  />
                  <AvatarFallback className="rounded-lg text-sm font-medium text-primary-foreground">
                    {user?.profile?.firstName?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="font-medium">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => dispatch(logoutUser())}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
