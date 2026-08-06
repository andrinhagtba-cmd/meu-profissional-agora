import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Download, Printer, QrCode, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  slug: string | null;
  displayName: string;
  logoUrl?: string | null;
};

const PRESETS: { label: string; fg: string; bg: string }[] = [
  { label: "Clássico", fg: "#0F172A", bg: "#FFFFFF" },
  { label: "Azul marca", fg: "#0759F8", bg: "#FFFFFF" },
  { label: "Laranja", fg: "#FF642E", bg: "#FFFFFF" },
  { label: "Invertido", fg: "#FFFFFF", bg: "#0759F8" },
];

export function AdminProQrCodePanel({ slug, displayName, logoUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [origin, setOrigin] = useState("");
  const [size, setSize] = useState(720);
  const [margin, setMargin] = useState(2);
  const [fg, setFg] = useState("#0F172A");
  const [bg, setBg] = useState("#FFFFFF");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [showLabel, setShowLabel] = useState(true);
  const [label, setLabel] = useState(displayName);
  const [caption, setCaption] = useState("Aponte a câmera e veja meu perfil");
  const [withLogo, setWithLogo] = useState(Boolean(logoUrl));
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => setLabel(displayName), [displayName]);

  const [customUrl, setCustomUrl] = useState("");
  const targetUrl = useMemo(() => {
    if (customUrl.trim()) return customUrl.trim();
    if (!slug || !origin) return "";
    return `${origin}/profissional/${slug}`;
  }, [customUrl, slug, origin]);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !targetUrl) return;
    const pad = Math.round(size * 0.06);
    const textBlock = showLabel ? Math.round(size * 0.22) : 0;
    const w = size + pad * 2;
    const h = size + pad * 2 + textBlock;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, targetUrl, {
      width: size,
      margin,
      errorCorrectionLevel: level,
      color: { dark: fg, light: bg },
    });
    ctx.drawImage(qrCanvas, pad, pad, size, size);

    if (withLogo && logoUrl) {
      try {
        const img = await loadImage(logoUrl);
        const box = Math.round(size * 0.22);
        const x = pad + (size - box) / 2;
        const y = pad + (size - box) / 2;
        ctx.fillStyle = bg;
        roundRect(ctx, x - 8, y - 8, box + 16, box + 16, 20);
        ctx.fill();
        ctx.save();
        roundRect(ctx, x, y, box, box, 14);
        ctx.clip();
        ctx.drawImage(img, x, y, box, box);
        ctx.restore();
      } catch {
        /* logo opcional */
      }
    }

    if (showLabel) {
      const baseY = pad + size + Math.round(textBlock * 0.42);
      ctx.textAlign = "center";
      ctx.fillStyle = fg;
      ctx.font = `800 ${Math.round(size * 0.072)}px Manrope, system-ui, sans-serif`;
      ctx.fillText(truncate(label || displayName, 28), w / 2, baseY);
      ctx.globalAlpha = 0.7;
      ctx.font = `500 ${Math.round(size * 0.042)}px Inter, system-ui, sans-serif`;
      ctx.fillText(truncate(caption, 46), w / 2, baseY + Math.round(size * 0.075));
      ctx.globalAlpha = 1;
    }

    setDataUrl(canvas.toDataURL("image/png"));
  }, [targetUrl, size, margin, level, fg, bg, showLabel, label, caption, withLogo, logoUrl, displayName]);

  useEffect(() => {
    void render();
  }, [render]);

  const fileBase = (slug || "qrcode").replace(/[^a-z0-9-]/gi, "-");

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${fileBase}-qrcode.png`;
    a.click();
  };

  const downloadSvg = async () => {
    if (!targetUrl) return;
    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      margin,
      errorCorrectionLevel: level,
      color: { dark: fg, light: bg },
    });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}-qrcode.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    if (!dataUrl) return;
    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win) {
      toast.error("Permita pop-ups para imprimir.");
      return;
    }
    win.document.write(
      `<html><head><title>QR Code · ${escapeHtml(displayName)}</title>
      <style>@page{margin:16mm}body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh}
      img{max-width:100%;max-height:100%}</style></head>
      <body><img src="${dataUrl}" onload="window.focus();window.print();window.close()"/></body></html>`,
    );
    win.document.close();
  };

  if (!slug && !customUrl) {
    return (
      <Card className="rounded-[1.7rem] shadow-card">
        <CardContent className="p-8 text-sm text-muted-foreground">
          Defina um <strong>slug</strong> na aba Perfil para gerar o QR Code do perfil público.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="rounded-[1.7rem] shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-xl font-extrabold tracking-normal">
            <QrCode size={18} /> QR Code do perfil
          </CardTitle>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => void render()}>
            <RefreshCw size={14} className="mr-1.5" /> Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-6">
            <canvas ref={canvasRef} className="max-h-[420px] w-auto max-w-full rounded-xl" />
          </div>
          <p className="truncate rounded-xl bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">{targetUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={downloadPng}><Download size={15} className="mr-1.5" /> Baixar PNG</Button>
            <Button variant="outline" className="rounded-full" onClick={() => void downloadSvg()}>
              <Download size={15} className="mr-1.5" /> Baixar SVG
            </Button>
            <Button variant="outline" className="rounded-full" onClick={print}>
              <Printer size={15} className="mr-1.5" /> Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.7rem] shadow-card">
        <CardHeader><CardTitle className="font-display text-lg font-extrabold tracking-normal">Personalizar</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setFg(p.fg); setBg(p.bg); }}
                className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs font-semibold hover:border-primary"
              >
                <span className="h-4 w-4 rounded-full border" style={{ background: p.fg, borderColor: p.bg }} />
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cor do código</Label>
              <Input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-10 p-1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fundo</Label>
              <Input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-10 p-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tamanho ({size}px)</Label>
            <Slider value={[size]} min={320} max={1400} step={40} onValueChange={([v]) => setSize(v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Margem ({margin})</Label>
            <Slider value={[margin]} min={0} max={6} step={1} onValueChange={([v]) => setMargin(v)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Correção de erro</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Baixa (L)</SelectItem>
                <SelectItem value="M">Média (M)</SelectItem>
                <SelectItem value="Q">Alta (Q)</SelectItem>
                <SelectItem value="H">Máxima (H) — recomendada com logo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logoUrl && (
            <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
              <Label className="text-xs">Logo no centro</Label>
              <Switch checked={withLogo} onCheckedChange={setWithLogo} />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
            <Label className="text-xs">Exibir textos</Label>
            <Switch checked={showLabel} onCheckedChange={setShowLabel} />
          </div>

          {showLabel && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Título</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Legenda</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-xl" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Link personalizado (opcional)</Label>
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder={slug ? `${origin}/profissional/${slug}` : "https://…"}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function truncate(v: string, max: number) {
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

function escapeHtml(v: string) {
  return v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
