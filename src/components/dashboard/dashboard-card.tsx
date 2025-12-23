"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardCardProps = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  iconBg: string;
  iconTone: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

export function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  tone,
  iconBg,
  iconTone,
  className,
  contentClassName,
  children,
}: DashboardCardProps) {
  return (
    <Card className={`relative overflow-hidden ${tone} ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <Link href={href} className="flex w-full items-start gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconTone}`} />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </Link>
      </CardHeader>
      <CardContent className={`space-y-4 ${contentClassName ?? ""}`}>
        {children}
      </CardContent>
    </Card>
  );
}
