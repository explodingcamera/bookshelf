#!/usr/bin/env bash
set -euo pipefail

mkdir -p public
bookshelf bookshelf.config.json --template page.html --out public/bookshelf.html

printf 'Updated public/bookshelf.html\n'
