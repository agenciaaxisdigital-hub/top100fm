import { useState } from "react";
import { uploadImage } from "@/lib/admin-api";
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(blob);
  });
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
      const finalName =
        compressed.type === "image/jpeg" && !/\.jpe?g$/i.test(file.name)
          ? file.name.replace(/\.[^.]+$/, "") + ".jpg"
          : file.name;
      const base64 = await blobToDataUrl(compressed);
      const contentType = compressed.type || file.type || "image/jpeg";
      const result = await uploadImage({
        data: { filename: finalName, contentType, base64 },
      });
      if (!result?.publicUrl) throw new Error("Upload falhou: bucket 'media' não encontrado no Supabase Storage");
      onUploaded(result.publicUrl);
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
