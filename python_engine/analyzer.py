"""
analyzer.py - Motor de Análise de Prompts em Python
Avalia arquitetura CROFTC, 5 Etapas do Google Prompting Essentials, Carga Cognitiva e Tokenomics.
"""

import json
import re
from typing import Dict, Any, Optional
from .gemini_service import GeminiClient
from .tokenomics import TokenomicsEngine

class PromptAnalyzer:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.gemini = gemini_client or GeminiClient()

    def analyze(
        self,
        prompt: str,
        prompt_caching_settings: Optional[Dict[str, Any]] = None,
        llm_parsed_result: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analisa o prompt utilizando o Gemini 3.5 Flash ou a heurística nativa em Python caso necessário.
        """
        if not prompt or not prompt.strip():
            raise ValueError("O prompt fornecido está vazio.")

        # Se o resultado estruturado já foi fornecido pelo backend
        if llm_parsed_result and isinstance(llm_parsed_result, dict):
            return self._enrich_analysis(prompt, llm_parsed_result, prompt_caching_settings)

        # Se o cliente Gemini estiver configurado, executa via LLM com schema rígido
        if self.gemini.is_configured():
            try:
                raw_llm = self._analyze_via_llm(prompt, prompt_caching_settings)
                return self._enrich_analysis(prompt, raw_llm, prompt_caching_settings)
            except Exception as e:
                print(f"[Python PromptAnalyzer] Fallback para análise heurística: {e}")
                return self._heuristic_analysis(prompt, prompt_caching_settings, fallback_reason=str(e))

        return self._heuristic_analysis(prompt, prompt_caching_settings)

    def _enrich_analysis(
        self,
        prompt: str,
        result: Dict[str, Any],
        prompt_caching_settings: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Enriquece o resultado com métricas matemáticas precisas do TokenomicsEngine em Python.
        """
        cache_metrics = TokenomicsEngine.calculate_cache_metrics(
            cache_system=bool(prompt_caching_settings.get("cacheSystemInstructions")) if prompt_caching_settings else True,
            cache_context=bool(prompt_caching_settings.get("cacheStaticContext")) if prompt_caching_settings else True,
            cache_few_shot=bool(prompt_caching_settings.get("cacheFewShotExamples")) if prompt_caching_settings else True,
            custom_blocks=prompt_caching_settings.get("customStaticBlocks", []) if prompt_caching_settings else [],
            dynamic_prompt_text=prompt
        )

        # Garante tokenomics preciso
        if "tokenomics" not in result or not isinstance(result["tokenomics"], dict):
            result["tokenomics"] = {}

        result["tokenomics"]["estimatedInputTokens"] = cache_metrics["total_tokens"]
        result["tokenomics"]["cachedTokens"] = cache_metrics["cached_tokens"]
        result["tokenomics"]["costSavingsPercent"] = cache_metrics["cost_savings_percent"]
        result["tokenomics"]["latencySavingsPercent"] = cache_metrics["latency_savings_percent"]
        result["tokenomics"]["normalLatency"] = cache_metrics["normal_latency_seconds"]
        result["tokenomics"]["cachedLatency"] = cache_metrics["cached_latency_seconds"]
        result["pythonEngineVersion"] = "2.0.0"

        return result

    def _analyze_via_llm(self, prompt: str, prompt_caching_settings: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        system_instruction = """Você é um Engenheiro de IA e Cientista de Dados Sênior especialista em arquiteturas de LLMs e engenharia de prompts avançada.
Sua tarefa é analisar o prompt fornecido pelo utilizador e fornecer uma avaliação estruturada detalhada.
Aplique conceitos profundos sobre:
1. O framework CROFTC (Context, Role, Objective, Format, Temperature, Constraints).
2. O framework de 5 passos do Google Prompting Essentials (Task, Context, References, Evaluation, Iteration).
3. Mecânicas de LLM (Self-Attention, Embeddings, Cosine Similarity, Tokenomics/Prompt Caching, riscos de alucinação e viés).
4. Práticas de Engenharia de Software como Spec-Driven Development (SDD) vs Vibe Coding.

Responda estritamente de acordo com o esquema JSON configurado."""

        user_prompt_msg = f'Analise o seguinte prompt em português:\n\n"""\n{prompt}\n"""'

        if prompt_caching_settings:
            user_prompt_msg += f"""\n\nConfigurações de Prompt Caching Ativas para este prompt:
- Instruções de Sistema Estáticas: {"ATIVADO" if prompt_caching_settings.get("cacheSystemInstructions") else "DESATIVADO"}
- Contexto de Dados Estático: {"ATIVADO" if prompt_caching_settings.get("cacheStaticContext") else "DESATIVADO"}
- Exemplos Few-Shot Estáticos: {"ATIVADO" if prompt_caching_settings.get("cacheFewShotExamples") else "DESATIVADO"}
"""
            custom_blocks = prompt_caching_settings.get("customStaticBlocks", [])
            if custom_blocks:
                user_prompt_msg += "- Blocos Estáticos Customizados:\n" + "\n".join(
                    [f"  * {b.get('name', 'Bloco')} ({b.get('tokens', 0)} tokens)" for b in custom_blocks]
                ) + "\n"
            user_prompt_msg += "\nLeve em consideração essa configuração de cache de prompt para responder ao campo 'tokenomics' e justifique as economias possíveis na latência e no custo."

        schema = {
            "type": "OBJECT",
            "properties": {
                "score": {"type": "INTEGER", "description": "Pontuação global da qualidade do prompt (0 a 100)."},
                "croftc": {
                    "type": "OBJECT",
                    "properties": {
                        "context": {"type": "STRING"},
                        "role": {"type": "STRING"},
                        "objective": {"type": "STRING"},
                        "format": {"type": "STRING"},
                        "temperature": {"type": "STRING"},
                        "constraints": {"type": "STRING"}
                    },
                    "required": ["context", "role", "objective", "format", "temperature", "constraints"]
                },
                "googleSteps": {
                    "type": "OBJECT",
                    "properties": {
                        "task": {"type": "STRING"},
                        "context": {"type": "STRING"},
                        "references": {"type": "STRING"},
                        "evaluation": {"type": "STRING"},
                        "iteration": {"type": "STRING"}
                    },
                    "required": ["task", "context", "references", "evaluation", "iteration"]
                },
                "suggestions": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                },
                "cognitiveLoadNote": {"type": "STRING"},
                "tokenomics": {
                    "type": "OBJECT",
                    "properties": {
                        "estimatedInputTokens": {"type": "INTEGER"},
                        "promptCachingPotential": {"type": "BOOLEAN"},
                        "promptCachingReason": {"type": "STRING"}
                    },
                    "required": ["estimatedInputTokens", "promptCachingPotential", "promptCachingReason"]
                },
                "scientificRefinement": {"type": "STRING"}
            },
            "required": ["score", "croftc", "googleSteps", "suggestions", "cognitiveLoadNote", "tokenomics", "scientificRefinement"]
        }

        response = self.gemini.generate_content(
            prompt=user_prompt_msg,
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=schema
        )

        return json.loads(response["text"].strip())

    def _heuristic_analysis(
        self,
        prompt: str,
        prompt_caching_settings: Optional[Dict[str, Any]] = None,
        fallback_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Análise semântica e algorítmica executada nativamente em Python.
        """
        text_lower = prompt.lower()
        tokens = TokenomicsEngine.estimate_tokens(prompt)

        # Verificação de elementos CROFTC
        has_role = bool(re.search(r"\b(atue como|você é|papel|especialista|persona|aja como)\b", text_lower))
        has_context = bool(re.search(r"\b(contexto|cenário|situação|empresa|problema|dados|histórico)\b", text_lower)) or len(prompt) > 200
        has_objective = bool(re.search(r"\b(objetivo|faça|crie|gere|elabore|escreva|desenvolva|meta)\b", text_lower))
        has_format = bool(re.search(r"\b(formato|tabela|markdown|json|lista|bullet|saída|estrutura)\b", text_lower))
        has_temperature = bool(re.search(r"\b(temperatura|criatividade|determinístico|preciso|tom)\b", text_lower))
        has_constraints = bool(re.search(r"\b(não|nunca|limite|restrição|evite|obrigatoriamente|apenas)\b", text_lower))

        score = 30
        if has_role: score += 15
        if has_context: score += 15
        if has_objective: score += 15
        if has_format: score += 15
        if has_constraints: score += 10
        score = min(95, max(25, score))

        # Recomendações em Python
        suggestions = []
        if not has_role:
            suggestions.append("Defina um papel (Role) especialista claro para balizar o vocabulário e a persona do LLM.")
        if not has_format:
            suggestions.append("Especifique a formatação exata desejada (ex: tags XML, tabela Markdown ou JSON Schema).")
        if not has_constraints:
            suggestions.append("Adicione restrições explícitas (Negative Constraints) para evitar alucinações e respostas verbosas.")
        if not has_context:
            suggestions.append("Forneça contexto prévio delimitado por tags para contextualizar a auto-atenção do transformador.")
        if len(suggestions) < 3:
            suggestions.append("Aplique a técnica de Chain-of-Thought instruindo o modelo a raciocinar antes de responder.")

        caching_potential = tokens > 80 or bool(prompt_caching_settings)
        caching_reason = "Prefixos com mais de 100 tokens de contexto ou instruções de sistema têm alto retorno com Prefix Caching (75% a 80% de economia)."

        return {
            "score": score,
            "croftc": {
                "role": "Definido explicitamente no texto." if has_role else "Ausente: adicione uma persona técnica clara.",
                "context": "Contexto detectado e estruturado." if has_context else "Contexto incipiente ou vago.",
                "objective": "Objetivo operacional identificado." if has_objective else "Objetivo difuso ou multifacetado.",
                "format": "Formato de saída demarcado." if has_format else "Formato livre; adicione restrição estruturada.",
                "temperature": "Recomenda-se Temperature 0.2 a 0.4 para precisão técnica.",
                "constraints": "Restrições negativas presentes." if has_constraints else "Sem restrições de contenção."
            },
            "googleSteps": {
                "task": "A tarefa principal pode ser isolada em um comando acionável.",
                "context": "Contextualização operacional e background fornecido.",
                "references": "Recomenda-se adicionar 1 ou 2 exemplos Few-Shot.",
                "evaluation": "Critérios de sucesso não especificados no prompt.",
                "iteration": "Estruturado para refinamento e iterações dialéticas."
            },
            "suggestions": suggestions[:4],
            "cognitiveLoadNote": "Organize o prompt usando tags XML (<instructions>, <context>, <constraints>) para facilitar o parse semântico e reduzir a carga cognitiva.",
            "tokenomics": {
                "estimatedInputTokens": tokens,
                "promptCachingPotential": caching_potential,
                "promptCachingReason": caching_reason
            },
            "scientificRefinement": "A estruturação modular canaliza as matrizes de projeção de Query e Key no mecanismo de Self-Attention, elevando a similaridade cosseno dos vetores atencionais e minimizando dispersões estocásticas.",
            "engine": "Python Heuristics v2.0" if fallback_reason else "Python Hybrid Core"
        }
