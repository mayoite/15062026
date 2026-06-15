import React from "react";
import Image from "next/image";
import type { CatalogItem } from "../catalog/types";

interface CatalogProps {
  items: CatalogItem[];
  onSelect?: (item: CatalogItem) => void;
  className?: string;
}

export function Catalog({ items, onSelect, className = "" }: CatalogProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 p-4 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-blue-500 hover:shadow-md"
          onClick={() => onSelect?.(item)}
        >
          <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
            {item.thumbnail || item.imageUrl ? (
              <Image
                src={item.thumbnail || item.imageUrl || ""}
                alt={item.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-3">
            <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
              {item.name}
            </h3>
            {item.category && (
              <p className="text-xs text-gray-500">{item.category}</p>
            )}
            <div className="mt-auto pt-2">
              <div className="flex items-center gap-1 text-xs text-gray-600 tabular-nums">
                <span>{item.dimensions.widthMm}</span>
                <span className="text-gray-400">×</span>
                <span>{item.dimensions.depthMm}</span>
                <span className="text-gray-400">×</span>
                <span>{item.dimensions.heightMm}</span>
                <span className="ml-1 text-gray-400">mm</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
