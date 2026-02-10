"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
// Use native button for day cells to avoid size overrides from the app Button
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date())

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-1 [--cell-size:1.2rem] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
      
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      month={displayMonth}
      onMonthChange={setDisplayMonth}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "long" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-2 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-0",
          defaultClassNames.nav
        ),
        // ensure selected day has a visible purple background in both light and dark themes
        selected: cn("bg-[#a855f7] text-white dark:bg-[#7800A3] border-none"),
        button_previous: cn(
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 bg-transparent border-none shadow-none hover:bg-transparent focus:bg-transparent active:bg-transparent focus-visible:bg-transparent focus:ring-0",
          defaultClassNames.button_previous
        ),
        chevron : cn("size-8", defaultClassNames.chevron),
         
        
        button_next: cn(
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 bg-transparent border-none shadow-none hover:bg-transparent focus:bg-transparent active:bg-transparent focus-visible:bg-transparent focus:ring-0",
          defaultClassNames.button_next
        ),
        
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        dropdown_root: cn(
          "dark:bg-red-500  focus:ring-0 has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[0px] relative rounded-md border dark:focus:ring-0 ",
          defaultClassNames.dropdown_root
        ),
        // dropdown: cn(
        //   "bg-popover absolute inset-0 opacity-0 ",
        //   defaultClassNames.dropdown
        // ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-0 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        // months_dropdown:"dark:bg-red-500",
        
        table: "w-full border-collapse",
        weekdays: cn("grid grid-cols-7 gap-x-1 gap-y-0 w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground select-none rounded-md text-[0.45rem] font-normal flex items-center justify-center px-0 py-0",
          defaultClassNames.weekday
        ),
        week: cn("mt-0 grid w-full grid-cols-7 gap-0", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.4rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (<></>
              // <ChevronLeftIcon
              //   className={cn("h-4 w-4", className)}
              //   strokeWidth={1.2}
               
              //   fillOpacity={0}
              //   {...props}
              // />
            )
          }

          if (orientation === "right") {
            return (<></>
              // <ChevronRightIcon
              //   className={cn("h-4 w-4 ", className)}
              //   strokeWidth={1.2}
              //    fillOpacity={0}
              //   {...props}
              // />
            )
          }

          return (
            <ChevronDownIcon className={cn("h-4 w-4", className)} 
             fillOpacity={0}
            strokeWidth={1.2} {...props} />
          )
        },
        
        MonthCaption: () => {
          const month = displayMonth.getMonth()
          const year = displayMonth.getFullYear()
          const years = Array.from({ length: 21 }, (_, i) => year - 10 + i)

          return (
            <div className="flex items-center gap-2 px-2 pt-4">
              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(year, month - 1, 1))}
                className="h-[--cell-size] w-[--cell-size] flex items-center justify-center bg-transparent border-none p-0"
              >
                <ChevronLeftIcon className="h-6 w-6 text-current" 
                 strokeWidth={1.2}
               
                fillOpacity={0}
                />
              </button>

              <Select value={String(month)} onValueChange={(v) => setDisplayMonth(new Date(year, Number(v), 1))}>
                <SelectTrigger className="h-[--cell-size] px-2 py-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                  {Array.from({ length: 12 }).map((_, m) => (
                    <SelectItem key={m} value={String(m)} className="cursor-pointer dark:text-gray-200">
                      {new Date(0, m).toLocaleString(undefined, { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(year)} onValueChange={(v) => setDisplayMonth(new Date(Number(v), month, 1))}>
                <SelectTrigger className="h-[--cell-size] px-2 py-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[300] bg-white dark:bg-[#2a2640] border border-gray-200 dark:border-[#8B8D98]/50">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="cursor-pointer dark:text-gray-200">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => setDisplayMonth(new Date(year, month + 1, 1))}
                className="h-[--cell-size] w-[--cell-size] flex items-center justify-center bg-transparent border-none p-0"
              >
                <ChevronRightIcon className="h-6 w-6 text-current"
                 strokeWidth={1.2}
               
                fillOpacity={0}
                />
              </button>
            </div>
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        // dropdown item (html select/option)
        Option: ({ children, ...props }) => {
          return (
            <option
              {...props}
              className={cn(
                "dark:bg-black text-gray-200 px-2",
                props.className
              )}
            >
              {children}
            </option>
          )
        },
        // Months:({ children, ...props }) => {
        //   return (
        //     <div {...props} className={cn("dark:bg-red-500", props.className)}>
        //       {children}
        //     </div>
        //   )
        // },
        
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  children,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelectedSingle =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={isSelectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // base sizing and text
        "text-[0.75rem] flex flex-col items-center justify-center gap-0 font-normal leading-none",
        // sizing box
        "aspect-square h-[--cell-size] w-[--cell-size]",
        // selected single: explicit purple bg + white text so it's visible in light and dark
        "data-[selected-single=true]:bg-[#372c41] dark:data-[selected-single=true]:bg-[#a855f7] data-[selected-single=true]:text-white",
        // selected single smaller footprint
        "data-[selected-single=true]:rounded-lg data-[selected-single=true]:px-0 data-[selected-single=true]:py-0.5 data-[selected-single=true]:scale-95 data-[selected-single=true]:h-[calc(var(--cell-size)*0.95)] data-[selected-single=true]:min-w-[calc(var(--cell-size)*0.95)]",
         "data-[selected-single=false]:rounded-lg data-[selected-single=false]:px-0 data-[selected-single=false]:py-0.5 data-[selected-single=false]:scale-75 data-[selected-single=true]:h-[calc(var(--cell-size)*0.75)] data-[selected-single=false]:min-w-[calc(var(--cell-size)*0.75)]",
       
        // range states

        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        // inner span sizing: make unselected day number same size as selected
        //"data-[selected-single=true]:[&>span]:text-[0.34rem] [&>span]:text-[0.34rem] [&>span]:opacity-70",
        // include default DayPicker classnames
        defaultClassNames.day,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { Calendar, CalendarDayButton }
