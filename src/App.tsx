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
