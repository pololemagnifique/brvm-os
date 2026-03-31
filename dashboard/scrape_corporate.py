#!/usr/bin/env python3
"""
scrape_corporate.py — BRVM Corporate Calendar Scraper
Scrapes dividend payment pages from brvm.org and merges into corporate_calendar.json
"""

import json
import re
import os
import sys
import ssl
import logging
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from bs4 import BeautifulSoup

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_URL   = "https://www.brvm.org/fr/esv/paiement-de-dividendes"
CAL_FILE   = "/data/brvm-os/backend/data/corporate_calendar.json"
LOG_FILE   = "/data/brvm-os/dashboard/scrape_corporate.log"
START_PAGE = 0
END_PAGE   = 39          # inclusive (40 pages total)
ROWS_PER_PAGE = 10
TIMEOUT    = 20           # seconds per request
# ─────────────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("scrape_corporate")

# ─── Name → Ticker mapping (built from existing JSON + known BRVM tickers) ───
NAME_TO_TICKER = {
    # Exact matches observed on brvm.org table
    "VIVO ENERGY CI":                   "SHEC",
    "FILTISAC CI":                      "FTSC",
    "TRACTAFRIC CI":                    "PRSC",
    "TRACTAFRIC MOTORS CI":             "PRSC",
    "BIIC":                             "BIIC",
    "SMB":                              "SMBC",
    "SMB CI":                           "SMBC",
    "PALM CI":                          "PALC",
    "SODECI":                           "SDCC",
    "TOTAL":                            "TTLC",
    "TOTAL CI":                         "TTLC",
    "TOTALENERGIES MARKETING CI":      "TTLC",
    "SITAB":                            "STBC",
    "BOLLORE TRANSPORT & LOGISTICS":    "SDSC",
    "BOLLORE TRANSPORT & LOGISTICS CI": "SDSC",
    "AFRICA GLOBAL LOGISTICS CI":       "SDSC",
    "AFRICA GLOBAL LOGISTICS CI (ex BOLLORE CI)": "SDSC",
    "CFAO MOTORS CI":                   "CFAC",
    "SOLIBRA":                          "SLBC",
    "LNB":                              "LNBB",
    "LOTERIE NATIONALE DU BENIN":       "LNBB",
    "CIE CI":                           "CIEC",
    "SOGB":                             "SOGC",
    "SGB CI":                           "SGBC",
    "NESTLE CI":                        "NTLC",
    "SAPH CI":                          "SPHC",
    "SIB":                              "SIBC",
    "LOTERIE NATIONALE DU BENIN":      "LNBB",
    # BOA group
    "BANK OF AFRICA CI":                "BOAC",
    "BOA CI":                           "BOAC",
    "BANK OF AFRICA ML":                "BOAM",
    "BOA MALI":                         "BOAM",
    "BANK OF AFRICA SN":                "BOAS",
    "BOA SENEGAL":                      "BOAS",
    "BANK OF AFRICA BF":                "BOABF",
    "BOA BURKINA FASO":                 "BOABF",
    "BANK OF AFRICA NG":                "BOAN",
    "BOA NIGER":                        "BOAN",
    "BANK OF AFRICA BENIN":             "BOAB",
    "BOA BENIN":                        "BOAB",
    # Other
    "SONATEL SENEGAL":                  "SNTS",
    "ORANGE CI":                        "ORAC",
    "SICABLE CI":                       "CABC",
    "UNILEVER CI":                      "UNLC",
    "SERVAIR ABIDJAN CI":               "SRVC",
    "DIAMOND CEMENT":                    "DCMC",
    "BICIB":                             "BICB",
    "BICIS":                             "BICIS",
    "ECOBANK CI":                        "ECOC",
    "SAFCA":                             "SAFC",
    "SONIBR":                            "SNBR",
    "SONICAR":                           "SCRC",
    "SOGESOL":                           "SGSC",
    "WAKANY":                            "WKYC",
    "BILLOAD":                           "BILC",
    "NUTIS":                             "NTIC",
    "CREDICTION":                         "CREX",
    "ETS DEKY":                          "EDKC",
    "PALM":                              "PALC",
    "BOA IVORY COAST":                   "BOAC",
}

# Regex patterns for partial / fuzzy match
NAME_PATTERNS = [
    (re.compile(r"VIVO\s*ENERGY", re.I),        "SHEC"),
    (re.compile(r"FILTISAC", re.I),              "FTSC"),
    (re.compile(r"TRACTAFRIC", re.I),            "PRSC"),
    (re.compile(r"^BIIC$", re.I),                "BIIC"),
    (re.compile(r"^SMB($|\s)", re.I),            "SMBC"),
    (re.compile(r"PALM", re.I),                  "PALC"),
    (re.compile(r"SODECI", re.I),               "SDCC"),
    (re.compile(r"TOTAL", re.I),                "TTLC"),
    (re.compile(r"SITAB", re.I),                "STBC"),
    (re.compile(r"BOLLORE|AFRICA GLOBAL LOG|AGL", re.I), "SDSC"),
    (re.compile(r"CFAO\s*MOTORS", re.I),        "CFAC"),
    (re.compile(r"^SOLIBRA$", re.I),            "SLBC"),
    (re.compile(r"LOTERIE|LNB|BENIN", re.I),    "LNBB"),
    (re.compile(r"CIE\s*CI$|^CIE ", re.I),      "CIEC"),
    (re.compile(r"^SOGB$|SOGC|SOGB", re.I),    "SOGC"),
    (re.compile(r"SGB\s*CI", re.I),             "SGBC"),
    (re.compile(r"NESTLE", re.I),               "NTLC"),
    (re.compile(r"SAPH", re.I),                 "SPHC"),
    (re.compile(r"^SIB$", re.I),                "SIBC"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*CI|BOA\s*CI", re.I), "BOAC"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*ML|BOA\s*MALI", re.I), "BOAM"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*SN|BOA\s*SENEGAL", re.I), "BOAS"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*BF|BOA\s*BURKINA", re.I), "BOABF"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*NG|BOA\s*NIGER", re.I), "BOAN"),
    (re.compile(r"BANK\s*OF\s*AFRICA.*BENIN|BOA\s*BENIN", re.I), "BOAB"),
    (re.compile(r"SONATEL", re.I),              "SNTS"),
    (re.compile(r"ORANGE\s*CI", re.I),          "ORAC"),
    (re.compile(r"SICABLE", re.I),             "CABC"),
    (re.compile(r"UNILEVER", re.I),            "UNLC"),
    (re.compile(r"SERVAIR", re.I),             "SRVC"),
    (re.compile(r"DIAMOND\s*CEMENT", re.I),    "DCMC"),
    (re.compile(r"^BICIB?$", re.I),             "BICB"),
    (re.compile(r"ECOBANK", re.I),             "ECOC"),
    (re.compile(r"SAFCA", re.I),               "SAFC"),
    (re.compile(r"SONIBR", re.I),              "SNBR"),
    (re.compile(r"SCRC|SONICAR", re.I),        "SCRC"),
    (re.compile(r"SOGESOL", re.I),             "SGSC"),
    (re.compile(r"WAKANY", re.I),              "WKYC"),
    (re.compile(r"BILLOAD", re.I),             "BILC"),
    (re.compile(r"NUTIS", re.I),               "NTIC"),
]


def resolve_ticker(name: str) -> str | None:
    """Resolve a company name to its ticker symbol."""
    if not name or not name.strip():
        return None
    name = name.strip()
    if name in NAME_TO_TICKER:
        return NAME_TO_TICKER[name]
    for pattern, ticker in NAME_PATTERNS:
        if pattern.search(name):
            return ticker
    return None


# ─── Helpers ────────────────────────────────────────────────────────────────

_ssl_ctx = ssl._create_unverified_context()


def fetch_page(page: int) -> str | None:
    url = f"{BASE_URL}?page={page}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=TIMEOUT, context=_ssl_ctx) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset)
    except Exception as e:
        log.error("Failed to fetch page %d: %s", page, e)
        return None


def parse_amount(raw: str) -> float | None:
    """Extract numeric value from strings like '1 320 FCFA' or 'XOF 8'."""
    if not raw:
        return None
    s = raw.replace("FCFA", "").replace("F CFA", "").replace("XOF", "").replace(" ", "").strip()
    s = s.replace("\u202f", "").replace("\xa0", "")   # narrow no-break space, regular nbsp
    try:
        return float(s)
    except ValueError:
        # Try comma as decimal separator
        s2 = s.replace(",", ".")
        try:
            return float(s2)
        except ValueError:
            return None


MONTH_MAP = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4,
    "mai": 5, "juin": 6, "juillet": 7, "août": 8,
    "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}


def parse_date(raw: str) -> str | None:
    """Convert French date string like '22 octobre 2025' → '2025-10-22'."""
    if not raw or raw.strip() == "":
        return None
    raw = raw.strip()
    # Patterns: "22 octobre 2025" or "1 mai 2016"
    m = re.match(r"(\d{1,2})\s+(\w+)\s+(\d{4})", raw)
    if not m:
        return None
    day, month_str, year = m.group(1), m.group(2).lower(), m.group(3)
    month = MONTH_MAP.get(month_str)
    if month is None:
        return None
    return f"{year}-{month:02d}-{int(day):02d}"


def load_cal() -> dict:
    if os.path.exists(CAL_FILE):
        with open(CAL_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"_meta": {"generated_at": None, "note": "Created by scrape_corporate.py"}}


def save_cal(cal: dict):
    os.makedirs(os.path.dirname(CAL_FILE), exist_ok=True)
    with open(CAL_FILE, "w", encoding="utf-8") as f:
        json.dump(cal, f, ensure_ascii=False, indent=2)


def unique_key(entry: dict) -> tuple:
    """Key used to detect duplicates across the dividend list."""
    return (
        entry.get("ticker") or "",
        entry.get("exercice") or "",
        entry.get("date_ex_dividende") or "",
        entry.get("date_paiement") or "",
    )


def merge_dividends(existing: list, new_entries: list) -> list:
    """Merge new entries into existing list without duplicates."""
    seen = {unique_key(e) for e in existing if unique_key(e) != ("", "", "", "")}
    added = 0
    for entry in new_entries:
        key = unique_key(entry)
        if key == ("", "", "", "") or key[0] == "":
            # Can't uniquely identify - skip unless truly new
            log.warning("Skipping entry with no ticker: %s", entry.get("societe", "?"))
            continue
        if key not in seen:
            existing.append(entry)
            seen.add(key)
            added += 1
    return added


# ─── Main ─────────────────────────────────────────────────────────────────────

def scrape_all_pages() -> list:
    """Scrape pages START_PAGE..END_PAGE, return list of dividend entries."""
    all_entries = []
    total_pages = END_PAGE - START_PAGE + 1

    for page in range(START_PAGE, END_PAGE + 1):
        log.info("Scraping page %d/%d …", page + 1, total_pages)
        html = fetch_page(page)
        if html is None:
            log.warning("Skipping page %d (fetch failed)", page)
            continue

        soup = BeautifulSoup(html, "lxml")
        tables = soup.find_all("table")
        div_table = None
        for t in tables:
            headers = [th.get_text(strip=True) for th in t.find_all("th")]
            if "Emetteur" in headers:
                div_table = t
                break

        if div_table is None:
            log.warning("No dividend table found on page %d", page)
            continue

        rows = div_table.find_all("tr")
        if len(rows) <= 1:
            log.info("Page %d has no data rows", page)
            continue

        page_entries = 0
        for row in rows[1:]:          # skip header row
            cells = [td.get_text(strip=True) for td in row.find_all("td")]
            if len(cells) < 7:
                continue

            emetteur    = cells[0]    # company name
            # col 1 = Obligation (skip)
            action_col  = cells[2]     # may contain ticker
            exercice    = cells[3]    # e.g. "2024"
            date_paie   = parse_date(cells[4])
            date_ex     = parse_date(cells[5])
            montant_raw = cells[6]
            montant     = parse_amount(montant_raw)

            if not emetteur and not action_col:
                log.debug("Skipping empty row on page %d", page)
                continue

            # Resolve ticker: try Action column first (sometimes filled), else name lookup
            ticker = action_col.strip() if action_col.strip() else resolve_ticker(emetteur)

            entry = {
                "ticker":              ticker or "",
                "societe":             emetteur,
                "exercice":            int(exercice) if str(exercice).isdigit() else None,
                "montant_net_fcfa":    montant,
                "date_paiement":       date_paie,
                "date_ex_dividende":   date_ex,
                "source":              f"brvm.org page {page}",
            }
            all_entries.append(entry)
            page_entries += 1

        log.info("  → %d entries from page %d", page_entries, page)

    return all_entries


def main():
    log.info("=== Starting BRVM Corporate Scrape ===")
    log.info("Pages: %d → %d (%d pages)", START_PAGE + 1, END_PAGE + 1, END_PAGE - START_PAGE + 1)

    # Scrape
    new_entries = scrape_all_pages()
    log.info("Total new entries scraped: %d", len(new_entries))

    # Load & merge
    cal = load_cal()
    if "dividendes_brvm_scrape" not in cal:
        cal["dividendes_brvm_scrape"] = []

    existing_list = cal.get("dividendes_brvm_scrape", [])
    added = merge_dividends(existing_list, new_entries)
    cal["dividendes_brvm_scrape"] = existing_list

    # Update meta
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if "_meta" not in cal:
        cal["_meta"] = {}
    cal["_meta"]["scrape_at"] = now
    cal["_meta"]["scrape_pages"] = f"{START_PAGE}-{END_PAGE}"
    cal["_meta"]["scrape_new_entries"] = len(new_entries)
    cal["_meta"]["scrape_added"] = added

    save_cal(cal)
    total = len(existing_list)
    log.info("=== Done. %d total entries in dividends_brvm_scrape (added: %d) ===", total, added)
    print(f"SCRAPE_COMPLETE:{total}:{added}", flush=True)


if __name__ == "__main__":
    main()
