"use client";

import { useRef, useState, useTransition } from "react";

const MAX_DIMENSION = 512;

async function resizeImage(file: File): Promise<{ blob: Blob; name: string }> {
  if (file.type === "image/svg+xml") {
    return { blob: file, name: file.name };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, name: file.name };
    ctx.drawImage(bitmap, 0, 0, width, height);

    const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const outExt = outType === "image/png" ? "png" : "jpg";
    const blob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b ?? file), outType, 0.85);
    });

    return { blob, name: file.name.replace(/\.\w+$/, "") + `.${outExt}` };
  } catch {
    // Decoding can fail for corrupt files or in browsers without full
    // codec support — fall back to uploading the original, unresized.
    return { blob: file, name: file.name };
  }
}

export function LogoUploadForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2 border-t border-slate-100 pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const file = inputRef.current?.files?.[0];
        if (!file) return;
        startTransition(async () => {
          const { blob, name } = await resizeImage(file);
          const formData = new FormData();
          formData.set("logo_file", blob, name);
          await action(formData);
        });
      }}
    >
      <label className="block text-sm text-slate-700">
        Logo
        <input
          ref={inputRef}
          name="logo_file"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
      </label>
      <p className="text-xs text-slate-400">
        Automatically resized to fit within {MAX_DIMENSION}×{MAX_DIMENSION}px.
      </p>
      <button
        type="submit"
        disabled={isPending || !fileName}
        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? "Uploading…" : "Upload logo"}
      </button>
    </form>
  );
}
