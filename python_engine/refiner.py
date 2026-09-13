"""
refiner.py - Motor de Refinamento e Reconstrução Estruturada de Prompts em Python
Aplica boas práticas globais: XML tags, Chain-of-Thought (<thinking>), Delimitação de Cache e CROFTC.
"""

from typing import Dict, Any, Optional
from .gemini_service import GeminiClient

class PromptRefiner:
    def __init__(self, gemini_client: Optional[GeminiClient] = None):
        self.gemini = gemini_client or GeminiClient()

    def refine(
        self,
        prompt: str,
        target_framework: Optional[str] = None,
        additional_data: Optional[str] = None,
        prompt_caching_settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Refina e reestrutura o prompt via LLM Gemini ou construtor determinístico em Python.
        """
        if not prompt or not prompt.strip():
            raise ValueError("O prompt fornecido está vazio.")

        if self.gemini.is_configured():
            try:
                return self._refine_via_llm(prompt, target_framework, additional_data, prompt_caching_settings)
            except Exception as e:
                print(f"[Python PromptRefiner] Fallback para refinador determinístico Python: {e}")
                return self._deterministic_refine(prompt, target_framework, additional_data, prompt_caching_settings)

        return self._deterministic_refine(prompt, target_framework, additional_data, prompt_caching_settings)

    def _refine_via_llm(
        self,
        prompt: str,
        target_framework: Optional[str],
        additional_data: Optional[str],
        prompt_caching_settings: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        system_instruction = """Você é um Engenheiro de Prompts e Engenheiro de IA de elite.
Sua missão é receber um prompt rascunhado do usuário e reconstruí-lo utilizando as melhores práticas globais de Engenharia de Prompts (como tags XML estruturadas, preenchimento prévio/prefilling, cadeia de pensamento/Chain-of-Thought dentro de <thinking>, e delimitação cirúrgica de restrições).

Regras de Reconstrução:
1. Reestruture o prompt rascunhado para o padrão CROFTC de forma elegante.
2. Utilize tags XML ricas para estruturar a chamada (ex: <instructions>, <context>, <constraints>, <examples>, <output_format>).
3. Se o usuário fornecer dados de suporte adicionais (planilhas, métricas), incorpore-os numa tag <input_data> de forma limpa.
4. Adicione uma tag explicativa de Configurações Recomendadas como Temperatura (T) e Top-P ideal.
5. Se for um caso de Ciência de Dados ou Machine Learning, integre conceitos como matriz de confusão, F1-Score, precisão, recall, RMSE, ou MAE, instruindo o modelo a validar saídas sistematicamente."""

        if prompt_caching_settings:
            system_instruction += f"""\n\n6. [REQUISITO CRÍTICO: PROMPT CACHING] O usuário deseja otimizar este prompt para Caching de Prefixo da API Gemini.
Incorpore as seções estáticas dentro de uma tag XML principal chamada <prompt_cache>.
Abaixo estão as seções que devem ser marcadas como estáticas (colocadas dentro da tag <prompt_cache>):
- Instruções de Sistema e Persona: {"SIM (Coloque as regras estruturais e de persona no início dentro do cache)" if prompt_caching_settings.get("cacheSystemInstructions") else "NÃO"}
- Dados de Contexto / Planilha: {"SIM (Coloque os dados da planilha/contexto dentro do cache)" if prompt_caching_settings.get("cacheStaticContext") else "NÃO"}
- Exemplos de Poucos Disparos / Templates: {"SIM (Incorpore os templates de exemplo dentro do cache)" if prompt_caching_settings.get("cacheFewShotExamples") else "NÃO"}
"""
            custom_blocks = prompt_caching_settings.get("customStaticBlocks", [])
            if custom_blocks:
                system_instruction += "Além disso, incorpore estes blocos estáticos customizados pelo usuário dentro da tag <prompt_cache>:\n" + "\n".join(
                    [f'<static_block name="{b.get("name")}">\n{b.get("content")}\n</static_block>' for b in custom_blocks]
                ) + "\n"
            system_instruction += '\nMuito Importante: Logo após fechar a tag </prompt_cache>, você DEVE obrigatoriamente adicionar a tag de quebra de cache da API Gemini: "<gemini_cache_boundary />" (em uma linha isolada). Tudo o que vier após essa tag será processado dinamicamente em cada chamada, permitindo economizar custos e latência no prefixo estático.'

        system_instruction += "\n\nRetorne apenas o prompt reconstruído com as marcações solicitadas, pronto para ser copiado e utilizado."

        instruction_body = f'Por favor, refine e reestruture o seguinte prompt:\n\n"""\n{prompt}\n"""'
        if target_framework:
            instruction_body += f"\n\nFoque em otimizá-lo para o framework/modelo de referência: {target_framework}"
        if additional_data:
            instruction_body += f"\n\nIncorpore os seguintes dados adicionais ou planilha contextualizada:\n{additional_data}"

        response = self.gemini.generate_content(
            prompt=instruction_body,
            system_instruction=system_instruction
        )

        return {"refinedPrompt": response["text"].strip()}

    def _deterministic_refine(
        self,
        prompt: str,
        target_framework: Optional[str],
        additional_data: Optional[str],
        prompt_caching_settings: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Gera uma reconstrução estruturada em padrão de ouro puramente em Python.
        """
        lines = [line.strip() for line in prompt.split("\n") if line.strip()]
        topic = lines[0] if lines else "Processamento de Tarefa Especializada"

        xml_parts = []

        if prompt_caching_settings:
            xml_parts.append("<prompt_cache>")
            if prompt_caching_settings.get("cacheSystemInstructions"):
                xml_parts.append("""  <system_role>
    Você é um Arquiteto de Software e Especialista em IA Sênior. 
    Seu objetivo é resolver a solicitação com precisão matemática, clareza semântica e sem alucinações.
  </system_role>""")
            if prompt_caching_settings.get("cacheStaticContext"):
                xml_parts.append("""  <domain_context>
    Ambiente de execução Python 3.10 com suporte a bibliotecas analíticas e padrões de Spec-Driven Development (SDD).
  </domain_context>""")
            if prompt_caching_settings.get("cacheFewShotExamples"):
                xml_parts.append("""  <few_shot_examples>
    <example>
      <input>Calcular F1-Score para TP=80, FP=10, FN=20, TN=90</input>
      <output>Precision=88.89%, Recall=80.00%, F1-Score=84.21%</output>
    </example>
  </few_shot_examples>""")
            xml_parts.append("</prompt_cache>")
            xml_parts.append("\n<gemini_cache_boundary />\n")

        # Conteúdo dinâmico da solicitação
        xml_parts.append("<prompt_request>")
        xml_parts.append(f"""  <objective>
    {prompt}
  </objective>""")

        if target_framework:
            xml_parts.append(f"""  <target_framework>
    {target_framework}
  </target_framework>""")

        if additional_data:
            xml_parts.append(f"""  <input_data>
<![CDATA[
{additional_data}
]]>
  </input_data>""")

        xml_parts.append("""  <constraints>
    - Responda de forma analítica e fundamentada.
    - Evite prolixidade e introduções vazias.
    - Forneça código Python tipado e validado sempre que couber.
  </constraints>

  <output_format>
    - Raciocínio prévio estruturado em <thinking>.
    - Resposta final em blocos de código ou Markdown estruturado.
  </output_format>
</prompt_request>""")

        return {"refinedPrompt": "\n".join(xml_parts)}
