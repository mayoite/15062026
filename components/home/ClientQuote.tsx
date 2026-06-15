export function ClientQuote() {
    return (
        <section className="w-full bg-panel border-t border-soft py-20 md:py-28">
            <div className="container px-6 2xl:px-0 max-w-4xl">
                <p className="typ-label text-muted mb-10">What our clients say</p>
                <blockquote>
                    <p className="typ-section text-strong mb-10">
                        &ldquo;They delivered exactly what we specified — on time, on budget,
                        and without the usual disruption to our operations.&rdquo;
                    </p>
                    <footer className="flex items-center gap-4">
                        <div className="w-8 h-[1px] bg-muted" />
                        <div>
                            <p className="text-sm font-medium text-strong">Procurement Head</p>
                            <p className="typ-label text-muted mt-1">Delhi Metro Rail Corporation</p>
                        </div>
                    </footer>
                </blockquote>
            </div>
        </section>
    );
}


