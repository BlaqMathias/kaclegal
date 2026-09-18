"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
  IMAGE_UPLOAD_ACCEPT,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  UPLOAD_ACCEPT,
  formatBytes,
  slugify,
} from "@/lib/publications";
import { resolvePublicationImageUrl } from "@/lib/publicationImages";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/** Wording for each status checkbox, keyed by the stored value. */
const STATUS_LABELS = {
  draft: "Draft — hidden from the public site",
  published: "Published — visible to everyone",
  archived: "Archived — hidden, purchase history preserved",
};

/**
 * Textarea classes matched to the Input primitive.
 *
 * There is no Textarea primitive in the design system, and the consultation form
 * solves this the same way. Kept identical so the two forms stay visually
 * consistent.
 *
 * @param {boolean} hasError - Whether to show the error border.
 * @returns {string}
 */
function textareaClasses(hasError) {
  return [
    "w-full rounded-none border bg-white px-3.5 py-2.5 text-body text-brand-slate",
    "placeholder:text-brand-muted transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    hasError
      ? "border-brand-error focus:border-brand-error focus:ring-brand-error/40"
      : "border-slate-300 focus:border-brand-navy focus:ring-brand-navy/30",
  ].join(" ");
}


/**
 * Lightweight client-side signature check for publication files before a signed
 * Storage upload is requested. The private bucket MIME allowlist is still the
 * storage boundary; this catches obvious renamed/corrupt files early.
 */
async function validatePublicationFileHeader(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  const startsWith = (signature) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (ext === "pdf" && !startsWith([0x25, 0x50, 0x44, 0x46])) {
    return "This file does not look like a valid PDF.";
  }

  if (
    (ext === "epub" || ext === "docx") &&
    !startsWith([0x50, 0x4b, 0x03, 0x04])
  ) {
    return `This file does not look like a valid ${ext.toUpperCase()} file.`;
  }

  if (
    ext === "doc" &&
    !startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  ) {
    return "This file does not look like a valid DOC file.";
  }

  return null;
}

/**
 * Upload directly to a Supabase signed Storage URL while keeping browser upload
 * progress. The file body never passes through the Next.js server.
 */
function uploadToSignedUrlWithProgress({
  signedUrl,
  file,
  onProgress,
  progressCeiling = 85,
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.responseType = "text";

    // Match Supabase Storage's uploadToSignedUrl request shape. The signed URL
    // itself carries the short-lived upload token, so no browser auth key is
    // exposed here.
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const rawPercent = Math.round((event.loaded / event.total) * 100);
      onProgress(
        Math.min(
          progressCeiling,
          Math.round((rawPercent * progressCeiling) / 100),
        ),
      );
    };

    xhr.onerror = () => reject(new Error("Network error while uploading to Storage."));

    xhr.onload = () => {
      let payload = {};
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        payload = { message: xhr.responseText || "" };
      }

      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        payload,
      });
    };

    const body = new FormData();
    body.append("cacheControl", "3600");
    // Supabase Storage's signed-upload endpoint expects the file in the unnamed
    // multipart field. Passing a File preserves its MIME type and filename.
    body.append("", file);

    onProgress(0);
    xhr.send(body);
  });
}

function imageStorageUploadErrorMessage(result, fallback) {
  const message = String(
    result?.payload?.message ||
      result?.payload?.error ||
      result?.payload?.statusCode ||
      "",
  ).trim();

  if (result?.status === 413 || /too large|maximum.*size|payload/i.test(message)) {
    return "This image exceeds the current 20 MB Supabase Storage limit.";
  }

  if (/mime|content.?type|media type/i.test(message)) {
    return `Storage rejected this image type${message ? `: ${message}` : "."}`;
  }

  if (/row-level security|unauthorized|permission/i.test(message)) {
    return "Storage permission rejected the image upload. Please check the Supabase bucket setup.";
  }

  return message ? `${fallback} (${message})` : fallback;
}

function tusUploadErrorMessage(error) {
  const status = Number(error?.status) || null;
  const body = String(error?.responseText || "").trim();

  let parsedMessage = body;
  if (body) {
    try {
      const parsed = JSON.parse(body);
      parsedMessage = String(parsed?.message || parsed?.error || body).trim();
    } catch {
      // Keep the raw response body.
    }
  }

  if (status === 413 || /too large|maximum.*size|file size/i.test(parsedMessage)) {
    return "This file exceeds the current 50 MB Supabase Storage limit.";
  }

  if (status === 401 || status === 403 || /unauthor|permission|signature|token/i.test(parsedMessage)) {
    return "Supabase rejected the upload authorization. Sign in again and retry; if it continues, check the Supabase keys and bucket setup.";
  }

  if (status === 404 || /bucket.*not found/i.test(parsedMessage)) {
    return "The private publications bucket could not be found. Run the Supabase storage setup SQL again.";
  }

  if (/mime|content.?type|media type/i.test(parsedMessage)) {
    return `Supabase rejected this publication type${parsedMessage ? `: ${parsedMessage}` : "."}`;
  }

  if (parsedMessage) return `Supabase upload failed: ${parsedMessage}`;
  if (error?.message) return `Upload failed: ${error.message}`;
  return "Could not upload that publication. Please try again.";
}

function encodeTusMetadataValue(value) {
  const bytes = new TextEncoder().encode(String(value ?? ""));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function makeTusMetadata(prepared) {
  return [
    ["bucketName", prepared.bucketName],
    ["objectName", prepared.path],
    ["contentType", prepared.contentType],
    ["cacheControl", "3600"],
  ]
    .map(([key, value]) => `${key} ${encodeTusMetadataValue(value)}`)
    .join(",");
}

function tusRequest({ method, url, headers = {}, body = null, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = "text";

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, String(value));
    });

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded, event.total);
      };
    }

    xhr.onerror = () => {
      const error = new Error("Network error while uploading to Supabase Storage.");
      error.status = 0;
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error("The Supabase upload request timed out.");
      error.status = 0;
      reject(error);
    };

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        responseText: xhr.responseText || "",
        location: xhr.getResponseHeader("Location"),
        uploadOffset: xhr.getResponseHeader("Upload-Offset"),
      });
    };

    xhr.send(body);
  });
}

async function createTusUpload({ file, prepared }) {
  const result = await tusRequest({
    method: "POST",
    url: prepared.endpoint,
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(file.size),
      "Upload-Metadata": makeTusMetadata(prepared),
      "x-signature": prepared.token,
      "x-upsert": "false",
    },
  });

  if (result.status < 200 || result.status >= 300 || !result.location) {
    const error = new Error("Supabase could not start the resumable upload.");
    error.status = result.status;
    error.responseText = result.responseText;
    throw error;
  }

  return new URL(result.location, prepared.endpoint).toString();
}

async function getTusOffset({ uploadUrl, prepared }) {
  const result = await tusRequest({
    method: "HEAD",
    url: uploadUrl,
    headers: {
      "Tus-Resumable": "1.0.0",
      "x-signature": prepared.token,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    const error = new Error("Supabase could not resume the upload.");
    error.status = result.status;
    error.responseText = result.responseText;
    throw error;
  }

  const offset = Number(result.uploadOffset);
  if (!Number.isFinite(offset) || offset < 0) {
    throw new Error("Supabase returned an invalid resumable-upload offset.");
  }

  return offset;
}

async function patchTusChunk({ uploadUrl, prepared, chunk, offset, onProgress }) {
  const result = await tusRequest({
    method: "PATCH",
    url: uploadUrl,
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": String(offset),
      "Content-Type": "application/offset+octet-stream",
      "x-signature": prepared.token,
    },
    body: chunk,
    onProgress,
  });

  if (result.status < 200 || result.status >= 300) {
    const error = new Error("Supabase rejected a resumable upload chunk.");
    error.status = result.status;
    error.responseText = result.responseText;
    throw error;
  }

  const nextOffset = Number(result.uploadOffset);
  return Number.isFinite(nextOffset) && nextOffset >= 0
    ? nextOffset
    : offset + chunk.size;
}

/**
 * Direct browser -> Supabase TUS upload with 6 MiB chunks, progress and retry.
 * If a request is interrupted, HEAD asks Supabase for the last accepted byte and
 * the next PATCH continues from there instead of restarting the whole file.
 */
async function uploadPublicationWithTus({ file, prepared, onProgress }) {
  const chunkSize = 6 * 1024 * 1024;
  const retryDelays = [0, 3000, 5000, 10000, 20000];
  let uploadUrl;

  try {
    uploadUrl = await createTusUpload({ file, prepared });
  } catch (error) {
    throw new Error(tusUploadErrorMessage(error));
  }

  let offset = 0;

  onProgress(0);

  while (offset < file.size) {
    const chunkEnd = Math.min(offset + chunkSize, file.size);
    const chunk = file.slice(offset, chunkEnd, prepared.contentType);
    let completed = false;
    let lastError = null;

    for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
      if (retryDelays[attempt] > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
      }

      try {
        const baseOffset = offset;
        offset = await patchTusChunk({
          uploadUrl,
          prepared,
          chunk: file.slice(baseOffset, Math.min(baseOffset + chunkSize, file.size), prepared.contentType),
          offset: baseOffset,
          onProgress: (loaded) => {
            const overall = baseOffset + loaded;
            const percent = Math.round((overall / file.size) * 95);
            onProgress(Math.max(0, Math.min(95, percent)));
          },
        });
        completed = true;
        break;
      } catch (error) {
        lastError = error;

        // Ask Supabase how much it actually accepted before retrying. This is
        // what makes the transfer resumable after a dropped connection.
        try {
          offset = await getTusOffset({ uploadUrl, prepared });
          if (offset >= file.size) {
            completed = true;
            break;
          }
        } catch (resumeError) {
          lastError = resumeError;
        }
      }
    }

    if (!completed) {
      const error = new Error(tusUploadErrorMessage(lastError));
      error.cause = lastError;
      throw error;
    }
  }

  return { url: uploadUrl };
}

function UploadProgress({ value, label = "Uploading…" }) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between gap-3 text-caption text-brand-navy">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-navy transition-all duration-150"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * PublicationForm — shared create and edit form.
 *
 * Files (and the cover image) upload as soon as they're chosen, not on submit,
 * so a large publication file isn't re-sent every time a validation error sends the admin
 * back to the form. Each upload returns a path submitted as `file_path` /
 * `image_path` respectively.
 *
 * The URL slug is editable when creating and fixed when editing: once a
 * publication is live, changing its slug would break every link already shared.
 *
 * @param {object} props
 * @param {'create'|'edit'} [props.mode='create'] - Which operation this form performs.
 * @param {Record<string, any>|null} [props.publication=null] - Existing row, required for edit.
 */
export default function PublicationForm({
  mode = "create",
  publication = null,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [title, setTitle] = useState(publication?.title ?? "");
  const [slug, setSlug] = useState(publication?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(publication?.slug));
  const [type, setType] = useState(publication?.type ?? "");
  const [description, setDescription] = useState(
    publication?.description ?? "",
  );
  const [isPaid, setIsPaid] = useState(Boolean(publication?.is_paid));
  const [price, setPrice] = useState(
    publication?.price_naira != null ? String(publication.price_naira) : "",
  );
  const [status, setStatus] = useState(publication?.status ?? "published");
  const availableStatuses =
    isEdit && publication?.status === "archived"
      ? PUBLICATION_STATUSES
      : PUBLICATION_STATUSES.filter((value) => value !== "archived");

  // The file currently attached — either the one already saved on the row, or one
  // uploaded during this editing session.
  const [filePath, setFilePath] = useState(publication?.file_path ?? null);
  const [fileLabel, setFileLabel] = useState("");
  // Tracks paths uploaded in THIS session, so replacing one can clean it up. The
  // path already saved on the row is never in here: removing that file is the
  // update route's job, and only after the row has been updated successfully.
  const [sessionUploads, setSessionUploads] = useState([]);

  // Same pattern as the file above, for the public cover image.
  const [imagePath, setImagePath] = useState(publication?.image_path ?? null);
  const [imageSessionUploads, setImageSessionUploads] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageOptimization, setImageOptimization] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleTitleChange = (event) => {
    const value = event.target.value;
    setTitle(value);
    clearFieldError("title");
    // Keep the slug in step with the title until the admin edits it by hand.
    if (!isEdit && !slugTouched) {
      setSlug(slugify(value));
      clearFieldError("slug");
    }
  };

  /**
   * Discard a file uploaded earlier in this session.
   *
   * @param {string} path - Storage key returned by the upload route.
   */
  const discardUpload = async (path) => {
    if (!path) return;
    try {
      await fetch(`/api/admin/upload?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
    } catch (caught) {
      // Not worth surfacing: the row is unaffected and the file is in a private
      // bucket. Logged so it's visible if it ever happens often.
      console.error("[admin] Could not discard replaced upload:", caught);
    }
  };

  /**
   * Same as `discardUpload`, for a cover image uploaded earlier in this session.
   *
   * @param {string} path - Public path returned by the upload-image route.
   */
  const discardImageUpload = async (path) => {
    if (!path) return;
    try {
      await fetch(`/api/admin/upload-image?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
    } catch (caught) {
      console.error("[admin] Could not discard replaced image upload:", caught);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError("");
    clearFieldError("file");
    setUploadProgress(0);

    if (file.size > MAX_UPLOAD_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        file: `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(
          MAX_UPLOAD_BYTES,
        )}.`,
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const previousSessionUpload =
      sessionUploads[sessionUploads.length - 1] ?? null;
    let preparedPath = null;

    try {
      const headerError = await validatePublicationFileHeader(file);
      if (headerError) throw new Error(headerError);

      const prepareResponse = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          name: file.name,
          type: file.type,
          size: file.size,
        }),
      });
      const prepared = await prepareResponse.json().catch(() => ({}));

      if (!prepareResponse.ok || !prepared?.ok || !prepared?.token || !prepared?.endpoint) {
        throw new Error(prepared?.error || "Could not prepare that upload.");
      }

      preparedPath = prepared.path;

      await uploadPublicationWithTus({
        file,
        prepared,
        onProgress: setUploadProgress,
      });

      // The bytes went directly to Supabase. Verify the stored size and real file
      // signature server-side before we allow the row to reference the object.
      setUploadProgress(97);
      const verifyResponse = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          path: prepared.path,
          size: file.size,
          ext: prepared.ext,
        }),
      });
      const verified = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok || !verified?.ok) {
        throw new Error(verified?.error || "Supabase could not verify that upload.");
      }

      setFilePath(verified.path);
      setFileLabel(
        `${file.name} (${verified.sizeLabel || formatBytes(file.size)})`,
      );
      setSessionUploads((current) => [...current, verified.path]);
      setUploadProgress(100);

      if (previousSessionUpload && previousSessionUpload !== verified.path) {
        discardUpload(previousSessionUpload);
      }
    } catch (caught) {
      console.error("[admin] Publication upload failed:", caught);

      // If Storage accepted the direct upload but verification or a later step
      // failed, clean up the orphan. If the TUS upload never completed this is a
      // harmless best-effort delete.
      if (preparedPath) {
        discardUpload(preparedPath);
      }

      setFieldErrors((current) => ({
        ...current,
        file:
          caught instanceof Error && caught.message
            ? caught.message
            : "Could not upload that publication. Please try again.",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Same upload flow as `handleFileChange`, for the cover image. Kept as a
   * separate handler (rather than a shared, parameterised one) because the two
   * report errors into different field-error keys and hit different routes.
   */
  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError("");
    clearFieldError("image_path");
    setImageOptimization(null);

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setFieldErrors((current) => ({
        ...current,
        image_path: `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(
          MAX_IMAGE_UPLOAD_BYTES,
        )}.`,
      }));
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setUploadingImage(true);
    const previousSessionUpload =
      imageSessionUploads[imageSessionUploads.length - 1] ?? null;

    let stagingPath = null;

    try {
      const signResponse = await fetch("/api/admin/upload-image/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
        }),
      });
      const signPayload = await signResponse.json().catch(() => ({}));

      if (!signResponse.ok || !signPayload?.ok || !signPayload?.signedUrl) {
        setFieldErrors((current) => ({
          ...current,
          image_path:
            signPayload?.error || "Could not prepare that image upload.",
        }));
        if (imageInputRef.current) imageInputRef.current.value = "";
        setImageUploadProgress(0);
        setUploadingImage(false);
        return;
      }

      stagingPath = signPayload.stagingPath;

      const uploadResult = await uploadToSignedUrlWithProgress({
        signedUrl: signPayload.signedUrl,
        file,
        onProgress: setImageUploadProgress,
        progressCeiling: 85,
      });

      if (!uploadResult.ok) {
        if (stagingPath) {
          fetch(
            `/api/admin/upload-image?stagingPath=${encodeURIComponent(stagingPath)}`,
            { method: "DELETE" },
          ).catch(() => {});
        }

        setFieldErrors((current) => ({
          ...current,
          image_path: imageStorageUploadErrorMessage(
            uploadResult,
            "Could not upload that image. Please try again.",
          ),
        }));
        if (imageInputRef.current) imageInputRef.current.value = "";
        setImageUploadProgress(0);
        setUploadingImage(false);
        return;
      }

      // The original is now safely in the private staging bucket. The server
      // validates, compresses and saves the final WebP from there.
      setImageUploadProgress(90);

      const processResponse = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagingPath,
          name: file.name,
          type: file.type,
        }),
      });
      const payload = await processResponse.json().catch(() => ({}));

      if (!processResponse.ok || !payload?.ok) {
        setFieldErrors((current) => ({
          ...current,
          image_path: payload?.error || "Could not process that image.",
        }));
        if (imageInputRef.current) imageInputRef.current.value = "";
        setImageUploadProgress(0);
        setUploadingImage(false);
        return;
      }

      setImagePath(payload.path);
      setImageSessionUploads((current) => [...current, payload.path]);
      setImageOptimization({
        originalSizeLabel:
          payload.originalSizeLabel || formatBytes(file.size),
        sizeLabel: payload.sizeLabel || null,
        savedPercent:
          typeof payload.savedPercent === "number" ? payload.savedPercent : null,
      });
      setImageUploadProgress(100);
      setUploadingImage(false);

      if (previousSessionUpload && previousSessionUpload !== payload.path) {
        discardImageUpload(previousSessionUpload);
      }
    } catch (caught) {
      console.error("[admin] Image upload failed:", caught);

      if (stagingPath) {
        fetch(
          `/api/admin/upload-image?stagingPath=${encodeURIComponent(stagingPath)}`,
          { method: "DELETE" },
        ).catch(() => {});
      }

      setFieldErrors((current) => ({
        ...current,
        image_path: "Could not reach the server. Please try again.",
      }));
      if (imageInputRef.current) imageInputRef.current.value = "";
      setImageUploadProgress(0);
      setUploadingImage(false);
    }

  };

  /**
   * Detach the current file.
   *
   * A file uploaded during this session is deleted outright — nothing references
   * it. A file already saved on the row is only *unlinked* here; the update route
   * removes the object from Storage once the row has been saved without it. That
   * asymmetry is deliberate: if the admin abandons the form, the saved row must
   * still point at a file that exists.
   */
  const handleRemoveFile = async () => {
    setFormError("");
    clearFieldError("file");

    const uploadedThisSession = sessionUploads.includes(filePath);

    setFilePath(null);
    setFileLabel("");
    setUploadProgress(0);
    setSessionUploads([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (uploadedThisSession) {
      await discardUpload(filePath);
    }
  };

  /** Same reasoning as `handleRemoveFile`, for the cover image. */
  const handleRemoveImage = async () => {
    setFormError("");
    clearFieldError("image_path");

    const uploadedThisSession = imageSessionUploads.includes(imagePath);
    const pathToDiscard = imagePath;

    setImagePath(null);
    setImageSessionUploads([]);
    setImageUploadProgress(0);
    setImageOptimization(null);
    if (imageInputRef.current) imageInputRef.current.value = "";

    if (uploadedThisSession) {
      await discardImageUpload(pathToDiscard);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (uploading || uploadingImage) {
      setFormError("Wait for the upload to finish before saving.");
      return;
    }

    setSubmitting(true);

    /** @type {Record<string, any>} */
    const body = {
      title,
      type,
      description,
      is_paid: isPaid,
      price_naira: isPaid ? price : null,
      status,
      file_path: filePath,
      image_path: imagePath,
    };

    // Slug is set at creation and immutable thereafter.
    if (!isEdit) {
      body.slug = slug || slugify(title);
    }

    const endpoint = isEdit
      ? `/api/admin/publications/${publication.id}`
      : "/api/admin/publications";

    try {
      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        // The server may have discarded a file/image it could not attach to a
        // row. If so, forget the path: resubmitting it would save a row
        // pointing at something that no longer exists.
        if (payload.fileDiscarded) {
          setFilePath(isEdit ? (publication?.file_path ?? null) : null);
          setFileLabel("");
          setSessionUploads([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }

        if (payload.imageDiscarded) {
          setImagePath(isEdit ? (publication?.image_path ?? null) : null);
          setImageSessionUploads([]);
          setImageOptimization(null);
          if (imageInputRef.current) imageInputRef.current.value = "";
        }

        if (payload.fieldErrors) {
          // Server field names differ from the local input names: the price is
          // `price_naira`, and file/image problems are reported against
          // `file_path` / `image_path`.
          const {
            price_naira: priceError,
            file_path: filePathError,
            image_path: imagePathError,
            ...rest
          } = payload.fieldErrors;

          const mapped = { ...rest };
          if (priceError) mapped.price = priceError;
          if (filePathError) mapped.file = filePathError;
          if (imagePathError) mapped.image_path = imagePathError;

          setFieldErrors(mapped);
          setFormError(
            payload.fileDiscarded || payload.imageDiscarded
              ? "Please correct the highlighted fields and attach the file/image again."
              : "Please correct the highlighted fields.",
          );
        } else {
          setFormError(payload.error || "Could not save the publication.");
        }
        setSubmitting(false);
        return;
      }

      router.push("/admin/publications");
      router.refresh();
    } catch (caught) {
      console.error("[admin] Save failed:", caught);
      setFormError("Could not reach the server. Please try again.");
      setSubmitting(false);
    }
  };

  const attachedFileName =
    fileLabel || (filePath ? filePath.split("/").pop() : "");
  const imagePreviewUrl = resolvePublicationImageUrl(imagePath);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-2xl space-y-6 text-left"
    >
      <Input
        label="Title"
        id="title"
        name="title"
        required
        value={title}
        onChange={handleTitleChange}
        error={fieldErrors.title}
        placeholder="Data Protection Compliance for Nigerian Startups"
        wrapperClassName="[&>label]:!text-white"
      />

      {isEdit ? (
        <div>
          <span className="mb-1.5 block text-caption font-medium text-white">
            Public URL
          </span>
          <p className="border border-slate-200 bg-brand-offWhite px-3.5 py-2.5 text-body text-brand-muted">
            /publications/{publication.slug}
          </p>
          <p className="mt-1.5 text-caption text-brand-muted">
            The URL is fixed once a publication is created, so links already
            shared keep working.
          </p>
        </div>
      ) : (
        <Input
          label="URL slug"
          id="slug"
          name="slug"
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
            clearFieldError("slug");
          }}
          onBlur={(event) => setSlug(slugify(event.target.value))}
          error={fieldErrors.slug}
          placeholder="data-protection-compliance"
          wrapperClassName="[&>label]:!text-white"
        />
      )}

      <Select
        label="Type"
        id="type"
        name="type"
        required
        value={type}
        onChange={(event) => {
          setType(event.target.value);
          clearFieldError("type");
        }}
        error={fieldErrors.type}
        wrapperClassName="[&>label]:!text-white"
      >
        <option value="" disabled>
          Choose a type
        </option>
        {PUBLICATION_TYPES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-caption font-medium text-white"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            clearFieldError("description");
          }}
          aria-invalid={fieldErrors.description ? true : undefined}
          aria-describedby={
            fieldErrors.description ? "description-error" : undefined
          }
          className={textareaClasses(Boolean(fieldErrors.description))}
          placeholder="A short summary shown on the publications page."
        />
        {fieldErrors.description && (
          <p
            id="description-error"
            className="mt-1.5 text-caption text-brand-error"
          >
            {fieldErrors.description}
          </p>
        )}
      </div>

      {/* Pricing */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 block w-full text-caption font-medium text-white">
          Pricing
        </legend>

        <div className="border border-slate-200 bg-white p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isPaid}
              onChange={(event) => {
                setIsPaid(event.target.checked);
                clearFieldError("price");
              }}
              className="mt-1 h-4 w-4 rounded-none border-slate-300 text-brand-navy focus:ring-brand-navy/30"
            />
            <span>
              <span className="block text-body font-medium text-brand-slate">
                This is a paid publication
              </span>
              <span className="mt-0.5 block text-caption text-brand-muted">
                Leave unchecked to offer it free. Free items can be read
                directly from the site.
              </span>
            </span>
          </label>

          {isPaid && (
            <div className="mt-5">
              <Input
                label="Price (Naira)"
                id="price"
                name="price"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                required
                value={price}
                onChange={(event) => {
                  setPrice(event.target.value);
                  clearFieldError("price");
                }}
                error={fieldErrors.price}
                placeholder="15000"
              />
              <p className="mt-1.5 text-caption text-brand-muted">
                Whole Naira, no kobo. Payment is wired up in the next phase.
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* File */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 block w-full text-caption font-medium text-white">
          File
        </legend>

        <div className="border border-slate-200 bg-white p-5">
          <label
            htmlFor="file"
            className="mb-1.5 block text-caption font-medium text-brand-slate"
          >
            {filePath ? "Replace file" : "Upload file"}
          </label>
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            accept={UPLOAD_ACCEPT}
            onChange={handleFileChange}
            disabled={uploading}
            aria-invalid={fieldErrors.file ? true : undefined}
            aria-describedby={fieldErrors.file ? "file-error" : "file-hint"}
            className="block w-full text-caption text-brand-slate file:mr-4 file:rounded-none file:border-0 file:bg-brand-navy file:px-4 file:py-2.5 file:text-caption file:font-medium file:text-white hover:file:bg-brand-navyDark disabled:opacity-60"
          />

          <p id="file-hint" className="mt-2 text-caption text-brand-muted">
            PDF, EPUB, DOC or DOCX, up to {formatBytes(MAX_UPLOAD_BYTES)}.
            Stored privately in Supabase using resumable upload — never linked publicly.
          </p>

          {uploading && <UploadProgress value={uploadProgress} />}

          {!uploading && attachedFileName && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-caption text-brand-success">
                Attached: {attachedFileName}
              </p>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-caption font-medium text-brand-error underline decoration-1 underline-offset-2 transition-opacity hover:opacity-70"
              >
                Remove file
              </button>
            </div>
          )}

          {!uploading && !filePath && (
            <p className="mt-2 text-caption text-brand-muted">
              No file attached yet. You can save this as a draft and add the
              file later.
            </p>
          )}

          {fieldErrors.file && (
            <p id="file-error" className="mt-2 text-caption text-brand-error">
              {fieldErrors.file}
            </p>
          )}
        </div>
      </fieldset>

      {/* Cover image */}
      <fieldset className="min-w-0">
        <legend className="mb-1.5 block w-full text-caption font-medium text-white">
          Cover image
        </legend>

        <div className="flex flex-col gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-start">
          {imagePath && (
            // Plain <img>, not next/image: this is an admin-only preview of the
            // optimized WebP stored in the public publication-images bucket.
            <img
              src={imagePreviewUrl}
              alt=""
              className="h-28 w-28 shrink-0 rounded-none border border-slate-200 object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <label
              htmlFor="image"
              className="mb-1.5 block text-caption font-medium text-brand-slate"
            >
              {imagePath ? "Replace image" : "Upload image"}
            </label>
            <input
              ref={imageInputRef}
              id="image"
              name="image"
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT}
              onChange={handleImageChange}
              disabled={uploadingImage}
              aria-invalid={fieldErrors.image_path ? true : undefined}
              aria-describedby={
                fieldErrors.image_path ? "image-error" : "image-hint"
              }
              className="block w-full text-caption text-brand-slate file:mr-4 file:rounded-none file:border-0 file:bg-brand-navy file:px-4 file:py-2.5 file:text-caption file:font-medium file:text-white hover:file:bg-brand-navyDark disabled:opacity-60"
            />

            <p id="image-hint" className="mt-2 text-caption text-brand-muted">
              JPEG, PNG, WEBP, AVIF or TIFF, up to {formatBytes(MAX_IMAGE_UPLOAD_BYTES)}. The image is resized when needed and compressed to WebP before it is saved. Optional.
            </p>

            {uploadingImage && (
              <UploadProgress
                value={imageUploadProgress}
                label={
                  imageUploadProgress >= 90
                    ? "Optimizing & saving…"
                    : "Uploading…"
                }
              />
            )}

            {!uploadingImage && imageOptimization && (
              <p className="mt-2 text-caption text-brand-success">
                Optimized to WebP: {imageOptimization.originalSizeLabel}
                {imageOptimization.sizeLabel
                  ? ` → ${imageOptimization.sizeLabel}`
                  : ""}
                {imageOptimization.savedPercent > 0
                  ? ` (${imageOptimization.savedPercent}% smaller)`
                  : ""}
              </p>
            )}

            {!uploadingImage && imagePath && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-caption font-medium text-brand-error underline decoration-1 underline-offset-2 transition-opacity hover:opacity-70"
              >
                Remove image
              </button>
            )}

            {fieldErrors.image_path && (
              <p
                id="image-error"
                className="mt-2 text-caption text-brand-error"
              >
                {fieldErrors.image_path}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-1.5 block w-full text-caption font-medium text-white">
          Status
        </legend>

        <div className="border border-slate-200 bg-white p-5">
          <div className="space-y-3">
            {availableStatuses.map((value) => (
              <label key={value} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="status"
                  checked={status === value}
                  onChange={() => {
                    // Checkbox-styled, but radio in behaviour: checking one
                    // option always selects it outright. Archive is exposed only
                    // for an already archived publication so it can be restored
                    // safely without making archive a normal edit/create state.
                    setStatus(value);
                    clearFieldError("status");
                  }}
                  className="mt-1 h-4 w-4 rounded-none border-slate-300 text-brand-navy focus:ring-brand-navy/30"
                />
                <span className="block text-body font-medium text-brand-slate">
                  {STATUS_LABELS[value] ?? value}
                </span>
              </label>
            ))}
          </div>

          {fieldErrors.status && (
            <p className="mt-2 text-caption text-brand-error">
              {fieldErrors.status}
            </p>
          )}
        </div>
      </fieldset>

      {formError && (
        <div
          role="alert"
          className="border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-caption text-brand-error"
        >
          {formError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-6">
        <Button
          type="submit"
          loading={submitting}
          disabled={uploading || uploadingImage}
        >
          {isEdit ? "Save changes" : "Create publication"}
        </Button>
        <Button
          href="/admin/publications"
          variant="ghost"
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
