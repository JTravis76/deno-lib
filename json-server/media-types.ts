export interface IMediaType {
  [key: string]: string
}

export const mediaTypes = {
  "md": "text/markdown",
  "html": "text/html",
  "htm": "text/html",
  "aspx": "text/html",
  "txt": "text/plain",
  "css": "text/css",
  "ico": "image/ico",
  "gif": "image/gif",
  "jpg": "image/jpg",
  "pdf": "application/pdf",
  "png": "image/png",
  "json": "application/json",
  "map": "application/json",
  "js": "application/javascript",
  "mjs": "application/javascript",
  "woff": "font/woff",
  "woff2": "font/woff2",
  "doc": "application/octet-stream",
  "docx": "application/octet-stream",
  "ppt": "application/octet-stream",
  "pptx": "application/octet-stream"
} as IMediaType;

export default mediaTypes;