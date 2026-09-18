#!/bin/bash
# Runs prettier on the file that was just edited by Claude.
# Receives tool input JSON via stdin (PostToolUse hook).

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Only format JS/JSX/TS/TSX/JSON/CSS/MD files
if [[ "$FILE_PATH" =~ \.(js|jsx|ts|tsx|json|css|md)$ ]]; then
  cd /Users/hammad/workspace/inventory-system-nextjs
  pnpm prettier --write "$FILE_PATH" 2>/dev/null || true
fi
