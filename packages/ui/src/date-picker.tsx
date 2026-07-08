import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "./cn"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface DatePickerProps {
  id?: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Overrides the default "PPP" display (e.g. to include the weekday) — the value is unchanged. */
  formatValue?: (date: Date) => string
  /** Month the calendar opens on when there's no value yet — e.g. a calculated default date,
   * so the user starts from that context instead of today's month. */
  defaultMonth?: Date
  /** 0 = Sunday (react-day-picker's default), 1 = Monday, etc. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  "data-testid"?: string
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    { id, value, onChange, placeholder = "Pick a date", disabled, className, formatValue, defaultMonth, weekStartsOn, ...props },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            {...props}
          >
            <CalendarIcon className="size-4" />
            {value ? (formatValue ? formatValue(value) : format(value, "PPP")) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={defaultMonth ?? value}
            weekStartsOn={weekStartsOn}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    )
  }
)
DatePicker.displayName = "DatePicker"

export { DatePicker }
