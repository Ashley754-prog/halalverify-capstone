"""Unified CLI to download the live IDCP webpage registry feed (gviz) and sync Supabase.

Usage:
    python backend/scripts/sync_idcp_registry.py               # Sync live gviz feed matching idcphalal.org, upsert, prune stale rows
    python backend/scripts/sync_idcp_registry.py --clean       # Wipe existing IDCP rows first, then re-seed cleanly
    python backend/scripts/sync_idcp_registry.py --full-sheet  # Optional: sync unfiltered /export?format=csv instead of gviz
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
    use_full_sheet = "--full-sheet" in sys.argv
    print(f"=== HalalVerify IDCP Registry Sync (clean_first={clean_first}, force_download={force_download}, full_sheet={use_full_sheet}) ===")
    run_sync(force_download=force_download, use_full_sheet=use_full_sheet)
    seed_idcp(seed_all=True, clean_first=clean_first)


if __name__ == "__main__":
    main()
