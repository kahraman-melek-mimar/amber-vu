from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/'extension/manifest.json').read_text(encoding='utf-8'))['version']
DIST=ROOT/'dist';DIST.mkdir(exist_ok=True)
def put(z,relative,data,execute=False):
 info=ZipInfo(relative);info.compress_type=ZIP_DEFLATED;info.external_attr=(0o100755 if execute else 0o100644)<<16;z.writestr(info,data)
for system in ['Windows','macOS']:
 prefix=f'Amber-VU-{VERSION}-{system}';archive=DIST/f'amber-vu-{VERSION}-{system}.zip'
 with ZipFile(archive,'w') as z:
  for f in sorted((ROOT/'extension').rglob('*')):
   if f.is_file() and f.name!='.DS_Store':put(z,prefix+'/extension/'+f.relative_to(ROOT/'extension').as_posix(),f.read_bytes())
  for name in ['START.html','README.md','WINDOWS-TEST.md']:put(z,prefix+'/'+name,(ROOT/name).read_bytes())
  if system=='Windows':put(z,prefix+'/START-Windows.cmd',b'@echo off\r\nstart "" "%~dp0START.html"\r\n')
  else:put(z,prefix+'/START-macOS.command',b'#!/bin/sh\nscript_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\n/usr/bin/open "$script_dir/START.html"\n',True)
 with ZipFile(archive) as z:
  assert z.testzip() is None
  assert json.loads(z.read(prefix+'/extension/manifest.json'))['version']==VERSION
with ZipFile(DIST/f'amber-vu-{VERSION}-source.zip','w') as z:
 for f in sorted(ROOT.rglob('*')):
  rel=f.relative_to(ROOT)
  if not f.is_file() or any(x in {'node_modules','dist','test-results','.git','__pycache__'} for x in rel.parts) or f.name=='.DS_Store':continue
  assert f.suffix not in {'.pem','.key'} and not f.name.startswith('.env')
  put(z,f'Amber-VU-{VERSION}-source/'+rel.as_posix(),f.read_bytes())
checks=[]
for archive in sorted(DIST.glob(f'amber-vu-{VERSION}-*.zip')):
 with ZipFile(archive) as z:assert z.testzip() is None
 checks.append(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name)
(DIST/'SHA256SUMS.txt').write_text('\n'.join(checks)+'\n',encoding='utf-8')
print(f'Built and verified Windows, macOS and source packages for {VERSION}.')
