
-- Validação backend das Regiões Administrativas do DF em novos pedidos de orçamento.
-- Preserva pedidos antigos (só valida em INSERT).

CREATE OR REPLACE FUNCTION public.tg_validate_df_region()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  valid_regions text[] := ARRAY[
    'Água Quente','Águas Claras','Arapoanga','Arniqueira','Brazlândia',
    'Candangolândia','Ceilândia','Cruzeiro','Fercal','Gama','Guará','Itapoã',
    'Jardim Botânico','Lago Norte','Lago Sul','Núcleo Bandeirante','Paranoá',
    'Park Way','Planaltina','Plano Piloto','Recanto das Emas','Riacho Fundo',
    'Riacho Fundo II','Samambaia','Santa Maria','São Sebastião','SCIA/Estrutural',
    'SIA','Sobradinho','Sobradinho II','Sol Nascente e Pôr do Sol',
    'Sudoeste/Octogonal','Taguatinga','Varjão','Vicente Pires'
  ];
BEGIN
  IF NEW.state IS DISTINCT FROM 'DF' THEN
    RAISE EXCEPTION 'Esta plataforma atende exclusivamente o Distrito Federal (state deve ser DF).';
  END IF;
  IF NEW.city IS NULL OR NOT (NEW.city = ANY(valid_regions)) THEN
    RAISE EXCEPTION 'Selecione uma Região Administrativa válida do Distrito Federal.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_validate_df_region_ins ON public.quote_requests;
CREATE TRIGGER tg_validate_df_region_ins
  BEFORE INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_validate_df_region();
