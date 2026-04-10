export type UploadedAttachment = {
  id: string;
  url: string;
  filename: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
};

export async function uploadFiles(files: FileList | File[], opts?: { signal?: AbortSignal }) {
  const list = Array.isArray(files) ? files : Array.from(files);
  const fd = new FormData();
  for (const f of list) fd.append("files", f);

  const r = await fetch("/api/v1/uploads", {
    method: "POST",
    credentials: "include",
    body: fd,
    signal: opts?.signal,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) {
    const msg = j?.error ?? "Не удалось загрузить файлы";
    throw new Error(msg);
  }
  return (j?.attachments ?? []) as UploadedAttachment[];
}

