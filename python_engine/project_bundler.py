"""
project_bundler.py - Utilitário para empacotar e exportar toda a codebase do projeto Scribe para uso no Gemini.
Gera bundle em Markdown otimizado para o Gemini (com árvore de arquivos, metadados e tags de contexto)
e arquivos ZIP contendo o código-fonte limpo.
"""

import os
import io
import zipfile
from datetime import datetime
from typing import List, Tuple, Dict, Any

# Pastas e arquivos a ignorar
IGNORED_DIRS = {"node_modules", "dist", ".git", "__pycache__", ".vscode", ".idea"}
IGNORED_EXTENSIONS = {".pyc", ".lock", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2", ".map"}
IGNORED_FILES = {"bun.lock", "package-lock.json", ".DS_Store"}

KEY_FILES_PRIORITY = [
    "server.ts",
    "package.json",
    "metadata.json",
    "index.html",
    "src/types.ts",
    "src/App.tsx",
    "src/components/PythonWorkbench.tsx",
    "src/main.tsx",
    "src/index.css",
    "python_engine/analyzer.py",
    "python_engine/refiner.py",
    "python_engine/data_science.py",
    "python_engine/tokenomics.py",
    "python_engine/gemini_service.py",
    "python_engine/exporter.py",
    "python_engine/runner.py",
    "python_engine/cli.py",
    "python_engine/test_engine.py",
    "vite.config.ts",
    "tsconfig.json",
    ".env.example"
]

def collect_project_files(base_dir: str = ".") -> List[Tuple[str, str]]:
    """
    Retorna uma lista de tuplas (caminho_relativo, conteudo_texto) de todos os arquivos de código válidos.
    """
    files_data = []
    
    for root, dirs, files in os.walk(base_dir):
        # Filtra pastas ignoradas in-place
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]
        
        for file in sorted(files):
            if file in IGNORED_FILES:
                continue
            ext = os.path.splitext(file)[1].lower()
            if ext in IGNORED_EXTENSIONS:
                continue
            
            abs_path = os.path.join(root, file)
            rel_path = os.path.relpath(abs_path, base_dir)
            
            # Tenta ler como texto UTF-8
            try:
                with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                files_data.append((rel_path, content))
            except Exception:
                continue

    # Ordena priorizando arquivos chave
    def sort_key(item):
        path = item[0]
        if path in KEY_FILES_PRIORITY:
            return (0, KEY_FILES_PRIORITY.index(path))
        return (1, path)

    files_data.sort(key=sort_key)
    return files_data

def generate_gemini_markdown_bundle(base_dir: str = ".") -> Dict[str, Any]:
    """
    Gera um documento Markdown unificado e estruturado especificamente para ser fornecido
    ao Gemini (Google AI Studio, Gemini 1.5/2.0/3.0/3.5, Gemini CLI ou API).
    """
    files_data = collect_project_files(base_dir)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    total_lines = sum(len(content.splitlines()) for _, content in files_data)
    total_chars = sum(len(content) for _, content in files_data)
    # Estimativa aproximada de tokens para código (~3.5 a 4 caracteres por token)
    est_tokens = int(total_chars / 3.8)

    md = []
    md.append("# 📦 Scribe - Codebase Completa para Contexto no Gemini")
    md.append(f"**Data de Exportação**: `{timestamp}` | **Arquivos**: `{len(files_data)}` | **Linhas de Código**: `{total_lines}` | **Tokens Estimados**: `~{est_tokens:,}`\n")
    
    md.append("## 🤖 Instrução Recomendada para Prompt no Gemini")
    md.append("```text")
    md.append("Você é um Engenheiro de Software Full-Stack Sênior e Especialista em Engenharia de Prompts e LLMs.")
    md.append("Abaixo está a codebase completa do Scribe (Frontend React + TypeScript + Tailwind, Servidor Node.js Express e Motor Matemático/Analítico Python 3.10 integrado com a API do Gemini).")
    md.append("Analise o projeto e [INSERIR SEU OBJETIVO: ex.: adicione uma nova métrica, refatore um módulo, crie um novo componente, analise a arquitetura].")
    md.append("```\n")

    md.append("## 📁 Arquitetura do Projeto & Resumo de Módulos")
    md.append("- **Frontend (`src/`)**: Interface React 18, Tailwind CSS, Lucide Icons, animações via `motion/react`.")
    md.append("  - `src/App.tsx`: Aplicação principal com abas de Laboratório, Workbench Python, Kanban, Métricas de Ciência de Dados, Teoria e Exportação.")
    md.append("  - `src/components/PythonWorkbench.tsx`: Painel interativo com REPL Python, testes unitários, documentação dos módulos e terminal de execução.")
    md.append("  - `src/types.ts`: Tipagens TypeScript estritas (CROFTC, Tokenomics, Métricas, Interações).")
    md.append("- **Backend (`server.ts`)**: Servidor Express na porta 3000 que atua como ponte segura com a API do Gemini e executa o motor Python via subprocessos.")
    md.append("- **Motor Python (`python_engine/`)**: Núcleo computacional Python 3.10 com CROFTC scoring, tokenomics, equações de Data Science (F1, Cosseno, MCC), geradores de script e CLI.\n")

    md.append("## 📋 Índice de Arquivos Exportados")
    for path, content in files_data:
        line_count = len(content.splitlines())
        md.append(f"- `{path}` ({line_count} linhas)")
    md.append("\n---\n")

    md.append("## 💻 Código-Fonte dos Arquivos\n")
    for path, content in files_data:
        ext = os.path.splitext(path)[1].lstrip(".")
        lang = "typescript" if ext in ("ts", "tsx") else ("python" if ext == "py" else (ext or "text"))
        if ext == "json":
            lang = "json"
        elif ext in ("css", "html"):
            lang = ext

        md.append(f"### Arquivo: `{path}`")
        md.append(f"```{lang}")
        md.append(content)
        md.append("```\n")

    markdown_str = "\n".join(md)

    return {
        "markdown": markdown_str,
        "total_files": len(files_data),
        "total_lines": total_lines,
        "est_tokens": est_tokens,
        "files_list": [path for path, _ in files_data]
    }

def generate_project_zip(base_dir: str = ".") -> bytes:
    """
    Gera um arquivo ZIP em memória com todos os arquivos do projeto limpos.
    """
    files_data = collect_project_files(base_dir)
    buffer = io.BytesIO()
    
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel_path, content in files_data:
            zf.writestr(rel_path, content.encode("utf-8"))

    buffer.seek(0)
    return buffer.getvalue()

if __name__ == "__main__":
    bundle = generate_gemini_markdown_bundle()
    print(f"Gerado bundle com {bundle['total_files']} arquivos e {bundle['total_lines']} linhas (~{bundle['est_tokens']} tokens).")
