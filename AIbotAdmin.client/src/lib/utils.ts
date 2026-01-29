import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseDateYYYYMMDD = (dateString: string) => {
    if (!dateString) return undefined;
   // Tách chuỗi theo dấu gạch chéo
    const parts = dateString.trim().split('/');

    // 1. Kiểm tra định dạng cơ bản: Phải có 3 phần
    if (parts.length !== 3) {
        return undefined;
    }

    // 2. Phân tích các thành phần
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Giá trị tháng (1-12)
    const day = parseInt(parts[2], 10);
    // 3. Kiểm tra tính hợp lệ cơ bản của số
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return undefined;
    }

    // 4. Kiểm tra phạm vi tháng (MM phải từ 1 đến 12)
    if (month < 1 || month > 12) {
        // Lỗi: Giá trị tháng không hợp lệ (như 23)
        return undefined; 
    }

    // 5. Tạo đối tượng Date (Sử dụng month - 1 vì Date() dùng chỉ mục 0-11)
    const date = new Date(year, month - 1, day);

    // 6. Kiểm tra lỗi tràn ngày (ví dụ: ngày 32, tháng 13, hoặc tháng 2 có 30 ngày)
    // Nếu ngày được tạo (date.getDate()) không khớp với ngày đầu vào (day),
    // có nghĩa là JavaScript đã tự động điều chỉnh ngày đó.
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return undefined; // Lỗi: Ngày tháng không tồn tại (ví dụ: 2024/02/30)
    }
    // Nếu tất cả đều hợp lệ
    return date;
}

export const formatDateYYYYMMDD = (date: Date | undefined) => {
    if (!date) {
        return ""
    }
    const formattedDateParts = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
    const year = formattedDateParts[2];
    const month = formattedDateParts[0];
    const day = formattedDateParts[1];
    return `${year}/${month}/${day}`;
}

export const formatDate = (date: Date | string | undefined) => {
    if (!date) {
        return ""
    }
    const dateFormat = new Date(date)
    const formattedDateParts = dateFormat.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
    const year = formattedDateParts[2];
    const month = formattedDateParts[0];
    const day = formattedDateParts[1];
    return `${year}/${month}/${day}`;
}

export const formatDateToSecond = (date: Date | string | undefined) => {
    if (!date) {
        return ""
    }
    const dateFormat = new Date(date)
    const formattedDateParts = dateFormat.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/');
    const year = formattedDateParts[2];
    const month = formattedDateParts[0];
    const day = formattedDateParts[1];
    const time = dateFormat.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    return `${year}/${month}/${day} ${time}`;
}

export const formatDateToMinute = (date: Date | string | undefined) => {
    if (!date) {
        return "";
    }

    const dateFormat = new Date(date);

    // Format YYYY/MM/DD
    const formattedDateParts = dateFormat
        .toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
        .split('/');

    const year = formattedDateParts[2];
    const month = formattedDateParts[0];
    const day = formattedDateParts[1];

    // Format HH:mm (24h)
    const time = dateFormat.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
    });

    return `${year}/${month}/${day} ${time}`;
};
