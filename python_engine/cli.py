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
