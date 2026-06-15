"use client";

import React from "react";
import clsx from "clsx";

interface MasonryProps {
    children: React.ReactNode;
    columns?: number;
    gap?: string | number;
    className?: string;
}

export function Masonry({
    children,
    columns = 3,
    gap = "2rem",
    className,
}: MasonryProps) {
    // A simple CSS-based masonry using column-count
    return (
        <div
            className={clsx("w-full", className)}
            style={{
                columnCount: columns,
                columnGap: gap,
            }}
        >
            {/* 
          Note: For a true masonry layout that balances height, 
          you often need JS. But for simple needs, 
          column-count works across modern browsers.
      */}
            {children}
        </div>
    );
}

interface MasonryItemProps {
    children: React.ReactNode;
    className?: string;
}

export function MasonryItem({ children, className }: MasonryItemProps) {
    return (
        <div
            className={clsx("break-inside-avoid mb-8 block", className)}
            style={{
                breakInside: "avoid",
            }}
        >
            {children}
        </div>
    );
}
