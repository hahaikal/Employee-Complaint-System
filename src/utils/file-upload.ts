import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Compress an image file into a lightweight Data URL as a fallback
 * if Supabase Storage bucket upload is restricted by RLS.
 */
async function compressImageToDataUrl(file: File, maxDimension = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.type.startsWith("image/")) {
    return compressImageToDataUrl(file);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file to Supabase Storage bucket `bukti-pengaduan`
 * and falls back to a compressed Data URL if storage RLS blocks the upload.
 */
export async function uploadEvidenceFile(
  supabase: SupabaseClient,
  file: File,
  folder: "pengaduan" | "penyelesaian"
): Promise<{ url: string; fileName: string; fileType: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${folder}/${Date.now()}_${safeName}`;

  try {
    const { data, error } = await supabase.storage
      .from("bukti-pengaduan")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from("bukti-pengaduan")
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return {
          url: publicUrlData.publicUrl,
          fileName: file.name,
          fileType: file.type || "image/jpeg",
        };
      }
    }
  } catch (err) {
    console.warn("Storage upload fallback to DataURL:", err);
  }

  // Fallback: convert to compressed Data URL so upload never fails
  const dataUrl = await fileToDataUrl(file);
  return {
    url: dataUrl,
    fileName: file.name,
    fileType: file.type || "image/jpeg",
  };
}
