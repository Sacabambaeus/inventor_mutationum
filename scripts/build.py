#!/usr/bin/env python3
"""Build the standalone PriMatch HTML using Python's standard library."""
from pathlib import Path
import argparse,csv,gzip,hashlib,json,re,sys

ROOT=Path(__file__).resolve().parents[1]
SOURCES={'alignment-engine':'src/alignment.js','viewer-runtime':'src/app.js','sources-runtime':'src/sources.js'}

def render(root=ROOT):
    page=(root/'src/page.html').read_text(encoding='utf-8')
    with (root/'data/manifest.tsv').open(encoding='utf-8',newline='') as f:manifest=list(csv.DictReader(f,delimiter='\t'))
    expected={'japanese-name-data','viewer-data'}
    if len(manifest)!=2 or {r['script_id'] for r in manifest}!=expected:
        raise ValueError('Data manifest must identify both reference snapshots exactly once')
    values={key:(root/path).read_text(encoding='utf-8') for key,path in SOURCES.items()}
    for row in manifest:
        path=root/row['file']
        if path.resolve().parent!=(root/'data').resolve():raise ValueError('Snapshot must be inside data/')
        packed=path.read_bytes()
        if hashlib.sha256(packed).hexdigest()!=row['compressed_sha256']:raise ValueError('Compressed snapshot checksum differs: '+row['file'])
        raw=gzip.decompress(packed)
        if len(raw)!=int(row['decoded_bytes']) or hashlib.sha256(raw).hexdigest()!=row['decoded_sha256']:
            raise ValueError('Decoded snapshot differs: '+row['file'])
        payload=raw.decode('utf-8');json.loads(payload)
        # A literal '<' could terminate an application/json script after an update.
        if '<' in payload:raise ValueError('Encode literal < as \\u003c before embedding JSON')
        values[row['script_id']]=payload
    for key,value in values.items():
        token='@@'+key+'@@'
        if page.count(token)!=1:raise ValueError('Template token must appear once: '+token)
        if '</script' in value.lower():raise ValueError('Embedded input contains a script closing tag: '+key)
        page=page.replace(token,value)
    if re.search(r'@@[a-z-]+@@',page):raise ValueError('Unresolved template token')
    return page.encode('utf-8')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'primatch.html',help='Output HTML path (default: repository primatch.html)')
    parser.add_argument('--check',action='store_true',help='Check that the output equals the source build; write nothing')
    args=parser.parse_args()
    try:
        result=render()
        if args.check:
            if not args.output.is_file() or args.output.read_bytes()!=result:
                print('HTML differs from source; run python3 scripts/build.py',file=sys.stderr);return 1
            print('Build is reproducible:',hashlib.sha256(result).hexdigest());return 0
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_bytes(result)
        print('Built',args.output,len(result),'bytes',hashlib.sha256(result).hexdigest());return 0
    except (ValueError,OSError,KeyError,csv.Error) as error:
        print('Build failed:',error,file=sys.stderr);return 1

if __name__=='__main__':raise SystemExit(main())
