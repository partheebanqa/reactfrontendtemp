import * as React from "react"
import { cn } from "@/lib/utils"

export function AnimatedShinyText({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <span
            className={cn(
                "rounded-30 relative inline-flex items-center justify-center",
                // Shiny gradient
                "before:pointer-events-none before:absolute before:inset-0",
                "before:bg-[linear-gradient(110deg,transparent,45%,rgba(255,255,255,0.7),55%,transparent)]",
                "before:bg-[length:200%_100%]",
                "before:animate-shiny",
                className
            )}
        >
            {children}
        </span>
    )
}
