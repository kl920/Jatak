"""Rewrite AIJatakPage.tsx — keep only lines 1-529"""
import os, sys

path = r'c:\AI\Jatak\frontend\src\pages\AIJatakPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines(keepends=True)
print(f'Total lines: {len(lines)}')
print(f'Line 529: {repr(lines[528][:60])}')
print(f'Line 530: {repr(lines[529][:60]) if len(lines) > 529 else "EOF"}')

# Keep only the first 529 lines (0..528 inclusive)
new_content = ''.join(lines[:529])
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_content)

print(f'Done — wrote {529} lines back to file')
