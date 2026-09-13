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
