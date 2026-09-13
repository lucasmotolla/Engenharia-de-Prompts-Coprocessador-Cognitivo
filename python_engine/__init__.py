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
