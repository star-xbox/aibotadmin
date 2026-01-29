import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
    field: {
        name: string;
        state: {
            value: string;
            meta: {
                isTouched: boolean;
                errors: any[];
            };
        };
        handleChange: (value: string) => void;
        handleBlur: (e: any) => void;
    };
    disabled?: boolean;
    className?: string;
}

export function TimePicker({ field, disabled, className }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const [hours, setHours] = useState("00");
    const [minutes, setMinutes] = useState("00");
    const hoursContainerRef = useRef<HTMLDivElement>(null);
    const minutesContainerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const isClosing = useRef(false);

    const isInvalid = field.state.meta.isTouched && !!field.state.meta.errors?.length;

    // Parse giá trị hiện tại
    useEffect(() => {
        if (field.state.value && field.state.value.match(/^\d{2}:\d{2}$/)) {
            const [h, m] = field.state.value.split(':');
            setHours(h);
            setMinutes(m);
        } else {
            setHours("00");
            setMinutes("00");
        }
    }, [field.state.value]);

    // Scroll đến giá trị khi mở popover
    useEffect(() => {
        if (open && !disabled) {
            // Đợi popover render xong
            requestAnimationFrame(() => {
                const hourElement = hoursContainerRef.current?.querySelector(`[data-hour="${hours}"]`);
                const minuteElement = minutesContainerRef.current?.querySelector(`[data-minute="${minutes}"]`);

                if (hourElement) {
                    hourElement.scrollIntoView({ block: 'center', behavior: 'instant' });
                }
                if (minuteElement) {
                    minuteElement.scrollIntoView({ block: 'center', behavior: 'instant' });
                }
            });
        }
    }, [open, hours, minutes, disabled]);

    const handleOpenPopover = useCallback(() => {
        if (disabled) return;
        isClosing.current = false;
        setOpen(true);
    }, [disabled]);

    const handleClosePopover = useCallback(() => {
        if (isClosing.current) return;

        isClosing.current = true;

        // Thêm animation fade-out nếu muốn
        if (popoverRef.current) {
            popoverRef.current.style.opacity = '0';
            popoverRef.current.style.transform = 'scale(0.95)';
        }

        // Đóng sau animation
        setTimeout(() => {
            setOpen(false);
            isClosing.current = false;
        }, 100);
    }, []);

    // Chọn thời gian hiện tại
    const handleNowClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');

        const timeString = `${h}:${m}`;
        field.handleChange(timeString);
        setHours(h);
        setMinutes(m);

        // Đóng popover mượt mà
        handleClosePopover();
    }, [disabled, field, handleClosePopover]);

    // Xóa thời gian
    const handleClearClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;

        field.handleChange('');
        setHours("00");
        setMinutes("00");

        // Đóng popover mượt mà
        handleClosePopover();
    }, [disabled, field, handleClosePopover]);

    // Chọn giờ
    const handleHourClick = useCallback((h: string) => {
        if (disabled) return;

        setHours(h);

        // Chỉ apply nếu đã có phút
        if (minutes !== "00") {
            const timeString = `${h}:${minutes}`;
            field.handleChange(timeString);
        }

        // Scroll đến phút
        requestAnimationFrame(() => {
            const minuteElement = minutesContainerRef.current?.querySelector(`[data-minute="${minutes}"]`);
            if (minuteElement) {
                minuteElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });
    }, [disabled, field, minutes]);

    // Chọn phút
    const handleMinuteClick = useCallback((m: string) => {
        if (disabled) return;

        setMinutes(m);
        const timeString = `${hours}:${m}`;
        field.handleChange(timeString);

        // Đóng popover ngay lập tức mà không animation
        handleClosePopover();
    }, [disabled, field, hours, handleClosePopover]);

    const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    // Format hiển thị cho input
    const displayValue = field.state.value || '';

    return (
        <div className="relative w-full">
            <Popover
                open={open && !disabled}
                onOpenChange={(newOpen) => {
                    if (disabled) return;

                    if (newOpen) {
                        handleOpenPopover();
                    } else {
                        handleClosePopover();
                    }
                }}
            >
                <PopoverTrigger asChild>
                    <div className="w-full">
                        <Input
                            id={field.name}
                            name={field.name}
                            value={displayValue}
                            readOnly
                            onBlur={field.handleBlur}
                            aria-invalid={isInvalid}
                            autoComplete="off"
                            placeholder="HH:MM"
                            className={cn(
                                "bg-background pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70",
                                "cursor-pointer",
                                className
                            )}
                            disabled={disabled}
                            onClick={handleOpenPopover}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    ref={popoverRef}
                    className="w-56 p-3 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-100"
                    align="end"
                    alignOffset={-8}
                    sideOffset={4}
                    onCloseAutoFocus={(e) => e.preventDefault()}
                    onEscapeKeyDown={handleClosePopover}
                    onPointerDownOutside={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('[data-hour]') || target.closest('[data-minute]')) {
                            e.preventDefault();
                        } else {
                            handleClosePopover();
                        }
                    }}
                    style={{
                        animationDuration: '0.1s',
                        animationFillMode: 'forwards'
                    }}
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">Select Time</div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleNowClick}
                                    disabled={disabled}
                                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
                                >
                                    Now
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearClick}
                                    disabled={disabled}
                                    className="px-2 py-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Time Selection */}
                        <div className="flex items-center justify-center gap-3">
                            {/* Hours */}
                            <div className="flex-1">
                                <div className="text-xs font-medium text-gray-500 mb-1 text-center">Hour</div>
                                <div
                                    ref={hoursContainerRef}
                                    className="h-40 overflow-y-auto rounded border border-gray-200"
                                >
                                    {hoursList.map((h) => (
                                        <button
                                            key={h}
                                            type="button"
                                            data-hour={h}
                                            onClick={() => handleHourClick(h)}
                                            disabled={disabled}
                                            className={`w-full py-1.5 text-sm text-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hours === h
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700'
                                                }`}
                                        >
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="text-xl text-gray-400 font-bold pt-6">:</div>

                            {/* Minutes */}
                            <div className="flex-1">
                                <div className="text-xs font-medium text-gray-500 mb-1 text-center">Min</div>
                                <div
                                    ref={minutesContainerRef}
                                    className="h-40 overflow-y-auto rounded border border-gray-200"
                                >
                                    {minutesList.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            data-minute={m}
                                            onClick={() => handleMinuteClick(m)}
                                            disabled={disabled}
                                            className={`w-full py-1.5 text-sm text-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${minutes === m
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-700'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Selected Time Preview */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="text-center">
                                <div className="text-xs text-gray-500">Selected</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {hours}:{minutes}
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-6 -translate-y-1/2 hover:bg-transparent"
                disabled={disabled}
                onClick={handleOpenPopover}
            >
                <Clock className="size-3.5 text-gray-500" />
                <span className="sr-only">Select time</span>
            </Button>
        </div>
    );
}