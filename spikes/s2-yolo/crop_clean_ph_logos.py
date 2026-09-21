import os
import cv2

OUT_DIR = r"d:\Downloads\kenfiles\halalverify-capstone\spikes\s2-yolo\raw_logos"

# 1. IDCP from idcp_tile.jpg: box is roughly x: 70 to 450, y: 145 to 345
idcp_tile = cv2.imread(os.path.join(OUT_DIR, "idcp_tile.jpg"))
idcp_crop = idcp_tile[150:340, 75:445]
cv2.imwrite(os.path.join(OUT_DIR, "IDCP.png"), idcp_crop)

# 2. National / NCMF mark from idcp_tile: bottom portion y: 395 to 480, x: 100 to 400
nat_crop = idcp_tile[390:478, 100:400]
cv2.imwrite(os.path.join(OUT_DIR, "NCMF_General.png"), nat_crop)

# 3. Invalid logo 1 from inv1_tile.jpg
inv1_tile = cv2.imread(os.path.join(OUT_DIR, "inv1_tile.jpg"))
inv1_crop = inv1_tile[115:430, 80:415]
cv2.imwrite(os.path.join(OUT_DIR, "Invalid_Logo.png"), inv1_crop)

# 4. Invalid logo 2 from inv2_tile.jpg
inv2_tile = cv2.imread(os.path.join(OUT_DIR, "inv2_tile.jpg"))
inv2_crop = inv2_tile[90:425, 120:425]
cv2.imwrite(os.path.join(OUT_DIR, "Invalid_Logo_Generic.png"), inv2_crop)

print("Saved IDCP, NCMF_General, and Invalid logos!")
