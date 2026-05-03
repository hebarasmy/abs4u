"use client";

import { useId, useState } from "react";

import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";

export function ImagePicker({
  name = "image",
  helperText = "Optional reference photo of you doing the movement.",
}: {
  name?: string;
  helperText?: string;
}) {
  const id = useId();
  const [message, setMessage] = useState(helperText);

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="flex min-h-24 cursor-pointer flex-col justify-center rounded-3xl border border-dashed border-white/18 bg-white/5 px-4 py-4 text-sm text-white/70 transition hover:bg-white/8"
      >
        <span className="font-medium text-white">Attach reference photo</span>
        <span className="mt-1 leading-6">{message}</span>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];

          if (!file) {
            setMessage(helperText);
            return;
          }

          if (file.size > MAX_IMAGE_SIZE_BYTES) {
            event.currentTarget.value = "";
            setMessage("Image is too large. Keep images under 10MB.");
            return;
          }

          setMessage(`${file.name} ready to upload`);
        }}
      />
    </div>
  );
}
