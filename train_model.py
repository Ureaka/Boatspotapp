#!/usr/bin/env python3
"""
ShipSpotter — Custom Ship Type Classifier
=========================================
Trains a MobileNet V2 transfer-learning head on downloaded ship images
and exports it to TF.js format so the browser can load it.

SETUP:
    pip install -r requirements.txt

RUN:
    python train_model.py

OUTPUT:
    model/model.json  +  model/*.bin   (~400 KB total)
    Copy the model/ folder to your repo root and push to GitHub.
"""

import os, sys, shutil, json
import numpy as np
from pathlib import Path

# ── CONFIG ──────────────────────────────────────────────────────────────────
SHIP_TYPES = [
    'cruise', 'container', 'bulk', 'tanker',
    'coastguard', 'military', 'car-carrier', 'megayacht',
]

# Search terms for each type — more specific = better quality images
# Specific ship names from ships.js — searched by name on Wikimedia Commons
SHIP_NAMES = {
    'cruise':      ['Wonder of the Seas','Symphony of the Seas','MSC World Europa',
                    'Queen Mary 2','Oasis of the Seas','Disney Wish','Norwegian Bliss',
                    'Harmony of the Seas','Costa Toscana','SS United States'],
    'container':   ['Ever Ace','MSC Gülsün','HMM Algeciras','CMA CGM Jacques Saadé',
                    'Ever Given','OOCL Hong Kong','Madrid Maersk','MSC Oscar',
                    'Emma Maersk','Cosco Shipping Universe'],
    'bulk':        ['Berge Stahl','Mineral Beijing','Star Polaris','Pacific Basin Dolphin',
                    'Golden Future','Aquafreedom','Vale Rio de Janeiro'],
    'tanker':      ['Seawise Giant','TI Oceania','TI Africa','Front Altair',
                    'Nordic Hawk','Overseas Houston','Jahre Viking'],
    'coastguard':  ['USCGC Bertholf','USCGC Stratton','CGS Louis S. St-Laurent',
                    'NoCGV Svalbard','USCGC Healy','JCG Akitsushima'],
    'military':    ['USS Gerald R. Ford','USS Nimitz','HMS Queen Elizabeth',
                    'USS Zumwalt','INS Vikrant','USS Arleigh Burke',
                    'HMAS Canberra','HMS Daring','USS Iowa','INS Kolkata'],
    'car-carrier': ['Tonsberg car carrier','Höegh Target','Grande Europa',
                    'Cougar Ace','Neptune Ace','Siem Confucius'],
    'megayacht':   ['Azzam yacht','Eclipse superyacht','Sailing Yacht A',
                    'Octopus yacht Paul Allen','Lady Moura yacht',
                    'Serene superyacht','Motor Yacht A'],
}

# Wikimedia Commons categories — properly tagged, curated ship photos, no API key needed
WIKI_CATEGORIES = {
    'cruise':       ['Cruise ships', 'Ocean liners'],
    'container':    ['Container ships'],
    'bulk':         ['Bulk carriers'],
    'tanker':       ['Oil tankers', 'Very large crude carriers'],
    'coastguard':   ['Coast guard vessels', 'United States Coast Guard cutters'],
    'military':     ['Destroyers by country', 'Frigates by country', 'Aircraft carriers'],
    'car-carrier':  ['Pure car carriers', 'Roll-on roll-off ships'],
    'megayacht':    ['Superyachts', 'Motor yachts'],
}

IMAGES_PER_CLASS = 180   # images downloaded per ship type
IMG_SIZE         = 224   # MobileNet V2 input size
BATCH_SIZE       = 32
EPOCHS           = 40
DATA_DIR         = Path('training_images')
MODEL_OUT        = Path('model')
# ────────────────────────────────────────────────────────────────────────────


def check_deps():
    missing = []
    for pkg in ['tensorflow', 'sklearn']:
        try:
            __import__(pkg if pkg != 'sklearn' else 'sklearn')
        except ImportError:
            missing.append(pkg)
    try:
        __import__('ddgs')
    except ImportError:
        try:
            __import__('duckduckgo_search')
        except ImportError:
            missing.append('ddgs')
    if missing:
        print("Missing packages. Run:\n")
        print(f"  py -m pip install -r requirements.txt\n")
        print(f"Missing: {', '.join(missing)}")
        sys.exit(1)


def download_images():
    import urllib.request
    import time
    try:
        from ddgs import DDGS
    except ImportError:
        from duckduckgo_search import DDGS

    HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    def fetch(url, dest):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            if len(data) < 15_000:
                return False
            with open(dest, 'wb') as f:
                f.write(data)
            return True
        except Exception:
            return False

    print(f"\n{'='*58}")
    print(f"  Downloading images by ship name from ships.js")
    print(f"{'='*58}\n")

    for ship_type, names in SHIP_NAMES.items():
        out_dir = DATA_DIR / ship_type
        out_dir.mkdir(parents=True, exist_ok=True)

        existing = len(list(out_dir.glob('*.jpg'))) + len(list(out_dir.glob('*.png')))
        if existing >= int(IMAGES_PER_CLASS * 0.8):
            print(f"  {ship_type:12s} — {existing} images already present, skipping")
            continue

        total_saved = existing
        print(f"  {ship_type:12s}:")

        for ship_name in names:
            if total_saved >= IMAGES_PER_CLASS:
                break
            query = f'{ship_name} ship'
            results = []
            for attempt in range(3):
                try:
                    time.sleep(3 + attempt * 4)   # 3s, 7s, 11s between attempts
                    results = list(DDGS().images(keywords=query, max_results=15))
                    break
                except Exception as e:
                    if attempt == 2:
                        print(f"    {ship_name[:35]:35s} — failed after 3 attempts")
                    continue

            saved = 0
            for r in results:
                if total_saved >= IMAGES_PER_CLASS:
                    break
                url  = r.get('image', '')
                if not url:
                    continue
                slug = ship_name[:25].replace(' ', '_').replace('/', '-')
                dest = out_dir / f'{slug}_{saved:02d}.jpg'
                if dest.exists():
                    saved += 1; total_saved += 1
                    continue
                if fetch(url, dest):
                    saved += 1; total_saved += 1

            print(f"    {ship_name[:35]:35s} — {saved} images")

        print(f"  {ship_type:12s} — {total_saved} total\n")

    print("Download complete.\n")


def extract_features():
    import tensorflow as tf
    from tensorflow import keras

    print("Loading MobileNet V2 (frozen feature extractor)...")
    base = keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        pooling='avg',
        weights='imagenet',
    )
    base.trainable = False
    preprocess = keras.applications.mobilenet_v2.preprocess_input

    features, labels = [], []
    class_counts = {}

    print("Extracting features...\n")
    for idx, ship_type in enumerate(SHIP_TYPES):
        img_dir = DATA_DIR / ship_type
        if not img_dir.exists():
            print(f"  {ship_type:12s} — folder missing, skipping")
            continue

        paths = (list(img_dir.glob('*.jpg')) +
                 list(img_dir.glob('*.jpeg')) +
                 list(img_dir.glob('*.png')))
        if not paths:
            print(f"  {ship_type:12s} — no images, skipping")
            continue

        batch_imgs, count = [], 0
        for p in paths:
            try:
                img = keras.preprocessing.image.load_img(p, target_size=(IMG_SIZE, IMG_SIZE))
                arr = keras.preprocessing.image.img_to_array(img)
                batch_imgs.append(arr)
                if len(batch_imgs) == BATCH_SIZE:
                    feats = base.predict(preprocess(np.array(batch_imgs)), verbose=0)
                    features.append(feats)
                    labels.extend([idx] * BATCH_SIZE)
                    count += BATCH_SIZE
                    batch_imgs = []
            except Exception:
                pass  # skip corrupt/unreadable images

        if batch_imgs:
            feats = base.predict(preprocess(np.array(batch_imgs)), verbose=0)
            features.append(feats)
            labels.extend([idx] * len(batch_imgs))
            count += len(batch_imgs)

        class_counts[ship_type] = count
        print(f"  {ship_type:12s} — {count} images  →  {base.output_shape[-1]}-dim features")

    if not features:
        print("\nERROR: No images found in training_images/")
        print("Make sure download_images() ran successfully, or add images manually.")
        sys.exit(1)

    X = np.concatenate(features, axis=0)
    y = np.array(labels)
    print(f"\nDataset: {len(X)} samples  |  feature size: {X.shape[1]}")
    return X, y, base.output_shape[-1]


def train_head(X, y, feature_dim):
    import tensorflow as tf
    from tensorflow import keras
    from sklearn.model_selection import train_test_split
    from sklearn.utils.class_weight import compute_class_weight

    n_classes = len(SHIP_TYPES)
    y_cat     = keras.utils.to_categorical(y, n_classes)

    X_train, X_val, y_train, y_val = train_test_split(
        X, y_cat, test_size=0.2, random_state=42, stratify=y
    )

    # Only compute weights for classes that actually appear in the dataset
    present = np.unique(y.argmax(1))
    if len(present) < 2:
        print(f"\nERROR: Only {len(present)} ship type(s) have images.")
        print("Run the script again to download more — it will pick up where it left off.")
        sys.exit(1)
    if len(present) < n_classes:
        missing = [SHIP_TYPES[i] for i in range(n_classes) if i not in present]
        print(f"WARNING: Missing images for: {', '.join(missing)}")
        print("Training with available types only.\n")

    class_weights_arr = compute_class_weight('balanced', classes=present, y=y.argmax(1))
    class_weights = {int(c): w for c, w in zip(present, class_weights_arr)}

    print(f"\nTrain: {len(X_train)}  |  Val: {len(X_val)}")
    print(f"Classes: {n_classes}  |  Epochs: {EPOCHS}\n")

    # Small but effective classification head
    head = keras.Sequential([
        keras.layers.Input(shape=(feature_dim,)),
        keras.layers.Dense(256, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.4),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(n_classes, activation='softmax'),
    ], name='ship_type_classifier')

    head.summary()

    head.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy'],
    )

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_accuracy', patience=10, restore_best_weights=True, verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=5, verbose=1
        ),
    ]

    history = head.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )

    _, val_acc = head.evaluate(X_val, y_val, verbose=0)
    print(f"\nFinal validation accuracy: {val_acc * 100:.1f}%")

    if val_acc < 0.55:
        print("WARNING: Accuracy below 55% — the model may not generalise well.")
        print("Consider adding more images (increase IMAGES_PER_CLASS) and re-running.")
    elif val_acc >= 0.80:
        print("Great accuracy! The classifier should work well in the app.")
    else:
        print("Decent accuracy. More images or fine-tuning could improve this further.")

    # Save class label mapping alongside the model
    label_map = {str(i): t for i, t in enumerate(SHIP_TYPES)}
    return head, label_map, history


def export_tfjs(head, label_map):
    import subprocess

    # Save as H5 first (no tensorflowjs Python import needed)
    h5_path = 'ship_classifier.h5'
    head.save(h5_path)
    print(f"\nSaved Keras model to {h5_path}")

    if MODEL_OUT.exists():
        shutil.rmtree(MODEL_OUT)
    MODEL_OUT.mkdir(parents=True)

    # Try the tensorflowjs CLI (works even when Python import is broken)
    print("Converting to TF.js format...")
    result = subprocess.run(
        ['tensorflowjs_converter', '--input_format=keras', h5_path, str(MODEL_OUT)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        result = subprocess.run(
            ['py', '-m', 'tensorflowjs.converters.converter',
             '--input_format=keras', h5_path, str(MODEL_OUT)],
            capture_output=True, text=True
        )
    if result.returncode != 0:
        print("CLI conversion failed — using manual export instead...")
        export_manual(head)
    else:
        print("Conversion successful.")

    # Save class label order so app knows index 0 = cruise, index 1 = container, etc.
    with open(MODEL_OUT / 'labels.json', 'w') as f:
        json.dump(SHIP_TYPES, f)

    total = 0
    print(f"\nExported to {MODEL_OUT}/:")
    for fpath in sorted(MODEL_OUT.iterdir()):
        size = fpath.stat().st_size
        total += size
        print(f"  {fpath.name:35s}  {size / 1024:6.1f} KB")
    print(f"  {'─'*43}")
    print(f"  {'TOTAL':35s}  {total / 1024:6.1f} KB")

    print("""
Next steps:
  1. git add model/
  2. git commit -m "Add trained ship classifier"
  3. git push
  The app will automatically load and use the model.
""")


def export_manual(head):
    """Export model weights to TF.js format without using the tensorflowjs package."""
    weights    = head.get_weights()
    bin_data   = b''.join(w.astype(np.float32).tobytes() for w in weights)

    with open(MODEL_OUT / 'group1-shard1of1.bin', 'wb') as f:
        f.write(bin_data)

    weight_specs = []
    offset = 0
    for layer in head.layers:
        for w in layer.weights:
            arr    = w.numpy().astype(np.float32)
            nbytes = arr.nbytes
            weight_specs.append({
                'name':       w.name,
                'shape':      list(arr.shape),
                'dtype':      'float32',
                'byteOffset': offset,
                'byteLength': nbytes,
            })
            offset += nbytes

    model_json = {
        'format':        'layers-model',
        'generatedBy':   'ShipSpotter train_model.py',
        'convertedBy':   'manual',
        'modelTopology': json.loads(head.to_json()),
        'weightsManifest': [{
            'paths':   ['group1-shard1of1.bin'],
            'weights': weight_specs,
        }],
    }

    with open(MODEL_OUT / 'model.json', 'w') as f:
        json.dump(model_json, f)

    print("Manual TF.js export complete.")


if __name__ == '__main__':
    print("ShipSpotter — Model Trainer")
    print("=" * 58)

    check_deps()
    download_images()

    X, y, feature_dim = extract_features()
    head, label_map, _ = train_head(X, y, feature_dim)
    export_tfjs(head, label_map)

    print("Done!")
