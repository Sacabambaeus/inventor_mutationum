/* IUPAC-aware alignment v2.2.1: target N is unknown, never match evidence. */
(() => {
  'use strict';
  const MASK={A:1,C:2,G:4,T:8,R:5,Y:10,S:6,W:9,K:12,M:3,B:14,D:13,H:11,V:7,N:15};
  const COMP={A:'T',C:'G',G:'C',T:'A',R:'Y',Y:'R',S:'S',W:'W',K:'M',M:'K',B:'V',V:'B',D:'H',H:'D',N:'N','-':'-'};
  const BASES=Object.fromEntries(Object.entries(MASK).map(([code,mask])=>[code,[...'ACGT'].filter(b=>MASK[b]&mask).join('')]));
  function normalize(sequence,gapped=false){
    if(typeof sequence!=='string')throw Error('DNA sequence must be a string');
    const s=sequence.replace(/\s/g,'').toUpperCase();
    if(!s.length||!(gapped?/^[ACGTRYSWKMBDHVN-]+$/:/^[ACGTRYSWKMBDHVN]+$/).test(s))throw Error('Invalid DNA/IUPAC sequence (U and inosine I are not supported)');
    return s;
  }
  const compatible=(a,b)=>Boolean(MASK[String(a).toUpperCase()]&MASK[String(b).toUpperCase()]);
  const reverseComplement=s=>[...normalize(s,true)].reverse().map(x=>COMP[x]).join('');
  function primerInfo(sequence){
    const primerSequence=normalize(sequence);let variants=1n;const positions=[];
    [...primerSequence].forEach((b,i)=>{const bases=BASES[b];variants*=BigInt(bases.length);if(bases.length>1)positions.push(`P${i+1}:${b}(${[...bases].join('/')})`);});
    return {primerSequence,primerDegenerateCount:positions.length,primerVariants:variants.toString(),primerDegeneratePositions:positions.join(';')||'-'};
  }
  // primerInfo depends only on the primer, so describe() reuses it instead of redoing the BigInt work per record.
  const infoCache=new Map();
  function cachedInfo(sequence){
    let info=infoCache.get(sequence);
    if(!info){if(infoCache.size>=256)infoCache.clear();info=primerInfo(sequence);infoCache.set(sequence,info);}
    return info;
  }
  function describe(p,t){
    p=normalize(p,true);t=normalize(t,true);
    if(p.length!==t.length)throw Error('Alignment lengths differ');
    let pos=0,matches=0,coveredMatches=0,possibleOnlyMatches=0,mm=0,pg=0,tg=0,uncertain=0,covered=0,targetNCount=0,unknownOpposedCount=0;
    const mismatches=[],primerBulges=[],targetBulges=[],positionKey=[],targetAmbiguousPositions=[],targetNPositions=[];
    for(let i=0;i<p.length;i++){
      const a=p[i],b=t[i];
      if(a==='-'&&b==='-')throw Error('Double-gap column is invalid');
      if(b!=='-'&&BASES[b].length>1){uncertain++;targetAmbiguousPositions.push(`${a==='-'?'before_':''}P${pos+1}:${b}(${[...BASES[b]].join('/')})`);}
      if(b==='N'){targetNCount++;targetNPositions.push(`${a==='-'?'before_':''}P${pos+1}`);}
      if(a==='-'){tg++;targetBulges.push(`before_P${pos+1}:${b}`);positionKey.push(`I${pos+1}`);continue;}
      pos++;
      if(b==='-'){pg++;primerBulges.push(`P${pos}:${a}`);positionKey.push(`D${pos}`);continue;}
      covered++;
      if(b==='N'){unknownOpposedCount++;positionKey.push(`U${pos}`);continue;}
      if(compatible(a,b)){matches++;if((MASK[b]&MASK[a])===MASK[b])coveredMatches++;else possibleOnlyMatches++;}
      else{mm++;mismatches.push(`P${pos}:${a}>${b}`);positionKey.push(`M${pos}`);}
    }
    const identity=100*matches/p.length;
    return {...cachedInfo(p.replace(/-/g,'')),matches,coveredMatches,possibleOnlyMatches,targetNCount,unknownOpposedCount,
      targetNPositions:targetNPositions.join(';')||'-',indeterminate:targetNCount>0,
      indeterminateReason:targetNCount?'target_N':'-',nonNCoverage:pos?100*(covered-unknownOpposedCount)/pos:0,
      mismatchCount:mm,primerBulgeCount:pg,targetBulgeCount:tg,uncertainCount:uncertain,
      targetAmbiguousPositions:targetAmbiguousPositions.join(';')||'-',
      coverage:pos?100*covered/pos:0,identity,identityOptimistic:100*(matches+unknownOpposedCount)/p.length,identityConservative:100*coveredMatches/p.length,
      perfect:mm===0&&pg===0&&tg===0&&uncertain===0,
      literalExact:p===t&&/^[ACGT]+$/.test(p),
      mismatches:mismatches.join(';')||'-',primerBulges:primerBulges.join(';')||'-',
      targetBulges:targetBulges.join(';')||'-',positionKey:positionKey.join(';')||'perfect'};
  }

  // Dynamic programming. Scores: diagonal +2 for compatible bases, -3 otherwise, 0 against
  // target N (unknown, not an invented match or a known mismatch); gaps -5. Row 0 is free
  // (the primer may start anywhere), the end is the first column with the maximal last-row
  // score, and the traceback prefers diagonal > up > left on ties.
  // Both strands are first scored without a trace. Only the chosen strand (both on a score
  // tie) is traced, inside the columns that can hold its optimal path: every primer base adds
  // at most 2 and every target bulge costs 5, so a score S allows at most floor((2m-S)/5)
  // target bulges and the path starts at or after column end-m-floor((2m-S)/5). Cells left of
  // that window can only lower values off the optimal path, so the path, its tie-breaks and
  // its start column are those of the full matrix.
  const TOO_LARGE='Alignment too large: split long reference sequences into gene regions.';
  const FWD=new Uint8Array(128).fill(16),REV=new Uint8Array(128).fill(16),COMP_CODE=new Uint16Array(128),SCORE=new Int8Array(256);
  for(const b of Object.keys(MASK))FWD[b.charCodeAt(0)]=b==='N'?0:MASK[b];
  for(const b of Object.keys(MASK)){REV[b.charCodeAt(0)]=FWD[COMP[b].charCodeAt(0)];COMP_CODE[b.charCodeAt(0)]=COMP[b].charCodeAt(0);}
  for(let p=0;p<16;p++)for(let t=0;t<16;t++)SCORE[p<<4|t]=t===0?0:(p&t)?2:-3;
  let fwd=new Uint8Array(1024),rev=new Uint8Array(1024),row=new Int32Array(1025),trace=new Uint8Array(4096),
    primerChars=new Uint16Array(256),targetChars=new Uint16Array(256),lastRaw=null,lastPrimer=null,lastScore=0;
  function primerOf(raw){
    if(lastPrimer===null||raw!==lastRaw){
      const sequence=normalize(raw),codes=new Uint8Array(sequence.length);
      for(let i=0;i<sequence.length;i++)codes[i]=MASK[sequence[i]];
      lastPrimer={sequence,codes,m:sequence.length};lastRaw=raw;
    }
    return lastPrimer;
  }
  function reserve(n){
    if(fwd.length<n){let size=fwd.length;while(size<n)size*=2;fwd=new Uint8Array(size);rev=new Uint8Array(size);}
    if(row.length<n+1){let size=row.length;while(size<n+1)size*=2;row=new Int32Array(size);}
  }
  // Fills fwd/rev with the codes of the target and its reverse complement; returns the normalized target.
  function encodeTarget(target){
    if(typeof target==='string'&&target.length>0&&target.length<=1000000){
      const n=target.length;reserve(n);let bad=0;
      for(let j=0,k=n-1;j<n;j++,k--){const c=target.charCodeAt(j);if(c>127){bad=16;break;}const f=FWD[c];bad|=f;fwd[j]=f;rev[k]=REV[c];}
      if(!(bad&16))return target;
    }
    target=normalize(target);
    const n=target.length;
    if(n<=1000000){reserve(n);for(let j=0,k=n-1;j<n;j++,k--){const c=target.charCodeAt(j);fwd[j]=FWD[c];rev[k]=REV[c];}}
    return target;
  }
  // Score-only pass over one strand: returns the first maximal end column and sets lastScore.
  // h holds the previous row; v-=x&(x>>31) is v=max(v,v-x) without a branch. Two primer rows
  // are filled per sweep (row i+1 reads row i from registers), then a last single row if m is odd.
  function scoreEnd(pm,m,t,n){
    const h=row;h.fill(0,0,n+1);let i=1;
    for(;i<m;i+=2){
      const b1=pm[i-1]<<4,b2=pm[i]<<4;let d1=h[0],l1=-5*i,d2=l1,l2=-5*(i+1);h[0]=l2;
      for(let j=1;j<=n;j++){
        const tc=t[j-1],up=h[j];
        let v=d1+SCORE[b1|tc],x=v-up+5;v-=x&(x>>31);l1-=5;x=v-l1;v-=x&(x>>31);d1=up;l1=v;
        let w=d2+SCORE[b2|tc];x=w-v+5;w-=x&(x>>31);l2-=5;x=w-l2;w-=x&(x>>31);d2=v;l2=w;h[j]=w;
      }
    }
    if(i===m){
      const base=pm[i-1]<<4;let diag=h[0],left=-5*i;h[0]=left;
      for(let j=1;j<=n;j++){
        const up=h[j];let v=diag+SCORE[base|t[j-1]],x=v-up+5;
        v-=x&(x>>31);left-=5;x=v-left;v-=x&(x>>31);
        diag=up;h[j]=v;left=v;
      }
    }
    let end=1,best=h[1];
    for(let j=2;j<=n;j++){const v=h[j];if(v>best){best=v;end=j;}}
    lastScore=best;return end;
  }
  // Traced pass over columns L..end of one strand; returns the alignment ending at end.
  function traceStrand(P,t,target,reverse,end,score,full){
    const m=P.m,pm=P.codes,n=target.length;
    let L=full?0:end-m-Math.floor((2*m-score)/5)-1;if(L<0)L=0;
    const w=end-L,width=w+1,h=row;
    if(trace.length<(m+1)*width){let size=trace.length;while(size<(m+1)*width)size*=2;trace=new Uint8Array(size);}
    if(primerChars.length<m+w){let size=primerChars.length;while(size<m+w)size*=2;primerChars=new Uint16Array(size);targetChars=new Uint16Array(size);}
    h.fill(0,0,width);
    for(let i=1;i<=m;i++){
      const base=pm[i-1]<<4,r=i*width;let diag=h[0],left=-5*i;h[0]=left;trace[r]=2;
      for(let k=1;k<=w;k++){
        const up=h[k],u=up-5;let v=diag+SCORE[base|t[L+k-1]],d=1;
        if(u>v){v=u;d=2;}
        left-=5;if(left>v){v=left;d=3;}
        diag=up;h[k]=v;left=v;trace[r+k]=d;
      }
    }
    // Guards for the window bound above; neither can trigger, and the full matrix is the plain DP.
    if(L>0&&h[w]!==score)return traceStrand(P,t,target,reverse,end,score,true);
    let i=m,k=w,len=0;const seq=P.sequence;
    while(i>0){
      if(k===0&&L>0)return traceStrand(P,t,target,reverse,end,score,true);
      const d=trace[i*width+k];
      if(d===1){primerChars[len]=seq.charCodeAt(--i);k--;targetChars[len]=reverse?COMP_CODE[target.charCodeAt(n-1-L-k)]:target.charCodeAt(L+k);}
      else if(d===2){primerChars[len]=seq.charCodeAt(--i);targetChars[len]=45;}
      else if(d===3){primerChars[len]=45;k--;targetChars[len]=reverse?COMP_CODE[target.charCodeAt(n-1-L-k)]:target.charCodeAt(L+k);}
      else throw Error('Invalid traceback');
      len++;
    }
    return {alignmentPrimer:String.fromCharCode.apply(null,primerChars.subarray(0,len).reverse()),
      alignmentTarget:String.fromCharCode.apply(null,targetChars.subarray(0,len).reverse()),score,start:L+k+1,end};
  }
  // Best hit of an encoded target: the reverse strand wins on a higher score, or on an equal
  // score with a higher identity.
  function bestHit(P,target){
    const m=P.m,n=target.length;
    if(m>100||n>1000000||m*n>12000000)throw Error(TOO_LARGE);
    const fe=scoreEnd(P.codes,m,fwd,n),fs=lastScore,re=scoreEnd(P.codes,m,rev,n),rs=lastScore;
    if(rs!==fs){const reverse=rs>fs,hit=reverse?traceStrand(P,rev,target,true,re,rs,false):traceStrand(P,fwd,target,false,fe,fs,false);hit.reverse=reverse;return hit;}
    const f=traceStrand(P,fwd,target,false,fe,fs,false),r=traceStrand(P,rev,target,true,re,rs,false);
    f.details=describe(f.alignmentPrimer,f.alignmentTarget);r.details=describe(r.alignmentPrimer,r.alignmentTarget);
    const hit=r.details.identity>f.details.identity?r:f;hit.reverse=hit===r;return hit;
  }
  function oneStrand(primer,target){
    const P=primerOf(primer);target=encodeTarget(target);
    const m=P.m,n=target.length;
    if(m>100||n>1000000||m*n>12000000)throw Error(TOO_LARGE);
    const end=scoreEnd(P.codes,m,fwd,n),hit=traceStrand(P,fwd,target,false,end,lastScore,false);
    return {alignmentPrimer:hit.alignmentPrimer,alignmentTarget:hit.alignmentTarget,score:hit.score,start:hit.start,end,...describe(hit.alignmentPrimer,hit.alignmentTarget)};
  }
  function align(primer,target){
    const P=primerOf(primer);target=encodeTarget(target);
    const hit=bestHit(P,target),n=target.length,reverse=hit.reverse;
    return {alignmentPrimer:hit.alignmentPrimer,alignmentTarget:hit.alignmentTarget,score:hit.score,start:hit.start,end:hit.end,
      ...(hit.details||describe(hit.alignmentPrimer,hit.alignmentTarget)),searchStrand:reverse?'antisense':'sense',
      bindingStart:reverse?n-hit.end+1:hit.start,bindingEnd:reverse?n-hit.start+1:hit.end,
      targetOligo5to3:reverseComplement(hit.alignmentTarget.replace(/-/g,''))};
  }
  function assess(hit,minIdentity=60,minCoverage=80){
    const thresholdPassed=hit.identity>=minIdentity&&hit.coverage>=minCoverage;
    return {thresholdPassed,passed:!hit.indeterminate&&thresholdPassed,
      judgement:hit.indeterminate?'indeterminate':thresholdPassed?'accepted':'below_threshold'};
  }

  // Compact results for many targets: distinct alignments are stored once as
  // [alignmentPrimer, alignmentTarget, score], and each target keeps the index of its
  // alignment, its start/end on the searched strand, the strand and its length.
  function alignBatch(primer,targets,onProgress){
    const count=targets.length,patterns=[],index=new Map(),
      result={patterns,pattern:new Int32Array(count),start:new Int32Array(count),end:new Int32Array(count),reverse:new Uint8Array(count),length:new Int32Array(count)};
    for(let k=0;k<count;k++){
      const P=primerOf(primer),target=encodeTarget(targets[k]),hit=bestHit(P,target),key=hit.alignmentPrimer+'\n'+hit.alignmentTarget+'\n'+hit.score;
      let id=index.get(key);
      if(id===undefined){id=patterns.length;index.set(key,id);patterns.push([hit.alignmentPrimer,hit.alignmentTarget,hit.score]);}
      result.pattern[k]=id;result.start[k]=hit.start;result.end[k]=hit.end;result.reverse[k]=hit.reverse?1:0;result.length[k]=target.length;
      if(onProgress&&(k+1)%16===0)onProgress(k+1);
    }
    return result;
  }
  // Concatenates compact results of consecutive target ranges, in order.
  function joinBatches(parts){
    const count=parts.reduce((sum,part)=>sum+part.pattern.length,0),patterns=[],index=new Map(),
      result={patterns,pattern:new Int32Array(count),start:new Int32Array(count),end:new Int32Array(count),reverse:new Uint8Array(count),length:new Int32Array(count)};
    let offset=0;
    for(const part of parts){
      const map=part.patterns.map(item=>{const key=item.join('\n');let id=index.get(key);if(id===undefined){id=patterns.length;index.set(key,id);patterns.push(item);}return id;});
      for(let k=0;k<part.pattern.length;k++){
        const id=map[part.pattern[k]];if(id===undefined)throw Error('Invalid compact alignment result');
        result.pattern[offset+k]=id;
      }
      result.start.set(part.start,offset);result.end.set(part.end,offset);result.reverse.set(part.reverse,offset);result.length.set(part.length,offset);
      offset+=part.pattern.length;
    }
    return result;
  }
  // Call objects for one primer, identical to
  // {...recordWithoutSequence, ...align(primer.sequence, record.sequence), ...assess(...), primer: primer.name, primerSequence: primer.sequence, confidence}.
  // metadata[k] is record k without its sequence; calls are written to out from offset.
  function expandCalls(result,metadata,primer,minIdentity,minCoverage,out=[],offset=0){
    if(result.pattern.length!==metadata.length)throw Error('Alignment result does not match the records');
    // describe() depends only on the alignment, so it is kept with the result for later threshold changes.
    if(!result.described)result.described=result.patterns.map(([p,t])=>({details:describe(p,t),oligo:reverseComplement(t.replace(/-/g,''))}));
    const items=result.patterns.map(([p,t,score],i)=>{
      const {details,oligo}=result.described[i],assessment=assess(details,minIdentity,minCoverage);
      return {p,t,score,details,oligo,assessment,confidence:assessment.passed&&!details.primerBulgeCount&&!details.targetBulgeCount&&!details.uncertainCount?'high':'review'};
    });
    const name=primer.name,sequence=primer.sequence;
    for(let k=0;k<metadata.length;k++){
      const q=items[result.pattern[k]],reverse=result.reverse[k]===1,start=result.start[k],end=result.end[k],n=result.length[k];
      out[offset+k]={...metadata[k],alignmentPrimer:q.p,alignmentTarget:q.t,score:q.score,start,end,...q.details,
        searchStrand:reverse?'antisense':'sense',bindingStart:reverse?n-end+1:start,bindingEnd:reverse?n-start+1:end,targetOligo5to3:q.oligo,
        ...q.assessment,primer:name,primerSequence:sequence,confidence:q.confidence};
    }
    return out;
  }
  // Stored compact results, keyed by primer sequence. They are valid only for the record list
  // they were computed on: the same record objects in the same order with the same sequences.
  // Any other list empties the store. At most `limit` targets are kept (oldest primer first out).
  function createResultCache(limit){
    let records=[],sequences=[],used=0;const entries=new Map();
    const same=list=>list.length===records.length&&list.every((r,i)=>r===records[i]&&r.sequence===sequences[i]);
    const cache={
      get(list,sequence){
        if(!same(list))return null;
        const value=entries.get(sequence);if(!value)return null;
        entries.delete(sequence);entries.set(sequence,value);return value;
      },
      set(list,sequence,value){
        if(value.pattern.length!==list.length)throw Error('Alignment result does not match the records');
        if(!same(list)){cache.clear();records=list.slice();sequences=list.map(r=>r.sequence);}
        if(entries.has(sequence)){used-=entries.get(sequence).pattern.length;entries.delete(sequence);}
        entries.set(sequence,value);used+=value.pattern.length;
        for(const [key,item] of entries){if(used<=limit||key===sequence)break;entries.delete(key);used-=item.pattern.length;}
      },
      clear(){records=[];sequences=[];entries.clear();used=0;},
      get size(){return entries.size;},
      get used(){return used;}
    };
    return cache;
  }
  const API={MASK,COMP,BASES,normalize,compatible,reverseComplement,primerInfo,describe,oneStrand,align,assess,alignBatch,joinBatches,expandCalls,createResultCache};
  globalThis.PrimerAlign=API;
  if(typeof module!=='undefined')module.exports=API;
})();
