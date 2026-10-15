"""Separa o díptico "com barba | sem barba" gerado por IA e alinha as duas metades.

Uso:
    pip install opencv-python-headless pillow
    python3 ferramentas/separar-barba.py diptico.png

Saída: img/barbeiro-com-barba.webp e img/barbeiro-sem-barba.webp (mesmo enquadramento).

Como as duas metades vêm da mesma imagem, a pessoa e a pose são as mesmas; o alinhamento
(SIFT + RANSAC, só rotação/escala/deslocamento) corrige o pouco que o modelo deslocou,
para a foto sem barba encaixar ao pixel quando o cursor a revela no hero.
"""
import sys
import cv2
import numpy as np
from PIL import Image

dip = cv2.imread(sys.argv[1], cv2.IMREAD_COLOR)
altura, largura = dip.shape[:2]
meio = largura // 2
com, sem = dip[:, :meio].copy(), dip[:, meio:].copy()

sift = cv2.SIFT_create(4000)
k1, d1 = sift.detectAndCompute(cv2.cvtColor(com, cv2.COLOR_BGR2GRAY), None)
k2, d2 = sift.detectAndCompute(cv2.cvtColor(sem, cv2.COLOR_BGR2GRAY), None)
bons = [a for a, b in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d2, d1, k=2) if a.distance < 0.72 * b.distance]
origem = np.float32([k2[m.queryIdx].pt for m in bons])
destino = np.float32([k1[m.trainIdx].pt for m in bons])
M, _ = cv2.estimateAffinePartial2D(origem, destino, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=5000)
print(f"escala {np.hypot(M[0, 0], M[1, 0]):.4f}  deslocamento ({M[0, 2]:.1f}, {M[1, 2]:.1f}) px")
sem = cv2.warpAffine(sem, M, (meio, altura), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

for nome, img in (("com-barba", com), ("sem-barba", sem)):
    Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).save(f"img/barbeiro-{nome}.webp", "WEBP", quality=80, method=6)
    print(f"img/barbeiro-{nome}.webp")
