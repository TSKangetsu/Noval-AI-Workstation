import type { GalleryFolderItem, GeneratedImageRecord } from "../engine/types";

export interface GalleryFileSelector {
  image_ids?: string[];
  gallery_indices?: number[];
  index_range?: [number, number];
  /** "" = ungrouped only; "*" = all images across pool & folders; non-empty name = specific folder */
  from_folder?: string;
  scene_ids?: string[];
  scene_prefix?: string;
  seeds?: number[];
  starred_only?: boolean;
  unstarred_only?: boolean;
  upscaled_only?: boolean;
  unupscaled_only?: boolean;
  checked_only?: boolean;
  selected_only?: boolean;
}

export interface GalleryFolderSummary {
  name: string;
  count: number;
  starred_count: number;
  upscaled_count: number;
  is_opened: boolean;
  is_pinned: boolean;
  created_at: number;
}

export interface GalleryOverviewSummary {
  total_count: number;
  ungrouped_count: number;
  starred_count: number;
  upscaled_count: number;
  folders: GalleryFolderSummary[];
}

export function hasEffectiveGallerySelector(selector?: GalleryFileSelector | null): boolean {
  if (!selector || typeof selector !== "object") return false;
  if (Array.isArray(selector.image_ids) && selector.image_ids.length > 0) return true;
  if (Array.isArray(selector.gallery_indices) && selector.gallery_indices.length > 0) return true;
  if (
    Array.isArray(selector.index_range) &&
    selector.index_range.length === 2 &&
    Number.isFinite(selector.index_range[0]) &&
    Number.isFinite(selector.index_range[1])
  ) {
    return true;
  }
  if (typeof selector.from_folder === "string") return true;
  if (Array.isArray(selector.scene_ids) && selector.scene_ids.length > 0) return true;
  if (typeof selector.scene_prefix === "string" && selector.scene_prefix.trim().length > 0) return true;
  if (Array.isArray(selector.seeds) && selector.seeds.length > 0) return true;
  if (
    selector.starred_only ||
    selector.unstarred_only ||
    selector.upscaled_only ||
    selector.unupscaled_only ||
    selector.checked_only ||
    selector.selected_only
  ) {
    return true;
  }
  return false;
}

/**
 * Resolve matching gallery indices using intersection semantics across all supplied selector criteria.
 * Returns [] if no selector criteria are supplied (prevents accidental match-all on empty `{}`).
 */
export function selectGalleryRecordIndices(
  gallery: readonly GeneratedImageRecord[],
  selectedIdx: number,
  checkedIds: ReadonlySet<string>,
  selector?: GalleryFileSelector | null
): number[] {
  if (!hasEffectiveGallerySelector(selector) || !selector) {
    return [];
  }

  const idSet =
    Array.isArray(selector.image_ids) && selector.image_ids.length > 0
      ? new Set(selector.image_ids.map((s) => String(s)))
      : null;
  const idxSet =
    Array.isArray(selector.gallery_indices) && selector.gallery_indices.length > 0
      ? new Set(selector.gallery_indices.map((n) => Math.trunc(Number(n))))
      : null;
  const hasRange =
    Array.isArray(selector.index_range) &&
    selector.index_range.length === 2 &&
    Number.isFinite(selector.index_range[0]) &&
    Number.isFinite(selector.index_range[1]);
  const rangeStart = hasRange ? Math.min(Math.trunc(selector.index_range![0]), Math.trunc(selector.index_range![1])) : 0;
  const rangeEnd = hasRange ? Math.max(Math.trunc(selector.index_range![0]), Math.trunc(selector.index_range![1])) : -1;

  const sceneSet =
    Array.isArray(selector.scene_ids) && selector.scene_ids.length > 0
      ? new Set(selector.scene_ids.map((s) => String(s).trim().toUpperCase()))
      : null;
  const scenePrefix =
    typeof selector.scene_prefix === "string" && selector.scene_prefix.trim()
      ? selector.scene_prefix.trim().toUpperCase()
      : "";
  const seedSet =
    Array.isArray(selector.seeds) && selector.seeds.length > 0
      ? new Set(selector.seeds.map((n) => Math.trunc(Number(n))))
      : null;

  const hasFromFolder = typeof selector.from_folder === "string";
  const fromFolderRaw = hasFromFolder ? selector.from_folder!.trim() : "";

  const matched: number[] = [];
  for (let i = 0; i < gallery.length; i++) {
    const rec = gallery[i];
    if (idSet && !idSet.has(rec.id)) continue;
    if (idxSet && !idxSet.has(i)) continue;
    if (hasRange && (i < rangeStart || i > rangeEnd)) continue;
    if (hasFromFolder && fromFolderRaw !== "*") {
      const recFolder = rec.group_folder || "";
      if (fromFolderRaw === "") {
        if (recFolder !== "") continue;
      } else if (recFolder.toLowerCase() !== fromFolderRaw.toLowerCase()) {
        continue;
      }
    }
    if (sceneSet && !sceneSet.has((rec.scene_id || "").toUpperCase())) continue;
    if (scenePrefix && !(rec.scene_id || "").toUpperCase().startsWith(scenePrefix)) continue;
    if (seedSet && !seedSet.has(rec.seed)) continue;
    if (selector.starred_only && !rec.is_starred) continue;
    if (selector.unstarred_only && rec.is_starred) continue;
    if (selector.upscaled_only && !rec.is_upscaled) continue;
    if (selector.unupscaled_only && rec.is_upscaled) continue;
    if (selector.checked_only && !checkedIds.has(rec.id)) continue;
    if (selector.selected_only && i !== selectedIdx) continue;
    matched.push(i);
  }
  return matched;
}

export function buildGalleryFolderSummaries(
  gallery: readonly GeneratedImageRecord[],
  galleryFolders: readonly GalleryFolderItem[],
  openedFolderName: string | null,
  pinnedTargetFolderName: string | null
): GalleryOverviewSummary {
  let ungroupedCount = 0;
  let starredCount = 0;
  let upscaledCount = 0;

  const statsByFolder = new Map<
    string,
    { count: number; starred_count: number; upscaled_count: number }
  >();
  for (const fld of galleryFolders) {
    statsByFolder.set(fld.name, { count: 0, starred_count: 0, upscaled_count: 0 });
  }

  for (const rec of gallery) {
    if (rec.is_starred) starredCount++;
    if (rec.is_upscaled) upscaledCount++;
    const folder = rec.group_folder || "";
    if (!folder) {
      ungroupedCount++;
      continue;
    }
    let st = statsByFolder.get(folder);
    if (!st) {
      st = { count: 0, starred_count: 0, upscaled_count: 0 };
      statsByFolder.set(folder, st);
    }
    st.count++;
    if (rec.is_starred) st.starred_count++;
    if (rec.is_upscaled) st.upscaled_count++;
  }

  const folders: GalleryFolderSummary[] = galleryFolders.map((fld) => {
    const st = statsByFolder.get(fld.name) ?? { count: 0, starred_count: 0, upscaled_count: 0 };
    return {
      name: fld.name,
      count: st.count,
      starred_count: st.starred_count,
      upscaled_count: st.upscaled_count,
      is_opened: openedFolderName === fld.name,
      is_pinned: pinnedTargetFolderName === fld.name,
      created_at: fld.created_at,
    };
  });

  return {
    total_count: gallery.length,
    ungrouped_count: ungroupedCount,
    starred_count: starredCount,
    upscaled_count: upscaledCount,
    folders,
  };
}
