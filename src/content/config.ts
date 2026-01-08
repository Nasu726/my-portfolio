import { z, defineCollection } from "astro:content";
const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional().transform((str) => {return str || "/post_img.webp"}),
    badge: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

const bookSchema = z.object({
    title: z.string(),
    authors: z.union([z.string(), z.array(z.string())]),
    translators: z.union([z.string(), z.array(z.string())]).optional(),
    publisher: z.string(),
    pubDate: z.coerce.date(),
    url: z.string().optional(),
    heroImage: z.string().optional().transform((str) => {return str || "/post_img.webp"}),
    status: z.string(),
    regDate: z.coerce.date(),
    beginDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    badge: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

const storeSchema = z.object({
    title: z.string(),
    description: z.string(),
    custom_link_label: z.string(),
    custom_link: z.string().optional(),
    updatedDate: z.coerce.date(),
    pricing: z.string().optional(),
    oldPricing: z.string().optional(),
    badge: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
    checkoutUrl: z.string().optional(),
    heroImage: z.string().optional(),
});

const projectSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    heroImage: z.string().optional(),
    heroImageDark: z.string().optional(), // ダークモード用画像
    badge: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
    url: z.string().optional(), // GitHubやデモサイトへのリンク
});

export type BlogSchema = z.infer<typeof blogSchema>;
export type BookSchema = z.infer<typeof bookSchema>;
export type StoreSchema = z.infer<typeof storeSchema>;
export type ProjectSchema = z.infer<typeof projectSchema>;

const blogCollection = defineCollection({ schema: blogSchema });
const bookCollection = defineCollection({ schema: bookSchema });
const storeCollection = defineCollection({ schema: storeSchema });
const projectCollection = defineCollection({ schema: projectSchema });

export const collections = {
    'blog': blogCollection,
    'books': bookCollection,
    'store': storeCollection,
    'projects': projectCollection,
}