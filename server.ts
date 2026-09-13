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
