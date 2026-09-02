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
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/** Wording for each status in the dropdown, keyed by the stored value. */
const STATUS_LABELS = {
  draft: "Draft — hidden from the public site",
  published: "Published — visible to everyone",
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
 * PublicationForm — shared create and edit form.
 *
 * Files (and the cover image) upload as soon as they're chosen, not on submit,
 * so a 25 MB PDF isn't re-sent every time a validation error sends the admin
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
  const [status, setStatus] = useState(publication?.status ?? "draft");

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
  const [uploadingImage, setUploadingImage] = useState(false);
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

    // Cheap client-side check so an oversized file isn't uploaded just to be
    // rejected. The server re-checks this — it is the check that counts.
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

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setFieldErrors((current) => ({
          ...current,
          file: payload.error || "Could not upload that file.",
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        setUploading(false);
        return;
      }

      setFilePath(payload.path);
      setFileLabel(
        `${file.name} (${payload.sizeLabel || formatBytes(file.size)})`,
      );
      setSessionUploads((current) => [...current, payload.path]);
      setUploading(false);

      // A previous upload from this same session is now unreferenced.
      if (previousSessionUpload && previousSessionUpload !== payload.path) {
        discardUpload(previousSessionUpload);
      }
    } catch (caught) {
      console.error("[admin] Upload failed:", caught);
      setFieldErrors((current) => ({
        ...current,
        file: "Could not reach the server. Please try again.",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
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

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setFieldErrors((current) => ({
          ...current,
          image_path: payload.error || "Could not upload that image.",
        }));
        if (imageInputRef.current) imageInputRef.current.value = "";
        setUploadingImage(false);
        return;
      }

      setImagePath(payload.path);
      setImageSessionUploads((current) => [...current, payload.path]);
      setUploadingImage(false);

      if (previousSessionUpload && previousSessionUpload !== payload.path) {
        discardImageUpload(previousSessionUpload);
      }
    } catch (caught) {
      console.error("[admin] Image upload failed:", caught);
      setFieldErrors((current) => ({
        ...current,
        image_path: "Could not reach the server. Please try again.",
      }));
      if (imageInputRef.current) imageInputRef.current.value = "";
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

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6">
      <Input
        label="Title"
        id="title"
        name="title"
        required
        value={title}
        onChange={handleTitleChange}
        error={fieldErrors.title}
        placeholder="Data Protection Compliance for Nigerian Startups"
      />

      {isEdit ? (
        <div>
          <span className="mb-1.5 block text-caption font-medium text-brand-slate">
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
          className="mb-1.5 block text-caption font-medium text-brand-slate"
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
      <fieldset className="border border-slate-200 bg-white p-5">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
          Pricing
        </legend>

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
              Leave unchecked to offer it free. Free items can be read directly
              from the site.
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
      </fieldset>

      {/* File */}
      <fieldset className="border border-slate-200 bg-white p-5">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
          File
        </legend>

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
          PDF, EPUB, DOC or DOCX, up to {formatBytes(MAX_UPLOAD_BYTES)}. Stored
          privately — never linked publicly.
        </p>

        {uploading && (
          <p className="mt-2 text-caption text-brand-navy">Uploading…</p>
        )}

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
            No file attached yet. You can save this as a draft and add the file
            later.
          </p>
        )}

        {fieldErrors.file && (
          <p id="file-error" className="mt-2 text-caption text-brand-error">
            {fieldErrors.file}
          </p>
        )}
      </fieldset>

      {/* Cover image */}
      <fieldset className="border border-slate-200 bg-white p-5">
        <legend className="px-2 text-caption font-semibold uppercase tracking-[0.14em] text-brand-muted">
          Cover image
        </legend>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {imagePath && (
            // Plain <img>, not next/image: this is an admin-only preview of a
            // file that was just written to public/images/publicationUploads,
            // not a performance-sensitive public page.
            <img
              src={imagePath}
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
              JPG, PNG, WEBP or GIF, up to {formatBytes(MAX_IMAGE_UPLOAD_BYTES)}
              . Shown publicly on this publication&apos;s card. Optional.
            </p>

            {uploadingImage && (
              <p className="mt-2 text-caption text-brand-navy">Uploading…</p>
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

      <Select
        label="Status"
        id="status"
        name="status"
        required
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          clearFieldError("status");
        }}
        error={fieldErrors.status}
        options={PUBLICATION_STATUSES.map((value) => ({
          value,
          label: STATUS_LABELS[value] ?? value,
        }))}
      />

      {formError && (
        <div
          role="alert"
          className="border border-brand-error/30 bg-brand-error/5 px-4 py-3 text-caption text-brand-error"
        >
          {formError}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
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
