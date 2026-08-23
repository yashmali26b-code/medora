from pathlib import Path

from PIL import Image

source = Path("/home/ubuntu/upload/WhatsAppImage2026-08-23at11.33.51AM.jpeg")
output = Path("/home/ubuntu/webdev-static-assets/medora-wordmark-refresh.png")

image = Image.open(source).convert("RGB")
# Crop away the large white canvas while retaining the complete supplied wordmark and its soft shadow.
cropped = image.crop((86, 120, 1518, 545))
cropped.save(output, format="PNG", optimize=True)
print(output)
