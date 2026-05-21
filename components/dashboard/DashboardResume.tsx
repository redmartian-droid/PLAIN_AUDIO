// components/dashboard/DashboardResume.tsx
"use client";

import { usePendingTranscription } from "@/hooks/usePendingTranscription";
import { useRouter } from "next/navigation";

export function DashboardResume({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  usePendingTranscription({
    onStart: (filename) => {
      // toast or banner: "Uploading {filename}..."
      console.log("Resuming", filename);
    },
    onDone: (id) => {
      router.push(`/dashboard/transcriptions/${id}`);
    },
    onError: (msg) => {
      // toast error, or set state if you want a banner
      console.error(msg);
    },
  });

  return <>{children}</>;
}
