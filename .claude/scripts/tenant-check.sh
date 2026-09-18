#!/bin/bash
# Checks edited API route files for tenant safety violations.
# Receives tool input JSON via stdin (PostToolUse hook).
# Prints warnings — does NOT block the agent.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Only audit API routes and model files
if [[ "$FILE_PATH" != *"pages/api/"* ]] && [[ "$FILE_PATH" != *"models/"* ]]; then
  exit 0
fi

WARNINGS=()

# findByPk without organizationId in the same file
if grep -q "findByPk" "$FILE_PATH" && ! grep -q "organizationId" "$FILE_PATH"; then
  WARNINGS+=("  ⚠️  findByPk used without organizationId scope — cross-tenant risk")
fi

# sequelize.query without organizationId in replacements
if grep -q "sequelize\.query" "$FILE_PATH" && ! grep -q "organizationId" "$FILE_PATH"; then
  WARNINGS+=("  ⚠️  sequelize.query used without organizationId in replacements — cross-tenant risk")
fi

# Model.update/destroy without organizationId
if grep -qE "\.(update|destroy)\(" "$FILE_PATH" && ! grep -q "organizationId" "$FILE_PATH"; then
  WARNINGS+=("  ⚠️  update/destroy used without organizationId in where clause — cross-tenant risk")
fi

# New model file missing organizationId field
if [[ "$FILE_PATH" == *"models/"* ]]; then
  if ! grep -q "organizationId" "$FILE_PATH"; then
    WARNINGS+=("  ⚠️  Model is missing organizationId FK — required for multi-tenancy")
  fi
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo "TENANT SAFETY CHECK: $FILE_PATH"
  for w in "${WARNINGS[@]}"; do
    echo "$w"
  done
  echo ""
fi
