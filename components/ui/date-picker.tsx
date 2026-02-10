"use client"

import * as React from "react"
import { format } from "date-fns"
import { th, enUS } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import "react-day-picker/style.css"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  locale?: string
  showClearButton?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  disabled = false,
  className,
  locale = "th",
  showClearButton = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const dateLocale = locale === "th" ? th : enUS
  
  // Convert string date to Date object
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === "string" && value) {
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? undefined : parsed
    }
    return undefined
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "text-sm w-full justify-start text-left font-normal cursor-pointer shadow-none group",
            "bg-white dark:bg-[#1f1d2e] border-gray-300 dark:border-[#8B8D98]/20",
            "text-gray-900 dark:text-gray-100",
            "hover:bg-gray-100 dark:hover:bg-[#2a2640] hover:text-gray-900 dark:hover:text-white",
            "focus:ring-2 focus:ring-[#7800A3] focus:border-[#7800A3]",
            !dateValue && "text-gray-500 dark:text-gray-400 dark:hover:text-gray-300",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
          <span className="flex-1 truncate text-sm">
            {dateValue ? (
              format(dateValue, locale === "th" ? "d MMM yyyy" : "MMM d, yyyy", { locale: dateLocale })
            ) : (
              placeholder
            )}
          </span>
          {showClearButton && dateValue && !disabled && (
            <X 
              className="ml-1 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-300 bg-white dark:bg-[#1f1d2e] border border-gray-200 dark:border-[#8B8D98]/30 shadow-lg rounded-lg" 
        align="start"
        sideOffset={4}
      >
         <Calendar 
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          autoFocus={true}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2099, 0)}
          locale={dateLocale}
          navLayout="around"
         
        /> 
        {/* <Calendar mode="single" selected={dateValue} onSelect={handleSelect}
        initialFocus
         captionLayout="dropdown"  locale={dateLocale}
        /> */}
      </PopoverContent>
    </Popover>
  )
}
