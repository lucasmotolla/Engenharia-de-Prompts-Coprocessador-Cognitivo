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
