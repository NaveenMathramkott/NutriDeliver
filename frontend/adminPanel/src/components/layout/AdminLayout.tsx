"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setSidebarOpen } from "@/store/slices/uiSlice";

export function AdminLayout() {
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300 lg:pl-64",
          sidebarOpen ? "pl-64" : "pl-0",
        )}
      >
        <Header onMenuClick={() => dispatch(setSidebarOpen(!sidebarOpen))} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-hidden="true"
        />
      )}
      <Toaster />
    </div>
  );
}
