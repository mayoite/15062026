"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function CookieConsent() {
    const [show, setShow] = useState(() => {
        if (typeof window === "undefined") return false;
        return !localStorage.getItem("oando-cookie-consent");
    });

    const handleAccept = () => {
        localStorage.setItem("oando-cookie-consent", "true");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full scheme-panel-dark p-6 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-theme-float">
            <div className="text-sm font-light max-w-2xl">
                <p>
                    We use cookies to optimize our website and our service.
                    <Link href="/privacy" className="underline hover:text-inverse-muted ml-1 focus-ring-theme">
                        Privacy Policy
                    </Link>
                </p>
            </div>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => setShow(false)} className="btn-outline-light">
                    Decline
                </Button>
                <Button onClick={handleAccept} className="btn-primary">
                    Accept All
                </Button>
            </div>
        </div>
    );
}
