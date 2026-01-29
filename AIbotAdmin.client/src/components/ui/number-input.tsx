
import { ChevronDown, ChevronUp } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import type { NumericFormatProps } from 'react-number-format';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';

type InputPropsWithoutType = Omit<
  React.ComponentProps<'input'>,
  'type' // ← remove type
>;

export interface NumberInputProps extends InputPropsWithoutType, Omit<NumericFormatProps, 'value' | 'onValueChange' | 'type'> {
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
  value?: string;
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: string | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
  showButton?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      showButton,
      value: controlledValue,
      ...props
    },
    ref
  ) => {
    if(showButton == undefined)
      showButton = true;
    const internalRef = useRef<HTMLInputElement>(null);
    const combinedRef = ref || internalRef;
    const [value, setValue] = useState<string | undefined>(
      controlledValue ?? defaultValue
    );

    const handleIncrement = useCallback(() => {
      setValue((prev) =>{
        const current = prev === undefined ? 0 : Number(prev);
        const next = Math.min(current + (stepper ?? 1), max);
        return next.toString();
      });
    }, [stepper, max]);

    const handleDecrement = useCallback(() => {
      setValue((prev) =>{
        const current = prev === undefined ? 0 : Number(prev);
        const next = Math.max(current - (stepper ?? 1), min);
        return next.toString();
      });
    }, [stepper, min]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement ===
          (combinedRef as React.RefObject<HTMLInputElement>).current
        ) {
          if (e.key === 'ArrowUp') {
            handleIncrement();
          } else if (e.key === 'ArrowDown') {
            handleDecrement();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, [handleIncrement, handleDecrement, combinedRef]);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue);
      }
    }, [controlledValue]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue + '';
      setValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    const handleBlur = () => {
      if (value !== undefined) {
        var v = Number(value)
        if (v < min) {
          setValue(min.toString());
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(min);
        } else if (v > max) {
          setValue(max.toString());
          (ref as React.RefObject<HTMLInputElement>).current!.value =
            String(max);
        }
      }
    };

    return (
      <div className="flex items-center">
        <InputGroup {...props}>
          <NumericFormat
            value={value}
            onValueChange={handleChange}
            thousandSeparator={thousandSeparator}
            decimalScale={decimalScale}
            fixedDecimalScale={fixedDecimalScale}
            allowNegative={min < 0}
            valueIsNumericString
            onBlur={handleBlur}
            max={max}
            min={min}
            suffix={suffix}
            prefix={prefix}
            customInput={InputGroupInput}
            placeholder={placeholder}           
            getInputRef={combinedRef}
            {...props}
          />
          {showButton && <InputGroupAddon align="inline-end" className="flex flex-col gap-0 p-[7px] mr-0">
            <InputGroupButton
              aria-label="Increase value"
              className="px-2 h-3 border-input rounded-md rounded-l-none rounded-br-none border-r-0  border-t-0 border-input focus-visible:relative"
              variant="outline"
              onClick={handleIncrement}
              disabled={Number(value ?? '0') >= max}
             
            >
              <ChevronUp size={15} />
            </InputGroupButton>
            <InputGroupButton
              aria-label="Decrease value"
              className="px-2 h-3 border-input rounded-md rounded-l-none rounded-tr-none border-r-0 border-b-0 border-input focus-visible:relative"
              variant="outline"
              onClick={handleDecrement}
              disabled={Number(value ?? '0') <= min}             
            >
              <ChevronDown size={15} />
            </InputGroupButton>
          </InputGroupAddon>}
        </InputGroup>
      </div>
    );
  }
);
