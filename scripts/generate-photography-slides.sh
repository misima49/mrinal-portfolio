#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PHOTOGRAPHY_DIR="${PROJECT_ROOT}/images/photography"
WEB_DIR="${PHOTOGRAPHY_DIR}/web"
OUTPUT_PATH="${PHOTOGRAPHY_DIR}/photography-slides.js"
WEB_MAX_DIMENSION="${PHOTOGRAPHY_WEB_MAX_DIMENSION:-1800}"
WEB_QUALITY="${PHOTOGRAPHY_WEB_QUALITY:-82}"

ensure_web_dir() {
  mkdir -p "${WEB_DIR}"
}

generate_web_image() {
  local input_path="$1"
  local output_path="$2"

  if command -v magick >/dev/null 2>&1; then
    magick "${input_path}" -auto-orient -resize "${WEB_MAX_DIMENSION}x${WEB_MAX_DIMENSION}>" -strip -quality "${WEB_QUALITY}" "${output_path}"
    return
  fi

  if command -v convert >/dev/null 2>&1; then
    convert "${input_path}" -auto-orient -resize "${WEB_MAX_DIMENSION}x${WEB_MAX_DIMENSION}>" -strip -quality "${WEB_QUALITY}" "${output_path}"
    return
  fi

  if command -v sips >/dev/null 2>&1; then
    sips --resampleHeightWidthMax "${WEB_MAX_DIMENSION}" --setProperty formatOptions "${WEB_QUALITY}" "${input_path}" --out "${output_path}" >/dev/null
    return
  fi

  cp "${input_path}" "${output_path}"
}

ensure_web_image() {
  local input_file="$1"
  local output_file="${WEB_DIR}/$1"

  if [[ ! -f "${output_file}" || "${PHOTOGRAPHY_DIR}/${input_file}" -nt "${output_file}" ]]; then
    generate_web_image "${PHOTOGRAPHY_DIR}/${input_file}" "${output_file}"
  fi
}

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

ensure_web_dir

{
  printf 'window.photographySlidesData = [\n'

  for i in "${!files[@]}"; do
    file="${files[$i]}"
    ensure_web_image "${file}"
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
    printf '    "src": "./images/photography/web/%s",\n' "$(escape_js "${file}")"
    printf '    "fullSrc": "./images/photography/%s",\n' "$(escape_js "${file}")"
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
