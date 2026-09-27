import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"

export function Select({ ...props }: SelectPrimitive.Root.Props<any>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

export function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex w-full items-center justify-between rounded-full bg-[#18201a] border border-[#28362b] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-[#1e2820]",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-slate-400 shrink-0 transition-transform duration-200">
        <ChevronDown className="w-4 h-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectValue({
  className,
  placeholder,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      className={cn("truncate text-left", className)}
      {...props}
    />
  )
}

export function SelectContent({
  className,
  sideOffset = 6,
  align = "start",
  children,
  ...props
}: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, "sideOffset" | "align">) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative z-50 max-h-72 min-w-[10rem] overflow-hidden rounded-2xl bg-[#141b16] border border-[#26372a] p-1.5 text-white shadow-2xl backdrop-blur-xl duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List className="overflow-y-auto max-h-64 space-y-0.5 no-scrollbar">
            {children}
          </SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl py-2 px-3 text-xs sm:text-sm font-semibold text-slate-300 outline-none transition-colors hover:bg-[#1f2c22] hover:text-white data-[highlighted]:bg-[#1f2c22] data-[highlighted]:text-[#ccff00] data-[selected]:text-[#ccff00] data-[selected]:font-bold data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-2 shrink-0 text-[#ccff00]">
        <Check className="w-4 h-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
