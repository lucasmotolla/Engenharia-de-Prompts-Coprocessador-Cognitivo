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
