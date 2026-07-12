import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  parseInstagramUrl,
  parseYouTubeUrl,
  type ParsedInstagram,
  type ParsedYouTube,
} from "@/lib/portfolioUrls";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { InstagramEmbed } from "./InstagramEmbed";
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

  const placeholder =
    kind === "instagram"
      ? "https://www.instagram.com/reel/XXXXXXXX/"
      : "https://www.youtube.com/watch?v=XXXX ou https://youtube.com/shorts/XXXX";

  const help =
    kind === "instagram"
      ? "Cole o link de um Reels ou publicação pública do Instagram."
      : "Cole a URL de um vídeo do YouTube ou de um YouTube Shorts.";

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
    <div className="space-y-3">
      <div>
        <Label htmlFor="ext-url">Link do vídeo</Label>
        <Input
          id="ext-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">{help}</p>
        {url && !parsed && (
          <p className="mt-1 text-xs text-destructive">
            Insira um link válido de {kind === "instagram" ? "Instagram" : "YouTube"}.
          </p>
        )}
      </div>

      {parsed && (
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="mx-auto w-full max-w-xs">
            {kind === "instagram" ? (
              <InstagramEmbed
                embedUrl={(parsed as ParsedInstagram).embedUrl}
                externalUrl={(parsed as ParsedInstagram).normalizedUrl}
                title={title || "Prévia"}
              />
            ) : (
              <YouTubeEmbed
                embedUrl={(parsed as ParsedYouTube).embedUrl}
                thumbnailUrl={(parsed as ParsedYouTube).thumbnailUrl}
                title={title || "Prévia"}
                vertical={parsed.type === "youtube_short"}
                autoplay={false}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="ext-title">Título (opcional)</Label>
          <Input
            id="ext-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ext-caption">Legenda (opcional)</Label>
          <Input
            id="ext-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={160}
            className="mt-1"
          />
        </div>
      </div>

      <Button type="button" onClick={submit} disabled={!canSubmit} className="rounded-xl">
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
        Adicionar ao portfólio
      </Button>
    </div>
  );
}
