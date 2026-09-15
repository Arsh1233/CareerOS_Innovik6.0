"""Specialist AI agents (ARIA, Career Twin, Resume, Learning, ECHO, Job).

Not implemented yet. Agents are expected to:

- receive already-authorised context (never raw client payloads),
- return typed results validated by a Pydantic schema,
- record provider/model/latency for observability,
- surface failures instead of returning fixture data.

Orchestration of multi-step agent workflows belongs to `n8n/workflows/`.
"""
