export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateResume(file: File): string | null {
  const hasPdfExtension = /\.pdf$/i.test(file.name);
  const hasCompatibleMime = file.type === "" || file.type === "application/pdf";

  if (!hasPdfExtension || !hasCompatibleMime) {
    return "Please choose a PDF file. Other file types are not supported.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "This file is larger than 10 MB. Choose a smaller PDF to continue.";
  }
  if (file.size === 0) {
    return "This file appears to be empty. Choose another PDF.";
  }
  return null;
}

export function formatFileSize(size: number): string {
  return size >= 1024 * 1024
    ? `${(size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}
