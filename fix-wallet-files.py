#!/usr/bin/env python3
import os
import shutil

source_dir = "/tmp/ckb-wallet-inspect"
dest_dir = "/home/phill/.openclaw/workspace/ckb-browser-wallet"

def fix_filename(name):
    # Remove .txt extension
    if name.endswith('.txt'):
        name = name[:-4]
    # Replace colons with slashes
    return name.replace(':', '/')

def process():
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir)
    os.makedirs(dest_dir)
    
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if '__MACOSX' in root:
                continue
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, source_dir)
            fixed = fix_filename(rel_path)
            dest_path = os.path.join(dest_dir, fixed)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(src_path, dest_path)
            print(f"Copied: {rel_path} -> {fixed}")

if __name__ == '__main__':
    process()
    print("Done.")