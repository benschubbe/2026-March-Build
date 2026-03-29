#!/usr/bin/env bash
# =============================================================================
# BioGuardian — Ingestion Layer Bootstrap
# src/ingestion/setup.sh
#
# Deletes the stale package-lock.json (which is missing all gRPC deps and all
# devDependencies), installs from the corrected package.json, and verifies
# that the critical binaries are present.
#
# Run from: src/ingestion/
# Requires: node >= 20, npm >= 10
# =============================================================================
 
set -euo pipefail
 
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
 
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup]${NC} $*"; }
fail() { echo -e "${RED}[setup] FATAL:${NC} $*"; exit 1; }
 
# ── Preflight ──────────────────────────────────────────────────────────────────
 
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [[ -z "$NODE_VERSION" || "$NODE_VERSION" -lt 20 ]]; then
  fail "Node >= 20 required. Found: $(node --version 2>/dev/null || echo 'not installed')"
fi
log "Node $(node --version) ✓"
 
NPM_MAJOR=$(npm --version | cut -d. -f1)
if [[ "$NPM_MAJOR" -lt 10 ]]; then
  fail "npm >= 10 required. Found: $(npm --version)"
fi
log "npm $(npm --version) ✓"
 
# ── Stale lock file removal ────────────────────────────────────────────────────
# The existing package-lock.json was generated from the original package.json
# which was MISSING: @grpc/grpc-js, @grpc/proto-loader, uuid@^11, and ALL
# devDependencies. Keeping it would cause `npm ci` to install the wrong tree.
 
if [[ -f package-lock.json ]]; then
  warn "Removing stale package-lock.json (missing gRPC deps + all devDeps)."
  rm package-lock.json
fi
 
if [[ -d node_modules ]]; then
  warn "Removing existing node_modules to ensure clean install."
  rm -rf node_modules
fi
 
# ── Clean install ──────────────────────────────────────────────────────────────
 
log "Running npm install (this generates a fresh package-lock.json)..."
npm install
 
# ── Verify critical binaries ───────────────────────────────────────────────────
 
log "Verifying critical dependencies..."
 
check_module() {
  node -e "require('$1')" 2>/dev/null \
    && log "  ✓ $1" \
    || fail "  ✗ $1 — module not resolvable after install"
}
 
check_module "@grpc/grpc-js"
check_module "@grpc/proto-loader"
check_module "axios"
check_module "socket.io"
check_module "uuid"
 
# Verify jest binary exists
if [[ ! -f node_modules/.bin/jest ]]; then
  fail "jest binary not found — devDependencies may not have installed"
fi
log "  ✓ jest binary present"
 
if [[ ! -f node_modules/.bin/nodemon ]]; then
  fail "nodemon binary not found — devDependencies may not have installed"
fi
log "  ✓ nodemon binary present"
 
# ── Commit instructions ────────────────────────────────────────────────────────
 
echo ""
log "Bootstrap complete. Commit the new lock file:"
echo ""
echo "    git add package.json package-lock.json"
echo "    git commit -m '[ingestion] regenerate lock file with grpc + devDeps'"
echo ""
log "To start the dev server:  npm run dev"
log "To run tests:             npm test"
log "To verify proto:          npm run proto:check"
