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
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
  ExternalLink,
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

          {/* Right — premium Instagram-style post card */}
          <div className="flex flex-col items-center gap-3">

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Prévia premium
            </span>

            <div className="w-full max-w-[320px]">
              <article
                className={cn(
                  "group/preview overflow-hidden rounded-2xl border border-neutral-200/80 bg-white",
                  "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.18)]",
                  "transition-all duration-300 hover:-translate-y-0.5",
                  "hover:shadow-[0_2px_4px_rgba(16,24,40,0.06),0_24px_48px_-16px_rgba(16,24,40,0.22)]",
                )}
              >
                {/* Header — Instagram post style */}
                <header className="flex items-center gap-3 px-4 py-3">
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute -inset-[2px] rounded-full bg-[conic-gradient(from_45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)]"
                    />
                    <div className="relative grid h-9 w-9 place-items-center rounded-full bg-white p-[2px]">
                      <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200">
                        {isIG ? (
                          <Instagram size={14} className="text-neutral-700" />
                        ) : (
                          <Youtube size={14} className="text-neutral-700" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-[13px] font-semibold text-neutral-900">
                        {isIG ? "seu.perfil" : "Seu canal"}
                      </span>
                      <BadgeCheck size={13} className="shrink-0 fill-sky-500 text-white" />
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      {isIG ? "Original audio" : "Publicado no YouTube"}
                    </span>
                  </div>
                  <MoreHorizontal size={18} className="text-neutral-700" />
                </header>

                {/* Media — 9:16 with subtle inner shadow */}
                <div className="relative">
                  <div className="relative aspect-[9/16] overflow-hidden bg-neutral-100">
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
                      <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
                        <div
                          aria-hidden
                          className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-fuchsia-200/40 via-rose-200/30 to-transparent blur-2xl"
                        />
                        <div
                          aria-hidden
                          className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-transparent blur-2xl"
                        />
                        <div className="relative flex flex-col items-center gap-3 text-center">
                          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-neutral-200">
                            <KindIcon size={24} className="text-neutral-700" />
                          </div>
                          <p className="px-6 text-[12px] font-medium text-neutral-500">
                            {isIG
                              ? "Cole o link do Reel para ver a prévia real"
                              : "Cole o link do vídeo para ver a prévia"}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Inner shadow for depth */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04),inset_0_-40px_60px_-40px_rgba(0,0,0,0.15)]"
                    />
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between px-4 pt-3">
                  <div className="flex items-center gap-4">
                    <Heart size={22} className="text-neutral-800 transition-colors hover:text-rose-500" strokeWidth={1.75} />
                    <MessageCircle size={22} className="text-neutral-800" strokeWidth={1.75} />
                    <Send size={22} className="text-neutral-800" strokeWidth={1.75} />
                  </div>
                  <Bookmark size={22} className="text-neutral-800" strokeWidth={1.75} />
                </div>

                {/* Caption */}
                <div className="px-4 pb-3 pt-2">
                  <p className="text-[12px] font-semibold text-neutral-900">
                    {(1247).toLocaleString("pt-BR")} curtidas
                  </p>
                  {(title || caption) ? (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-neutral-800">
                      <span className="font-semibold">{isIG ? "seu.perfil " : "Seu canal "}</span>
                      {caption || title}
                    </p>
                  ) : (
                    <p className="mt-1 text-[12.5px] leading-snug text-neutral-400">
                      <span className="font-semibold text-neutral-500">{isIG ? "seu.perfil " : "Seu canal "}</span>
                      Sua legenda aparecerá aqui…
                    </p>
                  )}
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">Há alguns instantes</p>
                </div>

                {/* Footer CTA */}
                <div className="border-t border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {isIG ? <Instagram size={12} /> : <Youtube size={12} />}
                      {isIG ? "Instagram" : "YouTube"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-neutral-700">
                      Ver no {isIG ? "Instagram" : "YouTube"} <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </article>
            </div>

            {parsed && (
              <p className="text-center text-[11px] text-muted-foreground">
                É exatamente assim que aparecerá no portfólio
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
