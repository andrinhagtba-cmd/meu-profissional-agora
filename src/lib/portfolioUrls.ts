// Domínios permitidos e parsers seguros para Instagram e YouTube.
// Nunca aceitar HTML, iframe manual, javascript:, data:, file:.

export type ExternalMediaType = "instagram_reel" | "youtube_video" | "youtube_short";

export interface ParsedInstagram {
  type: "instagram_reel";
  shortcode: string;
  normalizedUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
}

export interface ParsedYouTube {
  type: "youtube_video" | "youtube_short";
  videoId: string;
  normalizedUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
}

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com"]);
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);
const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be"]);

function safeUrl(input: string): URL | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^(javascript|data|file|vbscript):/i.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

const INSTAGRAM_SHORTCODE_RE = /^[A-Za-z0-9_-]{5,20}$/;

export function parseInstagramUrl(input: string): ParsedInstagram | null {
  const url = safeUrl(input);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  if (!INSTAGRAM_HOSTS.has(host)) return null;

  // Accept /reel/CODE, /reels/CODE, /p/CODE, /tv/CODE
  const parts = url.pathname.split("/").filter(Boolean);
  const kindIndex = parts.findIndex((p) => ["reel", "reels", "p", "tv"].includes(p));
  if (kindIndex === -1) return null;
  const shortcode = parts[kindIndex + 1];
  if (!shortcode || !INSTAGRAM_SHORTCODE_RE.test(shortcode)) return null;

  const normalizedUrl = `https://www.instagram.com/reel/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/reel/${shortcode}/embed`;
  return {
    type: "instagram_reel",
    shortcode,
    normalizedUrl,
    embedUrl,
    thumbnailUrl: null,
  };
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

export function parseYouTubeUrl(input: string): ParsedYouTube | null {
  const url = safeUrl(input);
  if (!url) return null;
  const host = url.hostname.toLowerCase();

  let videoId: string | null = null;
  let isShort = false;

  if (YOUTUBE_SHORT_HOSTS.has(host)) {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" && parts[1]) {
      videoId = parts[1];
      isShort = true;
    } else if (parts[0] === "embed" && parts[1]) {
      videoId = parts[1];
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (parts[0] === "watch" && url.searchParams.get("v")) {
      videoId = url.searchParams.get("v");
    }
  } else {
    return null;
  }

  if (!videoId || !YOUTUBE_ID_RE.test(videoId)) return null;

  const normalizedUrl = isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return {
    type: isShort ? "youtube_short" : "youtube_video",
    videoId,
    normalizedUrl,
    embedUrl,
    thumbnailUrl,
  };
}

export function parseExternalMediaUrl(input: string):
  | ParsedInstagram
  | ParsedYouTube
  | null {
  return parseYouTubeUrl(input) ?? parseInstagramUrl(input);
}

export function isVerticalMedia(type: string): boolean {
  return type === "instagram_reel" || type === "youtube_short";
}
