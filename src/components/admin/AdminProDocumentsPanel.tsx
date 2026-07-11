import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck, Check, Download, ExternalLink, FileText, Pencil, Plus,
  RefreshCw, Save, Trash2, Upload, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/admin/AdminTable";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  listProDocuments, uploadProDocument, setDocumentStatus, deleteProDocument,
  updateDocumentMeta,
  type AdminProDocument, type VerificationStatus,
} from "@/services/adminService";

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "Aguardando análise",
  approved: "Verificado",
  rejected: "Rejeitado",
};
const STATUS_TONE: Record<VerificationStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const MAX_MB = 10;

export function AdminProDocumentsPanel({
  professionalId, professionalUserId,
}: { professionalId: string; professionalUserId: string | null }) {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProDocument | null>(null);
  const [deleting, setDeleting] = useState<AdminProDocument | null>(null);

  const q = useQuery({
    queryKey: ["admin-pro-documents", professionalId],
    queryFn: () => listProDocuments(professionalId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-pro-documents", professionalId] });
    qc.invalidateQueries({ queryKey: ["admin-pro-detail", professionalId] });
  };

  const status = useMutation({
    mutationFn: ({ id, s }: { id: string; s: VerificationStatus }) => setDocumentStatus(id, s),
    onSuccess: () => { toast.success("Status atualizado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (row: AdminProDocument) => deleteProDocument(row.id, row.document_url),
    onSuccess: () => { toast.success("Documento removido"); invalidate(); setDeleting(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const rows = q.data ?? [];
    return {
      total: rows.length,
      pending: rows.filter((r) => r.verification_status === "pending").length,
      approved: rows.filter((r) => r.verification_status === "approved").length,
      rejected: rows.filter((r) => r.verification_status === "rejected").length,
    };
  }, [q.data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base">Documentos & verificação</CardTitle>
          <p className="text-xs text-muted-foreground">
            Certificados, comprovantes e credenciais enviados pelo profissional. Aprovar liberará a exibição pública.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => q.refetch()}>
            <RefreshCw size={14} className="mr-1.5" /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus size={14} className="mr-1.5" /> Enviar documento
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total" value={stats.total} />
          <Metric label="Aguardando" value={stats.pending} tone="warning" />
          <Metric label="Verificados" value={stats.approved} tone="success" />
          <Metric label="Rejeitados" value={stats.rejected} tone="danger" />
        </div>

        {q.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {!q.isLoading && (q.data?.length ?? 0) === 0 && (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-6 w-6 opacity-60" />
            Nenhum documento enviado ainda.
          </div>
        )}

        <div className="space-y-2">
          {q.data?.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
              <div className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-muted text-muted-foreground">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{row.title}</span>
                  <StatusPill tone={STATUS_TONE[row.verification_status]}>
                    {STATUS_LABEL[row.verification_status]}
                  </StatusPill>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {row.institution && <span>{row.institution}</span>}
                  {row.issued_at && <span>Emitido em {new Date(row.issued_at).toLocaleDateString("pt-BR")}</span>}
                  {row.file_name && <span className="truncate max-w-[220px]">{row.file_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {row.signed_url && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <a href={row.signed_url} target="_blank" rel="noreferrer">
                        <ExternalLink size={13} className="mr-1.5" /> Ver
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={row.signed_url} download>
                        <Download size={14} />
                      </a>
                    </Button>
                  </>
                )}
                {row.verification_status !== "approved" && (
                  <Button
                    variant="outline" size="sm"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => status.mutate({ id: row.id, s: "approved" })}
                  >
                    <Check size={13} className="mr-1.5" /> Aprovar
                  </Button>
                )}
                {row.verification_status !== "rejected" && (
                  <Button
                    variant="outline" size="sm"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => status.mutate({ id: row.id, s: "rejected" })}
                  >
                    <X size={13} className="mr-1.5" /> Rejeitar
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditing(row)}>
                      <Pencil size={13} className="mr-2" /> Editar dados
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => status.mutate({ id: row.id, s: "pending" })}>
                      <BadgeCheck size={13} className="mr-2" /> Marcar como pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setDeleting(row)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={13} className="mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {uploadOpen && (
        <UploadDialog
          professionalId={professionalId}
          professionalUserId={professionalUserId}
          onClose={() => setUploadOpen(false)}
          onSaved={() => { invalidate(); setUploadOpen(false); }}
        />
      )}
      {editing && (
        <EditMetaDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O documento "{deleting?.title}" e o arquivo em storage serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && remove.mutate(deleting)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function Metric({
  label, value, tone = "neutral",
}: { label: string; value: number; tone?: "neutral" | "warning" | "success" | "danger" }) {
  const toneCls: Record<string, string> = {
    neutral: "text-foreground",
    warning: "text-amber-600",
    success: "text-emerald-600",
    danger: "text-rose-600",
  };
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneCls[tone]}`}>{value}</div>
    </div>
  );
}

function UploadDialog({
  professionalId, professionalUserId, onClose, onSaved,
}: {
  professionalId: string;
  professionalUserId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [issuedAt, setIssuedAt] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione um arquivo.");
      if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Arquivo excede ${MAX_MB}MB.`);
      if (!title.trim()) throw new Error("Informe um título.");
      await uploadProDocument({
        professionalId,
        professionalUserId,
        file,
        title: title.trim(),
        institution: institution.trim() || null,
        issued_at: issuedAt || null,
      });
    },
    onSuccess: () => { toast.success("Documento enviado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Enviar documento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Arquivo (PDF, imagem — até {MAX_MB}MB)</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl border border-dashed p-6 text-center hover:bg-muted/40"
            >
              {file ? (
                <div className="space-y-1">
                  <FileText className="mx-auto h-5 w-5 text-muted-foreground" />
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <Upload className="mx-auto mb-1 h-5 w-5" />
                  Clique para escolher um arquivo
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: CREA, Certificado NR-35" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Instituição</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Data de emissão</Label>
              <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <Upload size={14} className="mr-1.5" /> Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMetaDialog({
  row, onClose, onSaved,
}: { row: AdminProDocument; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(row.title);
  const [institution, setInstitution] = useState(row.institution ?? "");
  const [issuedAt, setIssuedAt] = useState(row.issued_at ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Informe um título.");
      await updateDocumentMeta(row.id, {
        title: title.trim(),
        institution: institution.trim() || null,
        issued_at: issuedAt || null,
      });
    },
    onSuccess: () => { toast.success("Dados atualizados"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar documento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Instituição</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Data de emissão</Label>
              <Input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save size={14} className="mr-1.5" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
