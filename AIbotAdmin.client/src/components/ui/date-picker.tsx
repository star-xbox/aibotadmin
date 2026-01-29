import { cn, formatDateYYYYMMDD } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { IconCalendar } from "@tabler/icons-react";
import { Button } from "./button";
import { Input } from "./input";
import { ja } from 'date-fns/locale'
import { startOfMonth, isValid } from 'date-fns';
import { useState, useEffect } from "react";
import { safeFormat, toValidDate } from "@/utils";

const formatters = {
    formatMonthDropdown: (date: Date) => safeFormat(date, 'MMM', 'MMM'),
    formatYearDropdown: (date: Date) => safeFormat(date, 'yyyy', 'yyyy'),
    formatCaption: (date: Date) => safeFormat(date, 'yyyy年 MMM', 'yyyy年 MMM'),
};

export function DatePicker({ field, disabled, className }: {
    field: any
    disabled?: boolean | undefined
    className?: string | undefined;
}) {
    const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors?.length;
    const startYear = new Date().getFullYear() - 15;
    const endYear = startYear + 20;
    const selectedDate = toValidDate(field.state.value);
    const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
        const parsed = toValidDate(field.state.value);
        return parsed ? startOfMonth(parsed) : startOfMonth(new Date());
    });
    const [open, setOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState("");

    useEffect(() => {
        if (field.state.value && field.state.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Nếu là format YYYY-MM-DD, chuyển sang YYYY/MM/DD để hiển thị
            const [year, month, day] = field.state.value.split('-');
            setDisplayValue(`${year}/${month}/${day}`);
        } else if (field.state.value && field.state.value.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
            setDisplayValue(field.state.value);
        } else {
            setDisplayValue("");
        }
    }, [field.state.value]);

    const handleOpenPopover = () => {
        if (disabled) return;
        const parsed = toValidDate(field.state.value);
        setCalendarMonth(parsed ? startOfMonth(parsed) : startOfMonth(new Date()));
        setOpen(true);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date && isValid(date)) {
            const dateString = formatDateYYYYMMDD(date);
            field.handleChange(dateString);
        } else {
            field.handleChange('');
        }
        setOpen(false);
    };

    const handleTodayClick = () => {
        if (disabled) return;
        const today = new Date();
        const dateString = formatDateYYYYMMDD(today);
        field.handleChange(dateString);
        setOpen(false);
    };

    const handleClearClick = () => {
        if (disabled) return;
        field.handleChange('');
        setOpen(false);
    };

    return (
        <div className="relative flex gap-2 w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <div className="w-full">
                        <Input
                            id={field.name}
                            name={field.name}
                            value={displayValue}
                            readOnly
                            aria-invalid={isInvalid}
                            autoComplete="off"
                            placeholder="YYYY/MM/DD"
                            className={cn(
                                "bg-background pr-10 disabled:bg-secondary cursor-pointer",
                                className
                            )}
                            disabled={disabled}
                            onClick={handleOpenPopover}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                            <div className="text-sm font-medium text-gray-700">
                                {calendarMonth && safeFormat(calendarMonth, 'yyyy年 MMM', 'yyyy年 MMM')}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleTodayClick}
                                    disabled={disabled}
                                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                    今日
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearClick}
                                    disabled={disabled}
                                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>

                        <Calendar
                            mode="single"
                            formatters={formatters}
                            locale={ja}
                            captionLayout="dropdown"
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            startMonth={new Date(startYear, 0)}
                            endMonth={new Date(endYear, 11)}
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <Button
                id="date-picker"
                variant="ghost"
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2 hover:bg-transparent"
                disabled={disabled}
                onClick={handleOpenPopover}
            >
                <IconCalendar className="size-3.5 text-gray-500" />
                <span className="sr-only">Select date</span>
            </Button>
        </div>
    );
}