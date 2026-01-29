import { useEffect, useState, useRef } from 'react';
import {
    Folder,
    File,
    Upload,
    Trash2,
    Grid3x3,
    List,
    ChevronRight,
    Home,
    Search,
    Download,
    FolderPlus,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    Archive,
    X,
    Edit,
    CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { IconFileTypePdf, IconFileTypeTxt } from '@tabler/icons-react';
import { getMyUrl } from '../utils';
import { formatDateToMinute } from '../lib/utils'
import { toast } from 'sonner'

interface BlobItem {
    name: string;
    size: number;
    contentType: string;
    lastModified: string;
    url: string;
    comment?: string | null;
}

interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    parentId: string | null;
    createdAt: string;
    modifiedAt: string;
    fileType?: string;
    url?: string;
    blobFullName?: string; // <-- thêm
    comment?: string | null;
}

interface UploadTask {
    file: File;
    progress: number;
    status: 'waiting' | 'uploading' | 'success' | 'error';
    error?: string;
}

type ViewMode = 'list' | 'grid';

export function BlobManager() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [managedRoot, setManagedRoot] = useState<string>("");
    const ROOT_ID = managedRoot ? `folder-${managedRoot}` : null;
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(ROOT_ID);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    //const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editComment, setEditComment] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
    const [showUploadProgress, setShowUploadProgress] = useState(false);
    const [totalUploadProgress, setTotalUploadProgress] = useState(0);
    const [busy, setBusy] = useState(false);
    const dragCounter = useRef(0);
    const [uploadConfig, setUploadConfig] = useState<{ allowedExtensions: string[]; maxFileSizeMB: number; } | null>(null);
    type SortKey = "name" | "size" | "type" | "modified";
    type SortDir = "asc" | "desc";

    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const toggleSort = (key: SortKey) => {
        setSortKey(prevKey => {
            if (prevKey === key) {
                setSortDir(prevDir => (prevDir === "asc" ? "desc" : "asc"));
                return prevKey;
            }
            setSortDir("asc");
            return key;
        });
    };

    const SortIndicator = ({ k }: { k: SortKey }) => {
        if (sortKey !== k) return <span className="ml-1 text-gray-300">↕</span>;
        return <span className="ml-1 text-gray-600">{sortDir === "asc" ? "↑" : "↓"}</span>;
    };

    useEffect(() => {
        if (busy) {
            // Lưu cursor cũ (phòng khi page của bạn set cursor custom)
            const prevBodyCursor = document.body.style.cursor;
            const prevHtmlCursor = document.documentElement.style.cursor;

            document.body.style.cursor = "wait";
            document.documentElement.style.cursor = "wait";

            // cleanup: khi busy = false hoặc unmount
            return () => {
                document.body.style.cursor = prevBodyCursor;
                document.documentElement.style.cursor = prevHtmlCursor;
            };
        } else {
            // đảm bảo reset lại nếu không bận
            document.body.style.cursor = "";
            document.documentElement.style.cursor = "";
        }
    }, [busy]);


    // Chuyển đổi dữ liệu từ API thành cấu trúc FileItem
    const convertBlobsToFileItems = (blobs: BlobItem[]): FileItem[] => {
        const folderFileItems: FileItem[] = [];
        const folderMap = new Map<string, FileItem>(); // Lưu các folder đã tạo

        blobs.forEach((blob, index) => {
            // Xử lý path để tạo folder structure
            const pathParts = blob.name.split('/');

            // Nếu có path (có folder)
            if (pathParts.length > 1) {
                let currentParentId: string | null = null;

                // Tạo folder cho các phần trong path
                for (let i = 0; i < pathParts.length - 1; i++) {
                    const folderName = pathParts[i];
                    const folderPath = pathParts.slice(0, i + 1).join('/');
                    const folderId = `folder-${folderPath}`;

                    // Nếu folder chưa tồn tại, tạo mới
                    if (!folderMap.has(folderId)) {
                        const folderItem: FileItem = {
                            id: folderId,
                            name: folderName,
                            type: 'folder',
                            parentId: currentParentId,
                            createdAt: blob.lastModified,
                            modifiedAt: blob.lastModified,
                            comment: null,              // folder comment lấy từ folderComments map ở init()
                            blobFullName: folderPath,   // <-- folderPath mới đúng: "123" hoặc "123/a"
                        };
                        folderFileItems.push(folderItem);
                        folderMap.set(folderId, folderItem);
                    }

                    currentParentId = folderId;
                }

                // Tạo file với parentId là folder cuối cùng
                const fileItem: FileItem = {
                    id: `file-${blob.name}-${index}`,
                    name: pathParts[pathParts.length - 1],
                    type: 'file',
                    size: blob.size,
                    parentId: currentParentId,
                    createdAt: blob.lastModified,
                    modifiedAt: blob.lastModified,
                    fileType: getFileTypeFromContentType(blob.contentType),
                    url: blob.url,
                    comment: blob.comment ?? null,
                    blobFullName: blob.name,
                };
                folderFileItems.push(fileItem);
            } else {
                const fileItem: FileItem = {
                    id: `file-${blob.name}-${index}`,
                    name: blob.name,
                    type: 'file',
                    size: blob.size,
                    parentId: null,
                    createdAt: blob.lastModified,
                    modifiedAt: blob.lastModified,
                    fileType: getFileTypeFromContentType(blob.contentType),
                    url: blob.url,
                    blobFullName: blob.name, // <-- thêm
                    comment: blob.comment ?? null, // <-- thiếu dòng này
                };
                folderFileItems.push(fileItem);
            }
        });

        return folderFileItems;
    };

    const getCurrentPathPrefix = () => {
        if (!currentFolderId || !managedRoot) return "";

        if (!currentFolderId.startsWith("folder-")) return "";

        const fullPath = currentFolderId.replace("folder-", "");

        // 🔥 CẮT managedRoot → trả path TƯƠNG ĐỐI
        if (fullPath === managedRoot) return "";

        if (fullPath.startsWith(managedRoot + "/"))
            return fullPath.substring(managedRoot.length + 1);

        return "";
    };


    const normalize = (s: string) =>
        (s ?? "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

    const getFileTypeFromContentType = (contentType: string): string => {
        if (contentType.startsWith('image/')) return 'image';
        if (contentType.startsWith('video/')) return 'video';
        if (contentType.startsWith('audio/')) return 'audio';
        if (contentType.includes('txt')) return 'txt';
        if (contentType.includes('pdf')) return 'pdf';
        if (contentType.includes('text')) return 'text';
        if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('tar')) return 'archive';
        if (contentType.includes('msword') || contentType.includes('wordprocessingml')) return 'document';
        return 'text';
    };

    const init = async () => {
        setError(null);
        setLoading(true);
        try {
            const response = await fetch(getMyUrl(`/api/Blobs/list?&take=200`), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as {
                files: BlobItem[];
                folderComments: Record<string, string | null>;
                folderPaths: string[];
                managedRoot: string; // 👈 thêm
                uploadConfig: { allowedExtensions: string[]; maxFileSizeMB: number; };
            };

            console.log('data', data);
            const folderFileItems = convertBlobsToFileItems(data.files);
            console.log('folderFileItems', folderFileItems);

            if (!managedRoot) setManagedRoot(data.managedRoot);
            setUploadConfig(data.uploadConfig);
            // Thêm folder rỗng và folder con từ DB vào danh sách
            data.folderPaths?.forEach(path => {
                const folderId = `folder-${path}`;
                const parts = path.split('/');

                // Nếu folder đã tồn tại -> bỏ qua
                if (folderFileItems.some(f => f.id === folderId)) return;

                // Tìm parentId
                const parentPath =
                    parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') : null;

                const parentId = parentPath ? `folder-${parentPath}` : null;

                folderFileItems.push({
                    id: folderId,
                    name: parts[parts.length - 1],
                    type: "folder",
                    parentId,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    comment: data.folderComments?.[path] ?? null,
                    blobFullName: path
                });
            });

            // gán comment cho folder dựa trên folderId = folder-<path>
            const addItemsComment = folderFileItems.map(it => {
                if (it.type !== "folder") return it;
                const path = it.id.startsWith("folder-") ? it.id.replace("folder-", "") : "";
                return { ...it, comment: data.folderComments?.[path] ?? it.comment ?? null };
            });

            setFiles(addItemsComment);

            console.log('folderFileItems', folderFileItems);
            console.log('addItemsComment', addItemsComment);
        } catch (error) {
            console.error('Error fetching blobs:', error);
            setError('Failed to load files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, []);
    useEffect(() => {
        if (ROOT_ID && !currentFolderId) {
            setCurrentFolderId(ROOT_ID);
        }
    }, [ROOT_ID]);

    const handleFileDrop = async (fileList: FileList) => {
        if (!uploadConfig) {
            toast.error("Upload configuration not loaded yet");
            return;
        }
        if (fileList.length === 0) return;

        const files = Array.from(fileList).filter(isFileAllowed);
        if (files.length === 0) return;

        const prefix = getCurrentPathPrefix();

        // Tạo queue
        const newTasks: UploadTask[] = files.map(file => ({
            file,
            progress: 0,
            status: 'waiting' as const
        }));

        setUploadQueue(prev => [...prev, ...newTasks]);
        setShowUploadProgress(true);

        let successCount = 0;
        let errorCount = 0;

        // Upload từng file
        for (let i = 0; i < newTasks.length; i++) {
            const task = newTasks[i];
            const taskIndex = uploadQueue.length + i;

            // Bắt đầu upload
            setUploadQueue(prev => prev.map((t, idx) =>
                idx === taskIndex ? { ...t, status: 'uploading', progress: 5 } : t
            ));

            const formData = new FormData();
            formData.append("file", task.file);

            try {
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, progress: percent } : t
                            ));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, status: 'success', progress: 100 } : t
                            ));
                            successCount++;
                            resolve();
                        } else {
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, status: 'error', error: "Upload failed" } : t
                            ));
                            errorCount++;
                            reject(new Error("Upload failed"));
                        }
                    });

                    xhr.addEventListener("error", () => {
                        setUploadQueue(prev => prev.map((t, idx) =>
                            idx === taskIndex ? { ...t, status: 'error', error: "Network error" } : t
                        ));
                        errorCount++;
                        reject(new Error("Network error"));
                    });

                    const qs = prefix ? `?path=${encodeURIComponent(prefix)}` : "";
                    xhr.open("POST", getMyUrl(`/api/Blobs/upload${qs}`));
                    xhr.withCredentials = true;
                    xhr.send(formData);
                });
            } catch (err) {
                console.log(err);
            }
        }

        const interval = setInterval(() => {
            const total = uploadQueue.length + newTasks.length;
            const completed = uploadQueue.filter(t => t.status === 'success' || t.status === 'error').length + successCount + errorCount;
            if (completed >= total) {
                clearInterval(interval);
                setTotalUploadProgress(100);
            } else {
                const avg = uploadQueue.reduce((sum, t) => sum + t.progress, 0) / total;
                setTotalUploadProgress(Math.round(avg));
            }
        }, 100);

        setTimeout(async () => {
            await init();

            const successMessage = errorCount === 0
                ? `${successCount} file(s) uploaded successfully!`
                : `${successCount} file(s) uploaded successfully, ${errorCount} failed`;

            toast.success(successMessage, {
                style: {
                    '--normal-bg':
                        'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                    '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                    '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                } as React.CSSProperties,
                position: 'top-center',
                duration: 3000
            });

            if (errorCount === 0) {
                setTimeout(() => {
                    setShowUploadProgress(false);
                    setUploadQueue([]);
                    setTotalUploadProgress(0);
                }, 3000);
            }
        }, 1200);
    };
    const isFileAllowed = (file: File) => {
        if (!uploadConfig) return false;

        const ext = "." + file.name.split(".").pop()?.toLowerCase();

        if (!uploadConfig.allowedExtensions.includes(ext)) {
            toast.error(`File type ${ext} is not allowed`);
            return false;
        }

        if (file.size > uploadConfig.maxFileSizeMB * 1024 * 1024) {
            toast.error(`File exceeds ${uploadConfig.maxFileSizeMB}MB`);
            return false;
        }

        return true;
    };

    useEffect(() => {
        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            dragCounter.current = 0;

            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                await handleFileDrop(e.dataTransfer.files);
            }
        };

        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragleave', handleDragLeave);
        document.addEventListener('drop', handleDrop);

        return () => {
            document.removeEventListener('dragover', handleDragOver);
            document.removeEventListener('dragenter', handleDragEnter);
            document.removeEventListener('dragleave', handleDragLeave);
            document.removeEventListener('drop', handleDrop);
        };
    }, [currentFolderId]);

    // Refresh function
    const handleRefresh = () => {
        init();
    };

    useEffect(() => {
        // Kiểm tra xem thư mục hiện tại có còn tồn tại không
        if (currentFolderId && currentFolderId !== 'root') {
            const folderExists = files.some(f => f.id === currentFolderId && f.type === 'folder');
            if (!folderExists) {
                // Tìm parent của thư mục đã bị xóa
                const parentFolder = files.find(f =>
                    f.type === 'folder' &&
                    files.some(child => child.parentId === f.id && child.id === currentFolderId)
                );
                setCurrentFolderId(parentFolder?.id || null);
            }
        }
    }, [files, currentFolderId]);

    // Get current folder path for breadcrumbs
    const getBreadcrumbs = () => {
        const breadcrumbs: FileItem[] = [];
        let currentId = currentFolderId;

        while (currentId) {
            if (currentId === ROOT_ID) {
                const rootFolder = files.find(
                    f => f.id === ROOT_ID && f.type === "folder"
                );
                if (rootFolder) breadcrumbs.unshift(rootFolder);
                break;
            }

            const folder = files.find(
                f => f.id === currentId && f.type === "folder"
            );

            if (!folder) break;

            breadcrumbs.unshift(folder);
            currentId = folder.parentId;
        }

        return breadcrumbs;
    };

    // Get items in current folder
    const getCurrentItems = () => {
        return files.filter((item) => item.parentId === currentFolderId);
    };

    // Filter items based on search
    const filteredItems = getCurrentItems().filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const dir = sortDir === "asc" ? 1 : -1;

    const sortedItems = [...filteredItems].sort((a, b) => {
        // folders first
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;

        switch (sortKey) {
            case "name":
                return dir * a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });

            case "size": {
                const as = a.size ?? -1;
                const bs = b.size ?? -1;
                return dir * (as - bs);
            }

            case "modified": {
                const at = new Date(a.modifiedAt).getTime();
                const bt = new Date(b.modifiedAt).getTime();
                return dir * (at - bt);
            }

            case "type": {
                // folder/file (đã giống nhau ở đây), nếu muốn sort fileType thì dùng a.fileType
                const at = (a.fileType ?? a.type);
                const bt = (b.fileType ?? b.type);
                return dir * at.localeCompare(bt);
            }

            default:
                return 0;
        }
    });

    const formatFileName = (fileName: string, maxLength: number, endCharsFromName: number) => {
        const extensionMatch = fileName.match(/\.([^.]+)$/);
        const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
        const nameWithoutExt = extension ? fileName.slice(0, -extension.length) : fileName;

        if (fileName.length <= maxLength) {
            return fileName;
        }

        // endCharsFromName // Số ký tự cuối của tên file (trước extension) muốn hiển thị
        const ellipsis = '...';

        // Phần tên sẽ hiển thị: [đầu]...[cuối]
        // Tổng chiều dài = đầu + ... + cuối + extension
        // => đầu = maxLength - ... - cuối - extension

        const totalEndPart = endCharsFromName + extension.length;
        const startLength = maxLength - ellipsis.length - totalEndPart;

        if (startLength <= 0) {
            if (nameWithoutExt.length <= endCharsFromName) {
                return `${nameWithoutExt}${extension}`;
            }
            return `${ellipsis}${nameWithoutExt.slice(-endCharsFromName)}${extension}`;
        }

        const startPart = nameWithoutExt.substring(0, startLength);
        const endPart = nameWithoutExt.slice(-endCharsFromName);

        return `${startPart}${ellipsis}${endPart}${extension}`;
    };

    const handleItemClick = (item: FileItem) => {
        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
            //setSelectedItems(new Set());
        }
    };

    const handleBreadcrumbClick = (folderId: string | null) => {
        setCurrentFolderId(folderId);
        //setSelectedItems(new Set());
    };

    const openDeleteDialog = (item: FileItem) => {
        setItemToDelete(item);
        setShowDeleteDialog(true);
    };

    const openEditDialog = (item: FileItem) => {
        setItemToRename(item);
        setEditComment(item.comment ?? "");
        setShowEditDialog(true);
    };

    const handleEditSave = async () => {
        if (!itemToRename) { setShowEditDialog(false); return; }

        setBusy(true);
        try {
            await saveComment(itemToRename, editComment);

            setFiles(prev => prev.map(f =>
                f.id === itemToRename.id ? { ...f, comment: editComment } : f
            ));

            toast.success(`Comment updated successfully!`, {
                style: {
                    '--normal-bg':
                        'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                    '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                    '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                } as React.CSSProperties,
                position: 'top-center'
            });

            setShowEditDialog(false);
            setItemToRename(null);
            setEditComment("");
        } catch (e: any) {
            setError(e?.message ?? "Save failed");
        } finally {
            setBusy(false);
        }
    };

    const saveComment = async (item: FileItem, comment: string) => {
        const isFile = item.type === "file";
        const targetType = isFile ? 1 : 2;
        const rawPath =
            item.type === "file"
                ? (item.blobFullName ?? "")
                : item.id.replace("folder-", "");

        const targetPath = normalize(rawPath);


        const res = await fetch(getMyUrl(`/api/Blobs/comment`), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetType, targetPath, comment }),
        });

        if (!res.ok) throw new Error(`Save comment failed (${res.status})`);
    };

    //const handleDelete = (itemId: string) => {
    //    const deleteRecursive = (id: string) => {
    //        const children = files.filter((f) => f.parentId === id);
    //        children.forEach((child) => {
    //            if (child.type === 'folder') {
    //                deleteRecursive(child.id);
    //            }
    //        });
    //        setFiles((prev) => prev.filter((f) => f.id !== id));
    //    };

    //    deleteRecursive(itemId);
    //    selectedItems.delete(itemId);
    //    setSelectedItems(new Set(selectedItems));
    //};

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setError(null);
        setBusy(true);

        try {
            if (itemToDelete.type === "file") {
                const blobName = itemToDelete.blobFullName ?? (
                    getCurrentPathPrefix() ? `${getCurrentPathPrefix()}/${itemToDelete.name}` : itemToDelete.name
                );

                const res = await fetch(getMyUrl(`/api/Blobs/delete?name=${encodeURIComponent(blobName)}`), {
                    method: "DELETE",
                    credentials: "include",
                });

                if (res.ok) {
                    toast.success(`File deleted successfully!`, {
                        style: {
                            '--normal-bg':
                                'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                        } as React.CSSProperties,
                        position: 'top-center'
                    });
                    setShowDeleteDialog(false);
                    setItemToDelete(null);
                    await init();
                } else {
                    throw new Error(`Delete failed (${res.status})`);
                }

            } else {
                // folder: xóa theo prefix
                const folderPrefix = (() => {
                    if (itemToDelete.id.startsWith("folder-")) return itemToDelete.id.replace("folder-", "");
                    const parent = getCurrentPathPrefix();
                    return parent ? `${parent}/${itemToDelete.name}` : itemToDelete.name;
                })();

                const res = await fetch(getMyUrl(`/api/Blobs/delete-prefix?prefix=${encodeURIComponent(folderPrefix)}`), {
                    method: "DELETE",
                    credentials: "include",
                });

                if (res.ok) {
                    toast.success(`Folder deleted successfully!`, {
                        style: {
                            '--normal-bg':
                                'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                        } as React.CSSProperties,
                        position: 'top-center'
                    });

                    // Nếu đang xóa thư mục hiện tại hoặc thư mục con của thư mục hiện tại
                    // thì quay về thư mục cha
                    const currentPrefix = getCurrentPathPrefix();
                    if (currentPrefix === folderPrefix || currentPrefix.startsWith(folderPrefix + '/')) {
                        setCurrentFolderId(itemToDelete.parentId);
                    }

                    setShowDeleteDialog(false);
                    setItemToDelete(null);
                    await init();

                } else {
                    throw new Error(`Delete folder failed (${res.status})`);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Delete failed.");
        } finally {
            setBusy(false);
        }
    };


    // Hàm upload file (cần tích hợp với API backend)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!uploadConfig) {
            toast.error("Upload configuration not loaded yet");
            return;
        }
        const uploadedFiles = e.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        setError(null);

        const files = Array.from(uploadedFiles).filter(isFileAllowed);
        if (files.length === 0) return;

        const prefix = getCurrentPathPrefix();

        // Tạo queue cho upload bằng nút
        const newTasks: UploadTask[] = files.map(file => ({
            file,
            progress: 0,
            status: 'waiting' as const
        }));

        setUploadQueue(prev => [...prev, ...newTasks]);
        setShowUploadProgress(true);

        let successCount = 0;
        let errorCount = 0;

        // Upload từng file
        for (let i = 0; i < newTasks.length; i++) {
            const task = newTasks[i];
            const taskIndex = uploadQueue.length + i;

            // Bắt đầu upload
            setUploadQueue(prev => prev.map((t, idx) =>
                idx === taskIndex ? { ...t, status: 'uploading', progress: 5 } : t
            ));

            const formData = new FormData();
            formData.append("file", task.file);

            try {
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.addEventListener("progress", (e) => {
                        if (e.lengthComputable) {
                            const percent = Math.round((e.loaded / e.total) * 100);
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, progress: percent } : t
                            ));
                        }
                    });

                    xhr.addEventListener("load", () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, status: 'success', progress: 100 } : t
                            ));
                            successCount++;
                            resolve();
                        } else {
                            setUploadQueue(prev => prev.map((t, idx) =>
                                idx === taskIndex ? { ...t, status: 'error', error: "Upload failed" } : t
                            ));
                            errorCount++;
                            reject(new Error("Upload failed"));
                        }
                    });

                    xhr.addEventListener("error", () => {
                        setUploadQueue(prev => prev.map((t, idx) =>
                            idx === taskIndex ? { ...t, status: 'error', error: "Network error" } : t
                        ));
                        errorCount++;
                        reject(new Error("Network error"));
                    });

                    const qs = prefix ? `?path=${encodeURIComponent(prefix)}` : "";
                    xhr.open("POST", getMyUrl(`/api/Blobs/upload${qs}`));
                    xhr.withCredentials = true;
                    xhr.send(formData);
                });
            } catch (err) {
                console.log(err);
            }
        }

        const interval = setInterval(() => {
            const total = uploadQueue.length + newTasks.length;
            const completed = uploadQueue.filter(t => t.status === 'success' || t.status === 'error').length + successCount + errorCount;
            if (completed >= total) {
                clearInterval(interval);
                setTotalUploadProgress(100);
            } else {
                const avg = uploadQueue.reduce((sum, t) => sum + t.progress, 0) / total;
                setTotalUploadProgress(Math.round(avg));
            }
        }, 100);

        // Khi upload xong
        setTimeout(async () => {
            await init();

            const successMessage = errorCount === 0
                ? `${successCount} file(s) uploaded successfully!`
                : `${successCount} file(s) uploaded successfully, ${errorCount} failed`;

            toast.success(successMessage, {
                style: {
                    '--normal-bg':
                        'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                    '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                    '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                } as React.CSSProperties,
                position: 'top-center',
                duration: 3000
            });

            if (errorCount === 0) {
                setTimeout(() => {
                    setShowUploadProgress(false);
                    setUploadQueue([]);
                    setTotalUploadProgress(0);
                }, 3000);
            }
        }, 1200);

        // Reset input
        e.target.value = "";
    };

    // Hàm tạo folder (cần tích hợp với API backend)
    const handleCreateFolder = async () => {
        const name = newFolderName.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        if (!name) return;

        // hỗ trợ tạo nhiều cấp ngay trong 1 lần nhập: vd "a/b/c"
        const parts = name.split("/").filter(Boolean);

        let parentId = currentFolderId; // nơi đang đứng trong UI

        // giữ danh sách folderPath mới tạo để gửi lên server
        const createdFolderPaths: string[] = [];

        setFiles(prev => {
            const next = [...prev];

            for (const part of parts) {
                //const parentPrefix = parentId?.startsWith("folder-") ? parentId.replace("folder-", "") : "";
                const parentPrefix = parentId?.startsWith("folder-") ? parentId.replace("folder-", "") : managedRoot; // 👈 QUAN TRỌNG

                const folderPath = parentPrefix ? `${parentPrefix}/${part}` : part;
                const folderId = `folder-${folderPath}`;

                // nếu đã tồn tại thì thôi
                const exists = next.some(f => f.id === folderId && f.type === "folder");
                const addItem: FileItem = {
                    id: folderId,
                    name: part,
                    type: "folder",
                    parentId: parentId,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    comment: "",          // set comment local ngay
                    blobFullName: folderPath
                };

                if (!exists) {
                    next.push(addItem);
                    saveComment(addItem, "");
                    // lưu để gọi API
                    createdFolderPaths.push(folderPath);
                }

                parentId = folderId; // đi xuống 1 cấp
            }

            return next;
        });

        setNewFolderName("");
        setShowNewFolderDialog(false);
    };

    const downloadFile = async (item: FileItem) => {
        if (item.type !== "file") return;
        setBusy(true);
        // blob name đầy đủ để backend download đúng
        const blobName = item.blobFullName ?? item.name;
        if (!blobName) return;

        try {
            const res = await fetch(
                getMyUrl(`/api/Blobs/download?name=${encodeURIComponent(blobName)}`),
                { method: "GET", credentials: "include" }
            );

            if (!res.ok) throw new Error(`Download failed (${res.status})`);
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = item.name; // tên tiếng Việt hiển thị đúng
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(downloadUrl);

            // Thông báo thành công
            toast.success(`File downloaded successfully!`, {
                style: {
                    '--normal-bg':
                        'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                    '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                    '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                } as React.CSSProperties,
                position: 'top-center'
            });
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? "Download failed.");
        } finally {
            setBusy(false);
        }
    };

    //const handleCreateFolder = async () => {
    //    const name = newFolderName.trim();
    //    if (!name) return;

    //    setError(null);
    //    const parent = getCurrentPathPrefix();

    //    try {
    //        const qs = new URLSearchParams();
    //        qs.set("name", name);
    //        if (parent) qs.set("parent", parent);

    //        const res = await fetch(getMyUrl(`/api/Blobs/mkdir?${qs.toString()}`), {
    //            method: "POST",
    //            credentials: "include",
    //        });

    //        if (!res.ok) {
    //            let msg = `Create folder failed (${res.status})`;
    //            try {
    //                const j = await res.json();
    //                msg = j?.message ?? j?.error ?? msg;
    //            } catch { }
    //            throw new Error(msg);
    //        }

    //        setNewFolderName("");
    //        setShowNewFolderDialog(false);
    //        await init();
    //    } catch (err: any) {
    //        console.error(err);
    //        setError(err?.message ?? "Failed to create folder.");
    //    }
    //};


    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(1) + ' GB';
    };

    const getFileIcon = (item: FileItem) => {
        if (item.type === 'folder') {
            return <Folder className="w-5 h-5 text-blue-500" />;
        }

        switch (item.fileType) {
            case 'image':
                return <ImageIcon className="w-5 h-5 text-green-500" />;
            case 'video':
                return <Video className="w-5 h-5 text-purple-500" />;
            case 'audio':
                return <Music className="w-5 h-5 text-pink-500" />;
            case 'archive':
                return <Archive className="w-5 h-5 text-orange-500" />;
            case 'pdf':
                return <IconFileTypePdf className="w-5 h-5 text-red-500" />;
            case 'document':
                return <FileText className="w-5 h-5 text-blue-600" />;
            case 'txt':
                return <IconFileTypeTxt className="w-5 h-5 text-yellow-600" />;
            default:
                return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const breadcrumbs = getBreadcrumbs();

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center text-red-600 mb-4">{error}</div>
                <button
                    onClick={init}
                    className="mx-auto block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 relative">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Blob Management</h1>
                        <p className="text-gray-600">
                            Manage folder, file on blob
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Refresh</span>
                        </button>

                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Upload</span>
                            <input
                                type="file"
                                multiple
                                accept={uploadConfig?.allowedExtensions.join(",")}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>

                        {/* Create Folder */}
                        <button
                            onClick={() => setShowNewFolderDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                        >
                            <FolderPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Folder</span>
                        </button>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors cursor-pointer ${viewMode === 'list'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors cursor-pointer ${viewMode === 'grid'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Grid view"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 pt-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search files and folders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 ps-4">
                <div className="flex items-center gap-2 text-gray-600 overflow-x-auto">
                    <button
                        onClick={() => handleBreadcrumbClick(ROOT_ID)}
                        className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        <Home className="w-4 h-4" />
                        <span>Root</span>
                    </button>
                    {breadcrumbs.map((crumb) => (
                        <div key={crumb.id} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <button
                                onClick={() => handleBreadcrumbClick(crumb.id)}
                                className="hover:text-blue-600 transition-colors whitespace-nowrap cursor-pointer"
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* File/Folder List or Grid */}
            <div className="bg-white rounded-lg min-h-150 border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Loading files...</p>
                    </div>
                ) : (
                    <>
                        <div className={`relative bg-white rounded-lg overflow-hidden transition-all
                            ${isDragging
                                ? 'border-blue-300 ring-4 min-h-150 border border-dashed ring-blue-500/20 shadow-2xl shadow-blue-300/20'
                                : 'border-gray-200'
                            }`}
                        >
                            {isDragging && (
                                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <Upload className="w-20 h-20 text-blue-600 mx-auto mb-4 animate-bounce" />
                                        <p className="text-2xl font-bold text-blue-600">Drop to upload</p>
                                        <p className="text-blue-500 mt-2">
                                            {currentFolderId ? 'into this folder' : 'to root'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {viewMode === 'list' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="w-12 px-4 py-3 text-left">
                                                    <span className="sr-only">Icon</span>
                                                </th>
                                                <th
                                                    onClick={() => toggleSort("name")}
                                                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 cursor-pointer select-none hover:text-gray-700"
                                                >
                                                    Name <SortIndicator k="name" />
                                                </th>

                                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                                                    Comment
                                                </th>
                                                <th
                                                    onClick={() => toggleSort("size")}
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 cursor-pointer select-none hover:text-gray-700"
                                                >
                                                    Size <SortIndicator k="size" />
                                                </th>

                                                {/*<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 hidden md:table-cell cursor-pointer select-none hover:text-gray-700"*/}
                                                {/*    onClick={() => toggleSort("type")}*/}
                                                {/*>*/}
                                                {/*    Type <SortIndicator k="type" />*/}
                                                {/*</th>*/}
                                                <th
                                                    onClick={() => toggleSort("modified")}
                                                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40 hidden md:table-cell cursor-pointer select-none hover:text-gray-700"
                                                >
                                                    Modified <SortIndicator k="modified" />
                                                </th>

                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {sortedItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-16 text-center justify-items-center text-gray-500">
                                                        {searchQuery ? 'No items match your search' :
                                                            (
                                                                <div className=" text-center justify-items-center">
                                                                    <label className="w-27 flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                                                                        <Upload className="w-4 h-4" />
                                                                        <span>Upload</span>
                                                                        <input
                                                                            type="file"
                                                                            multiple
                                                                            onChange={handleFileUpload}
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                    <div className="p-4">
                                                                        Drag and drop files to upload
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedItems.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="hover:bg-gray-50 transition-colors group"

                                                    >
                                                        <td className="px-4 py-4">
                                                            {getFileIcon(item)}
                                                        </td>

                                                        <td
                                                            className={`py-4 pr-3
                                                                ${item.type === 'folder' ? 'cursor-pointer' : ''}`}
                                                            onClick={() => item.type === 'folder' && handleItemClick(item)}                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 max-w-3xs">
                                                                <span className="font-medium text-gray-900 truncate " title={item.name}>
                                                                    {formatFileName(item.name, 30, 3)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3 max-w-4xl">
                                                                <span className="font-medium text-gray-900 line-clamp-2 break-words" title={item.comment ?? ""}>
                                                                    {item.comment}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-left text-sm text-gray-600 min-w-24">
                                                            {item.type === 'folder' ? '—' : formatFileSize(item.size)}
                                                        </td>

                                                        {/*<td className="px-4 py-4 text-sm text-gray-600 w-10 hidden md:table-cell">*/}
                                                        {/*    {getFileIcon(item)}*/}
                                                        {/*</td>*/}

                                                        <td className="px-4 py-4 text-left text-sm text-gray-600 w-40 hidden md:table-cell">
                                                            {formatDateToMinute(item.modifiedAt)}
                                                        </td>

                                                        <td className="pr-4 py-4 text-right w-20">
                                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                                {item.type === 'file' && item.url && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            downloadFile(item).catch(err => setError(err.message));
                                                                        }}
                                                                        className="p-1.5 rounded bg-white border border-gray-200 hover:bg-gray-300 hover:border-gray-400 rounded-lg shadow-sm transition-colors"
                                                                        title="Download"
                                                                    >
                                                                        <Download className="w-4 h-4 text-gray-600" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openEditDialog(item);
                                                                    }}
                                                                    disabled={busy}
                                                                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Edit comment"
                                                                >
                                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openDeleteDialog(item);
                                                                    }}
                                                                    disabled={busy}
                                                                    className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {sortedItems.length === 0 ? (
                                        <div className="col-span-full justify-items-center text-center text-gray-500 py-12">
                                            {searchQuery ? 'No items match your search' :
                                                (
                                                    <div className=" text-center justify-items-center">
                                                        <label className="w-27 flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                                                            <Upload className="w-4 h-4" />
                                                            <span>Upload</span>
                                                            <input
                                                                type="file"
                                                                multiple
                                                                onChange={handleFileUpload}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <div className="p-4">
                                                            Drag and drop files to upload
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
                                        sortedItems.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleItemClick(item)}
                                                className={`group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all 
                                                                ${item.type === 'folder' ? 'cursor-pointer' : ''}`}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-16 h-16 flex items-center justify-center">
                                                        {getFileIcon(item)}
                                                    </div>
                                                    <div className="text-center w-full">
                                                        <div className="text-gray-900 truncate" title={item.name}>
                                                            {formatFileName(item.name, 25, 3)}
                                                        </div>
                                                        {item.type === 'file' && (
                                                            <div className="text-gray-500 text-sm mt-1">
                                                                {formatFileSize(item.size)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="absolute space-x-1 top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {item.type === 'file' && item.url && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                downloadFile(item).catch(err => setError(err.message));
                                                            }}
                                                            className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditDialog(item);
                                                        }}
                                                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteDialog(item);
                                                        }}
                                                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals giữ nguyên như cũ */}
            {showDeleteDialog && itemToDelete && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => {
                        setShowDeleteDialog(false);
                        setItemToDelete(null);
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Nút đóng */}
                        <button
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setItemToDelete(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                                Delete {itemToDelete.type === 'folder' ? 'folder' : 'file'}?
                            </h3>
                        </div>

                        <p className="text-gray-600 text-center mb-6">
                            Are you sure you want to delete{' '}
                            {itemToDelete.type === 'folder' ? ' folder' : ' file'}
                            <span className="ps-1 inline-block max-w-[280px] overflow-hidden whitespace-nowrap align-bottom font-bold"
                                title={itemToDelete.name}>
                                {formatFileName(itemToDelete.name, 30, 3)}
                            </span> ?
                            {itemToDelete.type === 'folder' && (
                                <span className="block mt-2 text-red-600 font-medium">
                                    All content inside the folder will also be permanently deleted.
                                </span>
                            )}
                            <br />
                            <span className="text-sm">This action cannot be undone.</span>
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteDialog(false);
                                    setItemToDelete(null);
                                }}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditDialog && itemToRename && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-gray-50 rounded-xl shadow-2xl h-fit max-w-4xl h-140 w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center text-xl text-gray-900 min-w-0">
                                Edit {itemToRename.type === 'folder' ? 'Folder' : 'File'}
                                <span className="px-2 font-bold truncate max-w-xl ">
                                    {formatFileName(itemToRename.name, 30, 3)}
                                </span>
                                <span>comment</span>
                            </h3>

                            <button
                                onClick={() => setShowEditDialog(false)}
                                className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            {/*{getFileIcon(itemToRename)}*/}
                            <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter" && (e.shiftKey || e.ctrlKey || e.altKey)) {
                                        return;
                                    }
                                    if (e.key === 'Enter') handleEditSave();
                                    if (e.key === 'Escape') setShowEditDialog(false);
                                }}
                                className="w-full h-120 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:none"
                                rows={4}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditDialog(false)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={false}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Folder Dialog */}
            {showNewFolderDialog && (
                <div
                    className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={() => {
                        setShowNewFolderDialog(false);
                        setNewFolderName('');
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Folder</h3>
                        <input
                            type="text"
                            placeholder="Folder name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') {
                                    setShowNewFolderDialog(false);
                                    setNewFolderName('');
                                }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowNewFolderDialog(false);
                                    setNewFolderName('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showUploadProgress && uploadQueue.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in slide-in-from-bottom">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="font-semibold text-gray-900">
                            Uploading {uploadQueue.filter(u => u.status === 'uploading').length || uploadQueue.length} file(s)
                        </div>
                        <button
                            onClick={() => {
                                setShowUploadProgress(false);
                                setUploadQueue([]);
                                setTotalUploadProgress(0);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                        {/* Total Progress */}
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Total Progress</span>
                                <span>{Math.round(totalUploadProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 shadow-md"
                                    style={{ width: `${totalUploadProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Individual Files */}
                        <div className="space-y-3">
                            {uploadQueue.map((upload, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-shrink-0">
                                        {upload.status === 'waiting' && <div className="w-5 h-5 border-2 border-gray-400 border-dashed rounded-full" />}
                                        {upload.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                                        {upload.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {upload.file.name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${upload.status === 'success' ? 'bg-green-500' :
                                                        upload.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                                                        }`}
                                                    style={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {upload.progress}%
                                            </span>
                                        </div>
                                        {upload.error && (
                                            <div className="text-xs text-red-600 mt-1">{upload.error}</div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatFileSize(upload.file.size)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}