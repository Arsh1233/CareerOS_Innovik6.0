"""Jina AI web reader integration.

Uses https://r.jina.ai/{url} as a free, no-key proxy that renders JavaScript
pages and returns clean markdown. Works for job boards, course catalogs, etc.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger("careeros.web_reader")

_JINA_BASE = "https://r.jina.ai/"
_TIMEOUT = 30.0
_HEADERS = {
    "Accept": "text/markdown,text/plain,*/*",
    "X-Timeout": "25",
    "X-Remove-Selector": "header,footer,nav,.cookie-banner,#cookie-modal",
    "X-Return-Format": "markdown",
}


class WebReader:
    """Fetch and clean public web pages via Jina AI reader (free, no API key)."""

    async def fetch(self, url: str, *, max_chars: int = 8000) -> str:
        """Return markdown content of a public URL, truncated to max_chars."""
        jina_url = f"{_JINA_BASE}{url}"
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.get(jina_url, headers=_HEADERS, follow_redirects=True)
                response.raise_for_status()
                content = response.text
                if len(content) > max_chars:
                    content = content[:max_chars] + "\n...[truncated]"
                logger.info("web_reader_fetch url=%s chars=%d", url, len(content))
                return content
        except httpx.TimeoutException:
            logger.warning("web_reader_timeout url=%s", url)
            return ""
        except httpx.HTTPError as exc:
            logger.warning("web_reader_error url=%s error=%s", url, exc)
            return ""

    async def fetch_multi(self, urls: list[str], *, max_chars: int = 6000) -> list[str]:
        """Fetch multiple URLs concurrently."""
        import asyncio
        tasks = [self.fetch(url, max_chars=max_chars) for url in urls]
        return await asyncio.gather(*tasks)


_reader: WebReader | None = None


def get_web_reader() -> WebReader:
    global _reader
    if _reader is None:
        _reader = WebReader()
    return _reader
