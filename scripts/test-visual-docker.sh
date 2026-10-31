#!/bin/sh
# Runs the visual regression tests in the Playwright Linux image, the same place CI runs them,
# so references made here match there. Extra arguments go to Vitest, e.g. `--update`.
#
# node_modules is a container-only volume: the host's (macOS) binaries do not run on Linux.
# --maxWorkers keeps four Chromiums (one per project) inside Docker Desktop's memory.
set -e

PLAYWRIGHT=$(node -p "require('@playwright/test/package.json').version")
BUN=$(bun --version)

docker run --rm --ipc=host -e CI \
  -v "$PWD":/work -v /work/node_modules -w /work \
  "mcr.microsoft.com/playwright:v$PLAYWRIGHT-noble" \
  sh -c "npm install -g --silent bun@$BUN && bun install --frozen-lockfile && bunx vitest run --config vitest.storybook.config.ts --maxWorkers=4 $*"
