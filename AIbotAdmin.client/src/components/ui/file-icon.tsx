import { FileArchiveIcon, FileAudioIcon, FileCodeIcon, FileCogIcon, FileTextIcon, FileVideoIcon, FileIcon as FileIconBase } from "lucide-react";

export default function FileIcon({ type, name, className }:{ type: string, name: string, className?: string}) {
    const extension =name ? name.split(".").pop()?.toLowerCase() ?? "" : "";
    if (type.startsWith("video/")) {
    return <FileVideoIcon className={className} />;
    }

    if (type.startsWith("audio/")) {
    return <FileAudioIcon className={className} />;
    }

    if (
    type.startsWith("text/") ||
    ["txt", "md", "rtf", "pdf"].includes(extension)
    ) {
    return <FileTextIcon className={className} />;
    }

    if (
    [
        "html",
        "css",
        "js",
        "jsx",
        "ts",
        "tsx",
        "json",
        "xml",
        "php",
        "py",
        "rb",
        "java",
        "c",
        "cpp",
        "cs",
    ].includes(extension)
    ) {
    return <FileCodeIcon className={className} />;
    }

    if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension)) {
    return <FileArchiveIcon className={className} />;
    }

    if (
    ["exe", "msi", "app", "apk", "deb", "rpm"].includes(extension) ||
    type.startsWith("application/")
    ) {
    return <FileCogIcon className={className} />;
    }

    return <FileIconBase className={className} />;
}
