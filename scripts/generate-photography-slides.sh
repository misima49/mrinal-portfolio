#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PHOTOGRAPHY_DIR="${PROJECT_ROOT}/images/photography"
OUTPUT_PATH="${PHOTOGRAPHY_DIR}/photography-slides.js"

format_title() {
  local slug="$1"
  local IFS='-'
  read -r -a words <<< "$slug"
  local formatted=()
  local word

  for word in "${words[@]}"; do
    [[ -z "${word}" ]] && continue
    formatted+=("$(uppercase_first "${word}")")
  done

  local IFS=' '
  printf '%s' "${formatted[*]}"
}

uppercase_first() {
  local value="$1"
  local first="${value:0:1}"
  local rest="${value:1}"

  printf '%s%s' "$(printf '%s' "${first}" | tr '[:lower:]' '[:upper:]')" "${rest}"
}

format_subtitle() {
  local slug="$1"
  local text="${slug//-/ }"

  [[ -z "${text}" ]] && return 0

  printf '%s' "$(uppercase_first "${text}")"
}

escape_js() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '%s' "$value"
}

shopt -s nullglob
files=(
  "${PHOTOGRAPHY_DIR}"/*.png
  "${PHOTOGRAPHY_DIR}"/*.jpg
  "${PHOTOGRAPHY_DIR}"/*.jpeg
  "${PHOTOGRAPHY_DIR}"/*.webp
  "${PHOTOGRAPHY_DIR}"/*.gif
  "${PHOTOGRAPHY_DIR}"/*.avif
)
shopt -u nullglob

sorted_files=()
while IFS= read -r file; do
  [[ -n "${file}" ]] && sorted_files+=("${file}")
done < <(printf '%s\n' "${files[@]##*/}" | sort)
files=("${sorted_files[@]}")

{
  printf 'window.photographySlidesData = [\n'

  for i in "${!files[@]}"; do
    file="${files[$i]}"
    basename="${file%.*}"
    title_slug="${basename%%__*}"
    subtitle_slug=""

    if [[ "${basename}" == *"__"* ]]; then
      subtitle_slug="${basename#*__}"
    fi

    title="$(format_title "${title_slug}")"
    subtitle="$(format_subtitle "${subtitle_slug}")"

    [[ -z "${title}" ]] && title="Photo $((i + 1))"

    printf '  {\n'
    printf '    "src": "./images/photography/%s",\n' "$(escape_js "${file}")"
    printf '    "alt": "%s",\n' "$(escape_js "${title}")"
    printf '    "title": "%s",\n' "$(escape_js "${title}")"
    printf '    "description": "%s"\n' "$(escape_js "${subtitle}")"

    if [[ "$i" -lt $((${#files[@]} - 1)) ]]; then
      printf '  },\n'
    else
      printf '  }\n'
    fi
  done

  printf '];\n'
} > "${OUTPUT_PATH}"

printf 'Generated %s photography slide entries in %s.\n' "${#files[@]}" "${OUTPUT_PATH#${PROJECT_ROOT}/}"
