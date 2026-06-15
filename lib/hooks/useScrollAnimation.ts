'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollAnimation() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const animation = gsap.fromTo(ref.current,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
                scrollTrigger: { trigger: ref.current, start: 'top 85%' }
            }
        );

        return () => {
            animation.kill();
        };
    }, []);

    return ref;
}
