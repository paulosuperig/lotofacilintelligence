import { useEffect } from 'react';
import { aiConfigService } from '@/services/aiConfigService';
import { initMetaPixel } from '@/lib/analytics/metaPixel';

/**
 * Skill: @skillslovable — Inicializa o Meta Pixel globalmente.
 * Busca o ID configurado em system_configs e dispara PageView inicial.
 */
export const MetaPixelLoader = () => {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await aiConfigService.getMetaPixelId();
        if (!cancelled && id) initMetaPixel(id);
      } catch (e) {
        console.warn('[MetaPixelLoader] init falhou:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};
