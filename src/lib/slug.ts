export function slugify(input: string): string {
	return input
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
}

export const isValidSlug = (s: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
