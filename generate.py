#!/usr/bin/env python3
"""Read prompts from prompts.txt, generate an image for each via Replicate,
and save the results into the output/ folder."""

import os
import re
import sys

import replicate
import requests
from dotenv import load_dotenv

PROMPTS_FILE = "prompts.txt"
OUTPUT_DIR = "output"
# Fast, cheap, good-quality default. Override with the REPLICATE_MODEL env var,
# e.g. REPLICATE_MODEL="stability-ai/sdxl"
MODEL = os.environ.get("REPLICATE_MODEL", "black-forest-labs/flux-schnell")


def slugify(text, max_length=50):
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return slug[:max_length] or "prompt"


def load_prompts(path):
    if not os.path.exists(path):
        sys.exit(f"Error: {path} not found. Create it with one prompt per line.")
    with open(path, "r", encoding="utf-8") as f:
        prompts = [line.strip() for line in f if line.strip() and not line.startswith("#")]
    if not prompts:
        sys.exit(f"Error: {path} has no prompts in it.")
    return prompts


def save_output(output, base_filename):
    """output is whatever replicate.run() returned: a single item or a list
    of items, each either a URL string or a FileOutput with a .url."""
    items = output if isinstance(output, list) else [output]
    saved_paths = []

    for index, item in enumerate(items):
        url = str(item)
        ext = os.path.splitext(url.split("?")[0])[1] or ".webp"
        suffix = f"_{index}" if len(items) > 1 else ""
        filepath = os.path.join(OUTPUT_DIR, f"{base_filename}{suffix}{ext}")

        response = requests.get(url, timeout=120)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(response.content)
        saved_paths.append(filepath)

    return saved_paths


def main():
    load_dotenv()

    if not os.environ.get("REPLICATE_API_TOKEN"):
        sys.exit(
            "Error: REPLICATE_API_TOKEN is not set.\n"
            "Get a key at https://replicate.com/account/api-tokens\n"
            "then put it in a .env file as REPLICATE_API_TOKEN=your_token_here"
        )

    prompts = load_prompts(PROMPTS_FILE)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Generating {len(prompts)} image(s) with model '{MODEL}'...\n")

    for i, prompt in enumerate(prompts, start=1):
        print(f"[{i}/{len(prompts)}] {prompt!r}")
        try:
            output = replicate.run(MODEL, input={"prompt": prompt})
            paths = save_output(output, f"{i:03d}_{slugify(prompt)}")
            for path in paths:
                print(f"  saved -> {path}")
        except Exception as e:
            print(f"  failed: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
