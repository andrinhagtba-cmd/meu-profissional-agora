import { useMemo, useState } from "react";
import {
  Instagram,
  Loader2,
  Youtube,
  Sparkles,
  LinkIcon,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  ShoppingBag,
  Home,
  Search,
  Film,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseInstagramUrl,
  parseYouTubeUrl,
  type ParsedInstagram,
  type ParsedYouTube,
} from "@/lib/portfolioUrls";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { InstagramEmbed } from "./InstagramEmbed";
import { cn } from "@/lib/utils";
import type { ExternalMediaInput } from "@/services/professionalMediaService";

type Kind = "instagram" | "youtube";

export function PortfolioExternalVideoForm({
  kind,
  onSubmit,
  submitting,
}: {
  kind: Kind;
  onSubmit: (payload: ExternalMediaInput) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const parsed = useMemo<ParsedInstagram | ParsedYouTube | null>(() => {
    if (!url.trim()) return null;
    return kind === "instagram" ? parseInstagramUrl(url) : parseYouTubeUrl(url);
  }, [url, kind]);

  const isIG = kind === "instagram";
  const placeholder = isIG
    ? "https://www.instagram.com/reel/XXXXXXXX/"
    : "https://www.youtube.com/watch?v=XXXX ou https://youtube.com/shorts/XXXX";

  const help = isIG
    ? "Cole o link de um Reels ou publicação pública do Instagram."
    : "Cole a URL de um vídeo do YouTube ou de um YouTube Shorts.";

  const KindIcon = isIG ? Instagram : Youtube;

  const canSubmit = !!parsed && !submitting;

  const submit = () => {
    if (!parsed) return;
    const payload: ExternalMediaInput = {
      media_type: parsed.type,
      external_url: parsed.normalizedUrl,
      embed_url: parsed.embedUrl,
      external_media_id: "shortcode" in parsed ? parsed.shortcode : parsed.videoId,
      thumbnail_url: parsed.thumbnailUrl ?? null,
      title: title.trim() || null,
      caption: caption.trim() || null,
    };
    onSubmit(payload);
    setUrl("");
    setTitle("");
    setCaption("");
  };

  return (
    <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-900 text-white shadow-sm">
            <KindIcon size={20} />
          </span>
          <div className="min-w-0">
            <h4 className="font-display text-base font-extrabold text-foreground">
              {isIG ? "Adicionar Reels do Instagram" : "Adicionar vídeo do YouTube"}
            </h4>
            <p className="text-xs text-muted-foreground">{help}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left — form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="ext-url" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Link do vídeo
              </Label>
              <div className="relative mt-1.5">
                <LinkIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ext-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={placeholder}
                  className="h-11 rounded-xl pl-9 text-sm"
                />
              </div>
              {url && !parsed && (
                <p className="mt-1.5 text-xs font-medium text-destructive">
                  Insira um link válido de {isIG ? "Instagram" : "YouTube"}.
                </p>
              )}
              {parsed && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <Sparkles size={12} /> Link reconhecido — pronto para publicar
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ext-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Título (opcional)
                </Label>
                <Input
                  id="ext-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Ex.: Antes e depois"
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="ext-caption" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Legenda (opcional)
                </Label>
                <Input
                  id="ext-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={160}
                  placeholder="Uma frase que conte a história"
                  className="mt-1.5 h-11 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-11 w-full rounded-xl text-sm font-bold sm:w-auto"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Adicionar ao portfólio
            </Button>
          </div>

          {/* Right — realistic phone mockup */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Prévia real
            </span>

            {/* Phone frame — neutral, no colored glow */}
            <div className="relative w-full max-w-[290px]">
              <div className="rounded-[2.5rem] bg-neutral-900 p-2 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] ring-1 ring-neutral-800">
                <div className="relative overflow-hidden rounded-[2rem] bg-black">
                  {/* Notch */}
                  <div className="pointer-events-none absolute left-1/2 top-2 z-30 flex h-6 w-32 -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                    <span className="h-2 w-2 rounded-full bg-neutral-800 ring-1 ring-neutral-700" />
                  </div>

                  {/* Status bar */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-2 text-[10px] font-semibold text-white">
                    <span>9:41</span>
                    <span className="opacity-80">••• 5G ▮</span>
                  </div>

                  {/* Media surface (9:16) */}
                  <div className="relative aspect-[9/16] bg-neutral-950">
                    {parsed ? (
                      isIG ? (
                        <InstagramEmbed
                          embedUrl={(parsed as ParsedInstagram).embedUrl}
                          title={title || "Prévia"}
                          className="rounded-none"
                        />
                      ) : (
                        <YouTubeEmbed
                          embedUrl={(parsed as ParsedYouTube).embedUrl}
                          thumbnailUrl={(parsed as ParsedYouTube).thumbnailUrl}
                          title={title || "Prévia"}
                          vertical={parsed.type === "youtube_short"}
                          autoplay={false}
                          className="rounded-none"
                        />
                      )
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-neutral-900">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
                            <KindIcon size={22} className="text-white/80" />
                          </div>
                          <p className="text-xs font-semibold text-white/70">
                            {isIG ? "Cole o link do Reel" : "Cole o link do vídeo"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* App overlay — only when Instagram (matches reference) */}
                    {isIG && (
                      <>
                        {/* Top: Reels label + camera */}
                        <div className="pointer-events-none absolute inset-x-0 top-9 z-20 flex items-center justify-between px-4">
                          <span className="text-lg font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            Reels
                          </span>
                          <Camera size={20} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                        </div>

                        {/* Right rail — actions */}
                        <div className="pointer-events-none absolute bottom-24 right-2 z-20 flex flex-col items-center gap-4 text-white">
                          <div className="flex flex-col items-center">
                            <Heart size={26} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                            <span className="mt-0.5 text-[10px] font-semibold drop-shadow">107K</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <MessageCircle size={26} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                            <span className="mt-0.5 text-[10px] font-semibold drop-shadow">342</span>
                          </div>
                          <Send size={26} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                          <MoreHorizontal size={26} className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-white/90 ring-1 ring-white">
                            <ShoppingBag size={14} className="text-black" />
                          </div>
                        </div>

                        {/* Bottom: username + caption */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 px-4 text-white">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-white/90 ring-1 ring-white" />
                            <span className="text-xs font-bold drop-shadow">username</span>
                            <span className="rounded-md border border-white/60 px-2 py-0.5 text-[10px] font-semibold">
                              Seguir
                            </span>
                          </div>
                          {(title || caption) && (
                            <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug drop-shadow">
                              {caption || title}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Bottom tab bar (iOS/IG) */}
                    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-white/5 bg-black/80 px-4 pb-3 pt-2 backdrop-blur-sm">
                      <Home size={18} className="text-white" />
                      <Search size={18} className="text-white/80" />
                      <Film size={18} className="text-white" />
                      <ShoppingBag size={18} className="text-white/80" />
                      <div className="h-5 w-5 rounded-full bg-white/90 ring-1 ring-white" />
                    </div>

                    {/* Home indicator */}
                    <div className="pointer-events-none absolute bottom-1 left-1/2 z-30 h-1 w-24 -translate-x-1/2 rounded-full bg-white/80" />
                  </div>
                </div>
              </div>
            </div>

            {parsed && (
              <p className="text-center text-[11px] text-muted-foreground">
                É exatamente assim que aparecerá no feed
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
