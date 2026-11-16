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
    return {...primerInfo(p.replace(/-/g,'')),matches,coveredMatches,possibleOnlyMatches,targetNCount,unknownOpposedCount,
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
  function oneStrand(primer,target){
    primer=normalize(primer);target=normalize(target);
    const m=primer.length,n=target.length,width=n+1;
    if(m>100||n>1000000||m*n>12000000)throw Error('Alignment too large: split long reference sequences into gene regions.');
    const trace=new Uint8Array((m+1)*width);
    let prev=new Int32Array(width),current=new Int32Array(width);
    const pm=[...primer].map(x=>MASK[x]),tm=[...target].map(x=>x==='N'?0:MASK[x]);
    for(let i=1;i<=m;i++){
      current[0]=-5*i;trace[i*width]=2;
      for(let j=1;j<=n;j++){
        // Target N is neutral (0), not an invented match (+2) or a known mismatch (-3).
        const diag=prev[j-1]+(tm[j-1]===0?0:(pm[i-1]&tm[j-1])?2:-3),up=prev[j]-5,left=current[j-1]-5;
        let value=diag,direction=1;
        if(up>value){value=up;direction=2;}
        if(left>value){value=left;direction=3;}
        current[j]=value;trace[i*width+j]=direction;
      }
      [prev,current]=[current,prev];
    }
    let end=1;
    for(let j=2;j<=n;j++)if(prev[j]>prev[end])end=j;
    let i=m,j=end,p=[],t=[];
    while(i>0){
      const direction=trace[i*width+j];
      if(direction===1){p.push(primer[--i]);t.push(target[--j]);}
      else if(direction===2){p.push(primer[--i]);t.push('-');}
      else if(direction===3){p.push('-');t.push(target[--j]);}
      else throw Error('Invalid traceback');
    }
    p=p.reverse().join('');t=t.reverse().join('');
    return {alignmentPrimer:p,alignmentTarget:t,score:prev[end],start:j+1,end,...describe(p,t)};
  }
  function align(primer,target){
    primer=normalize(primer);target=normalize(target);
    const f=oneStrand(primer,target),r=oneStrand(primer,reverseComplement(target));
    const useReverse=r.score>f.score||(r.score===f.score&&r.identity>f.identity),hit=useReverse?r:f;
    return {...hit,searchStrand:useReverse?'antisense':'sense',
      bindingStart:useReverse?target.length-hit.end+1:hit.start,
      bindingEnd:useReverse?target.length-hit.start+1:hit.end,
      targetOligo5to3:reverseComplement(hit.alignmentTarget.replace(/-/g,''))};
  }
  function assess(hit,minIdentity=60,minCoverage=80){
    const thresholdPassed=hit.identity>=minIdentity&&hit.coverage>=minCoverage;
    return {thresholdPassed,passed:!hit.indeterminate&&thresholdPassed,
      judgement:hit.indeterminate?'indeterminate':thresholdPassed?'accepted':'below_threshold'};
  }
  const API={MASK,COMP,BASES,normalize,compatible,reverseComplement,primerInfo,describe,oneStrand,align,assess};
  globalThis.PrimerAlign=API;
  if(typeof module!=='undefined')module.exports=API;
})();
