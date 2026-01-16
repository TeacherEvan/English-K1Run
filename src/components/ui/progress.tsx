import * as ProgressPrimitive from "@radix-ui/react-progress"
import { type ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-white/30 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-green-500 h-full w-full flex-1 transition-all shadow-[0_0_10px_rgba(34,197,94,0.5)]"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
