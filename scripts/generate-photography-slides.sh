#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PHOTOGRAPHY_DIR="${PROJECT_ROOT}/images/photography"
WEB_DIR="${PHOTOGRAPHY_DIR}/web"
OUTPUT_PATH="${PHOTOGRAPHY_DIR}/photography-slides.js"
WEB_MAX_DIMENSION="${PHOTOGRAPHY_WEB_MAX_DIMENSION:-1800}"
WEB_QUALITY="${PHOTOGRAPHY_WEB_QUALITY:-82}"
RANK_RANDOMNESS_FACTOR="${PHOTOGRAPHY_RANK_RANDOMNESS_FACTOR:-0.03}"

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

declare -a slide_records=()

for file in "${files[@]}"; do
  ensure_web_image "${file}"

  basename="${file%.*}"
  title_slug="${basename%%__*}"
  subtitle_slug=""

  if [[ "${basename}" == *"__"* ]]; then
    subtitle_slug="${basename#*__}"
  fi

  clean_subtitle_slug="${subtitle_slug}"
  rank_value=1

  if [[ -n "${subtitle_slug}" && "${subtitle_slug}" =~ ^(.*[^[:space:]-])[[:space:]-]+([0-9]+)$ ]]; then
    clean_subtitle_slug="${BASH_REMATCH[1]}"
    rank_value="${BASH_REMATCH[2]}"
  fi

  group_key="${title_slug}__${clean_subtitle_slug}"
  slide_records+=("${file}"$'\t'"${title_slug}"$'\t'"${clean_subtitle_slug}"$'\t'"${rank_value}"$'\t'"${group_key}")
done

records_file="$(mktemp)"
printf '%s\n' "${slide_records[@]}" > "${records_file}"

declare -a sorted_records=()
while IFS= read -r line; do
  [[ -n "${line}" ]] && sorted_records+=("${line}")
done < <(
  awk -F '\t' -v randomness_factor="${RANK_RANDOMNESS_FACTOR}" '
    BEGIN {
      srand();
    }
    {
      records[NR] = $0;
      rank = $4 + 0;
      if (rank > max_rank[$5]) {
        max_rank[$5] = rank;
      }
    }
    END {
      for (i = 1; i <= NR; i++) {
        split(records[i], fields, "\t");
        rank = fields[4] + 0;
        group = fields[5];
        normalized_rank = (max_rank[group] <= 1) ? 0 : (rank - 1) / (max_rank[group] - 1);
        randomized_rank = normalized_rank + ((rand() - 0.5) * randomness_factor);
        if (randomized_rank < 0) {
          randomized_rank = 0;
        }
        if (randomized_rank > 1) {
          randomized_rank = 1;
        }
        printf "%.6f\t%.6f\t%06d\t%s\t%s\t%s\t%s\n", randomized_rank, normalized_rank, rank, fields[2], fields[3], fields[1], group;
      }
    }
  ' "${records_file}" | sort -t $'\t' -k1,1n -k2,2n -k3,3n -k4,4 -k5,5 -k6,6
)

rm -f "${records_file}"

{
  printf 'window.photographySlidesData = [\n'

  for i in "${!sorted_records[@]}"; do
    IFS=$'\t' read -r randomized_rank normalized_rank rank_value title_slug clean_subtitle_slug file group_key <<< "${sorted_records[$i]}"
    rank_value="$((10#${rank_value}))"
    title="$(format_title "${title_slug}")"
    subtitle="$(format_subtitle "${clean_subtitle_slug}")"

    [[ -z "${title}" ]] && title="Photo $((i + 1))"

    printf '  {\n'
    printf '    "src": "./images/photography/web/%s",\n' "$(escape_js "${file}")"
    printf '    "fullSrc": "./images/photography/%s",\n' "$(escape_js "${file}")"
    printf '    "alt": "%s",\n' "$(escape_js "${title}")"
    printf '    "title": "%s",\n' "$(escape_js "${title}")"
    printf '    "description": "%s",\n' "$(escape_js "${subtitle}")"
    printf '    "rank": %s,\n' "${rank_value}"
    printf '    "normalizedRank": %s,\n' "${normalized_rank}"
    printf '    "randomizedRank": %s\n' "${randomized_rank}"

    if [[ "$i" -lt $((${#sorted_records[@]} - 1)) ]]; then
      printf '  },\n'
    else
      printf '  }\n'
    fi
  done

  printf '];\n'
} > "${OUTPUT_PATH}"

printf 'Generated %s photography slide entries in %s.\n' "${#files[@]}" "${OUTPUT_PATH#${PROJECT_ROOT}/}"
