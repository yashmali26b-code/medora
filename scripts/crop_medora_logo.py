from pathlib import Path

from PIL import Image


source = Path('/home/ubuntu/upload/IMG_4845.PNG')
destination = Path('/home/ubuntu/webdev-static-assets')
destination.mkdir(parents=True, exist_ok=True)

image = Image.open(source).convert('RGBA')

# Wordmark crop: captures the supplied Medora name treatment without its large outer canvas.
image.crop((180, 660, 1080, 905)).save(destination / 'medora-wordmark.png')

# Mark crop: captures the magnifier-and-M symbol without the separate wordmark below it.
image.crop((345, 115, 970, 680)).save(destination / 'medora-mark.png')
