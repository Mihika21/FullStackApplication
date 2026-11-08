"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4 select-none">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-hgv-navy transition"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 mx-1.5 text-slate-300" />
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="hover:text-hgv-navy transition">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-hgv-navy">{crumb.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
