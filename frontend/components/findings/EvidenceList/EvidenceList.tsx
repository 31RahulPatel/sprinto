import { useState } from "react";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EvidenceStatusBadge } from "@/components/findings/EvidenceStatusBadge";
import { relativeTime } from "@/lib/relative-time";
import type { EvidenceItem } from "@/types";

export function EvidenceList({
  evidence,
  basePath,
}: {
  evidence: EvidenceItem[];
  basePath: string;
}) {
  const [preview, setPreview] = useState<EvidenceItem | null>(null);

  if (evidence.length === 0) {
    return <p className="text-xs text-muted-foreground">No evidence uploaded yet.</p>;
  }

  return (
    <>
      <ul className="space-y-2">
        {evidence.map((e) => (
          <li key={e.id} className="flex items-start gap-2 rounded-md border border-border p-2">
            {e.mimeType.startsWith("image/") ? (
              <button type="button" onClick={() => setPreview(e)} className="shrink-0 cursor-zoom-in">
                <img
                  src={`${basePath}/evidence/${e.id}/file`}
                  alt={e.fileName}
                  className="h-12 w-12 rounded object-cover"
                />
              </button>
            ) : (
              <a
                href={`${basePath}/evidence/${e.id}/file`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded bg-muted"
              >
                <FileText className="h-5 w-5 text-muted-foreground" />
              </a>
            )}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-medium">{e.name}</p>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  v{e.version}
                </Badge>
                <EvidenceStatusBadge status={e.verificationStatus} className="shrink-0 text-[10px]" />
              </div>
              <p className="truncate text-xs text-muted-foreground">{e.fileName}</p>
              {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
              {e.rejectionReason && <p className="text-xs text-danger">Rejected: {e.rejectionReason}</p>}
              <p className="text-xs text-muted-foreground">
                {e.uploadedBy.name} · {relativeTime(e.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
          {preview && (
            <>
              <DialogTitle className="truncate text-sm">{preview.fileName}</DialogTitle>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${basePath}/evidence/${preview.id}/file`}
                alt={preview.fileName}
                className="max-h-[75vh] w-full rounded object-contain"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
