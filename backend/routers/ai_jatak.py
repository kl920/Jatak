"""
AI Ja Tak router — generates title + description suggestions
using top-performing examples from same category as few-shot context.
"""
from __future__ import annotations

import base64
import json
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from database import get_conn

router = APIRouter(prefix="/api/ai", tags=["ai"])


# ── Response schemas ────────────────────────────────────────────────────────

class JatakExample(BaseModel):
    title: str
    description: str
    jatak_count: int
    price: float
    has_emoji: bool


class SuggestResponse(BaseModel):
    suggestions: list[dict]          # [{title, description}]
    examples_used: int
    examples: list[JatakExample]


# ── Helper: fetch top examples from DuckDB ──────────────────────────────────

def _fetch_examples(category: str, limit: int = 15) -> list[JatakExample]:
    conn = get_conn()

    # Use median jatak_count for category as threshold (quality filter)
    median_row = conn.execute(
        """
        SELECT MEDIAN(jatak_count)
        FROM jatak
        WHERE category = ?
          AND title IS NOT NULL
          AND description IS NOT NULL
          AND LENGTH(TRIM(title)) > 3
          AND LENGTH(TRIM(description)) > 10
        """,
        [category],
    ).fetchone()
    median_count = float(median_row[0]) if median_row and median_row[0] else 5.0

    rows = conn.execute(
        """
        SELECT title, description, jatak_count, price, has_emoji
        FROM jatak
        WHERE category = ?
          AND jatak_count >= ?
          AND title IS NOT NULL
          AND description IS NOT NULL
          AND LENGTH(TRIM(title)) > 3
          AND LENGTH(TRIM(description)) > 10
        ORDER BY jatak_count DESC
        LIMIT ?
        """,
        [category, median_count, limit],
    ).fetchall()

    return [
        JatakExample(
            title=r[0],
            description=r[1],
            jatak_count=int(r[2]),
            price=float(r[3]) if r[3] else 0.0,
            has_emoji=bool(r[4]),
        )
        for r in rows
    ]


# ── Helper: build GPT prompt ────────────────────────────────────────────────

def _build_system_prompt(category: str, examples: list[JatakExample]) -> str:
    examples_text = ""
    for i, ex in enumerate(examples, 1):
        examples_text += (
            f"\nEksempel {i} ({ex.jatak_count} ja tak, {ex.price:.0f} kr):\n"
            f"  Titel: {ex.title}\n"
            f"  Beskrivelse: {ex.description}\n"
        )

    return f"""Du er ekspert i at skrive catchy og effektive Ja Tak-tilbud til Coop-butikker i Danmark (f.eks. Kvickly, SuperBrugsen, Dagli'Brugsen, LokalBrugsen).

Kategori: {category}

Her er {len(examples)} eksempler på velperformende Ja Tak-tilbud i denne kategori:
{examples_text}

Din opgave er at generere 3 forslag til titel og beskrivelse for et nyt Ja Tak-tilbud.

REGLER:
- Titlen skal være maks 80 tegn og fængende
- Brug emojis i samme stil som eksemplerne (hvis mange emojis, brug emojis; hvis ingen, undgå)
- Beskriv pris, mængde og evt. afhentningsfrist tydeligt
- Brug dansk sprog og samme tone som eksemplerne
- Beskrivelsen typisk 2-6 linjer
- Lav 3 different stilistiske varianter (f.eks. emoji-tung, mere sober, kort/direkte)

Returner KUN gyldig JSON i dette format (ingen markdown, ingen forklaring):
{{
  "suggestions": [
    {{"title": "...", "description": "..."}},
    {{"title": "...", "description": "..."}},
    {{"title": "...", "description": "..."}}
  ]
}}"""


# ── Main endpoint ───────────────────────────────────────────────────────────

@router.post("/suggest", response_model=SuggestResponse)
async def suggest(
    category: str = Form(...),
    product_name: str = Form(...),
    price: Optional[str] = Form(None),
    extra_info: Optional[str] = Form(None),
    api_key: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """
    Generate Ja Tak title + description suggestions using GPT-4o.
    Uses top-performing examples from the same category as few-shot context.
    The OpenAI API key is provided by the caller (stored in browser localStorage).
    """
    if not api_key or not api_key.startswith("sk-"):
        raise HTTPException(status_code=400, detail="Ugyldig OpenAI API-nøgle")

    # 1. Fetch top examples
    examples = _fetch_examples(category, limit=15)
    if len(examples) < 3:
        raise HTTPException(
            status_code=404,
            detail=f"Ikke nok data i kategorien '{category}' til at generere forslag",
        )

    # 2. Build user message
    user_parts: list[dict] = []

    price_str = f" til {price} kr" if price else ""
    info_str = f"\nEkstra info: {extra_info}" if extra_info else ""
    user_text = (
        f"Lav 3 Ja Tak-forslag for: {product_name}{price_str}"
        f"{info_str}\n"
        f"Brug de ovenstående eksempler som inspiration til tone og stil."
    )

    # Add image if provided
    if image and image.filename:
        img_bytes = await image.read()
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        content_type = image.content_type or "image/jpeg"
        user_parts = [
            {"type": "text", "text": user_text},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{content_type};base64,{img_b64}",
                    "detail": "low",
                },
            },
        ]
    else:
        user_parts = [{"type": "text", "text": user_text}]

    # 3. Call GPT-4o
    try:
        from openai import OpenAI  # lazy import

        client = OpenAI(api_key=api_key)
        system_prompt = _build_system_prompt(category, examples)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_parts},
            ],
            temperature=0.85,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        suggestions = data.get("suggestions", [])

        if not suggestions:
            raise ValueError("GPT returned empty suggestions")

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI-fejl: {str(exc)}",
        )

    return SuggestResponse(
        suggestions=suggestions,
        examples_used=len(examples),
        examples=examples,
    )


# ── Endpoint: list available categories ────────────────────────────────────

@router.get("/categories")
def ai_categories():
    """Return categories with example counts (for the AI Ja Tak dropdown)."""
    conn = get_conn()
    rows = conn.execute(
        """
        SELECT category, COUNT(*) AS cnt, MEDIAN(jatak_count) AS med_jatak
        FROM jatak
        WHERE title IS NOT NULL AND description IS NOT NULL
        GROUP BY category
        ORDER BY cnt DESC
        """
    ).fetchall()
    return [
        {"category": r[0], "example_count": int(r[1]), "median_jatak": round(float(r[2]), 1)}
        for r in rows
    ]
