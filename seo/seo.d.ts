export const SITE_URL: string;
export const SITE_NAME: string;
export const DEFAULT_IMAGE: string;
export const HOME_TITLE: string;
export const HOME_DESCRIPTION: string;
export const HOME_TITLE_EN: string;
export const HOME_DESCRIPTION_EN: string;
export const SPA_STATIC_PATHS: string[];
export const SPA_DYNAMIC_PREFIXES: string[];
export const SITEMAP_PRODUCTS_PER_FILE: number;

export interface PageMetaData {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}
export interface TrailStep { name: string; path: string }
type Json = Record<string, unknown>;

export function escapeHtml(value: unknown): string;
export function escapeXml(value: unknown): string;
export function safeJson(value: unknown): string;
export function absoluteUrl(pathOrUrl: string, siteUrl?: string): string;
export function truncate(text: string, max: number): string;
export function formatMznPlain(value: string | number): string;
export function categoryPath(category: { slug: string }): string;
export function productPath(product: { id: string }): string;
export function homeMeta(locale?: "pt" | "en"): PageMetaData;
export function categoryMeta(category: { name: string; slug: string }, info: { total: number; sampleNames: string[] }): PageMetaData;
export function productMeta(product: any, category: { name: string; slug: string } | null): PageMetaData;
export function breadcrumbJsonLd(trail: TrailStep[], siteUrl?: string): Json;
export function productJsonLd(product: any, siteUrl?: string): Json;
export function collectionJsonLd(category: { name: string; slug: string }, products: any[], siteUrl?: string): Json;
export function injectHead(html: string, meta: PageMetaData, extra?: { jsonLd?: Json[]; bodyHtml?: string; siteUrl?: string }): string;
export function crawlableBody(input: { h1: string; intro?: string; breadcrumb?: TrailStep[]; links?: TrailStep[] }): string;
export function urlEntry(loc: string, lastmod?: string | null): string;
export function buildUrlset(entries: string[]): string;
export function buildSitemapIndex(locs: { loc: string; lastmod?: string | null }[]): string;
export function isSitemapProduct(product: any): boolean;
export function isSitemapCategory(category: any, total: number): boolean;
