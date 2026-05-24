#!/usr/bin/env python3
"""Farm website scrape sidecar (Slice 1 of the content-backfill plan).

Produces a CLEAN MARKDOWN corpus per farm for the TypeScript enrichment stage
to ground descriptions against. This script does ONE thing: fetch the farm's
own site and emit observed text. It NEVER invents, summarises, or calls an LLM.
All structuring + validation + DB writes happen downstream in TS.

Reads  : farm-frontend/.enrichment/_targets.json  (from export-targets.ts)
Writes : farm-frontend/.enrichment/<slug>.json     (one corpus artifact per farm)

Usage:
    .venv/bin/python src/scrape_sidecar.py [--limit=N] [--max-age-days=14] \
        [--input=PATH] [--out-dir=PATH] [--min-delay=2.0]
"""
import argparse
import asyncio
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

USER_AGENT = os.environ.get(
    "PIPELINE_USER_AGENT",
    "FarmCompanion-Pipeline/1.0 (+https://www.farmcompanion.co.uk; contact info@eazyaccess.org)",
)

# Internal pages worth pulling in for more grounded facts (about/produce/hours).
LINK_KEYWORDS = re.compile(r"(about|our-?story|produce|product|shop|visit|hours|opening|stock|farm)", re.I)


# --- pure helpers (unit-tested in scrape_sidecar_test.py) ---

def _host(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def same_domain(base: str, url: str) -> bool:
    return _host(base) == _host(url)


def pick_internal_links(base_url: str, hrefs, cap: int = 4):
    base_norm = base_url.rstrip("/")
    out, seen = [], set()
    for href in hrefs:
        if not href or not isinstance(href, str):
            continue
        absolute = urljoin(base_url, href)
        norm = absolute.rstrip("/")
        if norm == base_norm or norm in seen:
            continue
        if not same_domain(base_url, absolute):
            continue
        if not LINK_KEYWORDS.search(urlparse(absolute).path):
            continue
        seen.add(norm)
        out.append(absolute)
        if len(out) >= cap:
            break
    return out


def clean_markdown(md: str) -> str:
    lines = [ln.rstrip() for ln in (md or "").splitlines()]
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def build_artifact(slug, website, status, markdown, http_status, final_url, pages, error):
    return {
        "schemaVersion": 1,
        "slug": slug,
        "website": website,
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": status,
        "httpStatus": http_status,
        "finalUrl": final_url,
        "markdown": markdown,
        "markdownChars": len(markdown or ""),
        "pagesCrawled": pages,
        "error": error,
    }


# --- crawl orchestration ---

def _md_text(result) -> str:
    md = getattr(result, "markdown", "") or ""
    if isinstance(md, str):
        return md
    return getattr(md, "raw_markdown", "") or getattr(md, "fit_markdown", "") or ""


def _hrefs(result):
    links = getattr(result, "links", None) or {}
    if isinstance(links, dict):
        return [l.get("href") for l in links.get("internal", []) if isinstance(l, dict)]
    return []


def robots_allows(url: str) -> bool:
    rp = RobotFileParser()
    rp.set_url(urljoin(url, "/robots.txt"))
    try:
        rp.read()
    except Exception:
        return True  # robots unreachable: proceed (we stay polite via delay)
    return rp.can_fetch(USER_AGENT, url)


def is_fresh(path: Path, max_age_days: float) -> bool:
    if not path.exists():
        return False
    age_days = (datetime.now().timestamp() - path.stat().st_mtime) / 86400
    return age_days < max_age_days


def _write(path: Path, artifact: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(artifact, ensure_ascii=False, indent=2), encoding="utf-8")


async def scrape_one(crawler, run_config, target, out_dir: Path, max_age_days: float):
    slug = target["slug"]
    website = target.get("website")
    artifact_path = out_dir / f"{slug}.json"

    if is_fresh(artifact_path, max_age_days):
        return "cached"
    if not website:
        _write(artifact_path, build_artifact(slug, website, "no_website", "", None, None, 0, None))
        return "no_website"
    if not robots_allows(website):
        _write(artifact_path, build_artifact(slug, website, "robots_blocked", "", None, website, 0, None))
        return "robots_blocked"

    try:
        home = await crawler.arun(url=website, config=run_config)
        if not getattr(home, "success", False):
            _write(artifact_path, build_artifact(slug, website, "fetch_error", "", getattr(home, "status_code", None), website, 0, getattr(home, "error_message", "fetch failed")))
            return "fetch_error"

        parts = [_md_text(home)]
        pages = 1
        for link in pick_internal_links(website, _hrefs(home), cap=4):
            try:
                sub = await crawler.arun(url=link, config=run_config)
                if getattr(sub, "success", False):
                    parts.append(_md_text(sub))
                    pages += 1
            except Exception:
                pass  # one bad sub-page must not sink the whole farm

        markdown = clean_markdown("\n\n".join(p for p in parts if p))
        status = "ok" if len(markdown) >= 200 else "empty"
        _write(artifact_path, build_artifact(slug, website, status, markdown, getattr(home, "status_code", 200), getattr(home, "url", website), pages, None))
        return status
    except Exception as e:  # noqa: BLE001 - record, never crash the batch
        _write(artifact_path, build_artifact(slug, website, "fetch_error", "", None, website, 0, str(e)))
        return "fetch_error"


async def run(args):
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

    targets = json.loads(Path(args.input).read_text(encoding="utf-8"))
    scrapeable = [t for t in targets if t.get("scrape")]
    if args.limit:
        scrapeable = scrapeable[: args.limit]
    out_dir = Path(args.out_dir)

    print(f"sidecar: {len(scrapeable)} scrapeable targets (of {len(targets)}); out={out_dir}")
    counts = {}
    browser_config = BrowserConfig(headless=True, user_agent=USER_AGENT)
    run_config = CrawlerRunConfig(page_timeout=30000)
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for i, t in enumerate(scrapeable, 1):
            status = await scrape_one(crawler, run_config, t, out_dir, args.max_age_days)
            counts[status] = counts.get(status, 0) + 1
            print(f"  [{i}/{len(scrapeable)}] {t['slug']}: {status}")
            if status not in ("cached", "no_website") and i < len(scrapeable):
                await asyncio.sleep(args.min_delay)
    print(f"sidecar done: {counts}")


def main():
    here = Path(__file__).resolve().parent
    default_enrich = here.parent.parent / "farm-frontend" / ".enrichment"
    p = argparse.ArgumentParser(description="Farm website scrape sidecar")
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--max-age-days", type=float, default=14.0)
    p.add_argument("--min-delay", type=float, default=2.0)
    p.add_argument("--input", default=str(default_enrich / "_targets.json"))
    p.add_argument("--out-dir", default=str(default_enrich))
    asyncio.run(run(p.parse_args()))


if __name__ == "__main__":
    main()
