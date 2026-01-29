import { parseDateYYYYMMDD } from "@/lib/utils";
import type { T_Document } from "@/types/t-document";
import axios from "axios";
import { format, isValid, parseISO } from "date-fns";
import { ja } from 'date-fns/locale'
import { getGlobalAbortController, abortAllFetch } from './fetchController';
let hasTriggeredLogout = false;

export const callApi = async (link: string, init?: RequestInit): Promise<Response> => {
  try {
    const controller = getGlobalAbortController();
    const response = await fetch(normalizeUrl(import.meta.env.BASE_URL + link), {
      ...init,
      credentials: 'include',
      signal: controller.signal,
    });
    // Xử lý 401 toàn cục – chỉ gọi 1 lần
    if (response.status === 401 && !hasTriggeredLogout) {
      hasTriggeredLogout = true;
      abortAllFetch(); // hủy luôn các request khác

      // Gọi goToLoginPage từ AppProvider (an toàn nhất)
      setTimeout(() => {
        const goToLoginPage = (window as any).__GO_TO_LOGIN_PAGE;
        goToLoginPage?.();
      }, 0);
    }

    return response;
  } catch (err: any) {
    // Nếu lỗi do abort → không ném lỗi (tránh console đỏ)
    if (err.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    throw err;
  }
}

export const callAxiosPostApi = async (link: string, data?: FormData, config?: any): Promise<any> => {
  //  return fetch(normalizeUrl(import.meta.env.BASE_URL + link), init)
   return await axios.post(normalizeUrl(import.meta.env.BASE_URL + link), data, config);
}

export const callAxiosPutApi = async (link: string, data?: FormData, config?: any): Promise<any> => {
  //  return fetch(normalizeUrl(import.meta.env.BASE_URL + link), init)
   return await axios.put(normalizeUrl(import.meta.env.BASE_URL + link), data, config);
}
export const getMyUrl = (link: string): string => {
    return normalizeUrl(import.meta.env.BASE_URL + link);
}
export const normalizeUrl = (input: string): string => {
  // Trường hợp 1: Không có protocol → chỉ là path → xử lý đơn giản
  if (!input.includes('://')) {
    return input.replace(/\/{2,}/g, '/');
  }

  // Trường hợp 2: Có protocol → tách thủ công, không dùng new URL().pathname
  const protocolMatch = input.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//i);
  if (!protocolMatch) {
    return input.replace(/([^:/])\/\//g, '$1/');
  }

  const protocol = protocolMatch[0]; // "http://" hoặc "https://"
  let rest = input.slice(protocol.length); // phần còn lại sau protocol

  // Tách host (có thể có port) và phần sau host
  const afterHostMatch = rest.match(/^([^\/?#]+)([\/?#].*)?$/);
  if (!afterHostMatch) {
    return input;
  }

  const hostAndPort = afterHostMatch[1];     // ví dụ: dfdf.com hoặc localhost:3000
  const afterHost = afterHostMatch[2] || ''; // query + hash + path (nếu có)

  // Bây giờ chỉ chuẩn hóa phần path trong afterHost
  let normalizedAfterHost = afterHost;

  // Nếu có path (bắt đầu bằng /), thì chuẩn hóa //
  if (afterHost.startsWith('/')) {
    normalizedAfterHost = afterHost.replace(/\/{2,}/g, '/');
  }
  // Nếu KHÔNG có path (tức là afterHost rỗng hoặc chỉ có ? hoặc #)
  // → giữ nguyên, KHÔNG thêm /

  return protocol + hostAndPort + normalizedAfterHost;
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const  getMimeTypeFromExtension = (extension = "txt") => {
    if (extension[0] === ".") {
        extension = extension.substr(1);
    }
    return {
        "aac": "audio/aac",
        "abw": "application/x-abiword",
        "arc": "application/x-freearc",
        "avi": "video/x-msvideo",
        "azw": "application/vnd.amazon.ebook",
        "bin": "application/octet-stream",
        "bmp": "image/bmp",
        "bz": "application/x-bzip",
        "bz2": "application/x-bzip2",
        "cda": "application/x-cdf",
        "csh": "application/x-csh",
        "css": "text/css",
        "csv": "text/csv",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "eot": "application/vnd.ms-fontobject",
        "epub": "application/epub+zip",
        "gz": "application/gzip",
        "gif": "image/gif",
        "htm": "text/html",
        "html": "text/html",
        "ico": "image/vnd.microsoft.icon",
        "ics": "text/calendar",
        "jar": "application/java-archive",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "js": "text/javascript",
        "json": "application/json",
        "jsonld": "application/ld+json",
        "mid": "audio/midi audio/x-midi",
        "midi": "audio/midi audio/x-midi",
        "mjs": "text/javascript",
        "mp3": "audio/mpeg",
        "mp4": "video/mp4",
        "mpeg": "video/mpeg",
        "mpkg": "application/vnd.apple.installer+xml",
        "odp": "application/vnd.oasis.opendocument.presentation",
        "ods": "application/vnd.oasis.opendocument.spreadsheet",
        "odt": "application/vnd.oasis.opendocument.text",
        "oga": "audio/ogg",
        "ogv": "video/ogg",
        "ogx": "application/ogg",
        "opus": "audio/opus",
        "otf": "font/otf",
        "png": "image/png",
        "pdf": "application/pdf",
        "php": "application/x-httpd-php",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "rar": "application/vnd.rar",
        "rtf": "application/rtf",
        "sh": "application/x-sh",
        "svg": "image/svg+xml",
        "swf": "application/x-shockwave-flash",
        "tar": "application/x-tar",
        "tif": "image/tiff",
        "tiff": "image/tiff",
        "ts": "video/mp2t",
        "ttf": "font/ttf",
        "txt": "text/plain",
        "vsd": "application/vnd.visio",
        "wav": "audio/wav",
        "weba": "audio/webm",
        "webm": "video/webm",
        "webp": "image/webp",
        "woff": "font/woff",
        "woff2": "font/woff2",
        "xhtml": "application/xhtml+xml",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xml": "application/xml",
        "xul": "application/vnd.mozilla.xul+xml",
        "zip": "application/zip",
        "3gp": "video/3gpp",
        "3g2": "video/3gpp2",
        "7z": "application/x-7z-compressed"
    }[extension] || "application/octet-stream";
}

export const getFileCanView = (extension = "txt") : boolean => {
    if (extension[0] === ".") {
        extension = extension.substr(1);
    }
    return [
        "text",
        "css",
        "png",
        "jpg",
        "gif",
        "htm",
        "html",
        "ico",
        "jpeg",
        "jpg",
        "pdf",
        "mp3",
        "mp4",
        "webm",
        "bmp",
        "heic",

        //"aac": "audio/aac",
        //"abw": "application/x-abiword",
        //"arc": "application/x-freearc",
        //"avi": "video/x-msvideo",
        //"azw": "application/vnd.amazon.ebook",
        //"bin": "application/octet-stream",
        //"bz": "application/x-bzip",
        //"bz2": "application/x-bzip2",
        //"cda": "application/x-cdf",
        //"csh": "application/x-csh",
        //"eot": "application/vnd.ms-fontobject",
        //"epub": "application/epub+zip",
        //"ics": "text/calendar",
        //"jar": "application/java-archive",
        //"js": "text/javascript",
        //"json": "application/json",
        //"jsonld": "application/ld+json",
        //"mid": "audio/midi audio/x-midi",
        //"midi": "audio/midi audio/x-midi",
        //"mjs": "text/javascript",
        //"mp3": "audio/mpeg",
        //"mp4": "video/mp4",
        //"mpeg": "video/mpeg",
        //"mpkg": "application/vnd.apple.installer+xml",
        //"odp": "application/vnd.oasis.opendocument.presentation",
        //"ods": "application/vnd.oasis.opendocument.spreadsheet",
        //"odt": "application/vnd.oasis.opendocument.text",
        //"oga": "audio/ogg",
        //"ogv": "video/ogg",
        //"ogx": "application/ogg",
        //"opus": "audio/opus",
        //"otf": "font/otf",
        //"png": "image/png",
        //"pdf": "application/pdf",
        //"php": "application/x-httpd-php",
        //"ppt": "application/vnd.ms-powerpoint",
        //"pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        //"rar": "application/vnd.rar",
        //"rtf": "application/rtf",
        //"sh": "application/x-sh",
        //"svg": "image/svg+xml",
        //"swf": "application/x-shockwave-flash",
        //"tar": "application/x-tar",
        //"tif": "image/tiff",
        //"tiff": "image/tiff",
        //"ts": "video/mp2t",
        //"ttf": "font/ttf",
        //"txt": "text/plain",
        //"vsd": "application/vnd.visio",
        //"wav": "audio/wav",
        //"weba": "audio/webm",
        //"webm": "video/webm",
        //"webp": "image/webp",
        //"woff": "font/woff",
        //"woff2": "font/woff2",
        //"xhtml": "application/xhtml+xml",
        //"xls": "application/vnd.ms-excel",
        //"xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        //"xml": "application/xml",
        //"xul": "application/vnd.mozilla.xul+xml",
        //"zip": "application/zip",
        //"3gp": "video/3gpp",
        //"3g2": "video/3gpp2",
        //"7z": "application/x-7z-compressed"
    ].includes(extension) || false;
}

export const isTDocument = (item: any): item is T_Document => {
  return !!item && 
         typeof item === "object" && 
         "doc_cd" in item && 
         "doc_name" in item;
};

export const safeFormat = (date: Date | number | null | undefined, formatStr: string, fallback: string) => {
  if (!date || !isValid(date)) {
    return fallback;
  }
  try {
    return format(date, formatStr, { locale: ja });
  } catch (error) {
    console.warn('date-fns format error:', error, date);
    return fallback;
  }
};

export const toValidDate = (
  input: Date | string | null | undefined
): Date | undefined => {
  if (!input) return undefined;

  let date: Date;

  if (input instanceof Date) {
    date = input;
  } 
  else if (typeof input === 'string' && (input.includes('T') || input.includes('-') && input.includes(':'))) {
    date = parseISO(input);
  } 
  else if (typeof input === 'string') {
    const parsed = parseDateYYYYMMDD(input);
    if (parsed && isValid(parsed)) {
      return parsed;
    }
    date = parseISO(input);
  } 
  else {
    return undefined;
  }

  return isValid(date) ? date : undefined;
};
 
export const toSafeDateString = (
  input: Date | string | null | undefined,
  formatStr: string = 'yyyy/MM/dd'
): string => {
  const date = toValidDate(input);
  if (!date) return '';

  try {
    return format(date, formatStr, { locale: ja });
  } catch (error) {
    console.warn('Format error:', error, input);
    return '';
  }
};