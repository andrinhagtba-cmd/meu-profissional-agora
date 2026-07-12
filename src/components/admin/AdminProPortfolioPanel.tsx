import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";

export function AdminProPortfolioPanel({
  professionalId,
  professionalUserId,
}: {
  professionalId: string;
  professionalUserId: string | null;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Portfólio</CardTitle>
        <p className="text-xs text-muted-foreground">
          Imagens, Reels do Instagram e vídeos do YouTube. Como admin você aprova, rejeita e reordena os itens.
        </p>
      </CardHeader>
      <CardContent>
        <PortfolioManager
          professionalId={professionalId}
          professionalUserId={professionalUserId}
          isAdmin
        />
      </CardContent>
    </Card>
  );
}
