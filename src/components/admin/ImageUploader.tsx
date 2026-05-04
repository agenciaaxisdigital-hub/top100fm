import { useState } from "react";
import { getUploadUrl } from "@/lib/admin-api";
import { ImageIcon } from "./icons";

const MAX_DIM = 2400;
const TARGET_QUALITY = 0.85;

async function compressImage(file: File): Promise<Blob> {
  if (/svg|gif/i.test(file.type)) return file;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("img"));
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > MAX_DIM || height > MAX_DIM) {
    const r = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * r);
    height = Math.round(height * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", TARGET_QUALITY),
  );
  return blob || file;
}


export function ImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      alert("Imagem muito grande (máx. 200 MB)");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const contentType = compressed.type || file.type || "image/jpeg";
      const finalName =
        contentType === "image/jpeg" && !/\.jpe?g$/i.test(file.name)
          ? file.name.replace(/\.[^.]+$/, "") + ".jpg"
          : file.name;

      // Step 1: get a signed upload URL from the server (small payload, inline auth)
      const urlResult = await getUploadUrl({ data: { filename: finalName, contentType } });
      if (!urlResult?.signedUrl) throw new Error(urlResult?.error || "Não foi possível obter URL de upload");

      // Step 2: upload directly from browser to Supabase Storage (bypasses Vercel body limit)
      const uploadRes = await fetch(urlResult.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: compressed,
      });
      if (!uploadRes.ok) throw new Error(`Upload direto falhou: ${uploadRes.status} ${uploadRes.statusText}`);

      onUploaded(urlResult.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      alert(`Erro ao enviar imagem: ${message}`);
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
        <input type="file" accept="image/*" onChange={handleFile} hidden />
      </label>
    </div>
  );
}
