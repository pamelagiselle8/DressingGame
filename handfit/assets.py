import glob
import os

import cv2

from .config import ASSET_FOLDERS


def load_transparent_images(folder_path):
    image_files = sorted(glob.glob(os.path.join(folder_path, '*.png')))
    images = []

    for img_path in image_files:
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if img is not None:
            images.append(img)

    return images


class AssetLibrary:
    def __init__(self):
        self.groups = {
            name: load_transparent_images(folder)
            for name, folder in ASSET_FOLDERS.items()
        }

    def count(self, part_name):
        return len(self.groups.get(part_name, []))

    def get(self, part_name, index):
        items = self.groups.get(part_name, [])
        if not items:
            return None
        return items[index % len(items)]
