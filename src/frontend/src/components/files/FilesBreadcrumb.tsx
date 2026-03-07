import type { FileFolder } from "@/utils/filesStorage";
import { ChevronRight, Home } from "lucide-react";

interface FilesBreadcrumbProps {
  path: FileFolder[];
  onNavigate: (folderId: string | null) => void;
}

export default function FilesBreadcrumb({
  path,
  onNavigate,
}: FilesBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-600 mb-4">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        data-ocid="files.breadcrumb.home.button"
      >
        <Home className="w-4 h-4" />
        <span>Files</span>
      </button>
      {path.map((folder) => (
        <span key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <button
            type="button"
            onClick={() => onNavigate(folder.id)}
            className="hover:text-gray-900 transition-colors"
            data-ocid="files.breadcrumb.folder.button"
          >
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
