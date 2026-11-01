#!/usr/bin/env python3
"""Regenerate every raster icon from public/favicon.svg, the single vector master.

Run from farm-frontend:  python3 scripts/build-icons.py

Three framings come off one master, because the surfaces crop differently:

  favicon      the master as drawn, ~75% of the canvas. Read at 16px.
  any          same framing, for manifest icons declared purpose "any".
  maskable     scaled to 0.72 so the mark's corners sit inside Android's
               80% safe circle. Android crops an arbitrary shape out of this,
               so the cream must bleed to all four edges.

apple-touch-icon is flattened onto cream: iOS rejects alpha and composites
transparency onto black, which would put a black square on the home screen.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MASTER = PUBLIC / "favicon.svg"
CREAM = "#F2EBDA"

# The mark's bounding box in the 1024 master is 128..896 on both axes, so its
# corners sit 543 units from centre. Android's safe circle has radius 410.
# 543 * 0.72 = 391, which clears it with room for the antialiased edge.
MASKABLE_SCALE = 0.72


def mark_parts(svg_text: str) -> tuple[str, str]:
    """The master's <style> block and its mark nodes, kept together.

    The style block carries the .ink and .stamp fill rules. Extracting the
    nodes without it renders the Vermilion sun as default black, which is
    exactly what happened the first time this script ran.
    """
    style = re.search(r"<style>.*?</style>", svg_text, re.S)
    nodes = re.findall(r"<(?:circle|path)\b[^>]*/>", svg_text)
    if not style or not nodes:
        sys.exit("could not find the style block or mark nodes in favicon.svg")
    return style.group(0), "".join(nodes)


def wrap(style: str, nodes: str, scale: float) -> str:
    inner = nodes
    if scale != 1.0:
        inner = (f'<g transform="translate(512,512) scale({scale}) translate(-512,-512)">'
                 f'{nodes}</g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{style}'
            f'<rect width="1024" height="1024" fill="{CREAM}"/>{inner}</svg>')


def render(svg: str, size: int, out: Path, flatten: bool) -> None:
    tmp = out.with_suffix(".tmp.svg")
    tmp.write_text(svg)
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size),
                    str(tmp), "-o", str(out)], check=True)
    tmp.unlink()
    if flatten:
        subprocess.run(["magick", str(out), "-background", CREAM,
                        "-alpha", "remove", "-alpha", "off", str(out)], check=True)
    print(f"  {out.relative_to(ROOT)}  {size}x{size}")


def assert_stamp_present(path: Path) -> None:
    """Fail loudly if the Vermilion sun is missing from a rendered icon."""
    out = subprocess.run(["magick", str(path), "-format", "%c", "histogram:info:"],
                         capture_output=True, text=True, check=True).stdout
    if "D33A2C" not in out.upper():
        sys.exit(f"{path.name}: no Vermilion found. The style block was lost again.")


def main() -> None:
    style, nodes = mark_parts(MASTER.read_text())
    any_svg = wrap(style, nodes, 1.0)
    maskable_svg = wrap(style, nodes, MASKABLE_SCALE)

    print("icons from", MASTER.relative_to(ROOT))
    render(any_svg, 180, PUBLIC / "apple-touch-icon.png", flatten=True)
    render(any_svg, 192, PUBLIC / "android-chrome-192x192.png", flatten=True)
    render(any_svg, 512, PUBLIC / "android-chrome-512x512.png", flatten=True)
    render(maskable_svg, 512, PUBLIC / "icon-maskable-512.png", flatten=True)

    for size in (16, 32, 48):
        render(any_svg, size, PUBLIC / f"_f{size}.png", flatten=True)
    assert_stamp_present(PUBLIC / "android-chrome-512x512.png")
    assert_stamp_present(PUBLIC / "icon-maskable-512.png")
    assert_stamp_present(PUBLIC / "apple-touch-icon.png")

    subprocess.run(["magick", str(PUBLIC / "_f16.png"), str(PUBLIC / "_f32.png"),
                    str(PUBLIC / "_f48.png"), str(PUBLIC / "favicon.ico")], check=True)
    (PUBLIC / "_f16.png").replace(PUBLIC / "favicon-16x16.png")
    (PUBLIC / "_f32.png").replace(PUBLIC / "favicon-32x32.png")
    (PUBLIC / "_f48.png").unlink()
    print("  public/favicon.ico  16+32+48")


if __name__ == "__main__":
    main()
