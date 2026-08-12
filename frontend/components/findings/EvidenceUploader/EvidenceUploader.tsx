"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EvidenceType } from "@/types";

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];
const MAX_BYTES = 10 * 1024 * 1024;

const EVIDENCE_TYPE_OPTIONS: { value: EvidenceType; label: string }[] = [
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "PDF", label: "PDF" },
  { value: "DOCUMENT", label: "Document" },
  { value: "REPORT", label: "Report" },
  { value: "OTHER", label: "Other" },
];

export function EvidenceUploader({
  findingId,
  basePath,
  onSuccess,
}: {
  findingId: string;
  basePath?: string;
  onSuccess?: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const path = basePath ?? `/api/findings/${findingId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<EvidenceType>("SCREENSHOT");
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validate = (candidate: File): string | null => {
    if (!ACCEPTED_MIME_TYPES.includes(candidate.type)) {
      return "Only PNG, JPEG, WebP, PDF, DOC/DOCX, XLS/XLSX, or CSV files are accepted.";
    }
    if (candidate.size > MAX_BYTES) {
      return "File must be 10MB or smaller.";
    }
    return null;
  };

  const pickFile = (candidate: File) => {
    const validationError = validate(candidate);
    setError(validationError);
    setFile(validationError ? null : candidate);
    if (!validationError && !name.trim()) setName(candidate.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  };

  // Three steps: 1) ask the backend to authorize the upload and hand back a short-lived
  // signed S3 URL, 2) PUT the file bytes straight to S3 (bypassing both Next.js and the
  // backend), 3) tell the backend the upload finished so it can verify + record it. No
  // Evidence row exists until step 3 succeeds — an abandoned/failed upload never creates a
  // dangling database record.
  const putToS3 = (uploadUrl: string, candidate: File) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("Failed to upload the file to storage."));
      };
      xhr.onerror = () => reject(new Error("Failed to upload the file to storage."));
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", candidate.type);
      xhr.send(candidate);
    });

  const handleSubmit = async () => {
    if (!file || !name.trim()) return;
    setSubmitting(true);
    setProgress(0);
    setError(null);

    try {
      const presignRes = await fetch(`${path}/evidence/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          name: name.trim(),
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to start the upload.");
      }
      const { evidenceId, uploadUrl } = await presignRes.json();

      await putToS3(uploadUrl, file);

      const confirmRes = await fetch(`${path}/evidence/${evidenceId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, name: name.trim(), type, note: note.trim() || undefined }),
      });
      if (!confirmRes.ok) {
        const data = await confirmRes.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to finish uploading evidence.");
      }

      setFile(null);
      setName("");
      setNote("");
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
      if (onSuccess) {
        await onSuccess();
      } else {
        await queryClient.invalidateQueries({ queryKey: ["finding", findingId] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload evidence.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed p-4 text-center text-sm transition-colors ${
          dragging ? "border-aws-blue bg-aws-blue/5" : "border-border hover:bg-accent"
        }`}
      >
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        {file ? (
          <p className="font-medium">{file.name}</p>
        ) : (
          <p className="text-muted-foreground">
            Drag a file here, or click to browse (screenshots, PDF, DOC/DOCX, XLS/XLSX, CSV — max
            10MB)
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) pickFile(selected);
          }}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Evidence Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. S3 Public Access Block Screenshot"
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Evidence Type</label>
        <Select value={type} onValueChange={(v) => v && setType(v as EvidenceType)}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        placeholder="Optional description of this evidence..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-sm"
      />

      {submitting && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-aws-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button size="sm" disabled={!file || !name.trim() || submitting} onClick={handleSubmit}>
        {submitting ? `Uploading... ${progress}%` : "Upload evidence"}
      </Button>
    </div>
  );
}
