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
