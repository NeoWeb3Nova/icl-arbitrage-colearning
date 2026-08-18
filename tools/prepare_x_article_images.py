from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs/20260813-crypto-trading-bots"
FONT = "/mnt/c/Windows/Fonts/msyhbd.ttc"

sources = {
    "cover": Path("/home/neo/.hermes/cache/images/openai_codex_gpt-image-2-medium_20260813_211340_23b1b66f.png"),
    "types": Path("/home/neo/.hermes/cache/images/openai_codex_gpt-image-2-medium_20260813_211106_e0592433.png"),
    "gates": Path("/home/neo/.hermes/cache/images/openai_codex_gpt-image-2-medium_20260813_211327_1937da28.png"),
}


def fit_white(image: Image.Image, size: tuple[int, int], margin: int = 0) -> Image.Image:
    canvas = Image.new("RGB", size, "white")
    copy = image.convert("RGB")
    copy.thumbnail((size[0] - margin * 2, size[1] - margin * 2), Image.Resampling.LANCZOS)
    canvas.paste(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return canvas


cover = Image.open(sources["cover"]).convert("RGB")
cover.thumbnail((1240, 740), Image.Resampling.LANCZOS)
cover_canvas = Image.new("RGB", (2000, 800), "white")
cover_canvas.paste(cover, (20, (800 - cover.height) // 2))
draw = ImageDraw.Draw(cover_canvas)
font_title = ImageFont.truetype(FONT, 72)
font_sub = ImageFont.truetype(FONT, 38)
draw.multiline_text((1300, 215), "交易机器人\n怎么选？", font=font_title, fill="#15171a", spacing=14)
draw.text((1304, 435), "先看风险，别先看收益", font=font_sub, fill="#3f67b5")
cover_canvas.save(OUT / "00-trading-bot-risk-cover.png", optimize=True)

fit_white(Image.open(sources["types"]), (1920, 1080), 24).save(
    OUT / "01-four-bot-types.png", optimize=True
)

gates = Image.open(sources["gates"]).convert("RGB")
draw = ImageDraw.Draw(gates)
w, h = gates.size
points = [(int(w * 0.55), int(h * 0.43)), (int(w * 0.59), int(h * 0.29)),
          (int(w * 0.69), int(h * 0.29)), (int(w * 0.75), int(h * 0.43))]
draw.line(points, fill="#111111", width=max(5, w // 260), joint="curve")
x, y = points[-1]
draw.polygon([(x, y), (x - 28, y - 10), (x - 8, y - 32)], fill="#111111")
fit_white(gates, (1920, 1080), 24).save(OUT / "02-three-safety-gates.png", optimize=True)

for path, expected in [
    (OUT / "00-trading-bot-risk-cover.png", (2000, 800)),
    (OUT / "01-four-bot-types.png", (1920, 1080)),
    (OUT / "02-three-safety-gates.png", (1920, 1080)),
]:
    with Image.open(path) as image:
        assert image.size == expected, (path, image.size)
        print(f"{path.name}: {image.size[0]}x{image.size[1]}")
