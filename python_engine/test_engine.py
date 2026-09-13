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
