"use client";

import { useId, useState } from "react";

import { MAX_VIDEO_DURATION_SECONDS, MAX_VIDEO_SIZE_BYTES } from "@/lib/constants";

async function readVideoDuration(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = objectUrl;
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("Could not read video duration."));
    });
    return duration;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function VideoPicker({
  name = "video",
  durationFieldName = "videoDuration",
  helperText = `Optional short clip up to ${MAX_VIDEO_DURATION_SECONDS} seconds.`,
  label = "Attach short video",
}: {
  name?: string;
  durationFieldName?: string;
  helperText?: string;
  label?: string;
}) {
  const id = useId();
  const [message, setMessage] = useState(helperText);
  const [duration, setDuration] = useState("");

  return (
    <div className="space-y-3">
      <label
        htmlFor={id}
        className="flex min-h-28 cursor-pointer flex-col justify-center rounded-3xl border border-dashed border-white/18 bg-white/5 px-4 py-4 text-sm text-white/70 transition hover:bg-white/8"
      >
        <span className="font-medium text-white">{label}</span>
        <span className="mt-1 leading-6">{message}</span>
      </label>
      <input
        id={id}
        name={name}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];

          if (!file) {
            setDuration("");
            setMessage(helperText);
            return;
          }

          if (file.size > MAX_VIDEO_SIZE_BYTES) {
            event.currentTarget.value = "";
            setDuration("");
            setMessage("File is too large. Keep clips under 35MB.");
            return;
          }

          try {
            const fileDuration = await readVideoDuration(file);
            if (fileDuration > MAX_VIDEO_DURATION_SECONDS) {
              event.currentTarget.value = "";
              setDuration("");
              setMessage(`Video is too long. Keep clips to ${MAX_VIDEO_DURATION_SECONDS} seconds or less.`);
              return;
            }

            setDuration(String(Math.ceil(fileDuration)));
            setMessage(`${file.name} ready to upload`);
          } catch {
            event.currentTarget.value = "";
            setDuration("");
            setMessage("We couldn't read this video. Try another clip.");
          }
        }}
      />
      <input type="hidden" name={durationFieldName} value={duration} readOnly />
    </div>
  );
}
