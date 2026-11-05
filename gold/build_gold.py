from __future__ import annotations

import argparse
from pathlib import Path

from gold_builder import build_gold


def main() -> None:
    parser = argparse.ArgumentParser(description="Build read-only Gold warehouse from existing Silver SQLite database")
    parser.add_argument("--silver-db", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "silver" / "silver_database.db")
    parser.add_argument("--gold-dir", type=Path, default=Path(__file__).resolve().parents[1] / "gold")
    args = parser.parse_args()
    result = build_gold(args.silver_db, args.gold_dir)
    print(result)


if __name__ == "__main__":
    main()
