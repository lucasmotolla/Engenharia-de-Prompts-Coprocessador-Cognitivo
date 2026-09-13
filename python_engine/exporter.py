"""
exporter.py - Módulo Python para Exportação de Relatórios e Geração de Código Python Autônomo
Gera relatórios em Markdown, scripts executáveis .py e planilhas analíticas.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional

class ReportExporter:
    @staticmethod
    def generate_markdown_report(
        interactions: List[Dict[str, Any]],
        daily_goal: bool,
        stats: Optional[Dict[str, Any]] = None
    ) -> str:
        date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        md = [
            f"# Relatório de Engenharia de Prompts & Produtividade (Python Core Engine)",
            f"*Gerado pelo Scribe Python Engine v2.0 em: {date_str}*\n",
            "## 📊 Métricas de Produtividade Diária",
            f"- **Meta de Foco Concluída**: {'Sim' if daily_goal else 'Pendente'}",
            f"- **Total de Prompts Analisados/Refinados**: {len(interactions)}"
        ]

        if stats:
            avg_score = stats.get("avgScore", 0)
            max_score = stats.get("maxScore", 0)
            md.append(f"- **Média de Qualidade Inicial**: {avg_score:.1f}/100")
            md.append(f"- **Pontuação Máxima Atingida**: {max_score}/100")

        md.append("\n---\n")
        md.append("## 🚀 Histórico de Refinamentos & Alinhamentos de Ciência de Dados\n")

        for idx, item in enumerate(interactions, 1):
            title = item.get("title", f"Prompt #{idx}")
            timestamp = item.get("timestamp", "")
            orig = item.get("originalPrompt", "")
            refined = item.get("refinedPrompt", "")
            analysis = item.get("analysis", {})

            md.append(f"### {idx}. {title}")
            if timestamp:
                md.append(f"*Registro: {timestamp}*\n")
            
            md.append(f"#### Prompt Original:\n```text\n{orig}\n```\n")

            if analysis:
                score = analysis.get("score", "N/A")
                croftc = analysis.get("croftc", {})
                tokenomics = analysis.get("tokenomics", {})
                sugs = analysis.get("suggestions", [])

                md.append("#### Avaliação Estrutural:")
                md.append(f"- **Score Global**: {score}/100")
                md.append(f"- **Papel (Role)**: {croftc.get('role', 'N/A')}")
                md.append(f"- **Formato (Format)**: {croftc.get('format', 'N/A')}")
                caching_pot = "Alto (Prefix Caching ativo)" if tokenomics.get("promptCachingPotential") else "Baixo"
                md.append(f"- **Potencial de Cache**: {caching_pot}\n")

                if sugs:
                    md.append("#### Sugestões de Melhoria:")
                    for s in sugs:
                        md.append(f"- {s}")
                    md.append("")

            if refined:
                md.append(f"#### Prompt Refinado (Scaffold):\n```text\n{refined}\n```\n")

            md.append("---\n")

        md.append("## 🧠 Fundamentos Matemáticos & Arquitetura Python")
        md.append("O motor analítico em Python processa tensores de similaridade de cosseno, equações de F1-Score balanceado e heurísticas de tokenomics. O isolamento de instruções estáticas via Prefix Caching viabiliza reduções de até 80% nos custos de inferência da família Gemini.")
        md.append("\n*Scribe: Coprocessador Cognitivo & Laboratório de IA em Python.*")

        return "\n".join(md)

    @staticmethod
    def generate_python_script(prompt: str, system_instructions: Optional[str] = None) -> str:
        """
        Gera um script Python pronto para ser executado e automatizar este prompt.
        """
        escaped_prompt = prompt.replace('"""', '\\"\\"\\"')
        escaped_sys = (system_instructions or "").replace('"""', '\\"\\"\\"')

        return f'''#!/usr/bin/env python3
"""
Script de Automação de Prompt gerado pelo Scribe Python Core.
Executa chamada otimizada ao Google Gemini 3.5 Flash.
"""

import os
import sys
import json
import urllib.request

def run_prompt():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Erro: A variável de ambiente GEMINI_API_KEY não foi encontrada.", file=sys.stderr)
        print("Defina-a via: export GEMINI_API_KEY='sua_chave'", file=sys.stderr)
        sys.exit(1)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={{api_key}}"
    
    payload = {{
        "contents": [
            {{
                "role": "user",
                "parts": [{{"text": """{escaped_prompt}"""}}]
            }}
        ]
    }}

    system_instruction = """{escaped_sys}"""
    if system_instruction.strip():
        payload["systemInstruction"] = {{
            "role": "system",
            "parts": [{{"text": system_instruction}}]
        }}

    headers = {{
        "Content-Type": "application/json",
        "User-Agent": "aistudio-build"
    }}

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)

    try:
        print("Enviando requisição para Gemini 3.5 Flash...")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
            print("\\n=== RESPOSTA DO MODELO ===\\n")
            print(answer)
    except Exception as e:
        print(f"Erro na execução: {{e}}", file=sys.stderr)

if __name__ == "__main__":
    run_prompt()
'''
