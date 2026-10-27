"""Build a tiny dotted globe map from public-domain Natural Earth land data.

Requires Pillow only for this optional asset-generation step.
"""
import json
import math
from pathlib import Path
from urllib.request import urlopen

from PIL import Image, ImageDraw

SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson'


def main():
    with urlopen(SOURCE, timeout=30) as response:
        world = json.load(response)
    mask = Image.new('1', (1440, 720))
    draw = ImageDraw.Draw(mask)
    for feature in world['features']:
        geometry = feature['geometry']
        polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]
        for polygon in polygons:
            for index, ring in enumerate(polygon):
                draw.polygon([((lon + 180) * 4, (90 - lat) * 4) for lon, lat, *_ in ring], fill=index == 0)
    points = []
    for row in range(74):
        latitude = -88.8 + row * 2.4
        count = max(1, round(150 * math.cos(math.radians(latitude))))
        for column in range(count):
            longitude = -180 + (column + .5) * 360 / count
            x = min(1439, max(0, int((longitude + 180) * 4)))
            y = min(719, max(0, int((90 - latitude) * 4)))
            if mask.getpixel((x, y)):
                points.append([round(latitude, 2), round(longitude, 2)])
    target = Path(__file__).resolve().parents[1] / 'site/globe-land.json'
    target.write_text(json.dumps({'source': 'Natural Earth 1:110m land (public domain)', 'points': points}, separators=(',', ':')) + '\n')
    print(f'Wrote {len(points)} land dots to {target.name} ({target.stat().st_size} bytes)')


if __name__ == '__main__':
    main()
