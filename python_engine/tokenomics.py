"""
tokenomics.py - Módulo Python para Simulação de Tokenomics e Prefix Caching
Calcula custos, latências estimadas, economias financeiras e compara snapshots de configuração.
"""

from typing import Dict, Any, List, Optional

class TokenomicsEngine:
    # Parâmetros de precificação base (Gemini 2.5/3.5 Flash)
    INPUT_COST_PER_MILLION = 0.075       # $0.075 por 1M tokens normais
    CACHED_INPUT_COST_PER_MILLION = 0.01875  # 75% de desconto (~$0.01875 por 1M tokens em cache)
    OUTPUT_COST_PER_MILLION = 0.30       # $0.30 por 1M tokens de saída

    @classmethod
    def estimate_tokens(cls, text: str) -> int:
        """
        Estimativa heurística de tokens com base na média de 3.8 caracteres por token em pt-BR/código.
        """
        if not text:
            return 0
        cleaned = text.strip()
        words = len(cleaned.split())
        chars = len(cleaned)
        # Média combinada ponderada
        token_est = int((chars / 3.8 + words * 1.25) / 2)
        return max(1, token_est)

    @classmethod
    def calculate_cache_metrics(
        cls,
        cache_system: bool = True,
        cache_context: bool = True,
        cache_few_shot: bool = True,
        custom_blocks: Optional[List[Dict[str, Any]]] = None,
        dynamic_prompt_text: str = ""
    ) -> Dict[str, Any]:
        """
        Calcula o panorama completo de tokens, economia de custo e latência.
        """
        # Blocos padrão pré-computados
        system_tokens = 680 if cache_system else 0
        context_tokens = 1420 if cache_context else 0
        few_shot_tokens = 950 if cache_few_shot else 0

        # Blocos customizados do usuário
        custom_tokens = 0
        if custom_blocks:
            for b in custom_blocks:
                custom_tokens += int(b.get("tokens", 0))

        total_cached_tokens = system_tokens + context_tokens + few_shot_tokens + custom_tokens
        dynamic_tokens = cls.estimate_tokens(dynamic_prompt_text) if dynamic_prompt_text else 150
        total_tokens = total_cached_tokens + dynamic_tokens

        # Custo sem cache
        cost_without_cache = (total_tokens / 1_000_000.0) * cls.INPUT_COST_PER_MILLION

        # Custo com prefix cache
        cost_cached_part = (total_cached_tokens / 1_000_000.0) * cls.CACHED_INPUT_COST_PER_MILLION
        cost_dynamic_part = (dynamic_tokens / 1_000_000.0) * cls.INPUT_COST_PER_MILLION
        cost_with_cache = cost_cached_part + cost_dynamic_part

        # Percentual de economia financeira
        if cost_without_cache > 0:
            savings_pct = round(((cost_without_cache - cost_with_cache) / cost_without_cache) * 100)
        else:
            savings_pct = 0

        # Simulação de Latência:
        # Base latency 0.2s + overhead de processamento de tokens dinâmicos
        normal_latency = round(max(0.4, 0.3 + (total_tokens / 1400.0)), 2)
        cached_latency = round(max(0.15, 0.18 + (dynamic_tokens / 2200.0)), 2)
        
        latency_savings_pct = round(((normal_latency - cached_latency) / normal_latency) * 100)

        return {
            "cached_tokens": total_cached_tokens,
            "dynamic_tokens": dynamic_tokens,
            "total_tokens": total_tokens,
            "cost_without_cache_usd": round(cost_without_cache, 7),
            "cost_with_cache_usd": round(cost_with_cache, 7),
            "cost_savings_percent": savings_pct,
            "normal_latency_seconds": normal_latency,
            "cached_latency_seconds": cached_latency,
            "latency_savings_percent": latency_savings_pct,
            "breakdown": {
                "system_tokens": system_tokens,
                "context_tokens": context_tokens,
                "few_shot_tokens": few_shot_tokens,
                "custom_blocks_tokens": custom_tokens
            }
        }

    @classmethod
    def compare_snapshots(cls, snapshot_a: Dict[str, Any], snapshot_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compara dois snapshots de configuração de cache e extrai o ganho marginal.
        """
        tokens_diff = snapshot_b.get("tokens", 0) - snapshot_a.get("tokens", 0)
        economy_diff = snapshot_b.get("economy", 0) - snapshot_a.get("economy", 0)
        latency_diff = round(snapshot_b.get("cachedLatency", 0) - snapshot_a.get("cachedLatency", 0), 3)

        return {
            "tokens_diff": tokens_diff,
            "economy_diff_percent": economy_diff,
            "latency_diff_seconds": latency_diff,
            "improved": (tokens_diff > 0 and economy_diff >= 0 and latency_diff <= 0)
        }
