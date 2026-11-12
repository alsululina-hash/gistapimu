#!/usr/bin/env python3
"""Пересобирает офлайн-версию: sw.js, offline_list.js и архив gistoatlas_offline.zip.
Запускать из папки сайта после любых изменений: python3 make_offline.py"""
import glob, hashlib, json, os, zipfile
CORE = ['index.html','structs.js','data.js','em.js','analyzers.js','pins.js','pins_a.js',
        'offline.js','offline_list.js','manifest.webmanifest','icon-192.png','icon-512.png']
MEDIA = sorted(glob.glob('*.jpg'))
ZIP = 'gistoatlas_offline.zip'
def h(files):
    m = hashlib.sha1()
    for f in files:
        if os.path.exists(f): m.update(f.encode()); m.update(open(f,'rb').read())
    return m.hexdigest()[:10]
def write_list(zip_mb):
    ver = h([f for f in CORE if f != 'offline_list.js'])
    data = dict(version=ver, mediaVersion=h(MEDIA), files=['./'] + CORE, media=MEDIA, zipMB=zip_mb)
    open('offline_list.js','w').write('self.OFFLINE=' + json.dumps(data, ensure_ascii=False) + ';\n')
    return data
def make_zip():
    with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_STORED) as z:
        for f in CORE + MEDIA + ['README.md']:
            if os.path.exists(f): z.write(f, 'gistoatlas/' + f)
    return os.path.getsize(ZIP)
write_list(0); size = make_zip()
data = write_list(round(size / 1048576)); make_zip()
sw = open('sw.template.js').read().replace('__VERSION__', data['version']).replace('__MEDIA__', data['mediaVersion'])
open('sw.js','w').write(sw)
print('version', data['version'], 'media', data['mediaVersion'], 'files', len(data['files']), 'images', len(MEDIA), 'zip MB', data['zipMB'])
