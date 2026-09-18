import {
  PUBLICATION_STATUSES,
  PUBLICATION_TYPES,
  slugify,
} from '@/lib/publications';

/** Field length ceilings, mirrored by the admin form's own inline checks. */
const LIMITS = {
  title: 200,
  description: 4000,
  slug: 80,
  filePath: 400,
  imagePath: 300,
};

/** Upper bound on price, purely to catch a slipped digit (₦100,000,000). */
const MAX_PRICE_NAIRA = 100000000;

/**
 * Validate and normalise a publication payload for insert or update.
 *
 * Shared by the create and update routes so the two can never drift apart —
 * every rule below is enforced server-side regardless of what the form did.
 *
 * Two rules worth calling out:
 *
 * - The slug is set once, at creation, and never changes on update. Public URLs
 *   (`/publications/<slug>`) stay stable, so a link shared today keeps working
 *   after the admin fixes a typo in the title.
 * - `file_path` on update is tri-state: absent (or `undefined`) means "leave the
 *   existing file alone", a string means "replace it", and an explicit `null`
 *   means "detach it". That distinction is what stops a metadata-only edit from
 *   silently orphaning or deleting a file.
 *
 * @param {Record<string, unknown>} raw - Parsed JSON request body.
 * @param {object} [options]
 * @param {'create'|'update'} [options.mode='create'] - Which operation this is for.
 * @param {Record<string, any>|null} [options.existing=null] - Current row, required for 'update'.
 * @returns {{ok: true, data: Record<string, any>} | {ok: false, fieldErrors: Record<string, string>}}
 */
export function normalizePublicationPayload(raw, options = {}) {
  const { mode = 'create', existing = null } = options;
  const body = raw && typeof raw === 'object' ? raw : {};

  /** @type {Record<string, string>} */
  const fieldErrors = {};

  // ---- title ----------------------------------------------------------------
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    fieldErrors.title = 'Title is required.';
  } else if (title.length > LIMITS.title) {
    fieldErrors.title = `Title must be ${LIMITS.title} characters or fewer.`;
  }

  // ---- type -----------------------------------------------------------------
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  if (!type) {
    fieldErrors.type = 'Type is required.';
  } else if (!PUBLICATION_TYPES.includes(type)) {
    fieldErrors.type = 'Choose one of the listed publication types.';
  }

  // ---- description ----------------------------------------------------------
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (description.length > LIMITS.description) {
    fieldErrors.description = `Description must be ${LIMITS.description} characters or fewer.`;
  }

  // ---- status ---------------------------------------------------------------
  const status =
    typeof body.status === 'string'
      ? body.status.trim()
      : mode === 'create'
        ? 'published'
        : existing?.status ?? 'draft';
  if (!PUBLICATION_STATUSES.includes(status)) {
    fieldErrors.status = 'Status must be draft, published or archived.';
  }

  // ---- paid / price ---------------------------------------------------------
  const isPaid = body.is_paid === true || body.is_paid === 'true';
  /** @type {number|null} */
  let priceNaira = null;

  if (isPaid) {
    const rawPrice = body.price_naira;
    const parsed =
      typeof rawPrice === 'number'
        ? rawPrice
        : Number(String(rawPrice ?? '').replace(/[,\s₦]/g, ''));

    if (!Number.isFinite(parsed) || parsed <= 0) {
      fieldErrors.price_naira = 'Enter a price greater than zero.';
    } else if (!Number.isInteger(parsed)) {
      fieldErrors.price_naira = 'Enter a whole Naira amount (no kobo).';
    } else if (parsed > MAX_PRICE_NAIRA) {
      fieldErrors.price_naira = 'That price looks too high — please check it.';
    } else {
      priceNaira = parsed;
    }
  }
  // When the item is free, the price is forced to null rather than kept around,
  // so a toggle from paid to free can't leave a stale amount for Phase 7 to read.

  // ---- file_path ------------------------------------------------------------
  // Tri-state on update: undefined = unchanged, string = replace, null = detach.
  const filePathProvided =
    Object.prototype.hasOwnProperty.call(body, 'file_path') &&
    body.file_path !== undefined;

  /** @type {string|null} */
  let filePath = null;

  if (filePathProvided) {
    filePath =
      typeof body.file_path === 'string' && body.file_path.trim()
        ? body.file_path.trim()
        : null;

    // A path the row already holds is accepted as-is. The edit form echoes the
    // stored value back on every save, so validating it would make a row whose
    // path was set by hand in the Supabase table editor permanently unsavable —
    // the admin could not even fix a typo in the title.
    const unchanged = mode === 'update' && filePath === (existing?.file_path ?? null);

    if (!unchanged && filePath) {
      if (filePath.length > LIMITS.filePath) {
        fieldErrors.file_path = 'That file reference is not valid.';
      }
      // New direct signed uploads are stored under `<auth-user-uuid>/YYYY/<uuid>.<ext>`
      // so every object gets a unique server-issued path. Older
      // `YYYY/<uuid>.<ext>` paths remain valid for existing publications.
      if (!/^(?:[a-f0-9-]{36}\/)?\d{4}\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(filePath)) {
        fieldErrors.file_path =
          'That file reference is not valid. Re-upload the file.';
      }
    }
  } else if (mode === 'update') {
    filePath = existing?.file_path ?? null;
  }

  // A published item with no file would show a "Read"/"Buy" button that leads
  // nowhere, so publishing requires an attached file. Drafts may have none,
  // which is the point of drafts.
  if (status === 'published' && !filePath) {
    fieldErrors.file = 'Attach a file before publishing. Save as a draft instead.';
  }

  // ---- image_path (cover image) ----------------------------------------------
  // Same tri-state as file_path — but a cover image is cosmetic, never required
  // to publish, so there is no "must be present" check to go with it.
  const imagePathProvided =
    Object.prototype.hasOwnProperty.call(body, 'image_path') &&
    body.image_path !== undefined;

  /** @type {string|null} */
  let imagePath = null;

  if (imagePathProvided) {
    imagePath =
      typeof body.image_path === 'string' && body.image_path.trim()
        ? body.image_path.trim()
        : null;

    const unchangedImage =
      mode === 'update' && imagePath === (existing?.image_path ?? null);

    if (!unchangedImage && imagePath) {
      if (imagePath.length > LIMITS.imagePath) {
        fieldErrors.image_path = 'That image reference is not valid.';
      }
      // New image keys are normalized to WebP by the upload-image route.
      if (!/^\d{4}\/[a-f0-9-]{36}\.webp$/i.test(imagePath)) {
        fieldErrors.image_path =
          'That image reference is not valid. Re-upload the image.';
      }
    }
  } else if (mode === 'update') {
    imagePath = existing?.image_path ?? null;
  }

  // ---- slug (create only) ---------------------------------------------------
  /** @type {string|undefined} */
  let slug;

  if (mode === 'create') {
    const custom =
      typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : '';

    // Length is checked on the REQUESTED slug, before slugify() truncates it.
    // Checking afterwards would make this branch unreachable and quietly shorten
    // a slug the admin typed deliberately — whereas truncating one derived from a
    // long title is exactly what should happen.
    if (custom.length > LIMITS.slug) {
      fieldErrors.slug = `URL slug must be ${LIMITS.slug} characters or fewer.`;
    }

    slug = slugify(custom || title);

    if (!slug) {
      fieldErrors.slug =
        'Could not build a URL from this title. Add a custom URL slug.';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  /** @type {Record<string, any>} */
  const data = {
    title,
    type,
    description,
    is_paid: isPaid,
    price_naira: priceNaira,
    file_path: filePath,
    image_path: imagePath,
    status,
  };

  if (mode === 'create') {
    data.slug = slug;
  }

  return { ok: true, data };
}
