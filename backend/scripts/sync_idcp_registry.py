"""Unified CLI to download the unfiltered live IDCP registry and sync Supabase.

Usage:
    python backend/scripts/sync_idcp_registry.py          # Download, parse, upsert, and prune stale rows
    python backend/scripts/sync_idcp_registry.py --clean  # Wipe existing IDCP rows first, then re-seed cleanly
"""

import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SPIKE_DIR = os.path.join(REPO_ROOT, "spikes", "s1-idcp-registry")
if SPIKE_DIR not in sys.path:
    sys.path.insert(0, SPIKE_DIR)

from sync_idcp_registry import run_sync  # noqa: E402
from seed_idcp_to_supabase import seed_idcp  # noqa: E402


def main():
    clean_first = "--clean" in sys.argv
    force_download = "--no-download" not in sys.argv
    print(f"=== HalalVerify IDCP Registry Sync (clean_first={clean_first}, force_download={force_download}) ===")
    run_sync(force_download=force_download)
    seed_idcp(seed_all=True, clean_first=clean_first)


if __name__ == "__main__":
    main()
