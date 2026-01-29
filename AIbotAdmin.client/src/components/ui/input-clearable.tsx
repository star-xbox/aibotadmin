import * as React from "react"

import { Input } from "./input"
import { Button } from "./button"
import { XIcon } from "lucide-react"

function InputClearable({ className, type, ...props }: React.ComponentProps<"input">) {
    const [value, setValue] = React.useState<string | number | readonly string[] | undefined>(undefined)

    const handleClear = () => {
        setValue(undefined)
    }
    return (
      <div className="relative w-full max-w-sm">
            <Input {...props} value={value}  onChange={(e) => setValue(e.target.value)} />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                onClick={handleClear}
            >
                <XIcon className="h-4 w-4"/>
                <span className="sr-only">Clear</span>
            </Button>
    </div>
    //<input
    //  type={type}
    //  data-slot="input"
    //  className={cn(
    //    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
    //    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    //    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    //    className
    //  )}
    //  {...props}
    ///>
  )
}

export { InputClearable }
