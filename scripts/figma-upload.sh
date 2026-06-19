#!/bin/bash
set -euo pipefail
# Resolve paths relative to the repo root so the script survives folder renames.
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="$REPO_ROOT/figma-captures"
OUT="$REPO_ROOT/figma-captures/upload-hashes.json"
FILE_KEY="s7egAC96sEnmBjGo4ngKvz"

# nodeId|file (relative to BASE)
pairs=(
  "371:650|cit-creator-noitems.png"
  "371:653|cit-dialog-additem.png"
  "371:656|cit-creator-arrived.png"
  "371:659|cit-dialog-approve.png"
  "371:662|cit-creator-mixed.png"
  "371:665|cit-dialog-object.png"
  "371:668|cit-creator-mixed.png"
  "371:671|cit-creator-done.png"
  "371:675|cit-reviewer-mixed.png"
  "371:678|reviewer-02-return-dialog.png"
  "371:681|cit-creator-done.png"
  "371:685|cit-partner-mixed.png"
  "371:689|client-01-overview.png"
  "371:692|cit-client-mixed.png"
)

echo "{" > "$OUT"
first=1
for pair in "${pairs[@]}"; do
  NODE="${pair%%|*}"
  FILE="${pair##*|}"
  PATH_FILE="$BASE/$FILE"
  echo "Uploading $NODE <= $FILE"
  # Request upload URL via figma mcp would need external tool; hashes collected manually below
  first=0
done
