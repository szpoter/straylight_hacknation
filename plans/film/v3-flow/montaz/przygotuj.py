"""Prepare nineteen 30 fps story shots from the first accepted takes in Google Flow."""


import subprocess as sp
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2 as cv
import numpy as np


cv.setNumThreads(1)
w, h = 1280, 720


# Each pair links an editorial frame to a source frame on the 30 fps timeline.
keys = {
    1: [(0, 0), (59, 235)],
    2: [(0, 17), (5, 32), (28, 74), (29, 115), (59, 235)],
    3: [(0, 0), (59, 235)],
    4: [(0, 0), (59, 232)],
    5: [(0, 55), (12, 80), (27, 120), (59, 232)],
    6: [(0, 0), (21, 61), (26, 76), (44, 144), (59, 235)],
    7: [(0, 0), (59, 235)],
    8: [(0, 0), (24, 73), (45, 166), (59, 234)],
    9: [(0, 10), (28, 116), (34, 131), (59, 234)],
    10: [(0, 0), (35, 145), (52, 185), (59, 195)],
    11: [(0, 0), (25, 48), (59, 94)],
    12: [(0, 95), (21, 145), (22, 205), (59, 235)],
    13: [(0, 0), (28, 77), (43, 152), (59, 231)],
    14: [(0, 0), (24, 99), (42, 157), (59, 231)],
    15: [(0, 19), (6, 36), (40, 105), (59, 227)],
    16: [(0, 0), (59, 235)],
    17: [(0, 0), (59, 235)],
    18: [(0, 0), (18, 96), (43, 166), (59, 235)],
    19: [(0, 0), (26, 78), (47, 119), (52, 125), (59, 125)],
}


# Frame, origin, width and rotation of the paper heading in the 320 px reference.
paper = np.array([
    (31, 184, 90, 25, -31),
    (33, 176, 102, 32, -44),
    (36, 171, 102, 36, -42),
    (39, 169, 101, 38, -39),
    (42, 163, 99, 40, -30),
    (45, 165, 94, 41, -20),
    (48, 175, 88, 43, -8),
    (51, 185, 89, 43, -1),
    (54, 198, 91, 42, 1),
    (57, 209, 97, 42, -2),
    (58, 209, 98, 42, -2),
], dtype=float)


def clean_heading(frame, f):
    x, y, width, angle = [np.interp(f, paper[:, 0], column) for column in paper[:, 1:].T]
    theta = np.deg2rad(angle)
    along = np.array([np.cos(theta), np.sin(theta)])
    down = np.array([-along[1], along[0]])
    corners = [(np.array([x, y]) + dx * along + dy * down) * 4 for dx, dy in [(-1, -2), (width + 2, -2), (width + 2, 7), (-1, 7)]]
    region = np.zeros(frame.shape[:2], np.uint8)
    cv.fillConvexPoly(region, np.rint(corners).astype(np.int32), 255)
    ink = np.uint8((frame.max(axis=2) < 195) & (region > 0)) * 255
    count, labels, stats, _ = cv.connectedComponentsWithStats(ink)
    for i in range(1, count):
        if stats[i, cv.CC_STAT_WIDTH] > 100 or stats[i, cv.CC_STAT_HEIGHT] > 70:
            ink[labels == i] = 0
    return cv.inpaint(frame, cv.dilate(ink, np.ones((5, 5), np.uint8)), 4, cv.INPAINT_TELEA)


def grab(file, i):
    cap = cv.VideoCapture(str(file))
    cap.set(cv.CAP_PROP_POS_FRAMES, i)
    ok, im = cap.read()
    cap.release()
    assert ok
    return im


def shot(n):
    src = Path('surowe') / f'{(12 if n == 11 else n):02}-p1.mp4'
    k = keys[n]
    cap = cv.VideoCapture(str(src))
    assert cap.isOpened(), src
    assert cap.get(cv.CAP_PROP_FPS) == 24, src
    seq = np.rint(np.interp(np.arange(60), *np.array(k).T) * (24 / 30)).astype(int)
    count = int(cap.get(cv.CAP_PROP_FRAME_COUNT))
    assert count > seq.max(), src
    base = Path('robocze/montaz-master') / f'{n:02}'
    base.mkdir(parents=True, exist_ok=True)
    if n == 3:
        # Pull back from the actual still to the photograph on the folder.
        photo = grab('surowe/02-p1.mp4', 188)
        plate = grab(src, 188)
        whole = np.float32([[0, 0], [1279, 0], [1279, 719], [0, 719]])
        window = 2 * np.float32([[469, 173], [515, 166], [518, 201], [473, 209]])
    out = sp.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', '1280x720', '-r', '30', '-i', 'pipe:0', '-c:v', 'libx264', '-qp', '0', '-pix_fmt', 'yuv420p', str(base / 'ruch.mp4')], stdin=sp.PIPE)
    idx = -1
    for f, s in enumerate(seq):
        while idx < s:
            ok, im = cap.read()
            assert ok
            idx += 1
        a = im
        if n == 3:
            t = np.clip((f - 3) / 52, 0, 1)
            ease = t * t * (3 - 2 * t)
            scale = (np.exp(2.25 * ease) - 1) / (np.exp(2.25) - 1)
            view = np.float32(window + (whole - window) * scale)
            T = cv.getPerspectiveTransform(view, whole)
            rect = cv.perspectiveTransform(window[None], T)[0]
            bg = cv.warpPerspective(plate, T, (w, h), flags=cv.INTER_LINEAR, borderMode=cv.BORDER_REPLICATE)
            fore = cv.warpPerspective(photo, cv.getPerspectiveTransform(whole, rect), (w, h), flags=cv.INTER_LINEAR, borderMode=cv.BORDER_REPLICATE)
            mask = np.zeros((h, w), np.uint8)
            cv.fillConvexPoly(mask, np.int32(rect), 255, lineType=cv.LINE_AA)
            a = np.where(mask[:, :, None] > 127, fore, bg)
            a = np.ascontiguousarray(a)
        if n == 2 and f in (28, 29):
            a = cv.addWeighted(a, 0.32 if f == 28 else 0.78, np.full_like(a, 250), 0.68 if f == 28 else 0.22, 0)
        if n == 5 and 31 <= f <= 58:
            a = clean_heading(a, f)
        if n == 8 and 20 <= f <= 53:
            mask = np.zeros(a.shape[:2], np.uint8)
            wall = a[396:444, 412:508]
            mask[396:444, 412:508] = cv.dilate((wall.max(axis=2) < 175).astype(np.uint8) * 255, np.ones((3, 3), np.uint8))
            a = cv.inpaint(a, mask, 3, cv.INPAINT_TELEA)
        out.stdin.write(a.tobytes())
    cap.release()
    out.stdin.close()
    assert out.wait() == 0
    print(n, flush=True)


if __name__ == '__main__':
    ids = list(map(int, sys.argv[1:])) or list(range(1, 20))
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(shot, ids))
