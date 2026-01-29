import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { IconCaretDownFilled, IconCaretUpFilled } from "@tabler/icons-react"

interface TableColumnSorterProps extends React.ComponentProps<typeof Button> {
  title: string
  sortDirection?: false | "asc" | "desc",
  defaultSort?: "asc" | "desc"
}

function TableColumnSorter({
  title,
  sortDirection,
  defaultSort = "asc",
  className,
  ...props
}: TableColumnSorterProps) {
  const nextDirection = sortDirection
    ? sortDirection === "asc" ? "desc" : "asc"
    : defaultSort

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full flex items-center justify-between h-9 px-2 rounded-md group",
        "hover:bg-accent/70 transition-colors",
        className
      )}
      {...props}
    >
      <span className="font-medium text-sm">{title}</span>
      <div className="flex flex-col items-center -space-y-2">
        <IconCaretUpFilled
          className={cn(
            "h-3.5 w-3.5 transition-opacity duration-200",
            sortDirection === "asc" && "opacity-100 text-foreground",
            nextDirection === "asc" && "opacity-30 group-hover:opacity-70",
            nextDirection !== "asc" && sortDirection !== "asc" && "opacity-30"
          )}
        />

        <IconCaretDownFilled
          className={cn(
            "h-3.5 w-3.5 transition-opacity duration-200",
            sortDirection === "desc" && "opacity-100 text-foreground",
            nextDirection === "desc" && "opacity-30 group-hover:opacity-70",
            nextDirection !== "desc" && sortDirection !== "desc" && "opacity-30"
          )}
        />
      </div>
    </Button>
  )
}

export { TableColumnSorter }