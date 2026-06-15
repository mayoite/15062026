"use client";

import { Button } from "@/components/ui/Button";

interface JobCardProps {
    title: string;
    department: string;
    location?: string;
    onClick?: () => void;
}

export function JobCard({ title, department, location = "Patna", onClick }: JobCardProps) {
    return (
        <div className="shell-card shell-accent-border-hover group flex flex-col items-start justify-between p-6 transition-all duration-300 hover:-translate-y-0.5 md:flex-row md:items-center">
            <div>
                <h3 className="typ-h3 text-strong transition-colors group-hover:text-primary">
                    {title}
                </h3>
                <p className="page-copy-sm text-body mt-1">
                    {location} | {department}
                </p>
            </div>
            <Button
                variant="outline"
                className="mt-4 md:mt-0"
                onClick={onClick}
            >
                View Details
            </Button>
        </div>
    );
}
