"use client";

import { Authenticated } from "convex/react";
import { AppLayout } from "@/components/app-layout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Authenticated>
      <AppLayout>{children}</AppLayout>
    </Authenticated>
  );
}
