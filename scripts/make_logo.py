# ヒカマニコイン(HMC) ロゴ生成 - 卵様モチーフ オリジナル
import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"C:\Users\maeba\Downloads\crypto_create_research\hikamani-coin\assets"
os.makedirs(OUT, exist_ok=True)
SIZE = 1024

# フォント探し
def find_font(cands):
    for c in cands:
        if os.path.exists(c):
            return c
    return None

bold = find_font([r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\DejaVuSans-Bold.ttf"])
reg = find_font([r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"])
if not bold:
    from PIL import features
    bold = r"C:\Windows\Fonts\arialbd.ttf"
print("fonts:", bold, reg)

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 背景円(ネイビー)+金リング
cx = cy = SIZE // 2
R = 470
d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(27, 42, 74, 255))
d.ellipse([cx - R + 22, cy - R + 22, cx + R - 22, cy + R - 22], outline=(212, 175, 55, 255), width=10)

# 卵本体(白・楕円・下が少し広い)
ew, eh = 360, 430
ex0, ey0 = cx - ew // 2, cy - eh // 2 + 40
ex1, ey1 = cx + ew // 2, cy + eh // 2 + 40
d.ellipse([ex0, ey0, ex1, ey1], fill=(255, 255, 255, 255))
# ハイライト
d.ellipse([cx - 90, cy - 60, cx - 20, cy + 20], fill=(235, 240, 255, 160))

# 顔: 目(黒丸)・頬(ピンク)・口(弧)
eye_r = 26
d.ellipse([cx - 120 - eye_r, cy - 40 - eye_r, cx - 120 + eye_r, cy - 40 + eye_r], fill=(30, 30, 30, 255))
d.ellipse([cx + 120 - eye_r, cy - 40 - eye_r, cx + 120 + eye_r, cy - 40 + eye_r], fill=(30, 30, 30, 255))
# 白目ハイライト
for ex in (cx - 120, cx + 120):
    d.ellipse([ex - 8, cy - 52, ex + 8, cy - 36], fill=(255, 255, 255, 255))
# 頬
d.ellipse([cx - 190, cy + 20, cx - 110, cy + 70], fill=(255, 150, 160, 160))
d.ellipse([cx + 110, cy + 20, cx + 190, cy + 70], fill=(255, 150, 160, 160))
# 口(笑顔の弧)
d.arc([cx - 60, cy - 20, cx + 60, cy + 80], start=20, end=160, fill=(30, 30, 30, 255), width=14)

# 文字: 上 HIKAMANI COIN / 下 HMC
def arc_text(draw, text, font, radius, start_deg, fill=(255, 255, 255, 255)):
    # 文字ごとに中心角を計算して配置
    n = len(text)
    # 文字の幅を推定
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths)
    step = 2.6  # 度/文字(調整)
    total_deg = step * (n - 1) + 26
    cur = start_deg
    for ch, w in zip(text, widths):
        rad = cur * 3.14159 / 180
        x = cx + int(radius * 0.86 * __import__("math").cos(rad)) - w // 2
        y = cy - int(radius * 0.86 * __import__("math").sin(rad)) - 30
        draw.text((x, y), ch, font=font, fill=fill)
        cur += step

f_big = ImageFont.truetype(bold, 96)
f_tick = ImageFont.truetype(bold, 150)
# 上: 弧状に HIKAMANI COIN
arc_text(d, "HIKAMANI COIN", f_big, R - 60, 198)
# 下: HMC (水平・中央)
tw = d.textlength("HMC", font=f_tick)
d.text((cx - tw / 2, cy + 300), "HMC", font=f_tick, fill=(212, 175, 55, 255))

img.save(os.path.join(OUT, "hmc_logo.png"))
img.convert("RGB").save(os.path.join(OUT, "hmc_logo.jpg"), quality=92)
print("saved:", os.path.join(OUT, "hmc_logo.png"))
