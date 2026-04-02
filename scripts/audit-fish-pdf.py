#!/usr/bin/env python3
"""
Ověří, že hlavičky 1–63 v source_cards/ryby.pdf jdou spárovat s data/fish.json
(bijekce číslo karty ↔ záznam). Spouštěj z kořene repa:

  PYTHONPATH=.pdf_tools python3 scripts/audit-fish-pdf.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "source_cards" / "ryby.pdf"
FISH_PATH = ROOT / "data" / "fish.json"


def norm_ws(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def lat_key(s: str) -> str:
    return re.sub(r"\s+", "", norm_ws(s).lower())


def load_cards_from_pdf(raw: str) -> dict[int, tuple[str, str]]:
    raw = re.sub(r"\s*--\s*\d+\s+of\s+\d+\s*--\s*", "\n", raw, flags=re.I)
    compact = norm_ws(raw)
    pat = re.compile(
        r"(\d+)\.\s+"
        r"([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽa-záčďéěíňóřšťúůýž\s\.,]+?)"
        r"\s*\(\s*([A-Za-z\.\s]+?)\s*\)\s*\.",
        re.UNICODE,
    )
    cards: dict[int, tuple[str, str]] = {}
    for m in pat.finditer(compact):
        n = int(m.group(1))
        if n < 1 or n > 63:
            continue
        cz, lat = norm_ws(m.group(2)), norm_ws(m.group(3))
        if len(lat) > 55:
            continue
        u = lat.upper()
        if any(x in u for x in ("ZNAKY", "HŘBET", "POTRAVA", "RYBY")):
            continue
        cards[n] = (cz, lat)
    return cards


def json_matches_pdf(jlat: str, plat: str) -> bool:
    a, b = lat_key(jlat), lat_key(plat)
    if a == b:
        return True
    pairs = [
        (lat_key("Ballerus sapa"), lat_key("Abramis sapa")),
        (lat_key("Romanogobio kessleri"), lat_key("Romanogobio kesslerii")),
        (lat_key("Squalius cephalus"), "leuciscussqualius"),
        (lat_key("Squalius cephalus"), lat_key("Leuciscus cephalus")),
        (lat_key("Carassius gibelio"), lat_key("Carassius auratus")),
    ]
    for x, y in pairs:
        if (a == x and b == y) or (a == y and b == x):
            return True
    return False


def main() -> int:
    try:
        from pypdf import PdfReader
    except ImportError:
        print(
            "[PDF] Přeskočeno: chybí pypdf. Nainstaluj do .pdf_tools nebo: pip install pypdf",
            file=sys.stderr,
        )
        return 0

    if not PDF_PATH.is_file():
        print(f"[PDF] Přeskočeno: není soubor {PDF_PATH}", file=sys.stderr)
        return 0

    r = PdfReader(str(PDF_PATH))
    raw = "\n".join(p.extract_text() or "" for p in r.pages)
    cards = load_cards_from_pdf(raw)

    if len(cards) != 63:
        print(
            f"[CHYBA PDF] Očekáváno 63 hlaviček karet, nalezeno {len(cards)}.",
            file=sys.stderr,
        )
        missing = [n for n in range(1, 64) if n not in cards]
        if missing:
            print(f"  Chybějící čísla: {missing[:20]}{'…' if len(missing) > 20 else ''}", file=sys.stderr)
        return 1

    with FISH_PATH.open(encoding="utf-8") as f:
        fishes = json.load(f)

    if len(fishes) != 63:
        print(f"[CHYBA] fish.json: očekáváno 63 druhů, je {len(fishes)}.", file=sys.stderr)
        return 1

    matched: list[tuple[str, int, str, str, str]] = []
    problems: list[tuple[str, ...]] = []

    for fish in fishes:
        fid = fish["id"]
        jlat = fish["name_lat"]
        jcz = fish["name_cz"]
        hits = [(n, cz, plat) for n, (cz, plat) in cards.items() if json_matches_pdf(jlat, plat)]
        if len(hits) == 1:
            matched.append((fid, hits[0][0], jcz, jlat, hits[0][2]))
        elif len(hits) == 0:
            problems.append(("NO_CARD", fid, jcz, jlat))
        else:
            problems.append(("MULTI", fid, jcz, jlat, str(hits)))

    if problems:
        for p in problems:
            print(f"[CHYBA PDF↔JSON] {p}", file=sys.stderr)
        return 1

    used = {m[1] for m in matched}
    if len(used) != 63:
        print(f"[CHYBA PDF] Některé karty nejsou přiřazené jednoznačně.", file=sys.stderr)
        return 1

    print("[PDF] 63 karet v ryby.pdf ↔ 63 záznamů v fish.json — OK (včetně známých synonym).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
