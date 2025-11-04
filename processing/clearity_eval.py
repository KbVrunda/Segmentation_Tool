import cv2
import numpy as np
import matplotlib.pyplot as plt
import glob
import csv
import os
import requests

# ============================================================
#  SECTION 1: VIDEO STREAM CLARITY DETECTION
# ============================================================

# ---- User Parameters ----
VIDEO_URL = '/Users/vrundapatel/Desktop/senior design/JA_2.mp4'
OUTPUT_CSV = "clarity_results.csv"
FRAME_SAMPLE_RATE = 10        # analyze every 10th frame
CLARITY_THRESHOLD = 100.0     # tune this experimentally

print("🔹 Initializing video stream...")

# ---- Step 1: Open the video stream from a URL ----
cap = cv2.VideoCapture(VIDEO_URL)
if not cap.isOpened():
    raise IOError("❌ Could not open video stream. Make sure it’s a direct .mp4 URL.")

fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"✅ Connected to stream: {VIDEO_URL}")
print(f"   FPS: {fps:.2f}, Total Frames: {total_frames}")

# ---- Step 2: Prepare CSV output ----
with open(OUTPUT_CSV, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["frame_number", "timestamp_sec", "laplacian_var", "clarity_label"])

    print("🚀 Starting clarity analysis on video frames...")

    frame_num = 0
    processed = 0
    clear_frames = 0

    # ---- Step 3: Frame-by-frame processing ----
    while True:
        ret, frame = cap.read()
        if not ret:
            print("📭 End of video stream reached.")
            break

        # Only process every Nth frame
        if frame_num % FRAME_SAMPLE_RATE == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            filtered = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
            lap_var = cv2.Laplacian(filtered, cv2.CV_64F).var()
            label = 1 if lap_var >= CLARITY_THRESHOLD else 0
            timestamp = frame_num / fps

            # ---- Optional visualization every 500 processed frames ----
            if processed % 500 == 0:
                plt.figure(figsize=(10, 3))
                plt.suptitle(f"Frame {frame_num} | Var(Lap)={lap_var:.2f} | Label={'Clear' if label else 'Blurry'}")

                plt.subplot(1, 3, 1)
                plt.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                plt.title("Original")
                plt.axis("off")

                plt.subplot(1, 3, 2)
                plt.imshow(gray, cmap="gray")
                plt.title("Grayscale")
                plt.axis("off")

                plt.subplot(1, 3, 3)
                plt.imshow(filtered, cmap="gray")
                plt.title("Filtered (Bilateral)")
                plt.axis("off")

                plt.tight_layout()
                plt.show()


            writer.writerow([frame_num, round(timestamp, 2), lap_var, label])
            processed += 1
            clear_frames += label

            # Print progress every 100 processed frames
            if processed % 100 == 0:
                print(f"   → Processed {processed} frames... Current clarity: {lap_var:.2f}")

        frame_num += 1

cap.release()
print(f"🏁 Done! {processed} frames analyzed.")
print(f"   Clear frames: {clear_frames}/{processed}")
print(f"📊 Results saved to: {OUTPUT_CSV}")

# ============================================================
#  SECTION 2: FRAME FOLDER CLARITY DETECTION (Optional)
# ============================================================

print("\n📁 Checking for local frame folder 'frames/'...")

frame_paths = glob.glob("frames/*.jpg")

if len(frame_paths) == 0:
    print("⚠️ No local frames found. Skipping frame folder analysis.")
else:
    print(f"🖼️ Found {len(frame_paths)} local frames. Running clarity check...")

    def check_clarity(image_path, threshold=CLARITY_THRESHOLD, visualize=False):
        """Compute Laplacian variance (clarity) for a single image."""
        img = cv2.imread(image_path)
        if img is None:
            print(f"⚠️ Could not read {image_path}. Skipping.")
            return 0, 0

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
        laplacian_var = cv2.Laplacian(filtered, cv2.CV_64F).var()
        label = 1 if laplacian_var >= threshold else 0

        if visualize:
            plt.figure(figsize=(6, 3))
            plt.subplot(1, 2, 1)
            plt.imshow(gray, cmap="gray")
            plt.title(f"Original\nVar(Lap)={laplacian_var:.2f}")
            plt.axis("off")

            plt.subplot(1, 2, 2)
            plt.imshow(filtered, cmap="gray")
            plt.title("Filtered")
            plt.axis("off")
            plt.tight_layout()
            plt.show()

        return laplacian_var, label

    results = []
    for path in frame_paths:
        var_val, label = check_clarity(path)
        results.append({
            "frame": os.path.basename(path),
            "variance": var_val,
            "clarity_label": label
        })

    clear_frames_local = sum(r["clarity_label"] for r in results)
    total_frames_local = len(results)
    print(f"📈 Local frame summary: {clear_frames_local}/{total_frames_local} clear frames.")
    print("✅ Local clarity analysis complete.")
