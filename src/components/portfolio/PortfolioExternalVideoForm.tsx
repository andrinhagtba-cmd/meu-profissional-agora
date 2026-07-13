import { useMemo, useState } from "react";
import { Instagram, Loader2, Youtube, Sparkles, LinkIcon } from "lucide-react";
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

  const brandBg = isIG
    ? "from-fuchsia-500/10 via-purple-500/10 to-orange-400/10"
    : "from-red-500/10 via-rose-500/5 to-orange-400/10";
  const brandRing = isIG ? "ring-fuchsia-500/20" : "ring-red-500/20";
  const brandIconBg = isIG
    ? "bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-purple-600"
    : "bg-red-600";
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
    <div className={cn("overflow-hidden rounded-3xl border bg-gradient-to-br p-1 shadow-sm ring-1", brandBg, brandRing)}>
      <div className="rounded-[calc(1.5rem-4px)] bg-card p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-md", brandIconBg)}>
            <KindIcon size={20} className="fill-current" />
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

          {/* Right — premium live preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", isIG ? "bg-fuchsia-500" : "bg-red-500")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", isIG ? "bg-fuchsia-500" : "bg-red-500")} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Prévia ao vivo
              </span>
            </div>

            <div className="relative w-full max-w-[300px]">
              {/* Ambient glow */}
              <div
                aria-hidden="true"
                className={cn(
                  "absolute -inset-4 -z-10 rounded-[2rem] opacity-60 blur-2xl transition-opacity",
                  isIG
                    ? "bg-gradient-to-br from-fuchsia-400 via-purple-500 to-orange-400"
                    : "bg-gradient-to-br from-red-500 via-rose-500 to-orange-400",
                  parsed ? "opacity-70" : "opacity-30",
                )}
              />

              {/* Gradient border shell */}
              <div
                className={cn(
                  "rounded-[1.75rem] p-[1.5px] shadow-[0_25px_60px_-25px_rgba(0,0,0,0.45)]",
                  "bg-gradient-to-br",
                  isIG
                    ? "from-yellow-400 via-fuchsia-500 to-purple-600"
                    : "from-red-500 via-rose-500 to-orange-500",
                )}
              >
                <div className="overflow-hidden rounded-[1.65rem] bg-neutral-950">
                  {/* Top chrome */}
                  <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500/80" />
                      <span className="h-2 w-2 rounded-full bg-yellow-400/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white",
                      isIG ? "bg-gradient-to-r from-fuchsia-500 to-purple-600" : "bg-red-600",
                    )}>
                      <KindIcon size={9} className="fill-current" />
                      {isIG ? "Reels" : "YouTube"}
                    </span>
                  </div>

                  {/* Media surface */}
                  <div className="relative bg-black">
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
                      <div className="relative flex aspect-[9/16] flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center">
                        {/* Animated mesh */}
                        <div aria-hidden="true" className={cn(
                          "absolute inset-0 opacity-90",
                          isIG
                            ? "bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.5),transparent_50%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.45),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(251,146,60,0.4),transparent_50%)]"
                            : "bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.55),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(251,113,133,0.4),transparent_50%)]",
                        )} />
                        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.55))]" />
                        <div className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                          <KindIcon size={26} className={cn("text-white", isIG ? "" : "fill-current")} />
                        </div>
                        <div className="relative z-10 space-y-1">
                          <p className="text-sm font-bold text-white">
                            {isIG ? "Seu Reel aparece aqui" : "Seu vídeo aparece aqui"}
                          </p>
                          <p className="text-[11px] leading-relaxed text-white/70">
                            Cole o link ao lado para carregar a prévia real
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {parsed && (
              <p className="text-center text-[11px] text-muted-foreground">
                É exatamente assim que aparecerá no seu portfólio
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
