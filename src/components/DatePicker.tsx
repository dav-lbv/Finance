import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronDownIcon, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parser la date string "YYYY-MM-DD"
  const date = React.useMemo(() => {
    if (!value) return undefined
    const parts = value.split("-").map(Number)
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return undefined
    }
    return new Date(parts[0], parts[1] - 1, parts[2])
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
      const day = String(selectedDate.getDate()).padStart(2, "0")
      onChange(`${year}-${month}-${day}`)
      setOpen(false)
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[10px] font-bold uppercase text-fg-2 mb-1">
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              type="button"
              data-empty={!date}
              className="w-full justify-between text-left font-normal bg-surface-2 hover:bg-surface-2 border-line-strong text-fg hover:text-fg rounded-2xl h-10 px-3.5 focus-visible:border-brand focus-visible:ring-brand/30 cursor-pointer shadow-sm data-[empty=true]:text-muted-foreground"
            >
              <span className="flex items-center gap-2 truncate">
                <CalendarIcon className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className={date ? "text-fg font-medium" : "text-fg-muted"}>
                  {date ? format(date, "d MMMM yyyy", { locale: fr }) : <span>{placeholder}</span>}
                </span>
              </span>
              <ChevronDownIcon data-icon="inline-end" className="w-4 h-4 text-fg-muted shrink-0" />
            </Button>
          }
        />
        <PopoverContent
          className="w-auto p-0 bg-surface border-line-strong text-fg rounded-2xl shadow-2xl z-50 overflow-hidden"
          align="start"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            defaultMonth={date || new Date()}
            locale={fr}
            className="rounded-2xl bg-surface text-fg p-3"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
