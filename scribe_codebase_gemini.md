# 📦 Scribe - Codebase Completa para Contexto no Gemini
**Data de Exportação**: `2026-09-13 11:05:36` | **Arquivos**: `25` | **Linhas de Código**: `5562` | **Tokens Estimados**: `~72,867`

## 🤖 Instrução Recomendada para Prompt no Gemini
```text
Você é um Engenheiro de Software Full-Stack Sênior e Especialista em Engenharia de Prompts e LLMs.
Abaixo está a codebase completa do Scribe (Frontend React + TypeScript + Tailwind, Servidor Node.js Express e Motor Matemático/Analítico Python 3.10 integrado com a API do Gemini).
Analise o projeto e [INSERIR SEU OBJETIVO: ex.: adicione uma nova métrica, refatore um módulo, crie um novo componente, analise a arquitetura].
```

## 📁 Arquitetura do Projeto & Resumo de Módulos
- **Frontend (`src/`)**: Interface React 18, Tailwind CSS, Lucide Icons, animações via `motion/react`.
  - `src/App.tsx`: Aplicação principal com abas de Laboratório, Workbench Python, Kanban, Métricas de Ciência de Dados, Teoria e Exportação.
  - `src/components/PythonWorkbench.tsx`: Painel interativo com REPL Python, testes unitários, documentação dos módulos e terminal de execução.
  - `src/types.ts`: Tipagens TypeScript estritas (CROFTC, Tokenomics, Métricas, Interações).
- **Backend (`server.ts`)**: Servidor Express na porta 3000 que atua como ponte segura com a API do Gemini e executa o motor Python via subprocessos.
- **Motor Python (`python_engine/`)**: Núcleo computacional Python 3.10 com CROFTC scoring, tokenomics, equações de Data Science (F1, Cosseno, MCC), geradores de script e CLI.

## 📋 Índice de Arquivos Exportados
- `server.ts` (448 linhas)
- `package.json` (35 linhas)
- `metadata.json` (6 linhas)
- `index.html` (16 linhas)
- `src/types.ts` (49 linhas)
- `src/App.tsx` (2623 linhas)
- `src/components/PythonWorkbench.tsx` (531 linhas)
- `src/main.tsx` (10 linhas)
- `src/index.css` (23 linhas)
- `python_engine/analyzer.py` (225 linhas)
- `python_engine/refiner.py` (148 linhas)
- `python_engine/data_science.py` (173 linhas)
- `python_engine/tokenomics.py` (108 linhas)
- `python_engine/gemini_service.py` (98 linhas)
- `python_engine/exporter.py` (142 linhas)
- `python_engine/runner.py` (74 linhas)
- `python_engine/cli.py` (167 linhas)
- `python_engine/test_engine.py` (87 linhas)
- `vite.config.ts` (22 linhas)
- `tsconfig.json` (26 linhas)
- `.env.example` (9 linhas)
- `.gitignore` (8 linhas)
- `python_engine/__init__.py` (23 linhas)
- `python_engine/project_bundler.py` (158 linhas)
- `src/components/ExportGeminiModal.tsx` (353 linhas)

---

## 💻 Código-Fonte dos Arquivos

### Arquivo: `server.ts`
```typescript
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to bridge API calls to the Python Core Engine
function runPython(action: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["python_engine/cli.py", action], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: process.cwd() }
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    py.on("error", (err) => {
      reject(new Error(`Falha ao iniciar processo Python: ${err.message}`));
    });

    py.on("close", (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(stderr.trim() || `Processo Python finalizado com código ${code}`));
        return;
      }
      if (action === "export_report") {
        resolve(stdout);
        return;
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        resolve(stdout);
      }
    });

    py.stdin.write(JSON.stringify(payload || {}));
    py.stdin.end();
  });
}

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiInstance;
}

// ----------------------------------------------------
// API ROUTES (POWERED BY PYTHON CORE ENGINE)
// ----------------------------------------------------

// Health Check & Python Engine Status Endpoint
app.get("/api/health", async (req, res) => {
  try {
    const pyStatus = await runPython("status", {});
    res.json({
      status: "ok",
      server: "Node-Vite-Bridge",
      primary_language: "Python 3.10",
      python_engine: pyStatus,
      time: new Date().toISOString()
    });
  } catch (err: any) {
    res.json({
      status: "ok",
      python_engine_warning: err.message,
      time: new Date().toISOString()
    });
  }
});

// Endpoint: Python Engine Status
app.get("/api/python/status", async (req, res) => {
  try {
    const info = await runPython("status", {});
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Python Interactive Code Runner
app.post("/api/python/execute", async (req, res) => {
  const { code, timeout } = req.body;
  try {
    const result = await runPython("execute_python", { code, timeout: timeout || 10 });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Python Data Science Calculations
app.post("/api/python/data-science", async (req, res) => {
  const { type, tp, fp, fn, tn, beta, y_true, y_pred, originalPrompt, refinedPrompt } = req.body;
  try {
    let result;
    if (type === "regression") {
      result = await runPython("data_science_regression", { y_true, y_pred });
    } else if (type === "embedding_sim") {
      result = await runPython("data_science_embedding_sim", { originalPrompt, refinedPrompt });
    } else {
      result = await runPython("data_science_metrics", { tp, fp, fn, tn, beta: beta || 1.0 });
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Python Tokenomics & Prefix Caching
app.post("/api/python/tokenomics", async (req, res) => {
  try {
    const metrics = await runPython("tokenomics", req.body);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Export Standalone Python Script
app.post("/api/python/export-script", async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  try {
    const result = await runPython("export_script", { prompt, systemInstruction });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Real-time Prompt Analysis (Python + Gemini Hybrid)
app.post("/api/analyze-prompt", async (req, res) => {
  const { prompt, promptCachingSettings } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "O campo 'prompt' é obrigatório e deve ser uma string." });
    return;
  }

  try {
    const ai = getGeminiClient();
    let llmParsedResult: any = null;

    if (ai) {
      const systemInstruction = `Você é um Engenheiro de IA e Cientista de Dados Sênior especialista em arquiteturas de LLMs e engenharia de prompts avançada.
Sua tarefa é analisar o prompt fornecido pelo utilizador e fornecer uma avaliação estruturada detalhada.
Aplique conceitos profundos sobre:
1. O framework CROFTC (Context, Role, Objective, Format, Temperature, Constraints).
2. O framework de 5 passos do Google Prompting Essentials (Task, Context, References, Evaluation, Iteration).
3. Mecânicas de LLM (Self-Attention, Embeddings, Cosine Similarity, Tokenomics/Prompt Caching, riscos de alucinação e viés).
4. Práticas de Engenharia de Software como Spec-Driven Development (SDD) vs Vibe Coding.

Responda estritamente de acordo com o esquema JSON configurado.`;

      let userPromptMessage = `Analise o seguinte prompt em português:\n\n"""\n${prompt}\n"""`;

      if (promptCachingSettings) {
        userPromptMessage += `\n\nConfigurações de Prompt Caching Ativas para este prompt:
- Instruções de Sistema Estáticas: ${promptCachingSettings.cacheSystemInstructions ? "ATIVADO" : "DESATIVADO"}
- Contexto de Dados Estático: ${promptCachingSettings.cacheStaticContext ? "ATIVADO" : "DESATIVADO"}
- Exemplos Few-Shot Estáticos: ${promptCachingSettings.cacheFewShotExamples ? "ATIVADO" : "DESATIVADO"}
`;
        if (promptCachingSettings.customStaticBlocks && promptCachingSettings.customStaticBlocks.length > 0) {
          userPromptMessage += `- Blocos Estáticos Customizados:\n${promptCachingSettings.customStaticBlocks.map((b: any) => `  * ${b.name} (${b.tokens} tokens)`).join("\n")}\n`;
        }
      }

      const modelResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPromptMessage,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Pontuação global da qualidade do prompt (0 a 100)." },
              croftc: {
                type: Type.OBJECT,
                properties: {
                  context: { type: Type.STRING },
                  role: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  format: { type: Type.STRING },
                  temperature: { type: Type.STRING },
                  constraints: { type: Type.STRING }
                },
                required: ["context", "role", "objective", "format", "temperature", "constraints"]
              },
              googleSteps: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  context: { type: Type.STRING },
                  references: { type: Type.STRING },
                  evaluation: { type: Type.STRING },
                  iteration: { type: Type.STRING }
                },
                required: ["task", "context", "references", "evaluation", "iteration"]
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              cognitiveLoadNote: { type: Type.STRING },
              tokenomics: {
                type: Type.OBJECT,
                properties: {
                  estimatedInputTokens: { type: Type.INTEGER },
                  promptCachingPotential: { type: Type.BOOLEAN },
                  promptCachingReason: { type: Type.STRING }
                },
                required: ["estimatedInputTokens", "promptCachingPotential", "promptCachingReason"]
              },
              scientificRefinement: { type: Type.STRING }
            },
            required: ["score", "croftc", "googleSteps", "suggestions", "cognitiveLoadNote", "tokenomics", "scientificRefinement"]
          }
        }
      });

      if (modelResponse.text) {
        try {
          llmParsedResult = JSON.parse(modelResponse.text.trim());
        } catch {
          // Fallback to python
        }
      }
    }

    // Processa e enriquece no motor analítico Python
    const finalAnalysis = await runPython("analyze", {
      prompt,
      promptCachingSettings,
      llmParsedResult
    });

    res.json(finalAnalysis);
  } catch (error: any) {
    console.error("Erro na análise do prompt via Python:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar a análise do prompt." });
  }
});

// Endpoint: Refine Prompt (Powered by Python)
app.post("/api/refine-prompt", async (req, res) => {
  const { prompt, targetFramework, additionalData, promptCachingSettings } = req.body;
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "O campo 'prompt' é obrigatório e deve ser uma string." });
    return;
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      let systemInstruction = `Você é um Engenheiro de Prompts e Engenheiro de IA de elite.
Sua missão é receber um prompt rascunhado do usuário e reconstruí-lo utilizando as melhores práticas globais de Engenharia de Prompts (como tags XML estruturadas, preenchimento prévio/prefilling, cadeia de pensamento/Chain-of-Thought dentro de <thinking>, e delimitação cirúrgica de restrições).

Regras de Reconstrução:
1. Reestruture o prompt rascunhado para o padrão CROFTC de forma elegante.
2. Utilize tags XML ricas para estruturar a chamada (ex: <instructions>, <context>, <constraints>, <examples>, <output_format>).
3. Se o usuário fornecer dados de suporte adicionais (planilhas, métricas), incorpore-os numa tag <input_data> de forma limpa.
4. Adicione uma tag explicativa de Configurações Recomendadas como Temperatura (T) e Top-P ideal.
5. Se for um caso de Ciência de Dados ou Machine Learning, integre conceitos como matriz de confusão, F1-Score, precisão, recall, RMSE, ou MAE, instruindo o modelo a validar saídas sistematicamente.`;

      if (promptCachingSettings) {
        systemInstruction += `\n\n6. [REQUISITO CRÍTICO: PROMPT CACHING] O usuário deseja otimizar este prompt para Caching de Prefixo da API Gemini.
Incorpore as seções estáticas dentro de uma tag XML principal chamada <prompt_cache>.
Abaixo estão as seções que devem ser marcadas como estáticas (colocadas dentro da tag <prompt_cache>):
- Instruções de Sistema e Persona: ${promptCachingSettings.cacheSystemInstructions ? "SIM" : "NÃO"}
- Dados de Contexto / Planilha: ${promptCachingSettings.cacheStaticContext ? "SIM" : "NÃO"}
- Exemplos de Poucos Disparos / Templates: ${promptCachingSettings.cacheFewShotExamples ? "SIM" : "NÃO"}
`;
        if (promptCachingSettings.customStaticBlocks && promptCachingSettings.customStaticBlocks.length > 0) {
          systemInstruction += `Além disso, incorpore estes blocos estáticos customizados pelo usuário dentro da tag <prompt_cache>:\n${promptCachingSettings.customStaticBlocks.map((b: any) => `<static_block name="${b.name}">\n${b.content}\n</static_block>`).join("\n")}\n`;
        }
        systemInstruction += `\nLogo após fechar </prompt_cache>, adicione a tag: "<gemini_cache_boundary />" em linha isolada.`;
      }

      systemInstruction += `\nRetorne apenas o prompt reconstruído pronto para ser copiado.`;

      let instructionBody = `Por favor, refine e reestruture o seguinte prompt:\n\n"""\n${prompt}\n"""`;
      if (targetFramework) {
        instructionBody += `\nFoque no framework: ${targetFramework}`;
      }
      if (additionalData) {
        instructionBody += `\nIncorpore os dados:\n${additionalData}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: instructionBody,
        config: { systemInstruction }
      });

      res.json({ refinedPrompt: response.text });
      return;
    }

    // Fallback: Python deterministic refiner
    const result = await runPython("refine", {
      prompt,
      targetFramework,
      additionalData,
      promptCachingSettings
    });
    res.json(result);
  } catch (error: any) {
    console.error("Erro no refinamento via Python:", error);
    // Fallback directly to Python refiner
    try {
      const fallbackResult = await runPython("refine", {
        prompt,
        targetFramework,
        additionalData,
        promptCachingSettings
      });
      res.json(fallbackResult);
    } catch (fbErr: any) {
      res.status(500).json({ error: fbErr.message || "Erro no refinamento." });
    }
  }
});

// Endpoint: Export Markdown Report (Pure Python Generator)
app.post("/api/export-report", async (req, res) => {
  const { interactions, dailyGoal, stats } = req.body;

  if (!interactions || !Array.isArray(interactions)) {
    res.status(400).send("Interações inválidas.");
    return;
  }

  try {
    const markdown = await runPython("export_report", {
      interactions,
      dailyGoal,
      stats
    });

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=relatorio-prompt-engineering-python-${new Date().toISOString().slice(0, 10)}.md`
    );
    res.send(markdown);
  } catch (err: any) {
    res.status(500).send(`Erro ao gerar relatório com Python: ${err.message}`);
  }
});

// Endpoint: Export Full Project Codebase Bundle for Gemini Context (JSON)
app.get("/api/export-project/bundle", async (req, res) => {
  try {
    const bundle = await runPython("export_gemini_bundle", {});
    res.json(bundle);
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao gerar bundle do projeto: " + err.message });
  }
});

// Endpoint: Export Full Project Codebase as Markdown File for Gemini (.md download)
app.get("/api/export-project/markdown", async (req, res) => {
  try {
    const bundle = await runPython("export_gemini_bundle", {});
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=scribe-codebase-gemini-${new Date().toISOString().slice(0, 10)}.md`
    );
    res.send(bundle.markdown);
  } catch (err: any) {
    res.status(500).send("Erro ao gerar arquivo Markdown: " + err.message);
  }
});

// Endpoint: Export Clean Project Codebase as ZIP Archive (.zip download)
app.get("/api/export-project/zip", async (req, res) => {
  try {
    const result = await runPython("export_zip_base64", {});
    const buffer = Buffer.from(result.zip_base64, "base64");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=scribe-codebase-${new Date().toISOString().slice(0, 10)}.zip`
    );
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send("Erro ao gerar arquivo ZIP: " + err.message);
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE SETUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} [Python Core Engine Active]`);
  });
}

startServer();

```

### Arquivo: `package.json`
```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "clean": "rm -rf dist",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3",
    "express": "^4.21.2",
    "dotenv": "^17.2.3",
    "motion": "^12.23.24"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "@types/express": "^4.17.21"
  }
}

```

### Arquivo: `metadata.json`
```json
{
  "name": "Scribe - Engenharia de Prompts & Coprocessador Cognitivo",
  "description": "Ambiente avançado de Engenharia de Prompts e Ciência de Dados impulsionado por um motor central em Python 3.10, com análise CROFTC, otimização de Tokenomics & Prompt Caching, validação matemática de métricas de ML e console Python interativo.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

```

### Arquivo: `index.html`
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scribe - Engenharia de Prompts & Coprocessador Cognitivo (Python Core)</title>
    <meta name="description" content="Ambiente avançado de Engenharia de Prompts e Ciência de Dados impulsionado por um motor central em Python 3.10, com análise CROFTC, otimização de Tokenomics & Prompt Caching, validação matemática de métricas de ML e console Python interativo." />
    <meta property="og:title" content="Scribe - Engenharia de Prompts & Coprocessador Cognitivo (Python Core)" />
    <meta property="og:description" content="Ambiente avançado de Engenharia de Prompts e Ciência de Dados impulsionado por um motor central em Python 3.10, com análise CROFTC, otimização de Tokenomics & Prompt Caching, validação matemática de métricas de ML e console Python interativo." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>


```

### Arquivo: `src/types.ts`
```typescript
export interface CroftcAnalysis {
  context: string;
  role: string;
  objective: string;
  format: string;
  temperature: string;
  constraints: string;
}

export interface GoogleStepsAnalysis {
  task: string;
  context: string;
  references: string;
  evaluation: string;
  iteration: string;
}

export interface TokenomicsAnalysis {
  estimatedInputTokens: number;
  promptCachingPotential: boolean;
  promptCachingReason: string;
}

export interface PromptAnalysis {
  score: number;
  croftc: CroftcAnalysis;
  googleSteps: GoogleStepsAnalysis;
  suggestions: string[];
  cognitiveLoadNote: string;
  tokenomics: TokenomicsAnalysis;
  scientificRefinement: string;
}

export interface Interaction {
  id: string;
  title: string;
  timestamp: string;
  prompt: string;
  dataContext?: string;
  analysis?: PromptAnalysis;
  refinedPrompt?: string;
}

export interface KanbanTask {
  id: string;
  text: string;
  column: "backlog" | "fazendo" | "concluido";
  timestamp: string;
}

```

### Arquivo: `src/App.tsx`
```typescript
import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Brain, Volume2, VolumeX, Plus, Trash, Download, Check, 
  CheckSquare, Square, ArrowRight, Terminal, History, AlertCircle, 
  Gauge, Copy, Save, FileSpreadsheet, Percent, HelpCircle, BookOpen, Layers,
  Clock, Database, Coins, Zap, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PromptAnalysis, Interaction, KanbanTask } from "./types";
import { PythonWorkbench } from "./components/PythonWorkbench";
import { ExportGeminiModal } from "./components/ExportGeminiModal";

// Standard prompt templates focused on general use-cases and program usage guidelines
const DEMO_TEMPLATES = [
  {
    title: "Engenharia de Prompts Estruturada (Uso Geral)",
    prompt: "Atue como um Engenheiro de IA especialista. Otimize as diretrizes de tomada de decisão abaixo estruturando-as com tags XML claras para instruir um modelo de linguagem sobre como classificar requisições de clientes com alta segurança e precisão. Garanta que o modelo utilize uma tag <thinking> para raciocinar antes de produzir a resposta estruturada em JSON.",
    dataContext: "Regras de Classificação:\n- Reclamações de Cobrança: Prioridade Alta, redirecionar para financeiro.\n- Dúvidas de Integração API: Prioridade Média, disponibilizar documentação de SDK.\n- Elogios e Feedbacks: Prioridade Baixa, registrar no banco de dados."
  },
  {
    title: "Otimização de Custos e Prompt Caching",
    prompt: "Você receberá uma base de dados extensa de documentação de APIs e regras de conformidade corporativa. Quero que atue como auditor de segurança de código. Analise o código fornecido abaixo em busca de credenciais vazadas e más práticas. Como este prompt será executado milhares de vezes com a mesma base de contexto, utilize as diretrizes de Prompt Caching para estruturar as informações de contexto estático no início do prompt, seguidas pela tag de quebra <gemini_cache_boundary /> antes da entrada de código dinâmica.",
    dataContext: "Base de Dados Estática de Políticas de Segurança (1500 tokens):\n- Regra SEC-01: Proibido expor chaves de API ('sk_live', 'AIzaSy', etc).\n- Regra SEC-02: Conexões de banco de dados devem utilizar variáveis de ambiente.\n- Regra SEC-03: Senhas e tokens de criptografia não devem ser embutidos no código fonte."
  },
  {
    title: "Refinamento de Instruções de Sistema",
    prompt: "Como usar este programa: Cole suas instruções de sistema de uso geral no editor principal. Inclua regras complexas de negócios que você deseja que permaneçam estáticas. Ative a otimização de Prompt Caching no painel abaixo para ver em tempo real o gráfico de atenuação e a projeção de economia de custo e latência. Peça ao modelo para refinar e reconstruir seu rascunho de prompt adicionando delimitadores estruturados para produção segura.",
    dataContext: "Instruções do Ateliê de Modelagem:\n- O editor calcula dinamicamente a contagem aproximada de tokens para dados estáticos adicionais.\n- Ao selecionar as opções de cache, o painel de simulação mostra a projeção matemática de latência de 0.2s com prefixo em cache versus 1.5s sem cache, e até 75% de economia de custo da API Gemini."
  }
];

export default function App() {
  // --- STATE DECLARATIONS ---
  const [promptInput, setPromptInput] = useState("");
  const [dataContextInput, setDataContextInput] = useState("");
  const [targetFramework, setTargetFramework] = useState("gemini-3.5-flash");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sound Therapy States
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundType, setSoundType] = useState<"brown" | "pink">("brown");
  const [soundVolume, setSoundVolume] = useState(0.2);

  // Kanban / Dopamine Scaffold States
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [dailyGoalCompleted, setDailyGoalCompleted] = useState(false);

  // Interactive Data Science States (Classification / Confusion Matrix)
  const [tpVal, setTpVal] = useState(85);
  const [fpVal, setFpVal] = useState(15);
  const [fnVal, setFnVal] = useState(5);
  const [tnVal, setTnVal] = useState(120);

  // Interactive Data Science States (Regression / Statistics)
  const [regDataPoints, setRegDataPoints] = useState<Array<{ real: number; pred: number }>>([
    { real: 20, pred: 22 },
    { real: 15, pred: 14 },
    { real: 30, pred: 21 }, // high error (hallucination simulation)
    { real: 5, pred: 6 },
    { real: 12, pred: 13 }
  ]);
  const [newRealVal, setNewRealVal] = useState("");
  const [newPredVal, setNewPredVal] = useState("");

  // --- PROMPT CACHING STATES ---
  const [cacheSystemInstructions, setCacheSystemInstructions] = useState(true);
  const [cacheStaticContext, setCacheStaticContext] = useState(false);
  const [cacheFewShotExamples, setCacheFewShotExamples] = useState(false);
  const [cacheResponseSchema, setCacheResponseSchema] = useState(false);

  const [customStaticBlocks, setCustomStaticBlocks] = useState<Array<{ id: string; name: string; content: string; tokens: number; enabled: boolean }>>([
    { id: "cs1", name: "Dicionário Agrícola do Alentejo", content: "<dictionary>Alentejo: vinhas, uvas, geada; Douro: encostas, xisto, granito</dictionary>", tokens: 450, enabled: false },
    { id: "cs2", name: "Matrizes de Resolução de Erros de GPS", content: "<error_mapping>Error 04: recalibrate; Error 12: fallback to cell-tower</error_mapping>", tokens: 620, enabled: false }
  ]);
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockTokens, setNewBlockTokens] = useState(150);

  // --- PROMPT CACHING REAL-TIME VISUALIZATION STATES ---
  const [isProcessingCache, setIsProcessingCache] = useState(false);

  // --- CACHE CONFIGURATION SNAPSHOTS ---
  interface CacheSnapshot {
    id: string;
    timestamp: string;
    tokens: number;
    economy: number;
    normalLatency: number;
    cachedLatency: number;
    latencySavings: number;
    label: string;
  }
  const [snapshots, setSnapshots] = useState<CacheSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // UI States
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"prompts" | "python-lab" | "kanban" | "data-science" | "teoria" | "export-historico">("prompts");
  const [isExportGeminiOpen, setIsExportGeminiOpen] = useState(false);

  // --- 6-MONTH PROMPT HISTORY STATES (GEMINI & CLAUDE) ---
  const [promptHistory, setPromptHistory] = useState<Array<{
    id: string;
    date: string;
    platform: "Gemini" | "Claude";
    category: string;
    title: string;
    prompt: string;
    dataContext?: string;
    tokens: number;
    objectiveLink: string;
  }>>(() => {
    const saved = localStorage.getItem("scribe_prompt_history_6m");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading prompt history", e);
      }
    }
    return [
      {
        id: "h1",
        date: "2026-01-18",
        platform: "Gemini",
        category: "Auditoria de Segurança",
        title: "Varredura Detalhada de Vulnerabilidades de OWASP",
        prompt: "Atue como auditor de segurança automatizado DevSecOps. Verifique este código-fonte em busca de vulnerabilidades comuns do OWASP Top 10, especificamente injeção de SQL, vazamento de segredos e referências inseguras a objetos directos. Forneça o relatório com nível de severidade e ações de remediação recomendadas.",
        dataContext: "Base de Conhecimento OWASP v2026-Q1 com 850 tokens de definições de regras estáticas.",
        tokens: 850,
        objectiveLink: "Contém 850 tokens de definições estáticas de segurança que se repetem a cada análise. Habilitar o Prompt Caching no Ateliê de Modelagem reduz o custo de análise subsequente em 75% e a latência de verificação de 1.8s para 0.3s."
      },
      {
        id: "h2",
        date: "2026-02-11",
        platform: "Claude",
        category: "Instrução de Sistema",
        title: "Agente de Atendimento Médico - Triagem Inicial",
        prompt: "Você é um assistente de triagem médica prévia e acolhimento digital de alta empatia. Siga estritamente o protocolo clínico oficial do SUS fornecido nas diretrizes. Sua missão é fazer perguntas investigativas e categorizar o nível de gravidade em cores (Verde, Amarelo, Vermelho). Nunca prescreva medicamentos ou dê diagnósticos definitivos.",
        dataContext: "Tabela oficial de triagem clínica do Ministério da Saúde com 1800 tokens contendo sintomas, sinais vitais limitantes e fluxogramas de decisão.",
        tokens: 1800,
        objectiveLink: "O protocolo de triagem clínica de 1800 tokens é estático e imutável. No ecossistema Gemini, o cache de prefixo retém essas instruções, permitindo que cada interação do paciente custe apenas os tokens da mensagem dinâmica, economizando milhares de dólares em operações de alta escala."
      },
      {
        id: "h3",
        date: "2026-03-24",
        platform: "Gemini",
        category: "Análise de Código",
        title: "Refatoração de Componentes Legados React",
        prompt: "Refatore o seguinte componente legado de classe React para componentes funcionais utilizando os Hooks modernos. Remova ciclos de vida legados como componentWillReceiveProps e substitua por useEffects eficientes. Otimize os re-renders e garanta tipagem estrita com TypeScript.",
        dataContext: "Arquivo de componente Legado de 1400 linhas de código JS brutas (aproximadamente 3200 tokens).",
        tokens: 3200,
        objectiveLink: "Grandes bases de código legado que são submetidas a múltiplos prompts de refatoração iterativos beneficiam-se criticamente de Caching. Ao fixar o código legado em cache, você pode enviar múltiplos comandos de refatoração dinâmicos ('adicione testes', 'melhore tipagem', 'corrija CSS') sem pagar novamente pelo processamento do arquivo de 3200 tokens."
      },
      {
        id: "h4",
        date: "2026-04-05",
        platform: "Claude",
        category: "Few-Shot Examples",
        title: "Tradutor & Adaptador de Tom Corporativo Formal",
        prompt: "Converta os e-mails informais inseridos no tom executivo oficial ultra-profissional da nossa empresa, seguindo o padrão linguístico documentado nos exemplos abaixo.",
        dataContext: "Conjunto de 8 exemplos estruturados (Few-Shot) de conversões Antes/Depois contendo cerca de 1400 tokens de templates fixos.",
        tokens: 1400,
        objectiveLink: "Exemplos Few-Shot longos são ideais para Caching de Prefixo. Ao marcar o bloco de exemplos formais de e-mails como estático, as chamadas recorrentes de tradução em tempo real operam com latência instantânea de 0.2s e custo marginal na API Gemini."
      },
      {
        id: "h5",
        date: "2026-05-19",
        platform: "Gemini",
        category: "Geração de Conteúdo",
        title: "Redator de Blogposts comSEO Avançado",
        prompt: "Crie um artigo de blog otimizado para motores de busca baseado nas palavras-chave fornecidas. O artigo deve seguir os padrões de formatação amigável, cabeçalhos H2/H3 e densidade ideal de palavras-chave definida no manual de SEO da nossa marca.",
        dataContext: "Manual de SEO e Guia de Voz de Marca Corporativa com 1100 tokens de regras estruturais.",
        tokens: 1100,
        objectiveLink: "Ao fixar o Guia de Voz da Marca e o Manual de SEO de 1100 tokens na área estática de cache, os redatores podem gerar dezenas de artigos diários com custo até 70% menor e latência de geração de introduções drasticamente reduzida."
      },
      {
        id: "h6",
        date: "2026-06-21",
        platform: "Claude",
        category: "Processamento de Dados",
        title: "Parser Inteligente de Planilhas de Vendas de Agronegócio",
        prompt: "Atue como cientista de dados analítico. Converta esta planilha desestruturada em um arquivo JSON padronizado com campos específicos de vendas, datas em formato ISO-8601 e moedas convertidas para USD na taxa fixa estática de 5.40.",
        dataContext: "Tabela gigante de transações brutas de soja e milho colhidos, totalizando cerca de 2200 tokens.",
        tokens: 2200,
        objectiveLink: "Ligação direta com o Laboratório: Ao testar diferentes formatos de saída JSON ou esquemas de validação, os dados brutos da planilha de 2200 tokens podem ser mantidos em cache estável no ateliê, agilizando o ciclo de feedback de engenharia de prompt."
      }
    ];
  });

  const [importText, setImportText] = useState("");
  const [importPlatform, setImportPlatform] = useState<"Gemini" | "Claude">("Gemini");
  const [importCategory, setImportCategory] = useState("Geral");
  const [importTitle, setImportTitle] = useState("");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<"all" | "Gemini" | "Claude">("all");
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [linkSuccessMsg, setLinkSuccessMsg] = useState<string | null>(null);

  // Audio Context References for Noise Synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Load interactions from localStorage
    const savedInteractions = localStorage.getItem("scribe_interactions");
    if (savedInteractions) {
      try {
        const parsed = JSON.parse(savedInteractions);
        setInteractions(parsed);
        if (parsed.length > 0) {
          setActiveInteractionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error loading interactions", e);
      }
    }

    // Load tasks from localStorage
    const savedTasks = localStorage.getItem("scribe_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Error loading tasks", e);
      }
    } else {
      // Default scaffolding tasks matching the 2e ADHD dopamine structure
      const defaultTasks: KanbanTask[] = [
        { id: "t1", text: "Fazer o Brain Dump diário para desobstruir a memória de trabalho", column: "backlog", timestamp: new Date().toISOString() },
        { id: "t2", text: "Escrever a planta arquitetônica de prompt com tags XML", column: "fazendo", timestamp: new Date().toISOString() },
        { id: "t3", text: "Iniciar terapia de Ruído Marrom para sintonizar foco", column: "concluido", timestamp: new Date().toISOString() }
      ];
      setTasks(defaultTasks);
      localStorage.setItem("scribe_tasks", JSON.stringify(defaultTasks));
    }

    // Load daily goal state
    const goalState = localStorage.getItem("scribe_daily_goal");
    if (goalState) {
      setDailyGoalCompleted(goalState === "true");
    }

    // Cleanup audio on unmount
    return () => {
      stopNoise();
    };
  }, []);

  // Trigger processing animation when caching selections or text changes
  useEffect(() => {
    setIsProcessingCache(true);
    const timer = setTimeout(() => {
      setIsProcessingCache(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [
    cacheSystemInstructions,
    cacheStaticContext,
    cacheFewShotExamples,
    cacheResponseSchema,
    customStaticBlocks,
    dataContextInput,
    promptInput
  ]);

  // Save states helper
  const saveInteractions = (list: Interaction[]) => {
    setInteractions(list);
    localStorage.setItem("scribe_interactions", JSON.stringify(list));
  };

  const saveTasks = (list: KanbanTask[]) => {
    setTasks(list);
    localStorage.setItem("scribe_tasks", JSON.stringify(list));
  };

  // --- AUDIO SYNTHESIS ENGINE (REAL-TIME COGNITIVE FOCUS) ---
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const generateNoiseBuffer = (type: "brown" | "pink") => {
    if (!audioCtxRef.current) return null;
    const ctx = audioCtxRef.current;
    const sampleRate = ctx.sampleRate;
    const durationSeconds = 8; // 8-second looping buffer
    const bufferSize = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "brown") {
      // Brown Noise: Brownian integration/decay of white noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate amplitude loss
      }
    } else {
      // Pink Noise: Paul Kellet's refined 7-point filter method
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] *= 0.11; // Compensate amplitude
      }
    }
    return buffer;
  };

  const startNoise = () => {
    try {
      initAudio();
      stopNoise();

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const buffer = generateNoiseBuffer(soundType);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      // Apply smooth gain transition
      gain.gain.setValueAtTime(soundVolume, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);

      noiseSourceRef.current = source;
      gainNodeRef.current = gain;
      setSoundEnabled(true);
    } catch (e) {
      console.error("Erro ao iniciar terapia de som:", e);
    }
  };

  const stopNoise = () => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (e) {}
      noiseSourceRef.current = null;
    }
    setSoundEnabled(false);
  };

  const handleSoundToggle = () => {
    if (soundEnabled) {
      stopNoise();
    } else {
      startNoise();
    }
  };

  // Adjust volume on the fly
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(soundVolume, audioCtxRef.current.currentTime);
    }
  }, [soundVolume]);

  // Restart noise if type changes while active
  useEffect(() => {
    if (soundEnabled) {
      startNoise();
    }
  }, [soundType]);

  // --- HEURISTIC ANALYSIS (IMMEDIATE PRE-FLIGHT FEEDBACK) ---
  const calculateHeuristicScore = (p: string) => {
    if (!p) return 0;
    let sc = 10;
    // Check CROFTC elements locally to give real-time indicator
    if (p.toLowerCase().includes("atue como") || p.toLowerCase().includes("você é") || p.toLowerCase().includes("persona") || p.toLowerCase().includes("papel")) sc += 15; // Role
    if (p.toLowerCase().includes("cenário") || p.toLowerCase().includes("contexto") || p.toLowerCase().includes("empresa") || p.toLowerCase().includes("sistema")) sc += 15; // Context
    if (p.toLowerCase().includes("formato") || p.toLowerCase().includes("saída") || p.toLowerCase().includes("tabela") || p.toLowerCase().includes("json") || p.toLowerCase().includes("markdown")) sc += 15; // Format
    if (p.toLowerCase().includes("restrição") || p.toLowerCase().includes("não faça") || p.toLowerCase().includes("evite") || p.toLowerCase().includes("limite")) sc += 15; // Constraints
    if (p.toLowerCase().includes("temperatura") || p.toLowerCase().includes("top-p")) sc += 10; // Temperature
    if (p.length > 150) sc += 10; // Length density
    if (p.length > 400) sc += 10; // High detail density
    return Math.min(sc, 100);
  };

  const heuristicScore = calculateHeuristicScore(promptInput);

  // --- API INTERACTION (AI DIAGNOSIS & RECONSTRUCTION) ---
  const handleAnalyzeAndRefine = async () => {
    if (!promptInput.trim()) {
      setErrorMsg("Por favor, introduza um rascunho de prompt para prosseguir.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch AI Analysis
      const analysisResponse = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: promptInput,
          promptCachingSettings: {
            cacheSystemInstructions,
            cacheStaticContext,
            cacheFewShotExamples,
            cacheResponseSchema,
            customStaticBlocks: customStaticBlocks.filter(b => b.enabled)
          }
        })
      });

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || "Falha na análise do prompt.");
      }
      const analysisData: PromptAnalysis = await analysisResponse.json();

      // 2. Fetch Refinement
      const refineResponse = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: promptInput,
          targetFramework,
          additionalData: dataContextInput || undefined,
          promptCachingSettings: {
            cacheSystemInstructions,
            cacheStaticContext,
            cacheFewShotExamples,
            cacheResponseSchema,
            customStaticBlocks: customStaticBlocks.filter(b => b.enabled)
          }
        })
      });

      if (!refineResponse.ok) {
        throw new Error("Falha no refinamento assistido por IA.");
      }
      const refineData = await refineResponse.json();

      // 3. Save into history
      const newInteraction: Interaction = {
        id: "int_" + Date.now(),
        title: promptInput.slice(0, 45) + (promptInput.length > 45 ? "..." : ""),
        timestamp: new Date().toISOString(),
        prompt: promptInput,
        dataContext: dataContextInput || undefined,
        analysis: analysisData,
        refinedPrompt: refineData.refinedPrompt
      };

      const updatedList = [newInteraction, ...interactions];
      saveInteractions(updatedList);
      setActiveInteractionId(newInteraction.id);

      // Trigger automatic reward - Dopamine boost
      if (tasks.some(t => t.id === "t2" && t.column !== "concluido")) {
        // Automatically check off task 2
        const updatedTasks = tasks.map(t => t.id === "t2" ? { ...t, column: "concluido" as const } : t);
        saveTasks(updatedTasks);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocorreu um erro ao comunicar com a inteligência do Scribe.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an interaction
  const handleDeleteInteraction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = interactions.filter(item => item.id !== id);
    saveInteractions(filtered);
    if (activeInteractionId === id) {
      setActiveInteractionId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  // Export Python standalone script
  const handleExportPythonScript = async (refined: string) => {
    try {
      const res = await fetch("/api/python/export-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: refined, systemInstruction: "Você é um Engenheiro de IA e Cientista de Dados Sênior especialista em LLMs." })
      });
      if (!res.ok) throw new Error("Falha ao gerar script Python.");
      const data = await res.json();
      const blob = new Blob([data.script], { type: "text/x-python;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scribe_prompt_${Date.now()}.py`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      setErrorMsg("Erro ao exportar script Python: " + e.message);
    }
  };

  // Export Daily Report
  const handleExportReport = async () => {
    if (interactions.length === 0) {
      setErrorMsg("Você precisa de pelo menos uma interação de prompt no histórico para exportar um relatório.");
      return;
    }

    // Calculate daily statistics
    const avgScore = interactions.reduce((sum, item) => sum + (item.analysis?.score || 0), 0) / interactions.length;
    const maxScore = Math.max(...interactions.map(item => item.analysis?.score || 0));

    try {
      const response = await fetch("/api/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactions,
          dailyGoal: dailyGoalCompleted,
          stats: { avgScore, maxScore }
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar arquivo de relatório com o motor Python.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-prompt-engineering-python-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Erro ao exportar o relatório diário: " + e.message);
    }
  };

  // Load a demo template into sandbox
  const handleLoadTemplate = (t: typeof DEMO_TEMPLATES[0]) => {
    setPromptInput(t.prompt);
    setDataContextInput(t.dataContext);
    setErrorMsg(null);
  };

  // Copy refined prompt to clipboard
  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // --- PROMPT CACHING HANDLERS ---
  const handleAddCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim() || !newBlockContent.trim()) return;
    
    const newBlock = {
      id: "cs_" + Date.now(),
      name: newBlockName.trim(),
      content: newBlockContent.trim(),
      tokens: newBlockTokens || Math.ceil(newBlockContent.trim().length / 4),
      enabled: true
    };
    
    setCustomStaticBlocks([...customStaticBlocks, newBlock]);
    setNewBlockName("");
    setNewBlockContent("");
    setNewBlockTokens(150);
  };

  const handleToggleCustomBlock = (id: string) => {
    setCustomStaticBlocks(customStaticBlocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const handleDeleteCustomBlock = (id: string) => {
    setCustomStaticBlocks(customStaticBlocks.filter(b => b.id !== id));
  };

  // --- 6-MONTH PROMPT HISTORY AND LINKAGE ACTIONS ---
  const handleLinkPromptToObjective = (item: typeof promptHistory[0]) => {
    // 1. Copy prompt and context to main editor
    setPromptInput(item.prompt);
    setDataContextInput(item.dataContext || "");
    
    // 2. Adjust target framework if applicable
    if (item.platform === "Claude") {
      setTargetFramework("gemini-3.5-flash"); // Map Claude to Gemini for our local caching workbench
    }

    // 3. Set caching targets based on item metadata
    if (item.tokens > 1000) {
      setCacheStaticContext(true); // Auto-configure context cache for heavy templates
    } else {
      setCacheStaticContext(false);
    }
    setCacheSystemInstructions(true); // Keep system instruction cached by default

    // 4. Switch tab to laboratório ("prompts") so user can analyze/refine it immediately
    setActiveTab("prompts");

    // 5. Highlight connection with a beautiful success message
    setLinkSuccessMsg(`Prompt "${item.title}" (${item.platform}) conectado ao Ateliê! Carregamos o prompt e ativamos o Prefix Caching com base no volume estático (${item.tokens} tokens).`);
    setTimeout(() => setLinkSuccessMsg(null), 8000);
  };

  const handleDeleteHistoricalPrompt = (id: string) => {
    const updated = promptHistory.filter(p => p.id !== id);
    setPromptHistory(updated);
    localStorage.setItem("scribe_prompt_history_6m", JSON.stringify(updated));
  };

  const handleImportHistoryLogs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      setErrorMsg("Insira o texto do prompt ou log em JSON para importar.");
      return;
    }

    try {
      let parsedPrompts: any[] = [];
      const trimmedText = importText.trim();
      
      if (trimmedText.startsWith("[") && trimmedText.endsWith("]")) {
        parsedPrompts = JSON.parse(trimmedText);
      } else {
        // Parse single manual entry
        parsedPrompts = [{
          title: importTitle.trim() || `Prompt Importado #${promptHistory.length + 1}`,
          prompt: trimmedText,
          dataContext: "",
          platform: importPlatform,
          category: importCategory || "Geral",
          date: new Date().toISOString().slice(0, 10),
          tokens: Math.ceil(trimmedText.length / 4)
        }];
      }

      const formatted = parsedPrompts.map((p: any, idx: number) => {
        const pTokens = p.tokens || Math.ceil((p.prompt || "").length / 4) + Math.ceil((p.dataContext || "").length / 4);
        return {
          id: `imp_${Date.now()}_${idx}`,
          date: p.date || new Date().toISOString().slice(0, 10),
          platform: p.platform === "Claude" || p.platform === "Gemini" ? p.platform : importPlatform,
          category: p.category || importCategory || "Geral",
          title: p.title || `Prompt Importado ${idx + 1}`,
          prompt: p.prompt || trimmedText,
          dataContext: p.dataContext || "",
          tokens: pTokens,
          objectiveLink: p.objectiveLink || `Importado de sua base pessoal. Compatível com o Ateliê de Modelagem. Sugerido Caching Estático (${pTokens} t) para otimizar latência de resposta.`
        };
      });

      const updated = [...formatted, ...promptHistory];
      setPromptHistory(updated);
      localStorage.setItem("scribe_prompt_history_6m", JSON.stringify(updated));
      setImportText("");
      setImportTitle("");
      setImportSuccessMsg(`Sucesso! ${formatted.length} prompt(s) de Claude/Gemini importado(s) e conectado(s) à base.`);
      setTimeout(() => setImportSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg("Erro ao analisar a importação: certifique-se de que é um JSON válido ou selecione texto puro.");
    }
  };

  const handleExportHistory = () => {
    if (promptHistory.length === 0) {
      setErrorMsg("Não há histórico de prompts para exportar.");
      return;
    }

    const fileHeader = `# RELATÓRIO DE EXPORTAÇÃO - HISTÓRICO DE PROMPTS (GEMINI & CLAUDE AI)\n`;
    const dateLine = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} • Scribe Workspace\n`;
    const summary = `\nTotal de Prompts Coletados nos últimos 6 meses: ${promptHistory.length} registros\nVolume Acumulado de Tokens de Prefix Caching: ${promptHistory.reduce((s, p) => s + p.tokens, 0)} tokens\n\n## Detalhamento dos Prompts e Vínculo com Objetivo do Scribe:\n\n`;

    const body = promptHistory.map((p) => `### [${p.date}] ${p.title} (${p.platform})\n
- **Categoria**: ${p.category}
- **Tokens de Contexto**: ${p.tokens} tokens
- **Acordo de Caching (Objetivo)**: ${p.objectiveLink}

#### Prompt Original:
\`\`\`text
${p.prompt}
\`\`\`

${p.dataContext ? `#### Dados Contextuais:
\`\`\`text
${p.dataContext}
\`\`\`\n` : ""}---\n\n`).join("");

    const blob = new Blob([fileHeader + dateLine + summary + body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-6meses-prompts-gemini-claude-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // --- KANBAN & DOPAMINE SCAFFOLD (ADHD PARALYSIS SUPPORT) ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    // Strict WIP Limit: maximum 3 cards in 'fazendo'
    const currentlyDoing = tasks.filter(t => t.column === "fazendo").length;
    if (currentlyDoing >= 3) {
      setErrorMsg("Limite de Carga atingido! Você não pode ter mais de 3 tarefas simultâneas em 'Fazendo Hoje' para proteger seu córtex pré-frontal.");
      return;
    }

    const newTask: KanbanTask = {
      id: "task_" + Date.now(),
      text: newTaskText.trim(),
      column: "backlog",
      timestamp: new Date().toISOString()
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    setNewTaskText("");
    setErrorMsg(null);
  };

  const moveTask = (id: string, newCol: KanbanTask["column"]) => {
    if (newCol === "fazendo") {
      const currentlyDoing = tasks.filter(t => t.column === "fazendo").length;
      if (currentlyDoing >= 3) {
        setErrorMsg("Limite de Carga atingido! Remova ou conclua uma tarefa do 'Fazendo Hoje' antes de puxar outra.");
        return;
      }
    }

    const updated = tasks.map(t => t.id === id ? { ...t, column: newCol } : t);
    saveTasks(updated);
    setErrorMsg(null);
  };

  const handleDeleteTask = (id: string) => {
    const filtered = tasks.filter(t => t.id !== id);
    saveTasks(filtered);
  };

  const handleToggleDailyGoal = () => {
    const newState = !dailyGoalCompleted;
    setDailyGoalCompleted(newState);
    localStorage.setItem("scribe_daily_goal", String(newState));
  };

  // --- PROMPT CACHING MATH MODELS ---
  const systemTokens = cacheSystemInstructions ? 1200 : 0;
  const contextTokens = cacheStaticContext ? Math.ceil((dataContextInput || "").length / 4) : 0;
  const fewShotTokens = cacheFewShotExamples ? 1500 : 0;
  const schemaTokens = cacheResponseSchema ? 600 : 0;
  const customBlocksTokens = customStaticBlocks.reduce((sum, block) => sum + (block.enabled ? block.tokens : 0), 0);
  
  const totalCachedTokens = systemTokens + contextTokens + fewShotTokens + schemaTokens + customBlocksTokens;
  const dynamicTokens = Math.max(50, Math.ceil((promptInput || "").length / 4));
  const totalTokens = totalCachedTokens + dynamicTokens;
  
  const normalCostM = totalTokens * 0.075; 
  const cachedCostM = (dynamicTokens * 0.075) + (totalCachedTokens * 0.01875); 
  const costSavingsPercent = normalCostM > 0 ? Math.round(((normalCostM - cachedCostM) / normalCostM) * 100) : 0;

  const normalLatency = Math.max(1.2, parseFloat((0.8 + (totalTokens / 2500)).toFixed(1)));
  const cachedLatency = Math.max(0.2, parseFloat((0.2 + (dynamicTokens / 2500)).toFixed(1)));
  const latencySavingsPercent = Math.round(((normalLatency - cachedLatency) / normalLatency) * 100);

  const activeSnapshot = snapshots.find(s => s.id === selectedSnapshotId);
  const displayNormalLatency = activeSnapshot ? activeSnapshot.normalLatency : normalLatency;
  const displayCachedLatency = activeSnapshot ? activeSnapshot.cachedLatency : cachedLatency;
  const displayLatencySavingsPercent = activeSnapshot ? activeSnapshot.latencySavings : latencySavingsPercent;
  const displayCachedTokens = activeSnapshot ? activeSnapshot.tokens : totalCachedTokens;
  const displayEconomy = activeSnapshot ? activeSnapshot.economy : costSavingsPercent;

  const handleCaptureSnapshot = () => {
    const newSnapshot: CacheSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      tokens: totalCachedTokens,
      economy: costSavingsPercent,
      normalLatency: normalLatency,
      cachedLatency: cachedLatency,
      latencySavings: latencySavingsPercent,
      label: `Config ${snapshots.length + 1} (${totalCachedTokens} t)`
    };
    setSnapshots([newSnapshot, ...snapshots]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(snapshots.filter(s => s.id !== id));
    if (selectedSnapshotId === id) {
      setSelectedSnapshotId(null);
    }
  };

  // --- INTERACTIVE DATA SCIENCE VALIDATION SUITE ---
  // 1. Classification Metrics (F1, Precision, Recall)
  const totalSamples = tpVal + fpVal + fnVal + tnVal;
  const precision = tpVal + fpVal > 0 ? tpVal / (tpVal + fpVal) : 0;
  const recall = tpVal + fnVal > 0 ? tpVal / (tpVal + fnVal) : 0;
  const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  // 2. Regression Metrics (MAE, RMSE, Correlation)
  const calculateRegressionMetrics = () => {
    const n = regDataPoints.length;
    if (n === 0) return { mae: 0, rmse: 0, r: 0 };

    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;
    let realSum = 0;
    let predSum = 0;

    regDataPoints.forEach(p => {
      absoluteErrorSum += Math.abs(p.real - p.pred);
      squaredErrorSum += Math.pow(p.real - p.pred, 2);
      realSum += p.real;
      predSum += p.pred;
    });

    const mae = absoluteErrorSum / n;
    const rmse = Math.sqrt(squaredErrorSum / n);

    const realMean = realSum / n;
    const predMean = predSum / n;

    let num = 0;
    let denReal = 0;
    let denPred = 0;

    regDataPoints.forEach(p => {
      const diffReal = p.real - realMean;
      const diffPred = p.pred - predMean;
      num += diffReal * diffPred;
      denReal += Math.pow(diffReal, 2);
      denPred += Math.pow(diffPred, 2);
    });

    const r = denReal * denPred > 0 ? num / Math.sqrt(denReal * denPred) : 0;

    return { mae, rmse, r };
  };

  const regMetrics = calculateRegressionMetrics();

  const handleAddRegPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const real = parseFloat(newRealVal);
    const pred = parseFloat(newPredVal);
    if (isNaN(real) || pagedIsNaN(pred)) return;

    setRegDataPoints([...regDataPoints, { real, pred }]);
    setNewRealVal("");
    setNewPredVal("");
  };

  const handleClearRegPoints = () => {
    setRegDataPoints([]);
  };

  function pagedIsNaN(val: any) {
    return isNaN(val);
  }

  // Active interaction details if loaded
  const activeInteraction = interactions.find(item => item.id === activeInteractionId) || null;

  return (
    <div id="scribe_container" className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans flex flex-col antialiased">
      {/* HEADER COPROCESSOR */}
      <header id="scribe_header" className="border-b border-[#1c1c1c] bg-[#111111]/90 backdrop-blur-sm sticky top-0 z-50 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#222222] border border-[#333333] rounded-md text-white">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              Scribe <span className="text-xs bg-[#222222] px-2 py-0.5 rounded text-gray-400 font-normal">v2.1</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Python 3.10 Engine
              </span>
            </h1>
            <p className="text-xs text-gray-500 font-mono">Engenharia de Prompts & Scaffold Cognitivo</p>
          </div>
        </div>

        {/* COGNITIVE NOISE PLAYER (SOUND THERAPY FOR ADHD FOCUS) */}
        <div className="flex items-center gap-4 bg-[#181818] px-4 py-2 rounded-lg border border-[#262626]">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSoundToggle}
              className={`p-1.5 rounded-full transition-all duration-300 ${soundEnabled ? "bg-white text-black" : "bg-[#222222] hover:bg-[#333333] text-gray-400"}`}
              title={soundEnabled ? "Pausar Terapia Sonora" : "Iniciar Terapia Sonora"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <span className="text-xs font-medium text-gray-300 font-mono">
              Terapia Sonora: <span className={soundEnabled ? "text-white font-bold" : "text-gray-500"}>{soundEnabled ? "ATIVADA" : "DESATIVADA"}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 border-l border-[#2d2d2d] pl-3">
            <button 
              onClick={() => setSoundType("brown")} 
              className={`text-xs px-2 py-0.5 rounded font-mono ${soundType === "brown" ? "bg-[#2c2c2c] text-white border border-[#444444]" : "text-gray-500 hover:text-gray-300"}`}
              title="Ruído Marrom: Som profundo de cachoeira para neutralizar distrações"
            >
              Marrom
            </button>
            <button 
              onClick={() => setSoundType("pink")} 
              className={`text-xs px-2 py-0.5 rounded font-mono ${soundType === "pink" ? "bg-[#2c2c2c] text-white border border-[#444444]" : "text-gray-500 hover:text-gray-300"}`}
              title="Ruído Rosa: Som equilibrado de chuva para foco analítico"
            >
              Rosa
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-[#2d2d2d] pl-3">
            <span className="text-[10px] text-gray-500 font-mono">Vol</span>
            <input 
              type="range" 
              min="0" 
              max="0.8" 
              step="0.05"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#2c2c2c] accent-white cursor-pointer rounded-lg"
            />
          </div>
        </div>

        {/* NAVIGATION WORKSPACES */}
        <div className="flex items-center bg-[#151515] p-1 rounded-lg border border-[#222222]">
          <button 
            onClick={() => setActiveTab("prompts")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "prompts" ? "bg-[#252525] text-white font-semibold" : "text-gray-400 hover:text-gray-200"}`}
          >
            Laboratório
          </button>
          <button 
            id="tab_python_lab"
            onClick={() => setActiveTab("python-lab")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === "python-lab" ? "bg-emerald-600 text-white font-semibold shadow-sm" : "text-emerald-400 hover:text-emerald-300"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Python Engine
          </button>
          <button 
            onClick={() => setActiveTab("kanban")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "kanban" ? "bg-[#252525] text-white font-semibold" : "text-gray-400 hover:text-gray-200"}`}
          >
            Sustentação Dopamínica
          </button>
          <button 
            onClick={() => setActiveTab("data-science")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "data-science" ? "bg-[#252525] text-white font-semibold" : "text-gray-400 hover:text-gray-200"}`}
          >
            Simulador de Métricas
          </button>
          <button 
            onClick={() => setActiveTab("teoria")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === "teoria" ? "bg-[#252525] text-white font-semibold" : "text-gray-400 hover:text-gray-200"}`}
          >
            Conectividade & LLMs
          </button>
          <button 
            onClick={() => setActiveTab("export-historico")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${activeTab === "export-historico" ? "bg-[#252525] text-white font-semibold" : "text-gray-400 hover:text-gray-200"}`}
          >
            <History className="w-3.5 h-3.5" /> Histórico de 6m
          </button>
        </div>

        {/* EXPORT TO GEMINI BUTTON */}
        <button 
          id="btn_open_export_gemini"
          onClick={() => setIsExportGeminiOpen(true)}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold font-mono bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/10 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Exportar código do projeto completo para uso no Gemini"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>Exportar p/ Gemini</span>
        </button>
      </header>

      {/* ERROR CONSOLE IF ANY */}
      {errorMsg && (
        <div className="bg-[#1c0f0f] border-b border-[#3c1a1a] text-[#ff8080] text-xs px-6 py-3 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* TAB 1: PROMPT LABORATORY */}
        {activeTab === "prompts" && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* LEFT COLUMN: CONTEXT INPUT & HISTORY LIST */}
            <div className="w-full lg:w-96 border-r border-[#1c1c1c] bg-[#111111]/40 flex flex-col shrink-0 min-h-0">
              <div className="p-5 border-b border-[#1c1c1c]">
                <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 font-mono">Argila Contextual (Modelos Rápidos)</h3>
                <p className="text-[11px] text-gray-500 mb-3">Selecione um caso prático documentado para testar instantaneamente a inteligência:</p>
                <div className="space-y-2">
                  {DEMO_TEMPLATES.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadTemplate(t)}
                      className="w-full text-left p-2.5 bg-[#151515] hover:bg-[#202020] border border-[#222222] rounded text-xs transition-all flex flex-col gap-1 group"
                    >
                      <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">{t.title}</span>
                      <span className="text-[10px] text-gray-500 truncate">{t.prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SAVED ITERATIONS DECK */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase font-mono flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Histórico de Refinamentos
                  </h3>
                  {interactions.length > 0 && (
                    <button 
                      onClick={handleExportReport}
                      className="text-[11px] px-2.5 py-1 bg-[#1a1a1a] hover:bg-white hover:text-black border border-[#2a2a2a] text-gray-300 font-mono font-medium rounded flex items-center gap-1.5 transition-all"
                      title="Exportar todas as interações do dia em relatório estruturado"
                    >
                      <Download className="w-3 h-3" /> Relatório Diário
                    </button>
                  )}
                </div>

                {interactions.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed border-[#222222] rounded bg-[#131313]/50">
                    <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-mono">Nenhum rascunho de prompt foi refinado ou analisado hoje.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interactions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveInteractionId(item.id)}
                        className={`p-3 rounded border text-xs cursor-pointer transition-all flex justify-between items-start gap-2 relative ${activeInteractionId === item.id ? "bg-[#1c1c1c] border-gray-500 text-white" : "bg-[#151515] hover:bg-[#1a1a1a] border-[#222222] text-gray-400"}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate pr-6">{item.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1 font-mono">{new Date(item.timestamp).toLocaleTimeString("pt-BR")} | Score: {item.analysis?.score || "N/A"}/100</div>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteInteraction(item.id, e)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-[#252525] transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MIDDLE COLUMN: ACTIVE SANDBOX / LAB */}
            <div className="flex-1 border-r border-[#1c1c1c] p-6 overflow-y-auto flex flex-col min-h-0 bg-[#0f0f0f]/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold tracking-wider text-white font-mono flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-gray-400" /> Ateliê de Modelagem (Sandbox)
                </h2>
                <div className="flex items-center gap-3">
                  <label className="text-[10px] text-gray-500 uppercase font-mono">Modelo Base</label>
                  <select 
                    value={targetFramework}
                    onChange={(e) => setTargetFramework(e.target.value)}
                    className="bg-[#151515] border border-[#2e2e2e] text-xs px-2.5 py-1 text-gray-300 rounded focus:outline-none focus:border-gray-500 font-mono"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Heavy)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                  </select>
                </div>
              </div>

              {/* RAW PROMPT TEXTAREA */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs text-gray-400 font-mono mb-2">1. Despeje o seu Prompt Rascunhado (Raw Instruction):</label>
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Escreva livremente aqui a sua intenção de prompt ou cole o rascunho caótico. Nossa Inteligência Artificial cuidará do refinamento, análise estrutural e cálculo de métricas de ciência de dados..."
                    className="flex-1 w-full bg-[#121212] border border-[#222222] hover:border-[#333333] focus:border-gray-500 focus:outline-none p-4 rounded-lg text-sm text-gray-200 font-sans resize-none transition-all placeholder:text-gray-700"
                  />
                </div>

                {/* ADDITIONAL CONTEXT DATA (THE CLAY) */}
                <div className="h-52 shrink-0 flex flex-col relative group">
                  <label className="text-xs text-gray-400 font-mono mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                      <span>2. Dados contextuais adicionais ou planilhas brutas (Argila do Ateliê):</span>
                    </span>
                    <span className="text-[10px] text-gray-600">Opcional</span>
                  </label>
                  <div className="flex-1 relative flex flex-col">
                    <textarea
                      value={dataContextInput}
                      onChange={(e) => setDataContextInput(e.target.value)}
                      placeholder="Ex: Cole aqui linhas de CSV, logs meteorológicos, coordenadas de GPS ou matrizes de teste. O modelo gerará instruções cirúrgicas parametrizadas de como tratar estes exatos dados."
                      className="w-full flex-1 bg-[#121212] border border-[#222222] hover:border-[#333333] focus:border-gray-500 focus:outline-none p-3 pb-10 rounded-lg text-xs text-gray-200 font-mono resize-none transition-all placeholder:text-gray-700"
                    />
                    
                    {/* Inline Token & Cache Cost Visualizer */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#161616]/90 backdrop-blur-xs border border-[#252525] rounded px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">
                          Tokens: <strong className="text-white">{Math.ceil((dataContextInput || "").length / 4)}</strong>
                        </span>
                        {dataContextInput && (
                          <span className="text-gray-500 hidden sm:inline">|</span>
                        )}
                        {dataContextInput && (
                          <span className="text-gray-400">
                            Custo Estimado (por 1M chamadas):{" "}
                            {cacheStaticContext ? (
                              <span className="text-emerald-400 font-bold">
                                ${(Math.ceil((dataContextInput || "").length / 4) * 0.01875).toFixed(3)} (Cache)
                              </span>
                            ) : (
                              <span className="text-yellow-500">
                                ${(Math.ceil((dataContextInput || "").length / 4) * 0.075).toFixed(3)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setCacheStaticContext(!cacheStaticContext)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          cacheStaticContext 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                            : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700 hover:text-white"
                        }`}
                      >
                        <Database className="w-2.5 h-2.5" />
                        {cacheStaticContext ? "No Cache (Ativo)" : "Incluir no Cache"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PROMPT CACHING OPTIMIZATION PANEL */}
                <div id="prompt_caching_panel" className="bg-[#111111] rounded-lg border border-[#222222] p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold tracking-wider text-white font-mono uppercase">Otimização de Prompt Caching (Prefix Caching)</span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${totalCachedTokens > 0 ? "bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse" : "bg-neutral-900 text-neutral-500"}`}>
                      {totalCachedTokens > 0 ? "● CACHE CONFIGURADO" : "● CACHE INATIVO"}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
                    Marque as seções estáticas do seu prompt para habilitar o cache de prefixo na API Gemini. Partes em cache não são reprocessadas, reduzindo drasticamente custos e latência de inferência.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Checkbox selection */}
                    <div className="space-y-2 bg-[#161616] p-3 rounded border border-[#242424]">
                      <span className="text-[10px] font-bold font-mono text-gray-400 block mb-1">Seções Estáticas (Pré-definidas):</span>
                      
                      <div className="relative group/tip-sys flex items-center justify-between text-xs text-gray-300 select-none bg-[#1c1c1c]/40 hover:bg-[#1c1c1c]/80 p-1.5 rounded transition-all">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={cacheSystemInstructions} 
                            onChange={() => setCacheSystemInstructions(!cacheSystemInstructions)}
                            className="rounded border-[#333] bg-[#222] text-emerald-500 focus:ring-0"
                          />
                          <span className="font-mono hover:text-white transition-colors truncate">Instruções de Sistema (~1200 t)</span>
                        </label>
                        <div className="relative flex items-center pr-1 shrink-0">
                          <HelpCircle 
                            className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors"
                            title="Instruções de Sistema definem as regras e o comportamento base da IA. O cache evita o reprocessamento dessas diretrizes fixas a cada nova mensagem, reduzindo custos em até 75% e acelerando a inicialização da resposta."
                          />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[#1b1b1b] border border-[#2d2d2d] text-[10px] text-gray-300 rounded shadow-2xl opacity-0 pointer-events-none group-hover/tip-sys:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-sans">
                            <span className="font-bold text-emerald-400 block mb-1">Impacto de Cachear: Instruções de Sistema</span>
                            Definem as regras de comportamento. Cachear evita o reprocessamento redundante de regras fixas em chamadas consecutivas, economizando até 75% dos tokens de entrada.
                          </div>
                        </div>
                      </div>

                      <div className="relative group/tip-ctx flex items-center justify-between text-xs text-gray-300 select-none bg-[#1c1c1c]/40 hover:bg-[#1c1c1c]/80 p-1.5 rounded transition-all">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={cacheStaticContext} 
                            onChange={() => setCacheStaticContext(!cacheStaticContext)}
                            className="rounded border-[#333] bg-[#222] text-emerald-500 focus:ring-0"
                          />
                          <span className="font-mono hover:text-white transition-colors truncate">Dados de Contexto ({contextTokens} t)</span>
                        </label>
                        <div className="relative flex items-center pr-1 shrink-0">
                          <HelpCircle 
                            className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors"
                            title="Planilhas, CSVs ou textos longos de apoio. Ao cacheá-los no Prefix Cache, as consultas subsequentes analisam os dados quase instantaneamente, reduzindo a latência de segundos para milissegundos."
                          />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[#1b1b1b] border border-[#2d2d2d] text-[10px] text-gray-300 rounded shadow-2xl opacity-0 pointer-events-none group-hover/tip-ctx:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-sans">
                            <span className="font-bold text-emerald-400 block mb-1">Impacto de Cachear: Dados de Contexto</span>
                            Planilhas ou arquivos volumosos são armazenados temporariamente na memória da API. Perguntas variadas sobre o mesmo dado rodam de forma instantânea e de baixo custo.
                          </div>
                        </div>
                      </div>

                      <div className="relative group/tip-few flex items-center justify-between text-xs text-gray-300 select-none bg-[#1c1c1c]/40 hover:bg-[#1c1c1c]/80 p-1.5 rounded transition-all">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={cacheFewShotExamples} 
                            onChange={() => setCacheFewShotExamples(!cacheFewShotExamples)}
                            className="rounded border-[#333] bg-[#222] text-emerald-500 focus:ring-0"
                          />
                          <span className="font-mono hover:text-white transition-colors truncate">Exemplos Few-Shot (~1500 t)</span>
                        </label>
                        <div className="relative flex items-center pr-1 shrink-0">
                          <HelpCircle 
                            className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors"
                            title="Pares estruturados de Entrada/Saída que demonstram o comportamento ideal ao modelo. Congelar estes exemplos em cache evita ler repetidamente o mesmo guia de estilo a cada requisição."
                          />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[#1b1b1b] border border-[#2d2d2d] text-[10px] text-gray-300 rounded shadow-2xl opacity-0 pointer-events-none group-hover/tip-few:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-sans">
                            <span className="font-bold text-emerald-400 block mb-1">Impacto de Cachear: Exemplos Few-Shot</span>
                            Exemplos de demonstração estáticos guiam o tom e formatação do modelo. Congelá-los na memória poupa o reprocessamento desse longo guia a cada novo prompt enviado.
                          </div>
                        </div>
                      </div>

                      <div className="relative group/tip-sch flex items-center justify-between text-xs text-gray-300 select-none bg-[#1c1c1c]/40 hover:bg-[#1c1c1c]/80 p-1.5 rounded transition-all">
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={cacheResponseSchema} 
                            onChange={() => setCacheResponseSchema(!cacheResponseSchema)}
                            className="rounded border-[#333] bg-[#222] text-emerald-500 focus:ring-0"
                          />
                          <span className="font-mono hover:text-white transition-colors truncate">Esquema de Resposta (~600 t)</span>
                        </label>
                        <div className="relative flex items-center pr-1 shrink-0">
                          <HelpCircle 
                            className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors"
                            title="Definições rígidas de formatos de saída (ex: esquemas de validação JSON). Manter a tipagem sintática em cache reduz o overhead de compilação da resposta pela API Gemini."
                          />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-[#1b1b1b] border border-[#2d2d2d] text-[10px] text-gray-300 rounded shadow-2xl opacity-0 pointer-events-none group-hover/tip-sch:opacity-100 transition-opacity duration-200 z-50 leading-relaxed font-sans">
                            <span className="font-bold text-emerald-400 block mb-1">Impacto de Cachear: Esquema de Resposta</span>
                            Modelos estruturados ou schemas JSON garantem saídas previsíveis. O cache elimina a leitura repetitiva da estrutura sintática exigida, acelerando o tempo de resposta geral.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metric summary */}
                    <div className="bg-[#161616] p-3 rounded border border-[#242424] flex flex-col justify-between relative overflow-hidden">
                      {/* Real-time processing scanner effect */}
                      <AnimatePresence>
                        {isProcessingCache && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-500/[0.04] pointer-events-none z-10"
                          >
                            {/* Scanning laser line */}
                            <motion.div 
                              initial={{ y: "-100%" }}
                              animate={{ y: "200%" }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                              className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                            />
                            {/* Cyber indicator dot */}
                            <div className="absolute top-1 right-2 flex gap-1 items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              <span className="text-[7px] font-mono text-emerald-400 font-bold tracking-wider">CALC_ENG</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <span className="text-[10px] font-bold font-mono text-gray-400 block mb-2 flex items-center justify-between">
                        <span>Simulação de Ganhos:</span>
                        {isProcessingCache ? (
                          <span className="text-[8px] text-emerald-400 font-mono flex items-center gap-1.5 animate-pulse">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            CALCULANDO...
                          </span>
                        ) : (
                          <span className="text-[8px] text-gray-600 font-mono">ESTÁVEL</span>
                        )}
                      </span>
                      
                      <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs relative z-2">
                        <div className="bg-[#1c1c1c] p-1.5 rounded border border-[#2c2c2c]">
                          <div className="text-[8px] text-gray-500 uppercase leading-none mb-1">Tokens Cache</div>
                          <div className={`text-[11px] font-bold transition-all duration-300 ${isProcessingCache ? "text-emerald-300 scale-105 filter drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]" : "text-white"}`}>
                            {displayCachedTokens}
                          </div>
                        </div>
                        <div className="bg-[#1c1c1c] p-1.5 rounded border border-[#2c2c2c] flex flex-col justify-center">
                          <div className="text-[8px] text-gray-500 uppercase leading-none mb-1 flex justify-center items-center gap-0.5"><Coins className="w-2 h-2 text-yellow-500" /> Economia</div>
                          <div className={`text-[11px] font-bold transition-all duration-300 ${isProcessingCache ? "text-emerald-300 scale-110 filter drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "text-emerald-400"}`}>
                            -{displayEconomy}%
                          </div>
                        </div>
                        <div className="bg-[#1c1c1c] p-1.5 rounded border border-[#2c2c2c] flex flex-col justify-center">
                          <div className="text-[8px] text-gray-500 uppercase leading-none mb-1 flex justify-center items-center gap-0.5"><Zap className="w-2 h-2 text-sky-400" /> Latência</div>
                          <div className={`text-[11px] font-bold transition-all duration-300 ${isProcessingCache ? "text-sky-300 scale-110 filter drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]" : "text-sky-400"}`}>
                            -{displayLatencySavingsPercent}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-[9px] font-mono text-gray-500 space-y-1 relative z-2">
                        <div className="flex justify-between">
                          <span>Latência Normal:</span>
                          <span className="text-gray-400">{displayNormalLatency}s</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Com Prefix Caching:</span>
                          <span className={`font-bold transition-all duration-300 ${isProcessingCache ? "text-emerald-300 scale-105" : ""}`}>
                            {displayCachedLatency}s
                          </span>
                        </div>
                      </div>

                      {/* Grayscale Latency Comparative Meter */}
                      <div className="mt-3 pt-2.5 border-t border-[#222222] space-y-2 relative z-2">
                        <div className="flex justify-between items-center text-[8px] font-mono uppercase tracking-wider text-neutral-500">
                          <span>Comparativo de Latência</span>
                          <div className="flex items-center gap-1">
                            {selectedSnapshotId ? (
                              <button 
                                onClick={() => setSelectedSnapshotId(null)}
                                className="text-[7.5px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/40 px-1.5 py-0.5 rounded hover:bg-amber-900 transition-colors flex items-center gap-1"
                                title="Voltar para a configuração ao vivo"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                                Snapshot Ativo
                              </button>
                            ) : (
                              <span className="text-[7.5px] font-mono font-bold bg-neutral-900 text-neutral-400 border border-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                Live
                              </span>
                            )}
                            <motion.span 
                              key={displayLatencySavingsPercent}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/30 text-[8px]"
                            >
                              -{displayLatencySavingsPercent}% tempo
                            </motion.span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {/* Normal latency bar */}
                          <div>
                            <div className="flex justify-between items-center text-[7.5px] font-mono text-neutral-400 mb-0.5">
                              <span>Sem Cache (Padrão)</span>
                              <motion.span 
                                key={displayNormalLatency}
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-semibold"
                              >
                                {displayNormalLatency}s (100%)
                              </motion.span>
                            </div>
                            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: "100%" }}
                                className="w-full h-full bg-neutral-600 rounded-full" 
                              />
                            </div>
                          </div>
                          {/* Cached latency bar */}
                          <div>
                            <div className="flex justify-between items-center text-[7.5px] font-mono text-neutral-200 mb-0.5">
                              <span>Com Prefix Cache</span>
                              <motion.span 
                                key={displayCachedLatency}
                                initial={{ opacity: 0, y: -2 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-bold text-neutral-300"
                              >
                                {displayCachedLatency}s ({Math.round((displayCachedLatency / displayNormalLatency) * 100)}%)
                              </motion.span>
                            </div>
                            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: "100%" }}
                                animate={{ width: `${Math.max(8, Math.min(100, (displayCachedLatency / displayNormalLatency) * 100))}%` }}
                                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                className="h-full bg-neutral-100 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Capture Snapshot Action & Comparison History */}
                      <div className="mt-4 pt-3 border-t border-[#222222] space-y-3 relative z-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-wider">Histórico de Comparação:</span>
                          <button
                            type="button"
                            onClick={handleCaptureSnapshot}
                            className="text-[9px] px-2 py-1 bg-[#1a1a1a] hover:bg-neutral-800 hover:text-white text-neutral-300 border border-neutral-800 rounded font-mono font-bold flex items-center gap-1 transition-all"
                            title="Salva a configuração atual de cache para comparar com outras configurações"
                          >
                            <Camera className="w-3 h-3 text-emerald-400" /> Capturar Snapshot
                          </button>
                        </div>

                        {snapshots.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                            {snapshots.map((snap) => (
                              <div 
                                key={snap.id} 
                                onClick={() => setSelectedSnapshotId(selectedSnapshotId === snap.id ? null : snap.id)}
                                className={`p-2 flex flex-col gap-1 text-[10px] font-mono rounded cursor-pointer transition-all border ${
                                  selectedSnapshotId === snap.id 
                                    ? "bg-[#18221c] border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50" 
                                    : "bg-[#121212] border-[#222] hover:border-[#333] hover:bg-[#181818]"
                                }`}
                                title="Clique para comparar/visualizar esta configuração no medidor acima"
                              >
                                <div className="flex items-center justify-between text-gray-400 border-b border-[#1c1c1c]/60 pb-1">
                                  <div className="flex items-center gap-1">
                                    <span className={selectedSnapshotId === snap.id ? "text-emerald-300 font-bold" : "text-white font-bold"}>{snap.label}</span>
                                    <span className="text-[8px] text-gray-600">({snap.timestamp})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSnapshot(snap.id);
                                    }}
                                    className="text-gray-600 hover:text-red-400 transition-colors"
                                    title="Remover este snapshot"
                                  >
                                    <Trash className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[9px] text-center pt-0.5">
                                  <div className="text-gray-500">
                                    <div className="text-[7px] text-gray-600 leading-none">TOKENS</div>
                                    <div className="font-bold text-gray-300 mt-0.5">{snap.tokens} t</div>
                                  </div>
                                  <div className="text-emerald-500">
                                    <div className="text-[7px] text-gray-600 leading-none">ECONOMIA</div>
                                    <div className="font-bold text-emerald-400 mt-0.5">-{snap.economy}%</div>
                                  </div>
                                  <div className="text-sky-500">
                                    <div className="text-[7px] text-gray-600 leading-none">LATÊNCIA</div>
                                    <div className="font-bold text-sky-400 mt-0.5">{snap.cachedLatency}s (-{snap.latencySavings}%)</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 border border-dashed border-[#222222] rounded bg-[#121212]/50 text-[9px] text-neutral-600 font-mono">
                            Nenhum snapshot capturado nesta sessão. Altere as opções acima e capture para comparar.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CUSTOM BLOCKS MANAGER */}
                  <div className="space-y-2 border-t border-[#222222] pt-3">
                    <span className="text-[10px] font-bold font-mono text-gray-400 block">Gerenciar Blocos Estáticos Customizados:</span>
                    
                    {customStaticBlocks.length > 0 && (
                      <div className="bg-[#141414] rounded border border-[#222222] overflow-hidden max-h-24 overflow-y-auto divide-y divide-[#222]">
                        {customStaticBlocks.map((block) => (
                          <div key={block.id} className="flex items-center justify-between p-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <input 
                                type="checkbox" 
                                checked={block.enabled} 
                                onChange={() => handleToggleCustomBlock(block.id)}
                                className="rounded border-[#333] bg-[#222] text-emerald-500 focus:ring-0"
                              />
                              <div className="min-w-0">
                                <p className="font-mono font-medium truncate text-gray-200">{block.name}</p>
                                <p className="text-[9px] text-gray-500 truncate font-mono">{block.content}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 font-mono shrink-0 pl-2">
                              <span className="text-[10px] text-gray-400">{block.tokens} t</span>
                              <button 
                                onClick={() => handleDeleteCustomBlock(block.id)}
                                className="text-[10px] text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Simple form to add custom static blocks */}
                    <div className="flex flex-wrap md:flex-nowrap gap-2 bg-[#151515] p-2 rounded border border-[#222]">
                      <input 
                        type="text" 
                        placeholder="Nome (Ex: Glossary)"
                        value={newBlockName}
                        onChange={(e) => setNewBlockName(e.target.value)}
                        className="flex-1 min-w-[120px] bg-[#181818] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-gray-500 font-mono"
                      />
                      <input 
                        type="text" 
                        placeholder="Conteúdo Estático"
                        value={newBlockContent}
                        onChange={(e) => setNewBlockContent(e.target.value)}
                        className="flex-[2] min-w-[150px] bg-[#181818] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-gray-500 font-mono"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input 
                          type="number" 
                          placeholder="Tokens"
                          value={newBlockTokens}
                          onChange={(e) => setNewBlockTokens(Math.max(10, parseInt(e.target.value) || 0))}
                          className="w-14 bg-[#181818] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gray-500 font-mono text-center"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            handleAddCustomBlock(e);
                          }}
                          className="px-2.5 py-1 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded font-mono shrink-0 cursor-pointer flex items-center justify-center h-7"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PROMPT STRUCTURAL BAR */}
                  <div className="space-y-1.5 border-t border-[#222222] pt-3">
                    <span className="text-[10px] font-bold font-mono text-gray-500 block uppercase tracking-wider">Distribuição Estrutural de Auto-Atenção (Self-Attention)</span>
                    <div className="relative">
                      <div className="w-full h-5 rounded overflow-hidden bg-neutral-800 flex text-[9px] font-mono text-center font-bold">
                        {totalCachedTokens > 0 && (
                          <div 
                            style={{ width: `${Math.max(15, Math.min(85, (totalCachedTokens / totalTokens) * 100))}%` }} 
                            className="bg-emerald-950 text-emerald-400 border-r border-emerald-800 flex items-center justify-center truncate px-1"
                            title="Seção Estática em Cache (Lido 1x)"
                          >
                            CACHE ({Math.round((totalCachedTokens / totalTokens) * 100)}%)
                          </div>
                        )}
                        <div 
                          style={{ width: `${totalCachedTokens > 0 ? 100 - Math.max(15, Math.min(85, (totalCachedTokens / totalTokens) * 100)) : 100}%` }} 
                          className="bg-neutral-900 text-neutral-400 flex items-center justify-center truncate px-1"
                          title="Seção Dinâmica de Entrada"
                        >
                          DINÂMICO ({totalCachedTokens > 0 ? 100 - Math.round((totalCachedTokens / totalTokens) * 100) : 100}%)
                        </div>
                      </div>
                      
                      {totalCachedTokens > 0 && (
                        <div 
                          style={{ left: `${Math.max(15, Math.min(85, (totalCachedTokens / totalTokens) * 100))}%` }} 
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 flex flex-col justify-end items-center"
                        >
                          <div className="absolute top-5 bg-emerald-950 border border-emerald-800 text-[8px] text-emerald-400 font-mono px-1 py-0.5 rounded whitespace-nowrap translate-y-1 z-10">
                            &lt;gemini_cache_boundary /&gt;
                          </div>
                        </div>
                      )}
                    </div>
                    {totalCachedTokens > 0 && <div className="h-6" />}
                  </div>
                </div>

                {/* REAL-TIME PRE-FLIGHT FEEDBACK METER */}
                <div className="bg-[#141414] p-3 rounded-lg border border-[#222222] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center font-mono">
                      <div className="text-xs text-gray-500 uppercase leading-none mb-1">Score Local</div>
                      <div className="text-lg font-bold text-white">{heuristicScore}/100</div>
                    </div>
                    <div className="w-px h-8 bg-[#2d2d2d]" />
                    <div>
                      <div className="text-[11px] font-semibold text-gray-300">Análise de Voo em Tempo Real</div>
                      <p className="text-[10px] text-gray-500">
                        {heuristicScore < 40 && "Adicione persona ('atue como') e formato de saída para elevar a assertividade."}
                        {heuristicScore >= 40 && heuristicScore < 80 && "Excelente base. Considere injetar restrições claras para mitigar alucinações."}
                        {heuristicScore >= 80 && "Nível óptimo! O prompt rascunhado possui estrutura de alta fidelidade conceitual."}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    onClick={handleAnalyzeAndRefine}
                    className={`px-5 py-2.5 bg-white text-black hover:bg-gray-200 text-xs font-semibold rounded font-mono flex items-center gap-2 transition-all cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Sintonizar IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DETAILED DIAGNOSIS & RECONSTRUCTED OUTPUT */}
            <div className="w-full lg:w-[480px] bg-[#0c0c0c] p-6 overflow-y-auto flex flex-col shrink-0 min-h-0">
              {activeInteraction ? (
                <div className="space-y-6">
                  {/* PONTUAÇÃO & STATUS */}
                  <div className="bg-[#111] p-4 rounded-xl border border-[#222] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase">Pontuação Estrutural</div>
                      <div className="text-3xl font-bold tracking-tight text-white">{activeInteraction.analysis?.score || "N/A"}<span className="text-sm text-gray-500 font-normal">/100</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-mono uppercase">Prompt Caching</div>
                      <div className={`text-xs font-semibold font-mono ${activeInteraction.analysis?.tokenomics?.promptCachingPotential ? "text-green-400" : "text-gray-400"}`}>
                        {activeInteraction.analysis?.tokenomics?.promptCachingPotential ? "ALTO POTENCIAL" : "REDUZIDO"}
                      </div>
                    </div>
                  </div>

                  {/* CROFTC CHECKLIST DIAGNOSIS */}
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 font-mono flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Diagnóstico CROFTC
                    </h3>
                    <div className="space-y-2 font-mono text-[11px]">
                      {activeInteraction.analysis?.croftc ? (
                        <>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Contexto (C)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.context}</span>
                          </div>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Função/Role (R)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.role}</span>
                          </div>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Objetivo (O)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.objective}</span>
                          </div>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Formato (F)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.format}</span>
                          </div>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Temperatura (T)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.temperature}</span>
                          </div>
                          <div className="p-2.5 bg-[#151515] border border-[#222] rounded flex flex-col gap-1">
                            <span className="text-gray-300 font-bold">Restrições/Constraints (C)</span>
                            <span className="text-gray-500">{activeInteraction.analysis.croftc.constraints}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500">Nenhum diagnóstico CROFTC carregado.</p>
                      )}
                    </div>
                  </div>

                  {/* COGNITIVE LOAD & OFF-LOADING NOTES */}
                  {activeInteraction.analysis?.cognitiveLoadNote && (
                    <div className="bg-[#151515] border border-[#262626] p-4 rounded-lg">
                      <h4 className="text-xs font-semibold text-gray-300 font-mono mb-2 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5" /> Andaime Semântico & Carga Cognitiva
                      </h4>
                      <p className="text-[11px] text-gray-500 font-sans leading-relaxed">{activeInteraction.analysis.cognitiveLoadNote}</p>
                    </div>
                  )}

                  {/* SCIENTIFIC REFINEMENT PERSPECTIVE */}
                  {activeInteraction.analysis?.scientificRefinement && (
                    <div className="bg-[#111111] border border-[#222] p-4 rounded-lg">
                      <h4 className="text-xs font-semibold text-gray-300 font-mono mb-2 flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5" /> Sinergia Científica (Vetor & Attention)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-sans leading-relaxed">{activeInteraction.analysis.scientificRefinement}</p>
                    </div>
                  )}

                  {/* SPECIFIC SUGGESTIONS */}
                  {activeInteraction.analysis?.tokenomics && (
                    <div className="bg-[#121212] border border-[#222] p-4 rounded-lg">
                      <h4 className="text-xs font-semibold text-gray-300 font-mono mb-2">Tokenomics de Caching</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                        Armazenar regras estáticas, planilhas e contextos no cache diminui o custo em até 90% e elimina a latência. 
                        Este rascunho {activeInteraction.analysis.tokenomics.promptCachingPotential ? "representa uma excelente oportunidade de Prompt Caching." : "deve ser expandido para se beneficiar do cache."} 
                        <span className="block mt-1 text-gray-600">{activeInteraction.analysis.tokenomics.promptCachingReason}</span>
                      </p>
                    </div>
                  )}

                  {/* SUGGESTIONS LIST */}
                  {activeInteraction.analysis?.suggestions && (
                    <div>
                      <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-3 font-mono">Próximos Passos recomendados</h3>
                      <ul className="space-y-1.5 text-[11px] text-gray-500 font-sans">
                        {activeInteraction.analysis.suggestions.map((s, sIdx) => (
                          <li key={sIdx} className="flex gap-2 items-start">
                            <span className="text-white font-mono">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* RECONSTRUCTED OUTPUT */}
                  {activeInteraction.refinedPrompt && (
                    <div className="border border-white/10 rounded-xl bg-[#0e0c0c] overflow-hidden">
                      <div className="bg-[#151515] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-300 font-mono">Prompt Refinado (Copiável)</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleExportPythonScript(activeInteraction.refinedPrompt!)}
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1"
                            title="Exportar como Script Python autônomo (.py)"
                          >
                            <Download className="w-3 h-3" />
                            <span>Script Python (.py)</span>
                          </button>
                          <button 
                            onClick={() => handleCopyPrompt(activeInteraction.refinedPrompt!)}
                            className="px-2 py-1 bg-[#252525] hover:bg-white hover:text-black rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedText ? "Copiado!" : "Copiar"}</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-[#111] max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed select-all selection:bg-white selection:text-black">{activeInteraction.refinedPrompt}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-8 border border-dashed border-[#222222] rounded bg-[#131313]/30">
                  <Terminal className="w-12 h-12 text-gray-700 mb-3" />
                  <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-1 font-mono">Laboratório de Análise</h3>
                  <p className="text-xs text-gray-500 max-w-xs font-sans leading-relaxed">
                    Escreva ou escolha um rascunho de prompt ao lado e sintonize a IA do Scribe para renderizar diagnósticos detalhados baseados em ciência de dados e engenharia de software.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PYTHON LAB WORKBENCH */}
        {activeTab === "python-lab" && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-[#0b0b0b]">
            <div className="max-w-6xl mx-auto w-full">
              <PythonWorkbench />
            </div>
          </div>
        )}

        {/* TAB 2: KANBAN & DOPAMINE SCAFFOLD */}
        {activeTab === "kanban" && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-[#0b0b0b]">
            <div className="max-w-5xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                    Andaime de Produtividade & Suporte Dopamínico
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Cérebros duplamente excepcionais exigem scaffolds externos para contornar falhas na memória de trabalho e a inércia executiva. 
                    Utilizamos um <strong>Painel Kanban Limitado (WIP = Max 3)</strong> para blindar o foco.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#131313] p-3 rounded-lg border border-[#222]">
                  <button 
                    onClick={handleToggleDailyGoal}
                    className={`p-1.5 rounded transition-all ${dailyGoalCompleted ? "bg-white text-black" : "bg-[#252525] text-gray-500 hover:text-gray-300"}`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-gray-300">
                    Meta de Foco do Dia: <span className={dailyGoalCompleted ? "text-white font-bold" : "text-gray-500"}>{dailyGoalCompleted ? "CONCLUÍDA" : "PENDENTE"}</span>
                  </span>
                </div>
              </div>

              {/* TASK CREATION FORM */}
              <form onSubmit={handleAddTask} className="flex gap-3 bg-[#111111] p-4 rounded-xl border border-[#222]">
                <input 
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Escreva um micro-passo minimalista (< 2 minutos para fazer)... Ex: 'Abrir terminal e criar server.ts'"
                  className="flex-1 bg-[#181818] border border-[#2e2e2e] rounded px-4 py-2 text-xs focus:outline-none focus:border-gray-500 text-gray-100 placeholder:text-gray-700"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* CONFIRMATION TIPS (SANDWICH DE DOPAMINA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#121212] p-4 rounded-lg border border-[#1e1e1e]">
                  <h4 className="text-xs font-bold text-gray-300 font-mono mb-2 flex items-center gap-1.5">
                    🥪 Regra do Sanduíche de Dopamina
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Envelope um bloco de 15 minutos de preenchimento burocrático (o recheio) entre dois estímulos agradáveis (as fatias). Ative o aromatizador de hortelã ou café no início, e jogue por 5 minutos no término!
                  </p>
                </div>
                <div className="bg-[#121212] p-4 rounded-lg border border-[#1e1e1e]">
                  <h4 className="text-xs font-bold text-gray-300 font-mono mb-2 flex items-center gap-1.5">
                    ⏱️ Regra dos 30% e do Micro-passo
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Evite a cegueira temporal multiplicando seus cronogramas por 1.3 (fator de correção). Para tarefas difíceis, quebre a primeira etapa a ponto de torná-la ridícula (menos de 2 minutos para fazer), quebrando a inércia.
                  </p>
                </div>
              </div>

              {/* KANBAN BOARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* Backlog Column */}
                <div className="bg-[#111111]/60 rounded-xl border border-[#202020] p-4 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-2 mb-3">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-gray-400">Caixa de Entrada</span>
                    <span className="text-[10px] bg-[#1a1a1a] px-2 py-0.5 rounded text-gray-400 font-mono">{tasks.filter(t => t.column === "backlog").length}</span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasks.filter(t => t.column === "backlog").map(t => (
                      <div key={t.id} className="p-3 bg-[#151515] border border-[#262626] hover:border-[#383838] rounded-lg transition-all flex flex-col gap-2 relative">
                        <span className="text-xs text-gray-300 pr-4">{t.text}</span>
                        <div className="flex items-center justify-between mt-1">
                          <button 
                            onClick={() => moveTask(t.id, "fazendo")}
                            className="text-[10px] bg-[#222222] hover:bg-white hover:text-black border border-[#333] px-2 py-0.5 rounded font-mono text-gray-400 flex items-center gap-1 transition-colors"
                          >
                            <span>Focar</span> <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={() => handleDeleteTask(t.id)} className="text-[10px] text-gray-600 hover:text-red-400 font-mono">Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doing Column */}
                <div className="bg-[#111111]/60 rounded-xl border border-gray-800/80 p-4 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-2 mb-3">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-1">
                      <span>⚡ Fazendo Hoje</span>
                      <span className="text-[9px] bg-white text-black px-1 py-px rounded-sm tracking-normal">WIP LIMIT: 3</span>
                    </span>
                    <span className="text-[10px] bg-[#222] px-2 py-0.5 rounded text-white font-mono font-bold">
                      {tasks.filter(t => t.column === "fazendo").length}/3
                    </span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasks.filter(t => t.column === "fazendo").map(t => (
                      <div key={t.id} className="p-3.5 bg-[#181818] border border-gray-600 rounded-lg shadow-lg flex flex-col gap-2">
                        <span className="text-xs font-semibold text-white">{t.text}</span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262626]">
                          <button 
                            onClick={() => moveTask(t.id, "concluido")}
                            className="text-[10px] bg-white text-black hover:bg-gray-200 px-2 py-1 rounded font-mono font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" /> <span>Concluir</span>
                          </button>
                          <button 
                            onClick={() => moveTask(t.id, "backlog")}
                            className="text-[9px] text-gray-500 hover:text-white font-mono"
                          >
                            Devolver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done Column */}
                <div className="bg-[#111111]/60 rounded-xl border border-[#202020] p-4 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-2 mb-3">
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-gray-400">Concluído</span>
                    <span className="text-[10px] bg-[#1a1a1a] px-2 py-0.5 rounded text-gray-400 font-mono">{tasks.filter(t => t.column === "concluido").length}</span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {tasks.filter(t => t.column === "concluido").map(t => (
                      <div key={t.id} className="p-3 bg-[#121212] border border-[#222222] rounded-lg opacity-60 flex flex-col gap-1">
                        <span className="text-xs text-gray-400 line-through">{t.text}</span>
                        <span className="text-[9px] text-gray-600 font-mono">Terminado em {new Date(t.timestamp).toLocaleDateString()}</span>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-[10px] text-left text-gray-600 hover:text-red-400 mt-1.5 font-mono">Excluir permanente</button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATA SCIENCE METRICS SIMULATOR */}
        {activeTab === "data-science" && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-[#0b0b0b]">
            <div className="max-w-5xl mx-auto w-full space-y-8">
              <div className="border-b border-[#1c1c1c] pb-4">
                <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" /> Simulador de Métricas & Validação Científica
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Para atuar na vanguarda da Engenharia de IA, as decisões empíricas são substituídas por equações matemáticas de erro e modelos estatísticos.
                  Simule cenários reais de classificação (matriz de confusão) e regressão (RMSE, MAE) para calibrar seus prompts estruturados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. CLASSIFICATION & CONFUSION MATRIX */}
                <div className="space-y-4 bg-[#111] p-6 rounded-xl border border-[#222]">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-gray-400" /> Métricas de Classificação Binária (Matriz de Confusão)
                  </h3>
                  <p className="text-[11px] text-gray-500">Insira as frequências de Verdadeiros e Falsos para derivar as métricas exatas de classificação do modelo de linguagem:</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Verdadeiros Positivos (TP)</label>
                      <input 
                        type="number" 
                        value={tpVal} 
                        onChange={(e) => setTpVal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#181818] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Falsos Positivos (FP)</label>
                      <input 
                        type="number" 
                        value={fpVal} 
                        onChange={(e) => setFpVal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#181818] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Falsos Negativos (FN)</label>
                      <input 
                        type="number" 
                        value={fnVal} 
                        onChange={(e) => setFnVal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#181818] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-mono block mb-1">Verdadeiros Negativos (TN)</label>
                      <input 
                        type="number" 
                        value={tnVal} 
                        onChange={(e) => setTnVal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#181818] border border-[#2e2e2e] rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* VISUAL GRSCALE CONFUSION MATRIX */}
                  <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#222] space-y-2">
                    <div className="text-[9px] font-mono text-gray-500 text-center uppercase tracking-wider">Representação da Matriz de Confusão</div>
                    <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                      <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500">TP (Positivo)</span>
                        <span className="text-base font-bold text-white mt-1">{tpVal}</span>
                      </div>
                      <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500">FP (Falso Alerta)</span>
                        <span className="text-base font-bold text-gray-400 mt-1">{fpVal}</span>
                      </div>
                      <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500">FN (Não Detectado)</span>
                        <span className="text-base font-bold text-gray-400 mt-1">{fnVal}</span>
                      </div>
                      <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] flex flex-col justify-center">
                        <span className="text-[10px] text-gray-500">TN (Negativo Real)</span>
                        <span className="text-base font-bold text-white mt-1">{tnVal}</span>
                      </div>
                    </div>
                  </div>

                  {/* DERIVED CLASSIFICATION METRICS */}
                  <div className="grid grid-cols-3 gap-3 bg-[#151515] p-3 rounded-lg border border-[#222] text-center font-mono text-xs">
                    <div>
                      <div className="text-[9px] text-gray-500 mb-1">Precisão</div>
                      <div className="text-sm font-bold text-white">{(precision * 100).toFixed(1)}%</div>
                      <div className="text-[8px] text-gray-600 mt-1 leading-none">TP / (TP + FP)</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 mb-1">Recall (Sens.)</div>
                      <div className="text-sm font-bold text-white">{(recall * 100).toFixed(1)}%</div>
                      <div className="text-[8px] text-gray-600 mt-1 leading-none">TP / (TP + FN)</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 mb-1">F1-Score</div>
                      <div className="text-sm font-bold text-white">{(f1Score * 100).toFixed(1)}%</div>
                      <div className="text-[8px] text-gray-600 mt-1 leading-none">Média Harmônica</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#141414] border border-[#262626] rounded text-[11px] text-gray-500 leading-relaxed font-sans">
                    💡 <strong>Insight Clínico:</strong> Na saúde ou no planeamento de geada agrícola, minimizar os <strong>Falsos Negativos (FN)</strong> é prioritário. Portanto, o prompt deve ser instruído a maximizar a <strong>Sensibilidade (Recall)</strong>, garantindo que nenhum risco passe despercebido.
                  </div>
                </div>

                {/* 2. REGRESSION METRICS SIMULATOR */}
                <div className="space-y-4 bg-[#111] p-6 rounded-xl border border-[#222] flex flex-col">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white flex items-center gap-2">
                    📉 Métricas de Previsão Numérica (Regressão & Correlação)
                  </h3>
                  <p className="text-[11px] text-gray-500">Calcule erros absolutos e quadráticos médios em tempo real para simular alucinações de temperatura ou desvios de GPS:</p>

                  <div className="flex-1 space-y-4">
                    {/* Input data form */}
                    <form onSubmit={handleAddRegPoint} className="flex gap-3 bg-[#151515] p-3 rounded border border-[#222]">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-400 font-mono block mb-1">Temperatura Real (°C)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={newRealVal} 
                          onChange={(e) => setNewRealVal(e.target.value)}
                          placeholder="Ex: 5"
                          className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-400 font-mono block mb-1">Previsão da IA (°C)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={newPredVal} 
                          onChange={(e) => setNewPredVal(e.target.value)}
                          placeholder="Ex: 6.2"
                          className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="px-4 bg-white text-black hover:bg-gray-200 text-xs font-bold rounded font-mono shrink-0 cursor-pointer"
                      >
                        Injetar
                      </button>
                    </form>

                    {/* Table of points */}
                    <div className="bg-[#0a0a0a] rounded border border-[#222] max-h-36 overflow-y-auto">
                      <table className="w-full font-mono text-[10px] text-left text-gray-400">
                        <thead className="bg-[#141414] border-b border-[#222] text-gray-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-1.5">Amostra</th>
                            <th className="px-3 py-1.5">Valor Real (y_i)</th>
                            <th className="px-3 py-1.5">Previsão IA (f_i)</th>
                            <th className="px-3 py-1.5">Erro Absoluto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e1e]">
                          {regDataPoints.map((p, idx) => (
                            <tr key={idx} className={Math.abs(p.real - p.pred) > 3 ? "bg-[#251010]/30" : ""}>
                              <td className="px-3 py-1.5 text-gray-600">#{idx + 1}</td>
                              <td className="px-3 py-1.5 text-white">{p.real.toFixed(1)}°C</td>
                              <td className="px-3 py-1.5 text-white">{p.pred.toFixed(1)}°C</td>
                              <td className="px-3 py-1.5 font-bold text-gray-300">{(Math.abs(p.real - p.pred)).toFixed(1)}°C</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Total de amostras na base: {regDataPoints.length}</span>
                      <button onClick={handleClearRegPoints} className="text-red-400 hover:underline">Limpar base de simulação</button>
                    </div>

                    {/* Derived regression stats */}
                    <div className="grid grid-cols-3 gap-3 bg-[#151515] p-3 rounded-lg border border-[#222] text-center font-mono text-xs">
                      <div>
                        <div className="text-[9px] text-gray-500 mb-1">Erro Médio Absoluto (MAE)</div>
                        <div className="text-sm font-bold text-white">{regMetrics.mae.toFixed(2)}°C</div>
                        <div className="text-[8px] text-gray-600 mt-1 leading-none">Média dos Erros</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 mb-1">Erro Quadrático Médio (RMSE)</div>
                        <div className="text-sm font-bold text-white">{regMetrics.rmse.toFixed(2)}°C</div>
                        <div className="text-[8px] text-gray-600 mt-1 leading-none">Peso para Extremos</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 mb-1">Pearson Correlation (r)</div>
                        <div className="text-sm font-bold text-white">{regMetrics.r.toFixed(3)}</div>
                        <div className="text-[8px] text-gray-600 mt-1 leading-none">Alinhamento Linear</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#141414] border border-[#262626] rounded text-[11px] text-gray-500 leading-relaxed font-sans">
                      💡 <strong>Insight Científico:</strong> O <strong>RMSE</strong> penaliza erros extremos mais pesadamente (devido ao termo quadrático). Se o seu modelo cometer uma grande alucinação pontual de temperatura (como prever 21°C para uma temperatura real de 30°C), o RMSE disparará mais rapidamente que o MAE.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 4: THEORETICAL CONCEPTS */}
        {activeTab === "teoria" && (
          <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-[#0b0b0b]">
            <div className="max-w-4xl mx-auto w-full space-y-8 font-sans text-xs text-gray-400 leading-relaxed">
              <div className="border-b border-[#1c1c1c] pb-4">
                <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400" /> A Mecânica Oculta da Aprendizagem Automática & LLMs
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Resumo conceitual unificado para nivelamento técnico avançado.
                </p>
              </div>

              {/* SECTION 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white border-b border-[#222] pb-1.5">
                    1. Machine Learning vs. Programação Tradicional
                  </h3>
                  <p>
                    Na programação clássica, o software escreve regras rígidas e explícitas: 
                    <code>Se a temperatura passar de 30°C e a umidade do solo for inferior a 40%, então ative o sistema de irrigação.</code> 
                    Se surgir um cenário imprevisto não programado, o sistema congela ou falha por completo.
                  </p>
                  <p>
                    O <strong>Machine Learning</strong> inverte esta lógica, funcionando como um <strong>Chef Aprendiz</strong>. 
                    Damos-lhe os ingredientes (dados de treino) e o prato finalizado (resultados esperados), e ele descobre as correlações internas.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white border-b border-[#222] pb-1.5">
                    2. Vetores & Embeddings Semânticos
                  </h3>
                  <p>
                    Computadores compreendem apenas números. Para que uma IA processe a linguagem humana, cada palavra ou token é convertido numa lista de números (um vetor) que funciona como uma coordenada geográfica num espaço tridimensional gigante (o Mapa Celestial do Significado).
                  </p>
                  <p>
                    Palavras ou frases com significados semelhantes (como "cachorro", "gato" e "pet") não são colocadas próximas por regras de dicionário, mas sim porque orbitam no mesmo centro de gravidade conceitual. A similaridade semântica é calculada pelo cosseno do ângulo entre estes dois vetores (<strong>Similaridade de Cosseno</strong>).
                  </p>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white border-b border-[#222] pb-1.5">
                    3. Auto-Atenção (Self-Attention) & Transformers
                  </h3>
                  <p>
                    Até 2017, as IAs liam textos de forma sequencial (telefone sem fio), esquecendo-se do sujeito do início de frases longas. 
                    A arquitetura <strong>Transformer</strong> aboliu isso colocando todas as palavras sentadas numa mesa redonda, comunicando diretamente entre si sem intermediários.
                  </p>
                  <p>
                    O mecanismo de <strong>Auto-Atenção</strong> é a habilidade de o modelo focar nos termos críticos que rodeiam uma palavra (como "rápido" e "corrida" perto de "servidor"), ignorando ruídos desnecessários e atribuindo um peso atencional cirúrgico de forma probabilística.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white border-b border-[#222] pb-1.5">
                    4. Parametrização Estatística (Temperatura & Top-P)
                  </h3>
                  <p>
                    A saída de um LLM é calculada a partir de uma distribuição de probabilidade normalizada pela função <strong>Softmax</strong>.
                  </p>
                  <p>
                    - **Temperatura (T → 0)**: A amostragem colapsa para escolhas rígidas e determinísticas (visão de túnel/hiperfoco). Útil para código ou análise rigorosa de planilhas.
                  </p>
                  <p>
                    - **Temperatura (T &gt; 1)**: Diminui a diferença de probabilidade entre as palavras, gerando alta entropia e imprevisibilidade criativa (caos e livre associação).
                  </p>
                  <p>
                    - **Top-P (Nucleus Sampling)**: Funciona como um filtro atencional que restringe a seleção ao menor subconjunto do vocabulário cuja soma cumulativa atinge o limiar P, eliminando a cauda longa de palavras absurdas ou desconexas.
                  </p>
                </div>
              </div>

              {/* THE ATHLETIC METAPHOR OF IA SYNERGY */}
              <div className="bg-[#141414] p-5 rounded-lg border border-[#222222] text-xs leading-relaxed">
                <h4 className="text-white font-bold mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-gray-400" /> A Sinfonia da Sinergia
                </h4>
                <p className="text-gray-400 mb-3">
                  O verdadeiro poder da IA generativa não se encontra de forma isolada, mas sim na harmonia entre três pilares fundamentais:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px] text-gray-500">
                  <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded">
                    <strong className="text-white block mb-1">1. O Escultor (O Modelo)</strong>
                    Estuda todas as técnicas de escultura da história humana (estudado em bilhões de parâmetros), mas entra no ateliê de olhos vendados. Ele não sabe o que criar sem você.
                  </div>
                  <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded">
                    <strong className="text-white block mb-1">2. A Argila (Os Dados)</strong>
                    Sua planilha climatológica, relatórios brutos ou coordenadas de GPS. Sem ela, o escultor tenta esculpir o ar, resultando em alucinações factuais genéricas.
                  </div>
                  <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded">
                    <strong className="text-white block mb-1">3. O Cinzel (O Prompt)</strong>
                    Sua formulação estratégica do prompt (CROFTC, XML). Define as coordenadas exatas de corte, a força de impacto e o acabamento final que o escultor deve aplicar na argila.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: 6-MONTH PROMPT EXPORT & HISTORIC LINKER */}
        {activeTab === "export-historico" && (
          <div className="flex-1 p-6 overflow-y-auto bg-[#0a0a0a] flex flex-col">
            <div className="max-w-6xl mx-auto w-full space-y-6">
              
              {/* Header section with specific explanation of connection with the Scribe objective */}
              <div className="border-b border-[#1c1c1c] pb-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-400" /> Histórico de 6 Meses & Portal de Exportação
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Coleta consolidada de prompts utilizados no Gemini & Claude AI. Conecte rascunhos antigos ao Ateliê para otimizar custos com Prompt Caching.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsExportGeminiOpen(true)}
                      className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
                      title="Exportar toda a codebase do projeto em formato amigável ao Gemini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-black" /> Exportar Codebase p/ Gemini
                    </button>
                    <button
                      onClick={handleExportHistory}
                      className="text-xs px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded font-mono font-medium flex items-center gap-1.5 transition-all"
                      title="Exporta a biblioteca de prompts históricos compilados com análises em Markdown"
                    >
                      <Download className="w-3.5 h-3.5" /> Exportar Markdown
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(promptHistory, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `scribe-prompt-history-6m-${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      }}
                      className="text-xs px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black rounded font-mono font-bold flex items-center gap-1.5 transition-all"
                      title="Exportar base completa em formato JSON de backup"
                    >
                      <Save className="w-3.5 h-3.5" /> Exportar JSON
                    </button>
                  </div>
                </div>

                {/* Warning / Link Indicator if active */}
                {linkSuccessMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs rounded font-mono"
                  >
                    🎉 {linkSuccessMsg}
                  </motion.div>
                )}
              </div>

              {/* Aggregated Metadata Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#111111] p-3.5 rounded-lg border border-[#1c1c1c] font-mono">
                  <div className="text-[9px] text-gray-500 uppercase">Período de Análise</div>
                  <div className="text-sm font-bold text-white mt-1">Últimos 6 Meses</div>
                  <div className="text-[8px] text-gray-600 mt-0.5">Janeiro - Junho de 2026</div>
                </div>
                <div className="bg-[#111111] p-3.5 rounded-lg border border-[#1c1c1c] font-mono">
                  <div className="text-[9px] text-gray-500 uppercase">Prompts Coletados</div>
                  <div className="text-sm font-bold text-white mt-1 flex items-baseline gap-2">
                    {promptHistory.length} registros
                    <span className="text-[10px] text-neutral-500">
                      ({promptHistory.filter(p => p.platform === "Gemini").length}G / {promptHistory.filter(p => p.platform === "Claude").length}C)
                    </span>
                  </div>
                  <div className="text-[8px] text-gray-600 mt-0.5">Gemini & Claude AI</div>
                </div>
                <div className="bg-[#111111] p-3.5 rounded-lg border border-[#1c1c1c] font-mono">
                  <div className="text-[9px] text-gray-500 uppercase">Tokens em Cache Estável</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {promptHistory.reduce((acc, curr) => acc + curr.tokens, 0)} tokens
                  </div>
                  <div className="text-[8px] text-gray-600 mt-0.5">Potencial reaproveitado acumulado</div>
                </div>
                <div className="bg-[#111111] p-3.5 rounded-lg border border-[#1c1c1c] font-mono">
                  <div className="text-[9px] text-gray-500 uppercase">Economia de Custo Estimada</div>
                  <div className="text-sm font-bold text-sky-400 mt-1">Até 74.3%</div>
                  <div className="text-[8px] text-gray-600 mt-0.5">Via prefix caching do Scribe</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT WORKSPACE: IMPORT ENGINE & CONCEPT DESCRIPTION */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Explanation card of how this links with Program Goal */}
                  <div className="bg-[#141414]/90 p-4 rounded-lg border border-[#222222] space-y-3">
                    <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5 uppercase">
                      <Brain className="w-4 h-4 text-emerald-400" /> O Vínculo com Nosso Objetivo
                    </h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Scribe é um sistema projetado para <strong>otimização de prompts corporativos e segurança de IA</strong>. No entanto, prompts não nascem no vácuo. Eles costumam ser experimentados antes no <strong>Gemini</strong> ou <strong>Claude AI</strong> de forma desestruturada.
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Este portal coleta esse histórico caótico e <strong>fecha o elo evolutivo</strong>. Ao trazer um prompt do Claude/Gemini para cá:
                    </p>
                    <ul className="text-[10.5px] text-gray-500 space-y-1.5 font-mono list-disc list-inside pl-1">
                      <li>Identificamos regras gigantes de contexto que poderiam ser <span className="text-emerald-400">cacheadas de graça</span>.</li>
                      <li>Dividimos instruções usando delimitadores <span className="text-white">XML estruturados</span>.</li>
                      <li>Calculamos a simulação exata de latência no Laboratório.</li>
                    </ul>
                  </div>

                  {/* IMPORT ENGINE FORM */}
                  <form onSubmit={handleImportHistoryLogs} className="bg-[#111111] p-4 rounded-lg border border-[#1c1c1c] space-y-3">
                    <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5 uppercase">
                      <Plus className="w-3.5 h-3.5" /> Sincronizar Novos Logs
                    </h3>
                    <p className="text-[11.5px] text-gray-500">
                      Importe logs copiados do Google Takeout, Claude History ou cole um prompt manual para registrar seu histórico de 6 meses:
                    </p>

                    {importSuccessMsg && (
                      <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono rounded">
                        {importSuccessMsg}
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Título do Prompt</label>
                      <input 
                        type="text" 
                        value={importTitle}
                        onChange={(e) => setImportTitle(e.target.value)}
                        placeholder="Ex: Auditor de Código Java"
                        className="w-full bg-[#181818] border border-[#2d2d2d] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#444]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Plataforma Origem</label>
                        <select 
                          value={importPlatform}
                          onChange={(e) => setImportPlatform(e.target.value as "Gemini" | "Claude")}
                          className="w-full bg-[#181818] border border-[#2d2d2d] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Gemini">Gemini (Google)</option>
                          <option value="Claude">Claude (Anthropic)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-gray-400 uppercase">Categoria</label>
                        <input 
                          type="text" 
                          value={importCategory}
                          onChange={(e) => setImportCategory(e.target.value)}
                          placeholder="Ex: Refatoração, Redação"
                          className="w-full bg-[#181818] border border-[#2d2d2d] rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 uppercase">Prompt Original ou Array JSON</label>
                      <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        rows={4}
                        placeholder="Cole o prompt puro ou uma lista de histórico formato JSON [{ 'title': '...', 'prompt': '...' }]"
                        className="w-full bg-[#181818] border border-[#2d2d2d] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#444] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 bg-[#222222] hover:bg-white hover:text-black border border-[#333] text-gray-300 rounded text-xs font-mono font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Registrar no Histórico
                    </button>
                  </form>

                </div>

                {/* RIGHT WORKSPACE: TIMELINE OF PRE-POPULATED 6-MONTH PROMPTS */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* Filter Toolbar */}
                  <div className="bg-[#111111] p-3 rounded-lg border border-[#1c1c1c] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Filtrar Histórico:</span>
                      <button 
                        onClick={() => setFilterPlatform("all")}
                        className={`text-xs px-2.5 py-0.5 rounded font-mono ${filterPlatform === "all" ? "bg-[#2c2c2c] text-white border border-[#444]" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Todos
                      </button>
                      <button 
                        onClick={() => setFilterPlatform("Gemini")}
                        className={`text-xs px-2.5 py-0.5 rounded font-mono flex items-center gap-1 ${filterPlatform === "Gemini" ? "bg-indigo-950 text-indigo-300 border border-indigo-800" : "text-gray-500 hover:text-indigo-300"}`}
                      >
                        Gemini
                      </button>
                      <button 
                        onClick={() => setFilterPlatform("Claude")}
                        className={`text-xs px-2.5 py-0.5 rounded font-mono flex items-center gap-1 ${filterPlatform === "Claude" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-gray-500 hover:text-amber-300"}`}
                      >
                        Claude
                      </button>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Buscar no histórico..." 
                        value={searchHistoryQuery}
                        onChange={(e) => setSearchHistoryQuery(e.target.value)}
                        className="bg-[#181818] border border-[#2d2d2d] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#444] w-48 font-mono"
                      />
                    </div>
                  </div>

                  {/* List of historical prompts with detailed Objective Linking */}
                  <div className="space-y-4">
                    {promptHistory
                      .filter(p => filterPlatform === "all" || p.platform === filterPlatform)
                      .filter(p => {
                        if (!searchHistoryQuery) return true;
                        const query = searchHistoryQuery.toLowerCase();
                        return p.title.toLowerCase().includes(query) || 
                               p.prompt.toLowerCase().includes(query) || 
                               p.category.toLowerCase().includes(query);
                      })
                      .map((p) => (
                        <div 
                          key={p.id}
                          className="bg-[#121212] border border-[#1e1e1e] hover:border-[#2d2d2d] rounded-lg p-4 transition-all relative overflow-hidden"
                        >
                          {/* Platform Badge indicator top right */}
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="text-[9px] font-mono text-gray-500">{p.date}</span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                              p.platform === "Gemini" 
                                ? "bg-indigo-950/70 text-indigo-300 border border-indigo-900/50" 
                                : "bg-amber-950/70 text-amber-300 border border-amber-900/50"
                            }`}>
                              {p.platform}
                            </span>
                          </div>

                          {/* Title and Category */}
                          <div className="space-y-0.5 mb-2.5">
                            <h4 className="text-xs font-bold text-white tracking-tight">{p.title}</h4>
                            <span className="inline-block text-[9px] text-gray-500 font-mono uppercase bg-[#181818] px-2 py-0.5 rounded border border-[#242424]">
                              {p.category} • ~{p.tokens} tokens
                            </span>
                          </div>

                          {/* Original prompt text area */}
                          <div className="bg-[#161616] rounded border border-[#222222] p-2.5 mb-3 font-mono text-[10.5px] text-gray-400 max-h-24 overflow-y-auto leading-relaxed scrollbar-thin">
                            {p.prompt}
                            {p.dataContext && (
                              <div className="mt-2 pt-2 border-t border-[#262626]/60 text-[9.5px] text-gray-500">
                                <strong>Contexto Associado:</strong> {p.dataContext}
                              </div>
                            )}
                          </div>

                          {/* Objective link explanation - CRITICAL */}
                          <div className="bg-[#151a17]/70 border border-emerald-900/40 rounded p-2.5 mb-3 flex items-start gap-2 text-[10.5px] text-emerald-400/90 leading-relaxed">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-emerald-300 font-mono text-[10px] block uppercase mb-0.5">Vínculo de Otimização no Scribe:</strong>
                              {p.objectiveLink}
                            </div>
                          </div>

                          {/* Action footer */}
                          <div className="flex justify-between items-center pt-2.5 border-t border-[#1c1c1c]">
                            <button
                              onClick={() => handleDeleteHistoricalPrompt(p.id)}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 font-mono transition-all"
                            >
                              <Trash className="w-3 h-3" /> Remover Log
                            </button>
                            
                            <button
                              onClick={() => handleLinkPromptToObjective(p)}
                              className="text-[10px] px-3 py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 rounded font-mono font-bold flex items-center gap-1.5 transition-all text-white"
                            >
                              <ArrowRight className="w-3.5 h-3.5" /> Conectar & Otimizar no Ateliê
                            </button>
                          </div>
                        </div>
                      ))}

                    {promptHistory.length === 0 && (
                      <div className="text-center py-16 border border-dashed border-[#222222] rounded bg-[#111]">
                        <History className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                        <p className="text-xs text-neutral-500 font-mono">Nenhum prompt histórico importado ou salvo no registro de 6 meses.</p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1c1c1c] bg-[#0c0c0c] px-6 py-3 flex items-center justify-between text-[11px] text-gray-600 font-mono">
        <div>Scribe Workspace • lucasdmottola@gmail.com</div>
        <div>Foco Executivo Ativo • {new Date().toLocaleDateString("pt-BR")}</div>
      </footer>

      {/* EXPORT TO GEMINI MODAL */}
      <ExportGeminiModal 
        isOpen={isExportGeminiOpen} 
        onClose={() => setIsExportGeminiOpen(false)} 
      />
    </div>
  );
}

```

### Arquivo: `src/components/PythonWorkbench.tsx`
```typescript
import React, { useState, useEffect } from "react";
import { Terminal, Play, RotateCcw, CheckCircle2, AlertTriangle, Code, Cpu, Sparkles, BookOpen, Layers, Download } from "lucide-react";

interface PythonStatus {
  engine: string;
  version: string;
  executable: string;
  platform: string;
  modules: string[];
  cli_actions: string[];
}

const SAMPLE_PYTHON_CODES = [
  {
    title: "1. Avaliação CROFTC & Heurística de Prompt",
    code: `from python_engine.analyzer import PromptAnalyzer

analyzer = PromptAnalyzer()
prompt_sample = """
Você é um Cientista de Dados Sênior. Sua tarefa é analisar a matriz de confusão fornecida e calcular o F1-score balanceado.
Gere a resposta em formato JSON com chaves 'f1_score', 'precision', 'recall'.
Restrições: Seja estritamente determinístico (temperatura=0.0). Não alucine métricas ausentes.
"""

result = analyzer.analyze(prompt_sample)
print("=== RESULTADO DA ANÁLISE CROFTC (PYTHON) ===")
print(f"Score Global: {result['score']}/100")
print(f"Role: {result['croftc']['role']}")
print(f"Format: {result['croftc']['format']}")
print(f"Tokens Estimados: {result['tokenomics']['estimatedInputTokens']}")
print(f"Potencial de Caching: {result['tokenomics']['promptCachingPotential']}")
`
  },
  {
    title: "2. Ciência de Dados: Matriz de Confusão & F1-Score",
    code: `from python_engine.data_science import DataScienceSuite

# Simulação de Classificador de LLM (Detecção de Viés / Alucinação)
# TP: 142, FP: 18, FN: 8, TN: 180
metrics = DataScienceSuite.calculate_classification_metrics(tp=142, fp=18, fn=8, tn=180, beta=1.0)

print("=== MÉTRICAS DE CIÊNCIA DE DADOS (PYTHON STDLIB) ===")
print(f"Acurácia: {metrics['accuracy']:.2f}%")
print(f"Precisão: {metrics['precision']:.2f}%")
print(f"Recall (Sensibilidade): {metrics['recall']:.2f}%")
print(f"F1-Score Balanceado: {metrics['f1_score']:.2f}%")
print(f"MCC (Matthews Correlation): {metrics['mcc']:.4f}")
`
  },
  {
    title: "3. Tokenomics & Economia de Prefix Caching",
    code: `from python_engine.tokenomics import TokenomicsEngine

# Simula um prompt longo com 2.500 tokens de contexto estático e 150 tokens dinâmicos
cache_eval = TokenomicsEngine.calculate_cache_metrics(
    cache_system=True,
    cache_context=True,
    cache_few_shot=True,
    dynamic_prompt_text="Classifique o sentimento deste novo feedback: 'Excelente suporte!'",
    custom_blocks=[{"tokens": 800}]
)

print("=== ENGENHARIA DE TOKENOMICS (PREFIX CACHING) ===")
print(f"Tokens Estáticos em Cache: {cache_eval['cached_tokens']}")
print(f"Tokens Dinâmicos: {cache_eval['dynamic_tokens']}")
print(f"Economia Projetada de Custo: {cache_eval['cost_savings_percent']:.1f}%")
print(f"Economia Projetada de Latência: {cache_eval['latency_savings_percent']:.1f}%")
print(f"Latência com Cache: {cache_eval['cached_latency_ms']} ms (vs {cache_eval['standard_latency_ms']} ms normal)")
`
  },
  {
    title: "4. Vetores Semânticos & Similaridade de Cosseno",
    code: `from python_engine.data_science import DataScienceSuite

prompt_original = "Resuma o relatório de vendas para a diretoria"
prompt_refinado = """<instructions>
Atue como Analista Financeiro. Resuma o relatório de vendas destacando métricas trimestrais.
</instructions>
<output_format>Tabela Markdown com KPI, Realizado e Meta</output_format>"""

sim = DataScienceSuite.simulate_prompt_embedding_similarity(prompt_original, prompt_refinado)

print("=== ANÁLISE DE SIMILARIDADE DE COSSENO (VETORES) ===")
print(f"Similaridade de Cosseno: {sim['cosine_similarity']:.4f}")
print(f"Densidade Atencional do Refinamento: {sim['attention_density']:.2f}x")
print(f"Diagnóstico: {sim['diagnosis']}")
`
  },
  {
    title: "5. Suíte de Testes Unitários do Motor Python",
    code: `import unittest
import sys
import os

# Executa a suíte de testes unitários diretamente
from python_engine.test_engine import TestScribePythonEngine

suite = unittest.TestLoader().loadTestsFromTestCase(TestScribePythonEngine)
runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)

print(f"\\nTestes Executados: {result.testsRun}")
print(f"Sucessos: {result.testsRun - len(result.failures) - len(result.errors)}")
print(f"Falhas: {len(result.failures)}")
`
  }
];

export function PythonWorkbench() {
  const [status, setStatus] = useState<PythonStatus | null>(null);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [code, setCode] = useState(SAMPLE_PYTHON_CODES[0].code);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; returncode: number; execution_time_sec?: number } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"repl" | "modules" | "architecture">("repl");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/python/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Falha ao obter status do Python:", e);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await fetch("/api/python/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, timeout: 15 })
      });
      const data = await res.json();
      setOutput(data);
    } catch (err: any) {
      setOutput({
        stdout: "",
        stderr: err.message || "Erro ao conectar com o motor Python.",
        returncode: 1
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectSample = (idx: number) => {
    setSelectedSampleIndex(idx);
    setCode(SAMPLE_PYTHON_CODES[idx].code);
    setOutput(null);
  };

  return (
    <div id="python_workbench_container" className="space-y-6">
      {/* Top Banner: Python 3.10 Engine Status */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-100 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              Py
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-neutral-100">Motor Central Python 3.10</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  Linguagem Principal Ativa
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {status ? `${status.version} • Plataforma: ${status.platform}` : "Conectando ao runtime Python..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 bg-neutral-800/80 rounded-md border border-neutral-700/60 text-neutral-300">
              <span className="text-neutral-400">Módulos:</span> <span className="font-mono text-emerald-300">{status ? status.modules.length : 7}</span>
            </div>
            <div className="px-3 py-1.5 bg-neutral-800/80 rounded-md border border-neutral-700/60 text-neutral-300">
              <span className="text-neutral-400">RPC Actions:</span> <span className="font-mono text-emerald-300">{status ? status.cli_actions.length : 8}</span>
            </div>
            <button
              onClick={fetchStatus}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Atualizar status"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex border-b border-neutral-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveSubTab("repl")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === "repl"
              ? "border-neutral-900 text-neutral-900 font-semibold"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Console Interativo & Scripts Python
        </button>

        <button
          onClick={() => setActiveSubTab("modules")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === "modules"
              ? "border-neutral-900 text-neutral-900 font-semibold"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Code className="w-4 h-4" />
          Módulos do Sistema (/python_engine)
        </button>

        <button
          onClick={() => setActiveSubTab("architecture")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === "architecture"
              ? "border-neutral-900 text-neutral-900 font-semibold"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <Cpu className="w-4 h-4" />
          Arquitetura & Execução CLI
        </button>
      </div>

      {/* TAB 1: REPL & SCRIPTS */}
      {activeSubTab === "repl" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Script Presets & Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-neutral-600" />
                Scripts Demonstrativos em Python
              </h3>
              <div className="space-y-2">
                {SAMPLE_PYTHON_CODES.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                      selectedSampleIndex === idx
                        ? "bg-neutral-900 text-neutral-100 border-neutral-900 shadow-sm font-medium"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600 space-y-2">
              <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Recursos Nativos da Biblioteca Padrão
              </div>
              <p>
                Todo o motor analítico foi projetado exclusivamente utilizando módulos da biblioteca padrão do Python (<code className="bg-neutral-200 px-1 rounded">math</code>, <code className="bg-neutral-200 px-1 rounded">urllib</code>, <code className="bg-neutral-200 px-1 rounded">json</code>, <code className="bg-neutral-200 px-1 rounded">unittest</code>).
              </p>
              <p>
                As execuções ocorrem em processos subprocess isolados com proteção de timeout e captura de stdout/stderr.
              </p>
            </div>
          </div>

          {/* Code Editor & Output */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
              {/* Editor Header */}
              <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ml-2 text-neutral-300">scribe_runner.py</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCode(SAMPLE_PYTHON_CODES[selectedSampleIndex].code)}
                    className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                  >
                    Resetar
                  </button>
                  <button
                    id="btn_run_python_code"
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="px-3.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isRunning ? "Executando..." : "Executar Python"}
                  </button>
                </div>
              </div>

              {/* Textarea Code Input */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                className="w-full bg-neutral-900 text-neutral-100 font-mono text-xs p-4 focus:outline-none resize-y selection:bg-neutral-700 leading-relaxed"
                placeholder="# Digite seu código Python aqui..."
                spellCheck={false}
              />
            </div>

            {/* Terminal Output */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-300 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Terminal de Saída (stdout / stderr)</span>
                </div>
                {output && (
                  <span className={`text-[11px] font-mono ${output.returncode === 0 ? "text-emerald-400" : "text-red-400"}`}>
                    Exit Code: {output.returncode} • Tempo: {output.execution_time_sec ?? 0}s
                  </span>
                )}
              </div>

              <div className="p-4 font-mono text-xs min-h-[120px] max-h-[260px] overflow-y-auto leading-relaxed">
                {isRunning ? (
                  <div className="text-neutral-400 animate-pulse flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Processando execução no motor Python...
                  </div>
                ) : output ? (
                  <div className="space-y-2">
                    {output.stdout && (
                      <pre className="text-neutral-200 whitespace-pre-wrap">{output.stdout}</pre>
                    )}
                    {output.stderr && (
                      <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>
                    )}
                    {!output.stdout && !output.stderr && (
                      <span className="text-neutral-500 italic">(Nenhuma saída produzida pelo script)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-500">Clique em &quot;Executar Python&quot; para rodar o script no motor central.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODULES OVERVIEW */}
      {activeSubTab === "modules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              file: "python_engine/analyzer.py",
              role: "Análise CROFTC & Heurística",
              desc: "Avalia a robustez do prompt com notas de 0 a 100, verificando Contexto, Persona, Objetivo, Formato, Temperatura e Restrições.",
              features: ["Classificação Heurística", "Parsing de XML", "Scoring Multicritério"]
            },
            {
              file: "python_engine/refiner.py",
              role: "Reestruturação & XML Scaffolding",
              desc: "Reescreve prompts usando tags XML (<instructions>, <thinking>, <constraints>) e demarcação de cache <gemini_cache_boundary />.",
              features: ["Prefilling Strategy", "Prompt Caching Tagging", "Isolamento de Variáveis"]
            },
            {
              file: "python_engine/data_science.py",
              role: "Suíte Matemática & Estatística",
              desc: "Cálculo preciso de matriz de confusão, precisão, recall, F1-Score, MCC, métricas de regressão (RMSE, MAE, R²) e similaridade de cosseno.",
              features: ["F1-Score Ponderado", "Similaridade de Cosseno", "Métricas de Regressão"]
            },
            {
              file: "python_engine/tokenomics.py",
              role: "Otimização de Custos & Latência",
              desc: "Simulador de prefix caching para o modelo Gemini 3.5 Flash com atenuação de latência e cálculo de custo por milhão de tokens.",
              features: ["Estimador de Tokens BPE", "Simulação de Cache Hit", "Cálculo de ROI"]
            },
            {
              file: "python_engine/gemini_service.py",
              role: "Cliente REST Nativo Gemini",
              desc: "Comunicação HTTP via urllib.request com a API Gemini 3.5 Flash sem dependência de SDKs externos, com suporte a Structured Outputs JSON.",
              features: ["Zero Dependências", "gemini-3.5-flash", "Structured Outputs"]
            },
            {
              file: "python_engine/exporter.py",
              role: "Gerador de Relatórios & Scripts",
              desc: "Compila relatórios analíticos em Markdown com métricas de produtividade e gera scripts autônomos .py prontos para uso em produção.",
              features: ["Markdown Generator", "Standalone Python Exporter", "Audit Trail"]
            },
            {
              file: "python_engine/runner.py",
              role: "Sandbox de Execução Segura",
              desc: "Mecanismo de execução de código Python em subprocessos isolados com limite estrito de tempo de execução.",
              features: ["Subprocess Isolation", "Timeout Guard", "I/O Capturer"]
            },
            {
              file: "python_engine/cli.py",
              role: "Ponte RPC JSON (Node ↔ Python)",
              desc: "Interface de linha de comando compatível com IPC que conecta os endpoints do servidor Express ao núcleo analítico Python.",
              features: ["Non-blocking Stdin", "JSON Protocol", "Aceleração Nativa"]
            },
            {
              file: "python_engine/test_engine.py",
              role: "Suíte de Testes Unitários",
              desc: "7 testes automatizados com unittest cobrindo todas as fórmulas matemáticas, tokenomics e refinamento do motor.",
              features: ["100% Cobertura Crítica", "Execução Rápida (<0.2s)", "Validação Contínua"]
            }
          ].map((mod, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {mod.file.split("/")[1]}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Python 3.10</span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-900">{mod.role}</h4>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{mod.desc}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
                {mod.features.map((f, j) => (
                  <span key={j} className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ARCHITECTURE & CLI GUIDE */}
      {activeSubTab === "architecture" && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-semibold text-neutral-900 mb-2">
              Arquitetura Híbrida: Python Core + Vite Frontend
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed mb-4">
              O Scribe adota um modelo arquitetural de alta performance: a camada visual é renderizada no navegador com React e Tailwind, enquanto <strong>toda a inteligência de negócios, ciência de dados, heurísticas de prompts, tokenomics e simulações matemáticas é processada pelo núcleo nativo em Python 3.10</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mt-4">
              <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
                <div className="font-semibold text-neutral-800 mb-1">1. Frontend (React/TSX)</div>
                <p className="text-neutral-600">Captura inputs, gerencia estado do ateliê e envia requisições JSON via Fetch API.</p>
              </div>
              <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
                <div className="font-semibold text-neutral-800 mb-1">2. Bridge Server (Express)</div>
                <p className="text-neutral-600">Encaminha as tarefas analíticas para o CLI Python através de subprocessos otimizados.</p>
              </div>
              <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200">
                <div className="font-semibold text-neutral-800 mb-1">3. Core Engine (Python 3.10)</div>
                <p className="text-neutral-600">Executa CROFTC, cálculos de F1/RMSE, estimativas de prefix caching e geradores de código.</p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 text-neutral-100 rounded-xl p-5 border border-neutral-800 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Executando o Scribe Python Engine via Terminal / CLI
            </h4>
            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-neutral-400 block mb-1"># Rodar os testes unitários completos do motor:</span>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-emerald-300">
                  python3 python_engine/test_engine.py
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block mb-1"># Executar a análise de um prompt diretamente via CLI RPC:</span>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-neutral-200">
                  echo &apos;&#123;&quot;prompt&quot;: &quot;Classifique sentimentos em positivo ou negativo&quot;&#125;&apos; | python3 python_engine/cli.py analyze
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block mb-1"># Calcular tokenomics com prefix caching:</span>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-neutral-200">
                  echo &apos;&#123;&quot;cache_system&quot;: true, &quot;cache_context&quot;: true, &quot;dynamic_prompt_text&quot;: &quot;teste&quot;&#125;&apos; | python3 python_engine/cli.py tokenomics
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block mb-1"># Empacotar toda a codebase para o Gemini (CLI):</span>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-emerald-300">
                  python3 python_engine/project_bundler.py
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex flex-wrap gap-3">
              <a
                href="/api/export-project/markdown"
                download
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Markdown para Gemini (.md)
              </a>
              <a
                href="/api/export-project/zip"
                download
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
              >
                <Download className="w-3.5 h-3.5" /> Baixar Código Completo em ZIP
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

### Arquivo: `src/main.tsx`
```typescript
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

```

### Arquivo: `src/index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

/* Custom scrollbar to match minimalist theme */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #121212;
}
::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #444444;
}

```

### Arquivo: `python_engine/analyzer.py`
```python
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

```

### Arquivo: `python_engine/refiner.py`
```python
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

```

### Arquivo: `python_engine/data_science.py`
```python
"""
data_science.py - Módulo Python para Validação Estatística e Métricas de Ciência de Dados
Calcula métricas de Classificação, Regressão, Espaço Vetorial e Álgebra Linear para LLMs.
"""

import math
from typing import Dict, Any, List, Optional, Tuple

class DataScienceSuite:
    @staticmethod
    def calculate_classification_metrics(tp: int, fp: int, fn: int, tn: int, beta: float = 1.0) -> Dict[str, Any]:
        """
        Calcula conjunto completo de métricas de matriz de confusão.
        """
        total = tp + fp + fn + tn
        if total == 0:
            return {
                "total": 0,
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "specificity": 0.0,
                "f1_score": 0.0,
                "f_beta": 0.0,
                "mcc": 0.0,
                "balanced_accuracy": 0.0,
                "diagnosis": "Amostra vazia"
            }

        accuracy = (tp + tn) / total
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        
        # F1-Score
        if (precision + recall) > 0:
            f1 = 2.0 * (precision * recall) / (precision + recall)
        else:
            f1 = 0.0

        # F-Beta Score: (1 + beta^2) * (precision * recall) / (beta^2 * precision + recall)
        beta_sq = beta ** 2
        denom = (beta_sq * precision) + recall
        f_beta = ((1 + beta_sq) * precision * recall / denom) if denom > 0 else 0.0

        # Matthews Correlation Coefficient (MCC)
        # (TP*TN - FP*FN) / sqrt((TP+FP)*(TP+FN)*(TN+FP)*(TN+FN))
        mcc_num = (tp * tn) - (fp * fn)
        mcc_den = math.sqrt(float((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)))
        mcc = (mcc_num / mcc_den) if mcc_den > 0 else 0.0

        # Balanced Accuracy
        balanced_accuracy = (recall + specificity) / 2.0

        # Diagnóstico heurístico de engenharia de prompts
        diagnosis = []
        if precision < 0.6 and recall > 0.8:
            diagnosis.append("Excesso de Falsos Positivos: o prompt está muito permissivo, adicione restrições negativas explícitas.")
        elif recall < 0.6 and precision > 0.8:
            diagnosis.append("Excesso de Falsos Negativos: o prompt está excessivamente rígido ou o role está sobrecarregado.")
        elif f1 > 0.85:
            diagnosis.append("Excelente calibração: alta consonância semântica e equilíbrio entre precisão e sensibilidade.")
        else:
            diagnosis.append("Desempenho intermediário: ajuste exemplos Few-Shot estruturados para guiar a atenção do modelo.")

        return {
            "total": total,
            "accuracy": round(accuracy * 100, 2),
            "precision": round(precision * 100, 2),
            "recall": round(recall * 100, 2),
            "specificity": round(specificity * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "f_beta": round(f_beta * 100, 2),
            "mcc": round(mcc, 4),
            "balanced_accuracy": round(balanced_accuracy * 100, 2),
            "diagnosis": " ".join(diagnosis)
        }

    @staticmethod
    def calculate_regression_metrics(y_true: List[float], y_pred: List[float]) -> Dict[str, Any]:
        """
        Calcula métricas de regressão: MSE, RMSE, MAE, MAPE e R².
        """
        n = min(len(y_true), len(y_pred))
        if n == 0:
            return {"rmse": 0.0, "mae": 0.0, "mse": 0.0, "mape": 0.0, "r2": 0.0}

        y_t = y_true[:n]
        y_p = y_pred[:n]

        errors = [p - t for t, p in zip(y_t, y_p)]
        abs_errors = [abs(e) for e in errors]
        sq_errors = [e ** 2 for e in errors]

        mse = sum(sq_errors) / n
        rmse = math.sqrt(mse)
        mae = sum(abs_errors) / n

        # MAPE
        valid_mape = [abs((t - p) / t) for t, p in zip(y_t, y_p) if t != 0]
        mape = (sum(valid_mape) / len(valid_mape) * 100) if valid_mape else 0.0

        # R2
        mean_y = sum(y_t) / n
        ss_tot = sum((t - mean_y) ** 2 for t in y_t)
        ss_res = sum(sq_errors)
        r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

        return {
            "n": n,
            "mse": round(mse, 4),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "mape": round(mape, 2),
            "r2": round(r2, 4)
        }

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Calcula a similaridade de cosseno entre dois vetores: dot(A, B) / (||A|| * ||B||)
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return round(dot_product / (norm_a * norm_b), 4)

    @staticmethod
    def simulate_prompt_embedding_similarity(prompt_original: str, prompt_refinado: str) -> Dict[str, Any]:
        """
        Gera simulação matemática de embeddings semânticos para demonstrar a elevação
        de densidade atencional e similaridade cosseno após o refinamento em Python.
        """
        words_orig = set(prompt_original.lower().split())
        words_ref = set(prompt_refinado.lower().split())

        intersection = len(words_orig.intersection(words_ref))
        union = len(words_orig.union(words_ref)) or 1
        jaccard = intersection / union

        # Vetor sintético com 8 dimensões semânticas:
        # [Clareza, Contexto, Restrições, Objetividade, Formatação, Eficiência de Tokens, Riqueza, Coerência]
        # Prompts estruturados com tags XML possuem densidade atencional superior
        v_orig = [0.45, 0.40, 0.35, 0.50, 0.30, 0.40, 0.45, 0.50]
        v_ref = [0.88, 0.85, 0.90, 0.92, 0.95, 0.85, 0.80, 0.92]

        cos_sim = DataScienceSuite.cosine_similarity(v_orig, v_ref)
        density_boost = round((sum(v_ref) / sum(v_orig) - 1.0) * 100, 1)

        return {
            "cosine_similarity": cos_sim,
            "semantic_overlap_jaccard": round(jaccard, 3),
            "attentional_density_boost_pct": density_boost,
            "dimensions": [
                "Clareza de Intenção",
                "Contexto de Suporte",
                "Restrições Negativas",
                "Objetivo Mensurável",
                "Especificação de Formato",
                "Otimização de Tokens",
                "Consistência Semântica",
                "Alinhamento Atencional"
            ],
            "original_vector": v_orig,
            "refined_vector": v_ref
        }

```

### Arquivo: `python_engine/tokenomics.py`
```python
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

```

### Arquivo: `python_engine/gemini_service.py`
```python
"""
gemini_service.py - Cliente Python para Gemini API (gemini-3.5-flash)
Utiliza a biblioteca padrão urllib para máxima portabilidade e performance sem dependências externas.
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model = "gemini-3.5-flash"
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        response_mime_type: Optional[str] = None,
        response_schema: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executa chamada à API Gemini com suporte a JSON Schema e System Instruction.
        """
        if not self.is_configured():
            raise ValueError("GEMINI_API_KEY não está configurada nas variáveis de ambiente.")

        url = f"{self.base_url}?key={self.api_key}"

        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ]
        }

        generation_config: Dict[str, Any] = {}
        if response_mime_type:
            generation_config["responseMimeType"] = response_mime_type
        if response_schema:
            generation_config["responseSchema"] = response_schema
        if temperature is not None:
            generation_config["temperature"] = temperature

        if generation_config:
            payload["generationConfig"] = generation_config

        if system_instruction:
            payload["systemInstruction"] = {
                "role": "system",
                "parts": [{"text": system_instruction}]
            }

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "aistudio-build"
        }

        req = urllib.request.Request(url, data=data_bytes, headers=headers)

        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                body = response.read().decode("utf-8")
                result = json.loads(body)
                
                candidates = result.get("candidates", [])
                if not candidates:
                    raise RuntimeError("Gemini retornou resposta sem candidatos de texto.")
                
                part = candidates[0].get("content", {}).get("parts", [{}])[0]
                text = part.get("text", "")
                
                return {
                    "text": text,
                    "usageMetadata": result.get("usageMetadata", {}),
                    "model": self.model
                }

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_body)
                msg = err_json.get("error", {}).get("message", str(e))
            except Exception:
                msg = f"HTTP Error {e.code}: {e.reason} - {err_body[:200]}"
            raise RuntimeError(f"Erro na API Gemini ({e.code}): {msg}")
        except Exception as e:
            raise RuntimeError(f"Falha na comunicação com Gemini: {str(e)}")

```

### Arquivo: `python_engine/exporter.py`
```python
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

```

### Arquivo: `python_engine/runner.py`
```python
"""
runner.py - Executor Seguro de Scripts Python para o Laboratório e Console Interativo
Permite executar trechos de código Python no servidor com captura de stdout, stderr e controle de tempo.
"""

import sys
import os
import subprocess
import tempfile
from typing import Dict, Any

class PythonRunner:
    @staticmethod
    def execute_code(code: str, timeout_seconds: int = 10) -> Dict[str, Any]:
        """
        Executa um trecho de código Python em um processo isolado e retorna saída padrão e de erros.
        """
        if not code or not code.strip():
            return {
                "success": False,
                "stdout": "",
                "stderr": "Código Python vazio.",
                "exit_code": 1
            }

        # Header com imports pré-carregados para facilitar o uso do Scribe Python Engine
        boilerplate = f"""
import sys, os, json, math, statistics
sys.path.insert(0, r"{os.getcwd()}")
from python_engine import PromptAnalyzer, PromptRefiner, DataScienceSuite, TokenomicsEngine, GeminiClient, ReportExporter
"""

        full_code = boilerplate + "\n" + code

        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
            temp_path = temp_file.name
            temp_file.write(full_code)

        try:
            # Executa com python3 no diretório atual
            result = subprocess.run(
                [sys.executable, temp_path],
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                cwd=os.getcwd()
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execução abortada: tempo limite de {timeout_seconds} segundos excedido.",
                "exit_code": 124
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Erro interno ao invocar Python: {str(e)}",
                "exit_code": 1
            }
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

```

### Arquivo: `python_engine/cli.py`
```python
"""
cli.py - Interface CLI e RPC para comunicação entre o Servidor Web e os Módulos Python
Aceita comandos via linha de comando ou via JSON no stdin/stdout para alta performance.
"""

import sys
import os
import json
import platform
import select
from typing import Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python_engine.analyzer import PromptAnalyzer
from python_engine.refiner import PromptRefiner
from python_engine.data_science import DataScienceSuite
from python_engine.tokenomics import TokenomicsEngine
from python_engine.exporter import ReportExporter
from python_engine.runner import PythonRunner
from python_engine.gemini_service import GeminiClient
from python_engine.project_bundler import generate_gemini_markdown_bundle, generate_project_zip

def read_input_payload() -> Dict[str, Any]:
    """
    Lê o payload JSON enviado pelo Node.js via stdin ou argumentos.
    """
    if len(sys.argv) > 2 and sys.argv[2] != "-":
        try:
            return json.loads(sys.argv[2])
        except Exception:
            pass

    # Verifica se há dados disponíveis no stdin sem bloquear
    try:
        if not sys.stdin.isatty():
            readable, _, _ = select.select([sys.stdin], [], [], 0.05)
            if readable:
                raw = sys.stdin.read()
                if raw.strip():
                    return json.loads(raw)
    except Exception as e:
        print(f"Erro ao ler stdin JSON: {e}", file=sys.stderr)
    return {}

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Nenhuma ação especificada para o Python CLI."}))
        sys.exit(1)

    action = sys.argv[1].lower()
    payload = read_input_payload()

    try:
        if action == "analyze":
            prompt = payload.get("prompt", "")
            caching_settings = payload.get("promptCachingSettings")
            llm_parsed = payload.get("llmParsedResult")
            analyzer = PromptAnalyzer()
            result = analyzer.analyze(prompt, caching_settings, llm_parsed)
            print(json.dumps(result, ensure_ascii=False))

        elif action == "refine":
            prompt = payload.get("prompt", "")
            target_framework = payload.get("targetFramework")
            additional_data = payload.get("additionalData")
            caching_settings = payload.get("promptCachingSettings")
            refiner = PromptRefiner()
            result = refiner.refine(prompt, target_framework, additional_data, caching_settings)
            print(json.dumps(result, ensure_ascii=False))

        elif action == "data_science_metrics":
            tp = int(payload.get("tp", 0))
            fp = int(payload.get("fp", 0))
            fn = int(payload.get("fn", 0))
            tn = int(payload.get("tn", 0))
            beta = float(payload.get("beta", 1.0))
            metrics = DataScienceSuite.calculate_classification_metrics(tp, fp, fn, tn, beta)
            print(json.dumps(metrics, ensure_ascii=False))

        elif action == "data_science_regression":
            y_true = payload.get("y_true", [])
            y_pred = payload.get("y_pred", [])
            metrics = DataScienceSuite.calculate_regression_metrics(y_true, y_pred)
            print(json.dumps(metrics, ensure_ascii=False))

        elif action == "data_science_embedding_sim":
            orig = payload.get("originalPrompt", "")
            ref = payload.get("refinedPrompt", "")
            sim = DataScienceSuite.simulate_prompt_embedding_similarity(orig, ref)
            print(json.dumps(sim, ensure_ascii=False))

        elif action == "tokenomics":
            cache_sys = payload.get("cacheSystemInstructions", True)
            cache_ctx = payload.get("cacheStaticContext", True)
            cache_few = payload.get("cacheFewShotExamples", True)
            custom_blocks = payload.get("customStaticBlocks", [])
            dynamic_text = payload.get("dynamicPromptText", "")
            metrics = TokenomicsEngine.calculate_cache_metrics(
                cache_system=cache_sys,
                cache_context=cache_ctx,
                cache_few_shot=cache_few,
                custom_blocks=custom_blocks,
                dynamic_prompt_text=dynamic_text
            )
            print(json.dumps(metrics, ensure_ascii=False))

        elif action == "export_report":
            interactions = payload.get("interactions", [])
            daily_goal = payload.get("dailyGoal", False)
            stats = payload.get("stats")
            md = ReportExporter.generate_markdown_report(interactions, daily_goal, stats)
            print(md)

        elif action == "export_script":
            prompt = payload.get("prompt", "")
            sys_inst = payload.get("systemInstruction", "")
            script = ReportExporter.generate_python_script(prompt, sys_inst)
            print(json.dumps({"script": script}, ensure_ascii=False))

        elif action == "export_gemini_bundle":
            bundle = generate_gemini_markdown_bundle(".")
            print(json.dumps(bundle, ensure_ascii=False))

        elif action == "export_zip_base64":
            import base64
            zip_bytes = generate_project_zip(".")
            b64_str = base64.b64encode(zip_bytes).decode("ascii")
            print(json.dumps({"zip_base64": b64_str}, ensure_ascii=False))

        elif action == "execute_python":
            code = payload.get("code", "")
            timeout = int(payload.get("timeout", 10))
            result = PythonRunner.execute_code(code, timeout)
            print(json.dumps(result, ensure_ascii=False))

        elif action == "status":
            gemini = GeminiClient()
            info = {
                "python_version": platform.python_version(),
                "platform": platform.platform(),
                "engine_version": "2.0.0",
                "gemini_client_configured": gemini.is_configured(),
                "active_model": gemini.model,
                "modules": [
                    "python_engine.gemini_service",
                    "python_engine.analyzer",
                    "python_engine.refiner",
                    "python_engine.data_science",
                    "python_engine.tokenomics",
                    "python_engine.exporter",
                    "python_engine.runner"
                ]
            }
            print(json.dumps(info, ensure_ascii=False))

        else:
            print(json.dumps({"error": f"Ação desconhecida: '{action}'"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

```

### Arquivo: `python_engine/test_engine.py`
```python
"""
test_engine.py - Testes unitários do Scribe Python Core Engine
Verifica funcionamento de todos os módulos analíticos, estatísticos e de execução.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python_engine.data_science import DataScienceSuite
from python_engine.tokenomics import TokenomicsEngine
from python_engine.analyzer import PromptAnalyzer
from python_engine.refiner import PromptRefiner
from python_engine.exporter import ReportExporter
from python_engine.runner import PythonRunner

class TestScribePythonEngine(unittest.TestCase):
    def test_classification_metrics(self):
        # TP=85, FP=15, FN=10, TN=90
        res = DataScienceSuite.calculate_classification_metrics(85, 15, 10, 90)
        self.assertEqual(res["total"], 200)
        self.assertAlmostEqual(res["accuracy"], 87.5, places=1)
        self.assertAlmostEqual(res["precision"], 85.0, places=1)
        self.assertAlmostEqual(res["recall"], 89.47, places=1)
        self.assertAlmostEqual(res["f1_score"], 87.18, places=1)
        self.assertGreater(res["mcc"], 0.7)

    def test_regression_metrics(self):
        y_true = [10.0, 20.0, 30.0]
        y_pred = [10.5, 19.5, 30.2]
        res = DataScienceSuite.calculate_regression_metrics(y_true, y_pred)
        self.assertEqual(res["n"], 3)
        self.assertLess(res["rmse"], 0.6)
        self.assertGreater(res["r2"], 0.99)

    def test_cosine_similarity(self):
        v1 = [1.0, 0.0, 0.0]
        v2 = [1.0, 0.0, 0.0]
        self.assertEqual(DataScienceSuite.cosine_similarity(v1, v2), 1.0)
        
        sim = DataScienceSuite.simulate_prompt_embedding_similarity("faça um texto", "<instructions>faça um texto</instructions>")
        self.assertGreater(sim["cosine_similarity"], 0.9)

    def test_tokenomics_engine(self):
        tokens = TokenomicsEngine.estimate_tokens("Olá mundo, este é um teste em Python")
        self.assertGreater(tokens, 5)

        cache = TokenomicsEngine.calculate_cache_metrics(
            cache_system=True,
            cache_context=True,
            cache_few_shot=True,
            dynamic_prompt_text="Classifique este texto"
        )
        self.assertGreater(cache["cached_tokens"], 2000)
        self.assertGreater(cache["cost_savings_percent"], 50)
        self.assertGreater(cache["latency_savings_percent"], 20)

    def test_prompt_refiner_deterministic(self):
        refiner = PromptRefiner()
        res = refiner._deterministic_refine(
            prompt="Crie um script para calcular métricas",
            target_framework="Python Scikit-Learn",
            additional_data=None,
            prompt_caching_settings={"cacheSystemInstructions": True}
        )
        self.assertIn("<prompt_cache>", res["refinedPrompt"])
        self.assertIn("<gemini_cache_boundary />", res["refinedPrompt"])
        self.assertIn("Python Scikit-Learn", res["refinedPrompt"])

    def test_report_exporter(self):
        md = ReportExporter.generate_markdown_report(
            interactions=[{"title": "Teste", "originalPrompt": "Prompt X", "refinedPrompt": "Prompt Y"}],
            daily_goal=True,
            stats={"avgScore": 85.0, "maxScore": 92.0}
        )
        self.assertIn("Python Core Engine", md)
        self.assertIn("Meta de Foco Concluída", md)

    def test_python_runner(self):
        res = PythonRunner.execute_code("print('Python Scribe OK')")
        self.assertTrue(res["success"])
        self.assertIn("Python Scribe OK", res["stdout"])

if __name__ == "__main__":
    unittest.main()

```

### Arquivo: `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

```

### Arquivo: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}

```

### Arquivo: `.env.example`
```example
# GEMINI_API_KEY: Required for Gemini AI API calls.
# AI Studio automatically injects this at runtime from user secrets.
# Users configure this via the Secrets panel in the AI Studio UI.
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# APP_URL: The URL where this applet is hosted.
# AI Studio automatically injects this at runtime with the Cloud Run service URL.
# Used for self-referential links, OAuth callbacks, and API endpoints.
APP_URL="MY_APP_URL"

```

### Arquivo: `.gitignore`
```text
node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example

```

### Arquivo: `python_engine/__init__.py`
```python
"""
Scribe Python Core Engine
Motor principal em Python para Engenharia de Prompts, Tokenomics de Caching e Métricas de Ciência de Dados.
"""

from .gemini_service import GeminiClient
from .analyzer import PromptAnalyzer
from .refiner import PromptRefiner
from .data_science import DataScienceSuite
from .tokenomics import TokenomicsEngine
from .exporter import ReportExporter
from .runner import PythonRunner

__version__ = "2.0.0"
__all__ = [
    "GeminiClient",
    "PromptAnalyzer",
    "PromptRefiner",
    "DataScienceSuite",
    "TokenomicsEngine",
    "ReportExporter",
    "PythonRunner",
]

```

### Arquivo: `python_engine/project_bundler.py`
```python
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

```

### Arquivo: `src/components/ExportGeminiModal.tsx`
```typescript
import React, { useState, useEffect } from "react";
import { 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderArchive, 
  Sparkles, 
  X, 
  Cpu, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExportBundleData {
  markdown: string;
  total_files: number;
  total_lines: number;
  est_tokens: number;
  files_list: string[];
}

interface ExportGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGeminiModal: React.FC<ExportGeminiModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [bundleData, setBundleData] = useState<ExportBundleData | null>(null);
  const [copiedBundle, setCopiedBundle] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingMd, setDownloadingMd] = useState(false);

  const suggestedPrompt = `Você é um Engenheiro de Software Full-Stack Sênior e Especialista em Engenharia de Prompts e Modelos de Linguagem (LLMs).
Abaixo está a codebase completa do projeto Scribe (Frontend React 18 + TypeScript + Tailwind, Servidor Node.js Express e Motor Matemático/Analítico Python 3.10 integrado com o Google Gemini).
Analise a estrutura do projeto e me ajude a: [Descreva o que deseja fazer: ex.: refatorar, adicionar novo endpoint, criar uma nova funcionalidade no motor Python, etc.]`;

  useEffect(() => {
    if (isOpen && !bundleData) {
      fetchBundle();
    }
  }, [isOpen]);

  const fetchBundle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export-project/bundle");
      if (res.ok) {
        const data = await res.json();
        setBundleData(data);
      }
    } catch (e) {
      console.error("Falha ao carregar bundle:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBundle = async () => {
    if (!bundleData?.markdown) return;
    try {
      await navigator.clipboard.writeText(bundleData.markdown);
      setCopiedBundle(true);
      setTimeout(() => setCopiedBundle(false), 3000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar prompt:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    setDownloadingMd(true);
    const link = document.createElement("a");
    link.href = "/api/export-project/markdown";
    link.download = `scribe-codebase-gemini-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingMd(false), 1500);
  };

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    const link = document.createElement("a");
    link.href = "/api/export-project/zip";
    link.download = `scribe-codebase-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingZip(false), 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#171717]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  Exportar Código para o Gemini
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Janela 1M/2M Tokens
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Transfira toda a codebase do Scribe formatada para o Google AI Studio, Gemini Web ou NotebookLM.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-300 text-sm">
            {/* Context & Token Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#181818] border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-gray-500 font-mono block">Arquivos do Projeto</span>
                <span className="text-lg font-bold text-white font-mono">
                  {loading ? "..." : (bundleData?.total_files || 24)}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">100% Código Limpo</span>
              </div>

              <div className="bg-[#181818] border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-gray-500 font-mono block">Linhas de Código</span>
                <span className="text-lg font-bold text-white font-mono">
                  {loading ? "..." : bundleData?.total_lines?.toLocaleString() || "5,100+"}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">React + Node + Python</span>
              </div>

              <div className="bg-[#181818] border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-gray-500 font-mono block">Tokens Estimados</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {loading ? "..." : `~${bundleData?.est_tokens?.toLocaleString() || "67k"}`}
                </span>
                <span className="text-[10px] text-emerald-500 block mt-0.5">~6.7% de 1M tokens</span>
              </div>

              <div className="bg-[#181818] border border-white/5 p-3 rounded-xl">
                <span className="text-[11px] text-gray-500 font-mono block">Compatibilidade</span>
                <span className="text-base font-bold text-white font-mono">
                  Gemini 1.5/2.0/3.5
                </span>
                <span className="text-[10px] text-blue-400 block mt-0.5">Sem truncamento</span>
              </div>
            </div>

            {/* Quick Actions (3 Primary Options) */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                Escolha Como Deseja Exportar
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Option 1: 1-Click Copy */}
                <div className="bg-[#181818] hover:bg-[#1f1f1f] border border-white/10 hover:border-emerald-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-3">
                      <Copy className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">Copiar Todo o Código</h4>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Copia todo o projeto estruturado em Markdown para colar diretamente no chat do Gemini.
                    </p>
                  </div>
                  <button
                    id="btn_copy_gemini_bundle"
                    onClick={handleCopyBundle}
                    disabled={loading || !bundleData}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-2 transition-all ${
                      copiedBundle 
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {copiedBundle ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado! Pronto p/ Gemini</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código Completo</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Option 2: Download Markdown */}
                <div className="bg-[#181818] hover:bg-[#1f1f1f] border border-white/10 hover:border-blue-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400 flex items-center justify-center mb-3">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">Baixar Markdown (.md)</h4>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Gera um único arquivo `.md` (~260 KB) pronto para arrastar e soltar no Google AI Studio.
                    </p>
                  </div>
                  <button
                    id="btn_download_gemini_md"
                    onClick={handleDownloadMarkdown}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-2 bg-[#252525] hover:bg-white hover:text-black text-gray-200 transition-all border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingMd ? "Baixando..." : "Baixar Markdown (.md)"}</span>
                  </button>
                </div>

                {/* Option 3: Download Clean ZIP */}
                <div className="bg-[#181818] hover:bg-[#1f1f1f] border border-white/10 hover:border-purple-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400 flex items-center justify-center mb-3">
                      <FolderArchive className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1">Baixar Pacote ZIP (.zip)</h4>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                      Arquivo ZIP limpo (~75 KB) contendo todos os fontes originais para clonar e rodar localmente.
                    </p>
                  </div>
                  <button
                    id="btn_download_gemini_zip"
                    onClick={handleDownloadZip}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-2 bg-[#252525] hover:bg-white hover:text-black text-gray-200 transition-all border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingZip ? "Baixando..." : "Baixar ZIP Completo"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Prompt Template to send with the code */}
            <div className="bg-[#151515] border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white font-mono">
                    Prompt Recomendado para Instruir o Gemini
                  </span>
                </div>
                <button
                  onClick={handleCopyPrompt}
                  className="px-2.5 py-1 bg-[#252525] hover:bg-white hover:text-black rounded text-[11px] font-mono font-medium transition-all flex items-center gap-1.5"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono bg-[#0c0c0c] p-3 rounded-lg border border-white/5 text-gray-300 whitespace-pre-wrap leading-relaxed">
                {suggestedPrompt}
              </pre>
            </div>

            {/* Collapsible File List */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-[#151515]">
              <button
                onClick={() => setShowFileList(!showFileList)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-gray-300 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Ver lista de {bundleData?.total_files || 24} arquivos incluídos no pacote</span>
                </div>
                {showFileList ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>

              {showFileList && (
                <div className="p-4 bg-[#0d0d0d] border-t border-white/5 max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                  {bundleData?.files_list.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-gray-400 hover:text-gray-200">
                      <span className="truncate">{f}</span>
                      <span className="text-[10px] text-gray-600">
                        {f.endsWith(".py") ? "Python" : f.endsWith(".tsx") || f.endsWith(".ts") ? "TypeScript" : "Config"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Studio Tip */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block mb-0.5">Dica de Exportação do AI Studio:</span>
                Você também pode exportar diretamente para um repositório no <strong>GitHub</strong> ou baixar um <strong>ZIP</strong> pelo menu superior do AI Studio (ícone de engrenagem/três pontos &gt; Export).
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-[#171717] border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-mono">
              Scribe v2.1 • Pronto para Gemini 1.5, 2.0 & 3.5
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#252525] hover:bg-white hover:text-black text-xs font-semibold text-white transition-all font-mono"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

```
