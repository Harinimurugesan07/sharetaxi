"""
AI Assistant service — generates blog drafts (title, excerpt, content) with
Claude, for the "AI Assistant" tab in Blog Management.

Requires ANTHROPIC_API_KEY to be set in the environment. Install with:
    pip install anthropic
"""
import json
import os

try:
    from anthropic import Anthropic, APIError
except ImportError:  # pragma: no cover - optional dependency in dev/test setups
    Anthropic = None
    APIError = Exception

_client = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        if Anthropic is None:
            raise RuntimeError(
                "Anthropic SDK is not installed. Install the optional 'anthropic' dependency to enable AI blog drafting."
            )
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to your .env file."
            )
        _client = Anthropic(api_key=api_key)
    return _client


SYSTEM_PROMPT = """You are a content writer for ShareTaxi, a ride-sharing \
and carpooling platform's blog. Write warm, specific, non-generic copy \
about shared rides, commuting, fare-splitting, driver safety, city travel, \
and life as a rider or driver — concrete, real-world detail over marketing \
fluff. Always respond with ONLY a JSON object (no markdown fences, no \
preamble) matching this exact shape:

{
  "title": "string, under 70 characters",
  "excerpt": "string, 1-2 sentences, under 200 characters",
  "content": "string, HTML-free plain text with \\n\\n between paragraphs, 4-7 paragraphs",
  "category": "string, one short category name",
  "suggestedTags": ["string", "string", "string"]
}
"""


def generate_blog_draft(
    topic: str,
    tone: str = "friendly",
    keywords: str | None = None,
    target_category: str | None = None,
    model: str = "claude-sonnet-4-6",
) -> dict:
    """
    Calls Claude to draft a blog post. Returns a dict with
    title / excerpt / content / category / suggestedTags.

    Raises RuntimeError on missing API key, and ValueError if the model's
    response can't be parsed as the expected JSON shape.
    """
    client = _get_client()

    user_prompt = f"""Write a blog post draft.

Topic: {topic}
Tone: {tone}
"""
    if keywords:
        user_prompt += f"Keywords/angles to include: {keywords}\n"
    if target_category:
        user_prompt += f"Preferred category: {target_category}\n"

    try:
        response = client.messages.create(
            model=model,
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except APIError as exc:
        raise RuntimeError(f"Anthropic API error: {exc}") from exc

    raw_text = "".join(
        block.text for block in response.content if block.type == "text"
    ).strip()

    # Defensive cleanup in case the model wraps output in ```json fences
    # despite instructions not to.
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.lower().startswith("json"):
            raw_text = raw_text[4:].strip()

    try:
        draft = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"AI response was not valid JSON: {raw_text[:200]}") from exc

    required = {"title", "excerpt", "content", "category"}
    if not required.issubset(draft):
        raise ValueError(f"AI response missing required fields: {draft}")

    draft.setdefault("suggestedTags", [])
    return draft