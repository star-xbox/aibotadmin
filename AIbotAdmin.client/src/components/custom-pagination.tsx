import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink
} from "@/components/ui/pagination";

interface MyPaginationProps {
    currentPage: number;
    pageSize: number;
    totalRows: number;
    className?: string;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

export function CustomPagination({ className, currentPage, totalRows, pageSize, onPageChange, onPageSizeChange }: MyPaginationProps) {
    const totalPages = Math.ceil(totalRows / pageSize)
    let pageNumbers: number[] = [];
    if(totalPages < 10){
       pageNumbers = Array.from({ length: totalPages-2 }, (_, i) => i + 2)
    }
    else if(currentPage < 4){
       pageNumbers = Array.from({ length: 5 }, (_, i) => i + 2).filter(page => page <= 5 && page < totalPages);
    }
    else if(currentPage == totalPages){
        pageNumbers = Array.from({ length: 5 }, (_, i) => i + currentPage - 4).filter(page => page > 1 && page < totalPages);
    }
    else{
        pageNumbers = Array.from({ length: 5 }, (_, i) => i + currentPage - 2).filter(page => page > 1 && page < totalPages);
    }
    const pageSizeArray = [10, 20, 30, 40, 50, 100];
    const startRow = ((currentPage - 1) * pageSize) + 1;
    let endRow = ((currentPage - 1) * pageSize) + pageSize;
    endRow = endRow > totalRows ? totalRows : endRow;
    const endPage = pageNumbers[pageNumbers.length - 1] || 1;
    return (
        <Pagination className={className}>
            <PaginationContent>
                <Label className="text-sm font-medium">第 { startRow }-{endRow} 条/总共 {totalRows} 条</Label>              
                {totalPages > 1 && <Button size="sm" variant="ghost" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage == 1}> <IconArrowLeft />前へ</Button > }
                <PaginationItem >
                    <PaginationLink
                        onClick={() => onPageChange(1)}
                        isActive={currentPage === 1}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
                {totalPages > 10 && currentPage > 4 && <PaginationEllipsis /> }
                {pageNumbers.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink
                            onClick={() => onPageChange(page)}
                            isActive={currentPage === page}
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                {totalPages > 10 && totalPages - endPage >= 2 && <PaginationEllipsis /> }
                {totalPages > 1 && <PaginationItem>
                        <PaginationLink
                            onClick={() => onPageChange(totalPages)}
                            isActive={currentPage === totalPages}
                        >
                            {totalPages}
                        </PaginationLink>
                    </PaginationItem>}
                {totalPages > 1 && <Button variant="ghost" size="sm" disabled={currentPage == totalPages} onClick={() => onPageChange(currentPage + 1)}>次へ<IconArrowRight /></Button > }
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => { onPageSizeChange(Number(value)) }}
                >
                    <SelectTrigger size="sm" className="w-35" id="rows-per-page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {pageSizeArray.map((pageSize) => (
                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                {pageSize}件 / ページ
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </PaginationContent>
        </Pagination>
    );
}