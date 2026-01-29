import { Button } from "@/components/ui/button";
/*import type { ReactNode } from "react";*/

interface InforBoxProps {
    data: string;
}

export default function InforBox({ data }: InforBoxProps) {
    const items = data && data.length > 0 ? data.split(";").filter(x => x.trim() !== "") : '';
    const first = items[0] || "";
    const hasNewline = first.includes("\n");
    const lines = hasNewline ? first.split("\n") : [first];

    return (
        <div className="border-dashed border-3 border-gray-500 bg-orange-100 mt-20 m-5 p-5 min-w-[550px] m-auto @xl/main:min-w-full">
            {lines.map((line, idx) => (
                <span key={idx}>
                    {line}
                    <br />
                </span>
            ))}
            <Button asChild variant="link" className="p-0">
                <a href={items[2]} target="_blank">{items[1]} </a>
            </Button>
        </div>
        
    )
}