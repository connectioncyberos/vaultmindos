const COMBINING_DIACRITICS = /[̀-ͯ]/g;

/** Gera um slug URL-safe a partir de um titulo (usado quando o campo slug fica em branco no CMS). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
