import { useState } from "react";
import { getUploadUrl } from "@/lib/admin-api";
import { ImageIcon } from "./icons";

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

async function compressToBlob(file: File): Promise<{ blob: Blob; contentType: string }> {
  if (/svg|gif/i.test(file.type)) return { blob: file, contentType: file.type };

  const dataUrl = await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Falha ao ler arquivo"));
    r.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Falha ao decodificar imagem"));
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { blob: file, contentType: file.type };
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", JPEG_QUALITY),
  );
  return { blob: blob ?? file, contentType: blob ? "image/jpeg" : file.type };
}

function finalFilename(original: string, contentType: string): string {
  if (contentType === "image/jpeg" && !/\.jpe?g$/i.test(original)) {
    return original.replace(/\.[^.]+$/, "") + ".jpg";
  }
  return original;
}

export function ImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Comprimir localmente
      const { blob, contentType } = await compressToBlob(file);
      const filename = finalFilename(file.name, contentType);

      // 2. Obter URL assinada do Supabase (payload mínimo, auth inline no servidor)
      const urlResult = await getUploadUrl({ data: { filename, contentType } });
      if (!urlResult?.signedUrl) {
        throw new Error(urlResult?.error ?? "Servidor não retornou URL de upload");
      }

      // 3. PUT direto ao Supabase Storage — bypassa limite 4.5 MB do Vercel
      const res = await fetch(urlResult.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Upload falhou (${res.status}): ${body || res.statusText}`);
      }

      if (!urlResult.publicUrl) throw new Error("URL pública não retornada pelo servidor");
      onUploaded(urlResult.publicUrl);
    } catch (err) {
      alert(`Erro ao enviar imagem: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="admin-uploader">
      <label className="admin-upload-btn">
        <ImageIcon />
        <span>{uploading ? "Otimizando e enviando..." : "Escolher imagem"}</span>
        <input type="file" accept="image/*" onChange={handleFile} hidden disabled={uploading} />
      </label>
    </div>
  );
}
