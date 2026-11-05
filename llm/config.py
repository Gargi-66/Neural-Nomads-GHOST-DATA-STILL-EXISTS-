from __future__ import annotations

import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


@dataclass(frozen=True)
class GeminiConfig:
    api_key: str
    model: str
    embedding_model: str

    @classmethod
    def from_env(cls) -> "GeminiConfig":
        if load_dotenv is not None:
            load_dotenv()
        return cls(
            api_key=os.getenv("GEMINI_API_KEY", "").strip(),
            model=os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip() or "gemini-flash-latest",
            embedding_model=os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001").strip() or "gemini-embedding-001",
        )

    def validate(self) -> None:
        if not self.api_key:
            raise RuntimeError("Missing GEMINI_API_KEY. Set it in the environment or a local .env file.")
