(() => {
  'use strict';
  const data=JSON.parse(document.getElementById('viewer-data').textContent),A=PrimerAlign;
  const RANKS=[['phylum','門'],['class','綱'],['order','目'],['family','科'],['genus','属']],GENES=['16S','12S','18S','COI'];
  const $=id=>document.getElementById(id),norm=v=>v&&v!=='-'?String(v):'unclassified';
  const LIMITS=Object.freeze({fastaBytes:64*1024*1024,taxonomyBytes:8*1024*1024,records:20000,totalRecords:80000,header:1024,field:512,accession:128,primerName:128,primerText:32768,line:101024,lines:1000000,bases:50000000,totalBases:150000000,resultCalls:640000,workCells:20000000000});
  const badControl=/[\u0000-\u001f\u007f-\u009f]/u;
  function fieldText(value,label,max=LIMITS.field){if(value.length>max||badControl.test(value))throw Error(label+': 文字数上限または制御文字を確認してください');return value;}
  function* inputLines(text,maxLength){
    let start=0,count=0;
    for(const m of text.matchAll(/\r\n|\n|\r/g)){
      if(++count>LIMITS.lines||m.index-start>maxLength)throw Error('入力の行数または行長が上限を超えます');
      yield text.slice(start,m.index);start=m.index+m[0].length;
    }
    if(++count>LIMITS.lines||text.length-start>maxLength)throw Error('入力の行数または行長が上限を超えます');
    yield text.slice(start);
  }
  const NAME_DATA=JSON.parse($('japanese-name-data').textContent),NAME_MAP=NAME_DATA.entries;
  const ENUM_JA={high:'通常候補',review:'要確認',accepted:'条件を満たす',below_threshold:'条件に届かない',indeterminate:'判定不能',target_N:'標的Nを含む',sense:'参照配列と同方向',antisense:'参照配列の逆相補方向',annotated_feature:'注釈領域から抽出',user_provided_gene_region:'利用者が読み込んだ領域','whole_mitogenome_fallback':'ミトコンドリア全配列から探索（旧版）',annotated_sense:'注釈領域・参照配列と同方向',annotated_antisense:'注釈領域・逆相補方向',whole_mitogenome_sense:'全ミトコンドリア・同方向（旧版）',whole_mitogenome_antisense:'全ミトコンドリア・逆相補方向（旧版）','local FASTA':'利用者のFASTAファイル','NCBI RefSeq':'NCBI参照配列データベース（RefSeq）','NCBI GenBank':'NCBI国際塩基配列データベース（GenBank）',annotated_gene_feature:'gene注釈領域から抽出',unclassified:'未分類',base:'塩基種別',position:'位置のみ'};
  function valueJa(value){if(value===undefined||value===null)return '未収録';if(value==='-')return '—';return Object.hasOwn(ENUM_JA,value)?ENUM_JA[value]:String(value);}
  function nameEntry(rank,value){return NAME_MAP[rank+'::'+value]||null;}
  function taxonLabel(rank,value){const name=norm(value);if(name==='unclassified')return '未分類';const entry=nameEntry(rank,name);return entry?.ja?entry.ja+'（'+name+'）':name;}
  const organismLabel=c=>taxonLabel('species',c.organism||c.species);
  const confidenceLabel=c=>valueJa(String(c.confidence||'review').toLowerCase());
  const CSV_HEADERS={id:'参照領域ID',feature_index:'元記録の注釈番号',sequence_sha256:'抽出配列のSHA256',partial:'部分注釈か',mitochondrial:'ミトコンドリア注釈か',gene:'遺伝子領域',primer:'プライマー名',primerSequence:'プライマー配列5′→3′',primerDegenerateCount:'縮重位置数',primerVariants:'候補配列数',primerDegeneratePositions:'縮重位置と候補塩基',accession:'アクセッション番号',organism:'生物名（原表記）',species:'種（学名）',phylum:'門（学名）',class:'綱（学名）',order:'目（学名）',family:'科（学名）',genus:'属（学名）',organism_display:'生物名（和名・学名）',phylum_display:'門（和名・学名）',class_display:'綱（和名・学名）',order_display:'目（和名・学名）',family_display:'科（和名・学名）',genus_display:'属（和名・学名）',species_display:'種（和名・学名）',judgement:'判定',indeterminate:'判定不能か',indeterminateReason:'判定不能の理由',targetNCount:'標的N数',targetNPositions:'標的N位置',unknownOpposedCount:'プライマーと対向する標的N数',identity:'互換一致率（%）',identityOptimistic:'参考上限一致率（採否不使用、%）',identityConservative:'保守的一致率（%）',coveredMatches:'標的候補を全て覆う互換一致列数',possibleOnlyMatches:'標的候補の一部のみ互換の列数',coverage:'プライマー被覆率（%）',nonNCoverage:'N以外と対向する被覆率（%）',score:'スコア',thresholdPassed:'一致率と重なりの条件を満たすか',passed:'条件を満たすか',perfect:'完全一致か',literalExact:'塩基文字が完全一致か',uncertainCount:'標的曖昧塩基数',targetAmbiguousPositions:'標的曖昧位置と候補塩基',mismatches:'不一致位置と塩基',primerBulges:'プライマー側バルジ',targetBulges:'標的側バルジ',alignmentPrimer:'整列プライマー',alignmentTarget:'整列標的',searchStrand:'探索方向',bindingStart:'領域内開始位置',bindingEnd:'領域内終了位置',regionSource:'領域の取得方法',source:'取得元',taxid:'生物分類ID',genus_taxid:'属分類ID',retrieved:'取得日',location:'元記録の注釈位置',pattern:'変異パターン番号',group:'統合方法',n:'参照記録数',genera:'属数',identityNote:'一致率についての注記',positionKey:'変異位置の識別子',baseVariants:'塩基種別の内訳数'};
  Object.assign(CSV_HEADERS,{taxon_rank:'表示階級',taxon:'分類群',taxonomy_path:'親分類パス',count_unit:'集計単位',target_units:'合計',matched_units:'完全一致する配列の数または完全一致する配列がある分類群数',other_units:'それ以外の配列数または完全一致する配列がない分類群数',match_rate:'完全一致側の割合（%）',reference_count:'参照配列数',perfect_references:'完全一致する参照配列数',indeterminate_references:'Nのため判断できない参照配列数',unclassified_references:'分類名不明の参照配列数'});
  function exportCsv(records,fields){
    if($('csv-language').value==='en')return csv(records,fields);
    const expanded=[];for(const field of fields){expanded.push(field);if(['organism','species',...RANKS.map(([r])=>r)].includes(field))expanded.push(field+'_display');}
    const rows=records.map(record=>{const r={...record};for(const field of fields){
      if(['organism','species',...RANKS.map(([rank])=>rank)].includes(field))r[field+'_display']=taxonLabel(field==='organism'?'species':field,record[field]);
      if(typeof r[field]==='boolean')r[field]=r[field]?'はい':'いいえ';
      else if(['judgement','indeterminateReason','searchStrand','regionSource','source','group'].includes(field))r[field]=valueJa(r[field]);
      else if(field==='identityNote')r[field]='一致率はグループ内最大値、保守値は代表整列の値。位置統合時は他の一致率を含む場合あり。';
    }return r;});
    return '\uFEFF'+[expanded.map(f=>quote(CSV_HEADERS[f]||f)).join(','),...rows.map(r=>expanded.map(f=>quote(r[f])).join(','))].join('\r\n')+'\r\n';
  }
  const state={gene:'all',mode:'custom',legacyPrimer:null,selectedTemplates:[],type:'U',strand:'F',filters:{},
    runs:{},activePrimer:null,group:'base',sort:'score',view:'cards',limit:1000,worker:null,importing:false,importSerial:0,records:data.records.map(r=>({...r})),dirty:false,
    chartRank:'phylum',chartUnit:'genus',chartQuery:'',chartSort:'matched',chartLimit:200};
  function add(parent,tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;}
  function button(parent,text,active,fn){const b=add(parent,'button',text);b.type='button';b.setAttribute('aria-selected',String(active));b.onclick=fn;return b;}
  function fail(error){$('error').hidden=false;$('error').textContent=String(error.message||error);}
  function clearError(){$('error').hidden=true;}
  function resetFilters(){state.filters={};state.limit=1000;}
  const regionLabel=gene=>gene==='all'?'全領域（16S・12S・18S・COI）':gene;
  const scopedRecords=()=>state.gene==='all'?state.records:state.records.filter(r=>r.gene===state.gene);
  function availableRun(gene=state.gene){
    if(state.runs[gene])return state.runs[gene];
    const all=state.runs.all;
    return all&&gene!=='all'?{...all,calls:all.calls.filter(c=>c.gene===gene)}:null;
  }
  const analysisRecords=()=>scopedRecords().filter(r=>!$('reference-phylum').value||r.phylum===$('reference-phylum').value);
  const builtinCache=new Map();
  // An alignment depends only on the primer and target sequences; the thresholds only feed assess().
  // Results are reused for the identical record list (same objects, order and sequences), see createResultCache.
  const resultCache=A.createResultCache(LIMITS.resultCalls);
  const presetMode=()=>state.mode==='builtin'||state.mode==='legacy';
  function builtinCalls(primer){
    if(builtinCache.has(primer))return builtinCache.get(primer);
    const group=data.builtin.primers[primer];if(!group)return [];
    const descriptions=group.summaries.map(([p,t,score])=>{const h=A.describe(p,t);return {...h,alignmentPrimer:p,alignmentTarget:t,score,...A.assess(h,data.builtin.minIdentity,data.builtin.minCoverage)};});
    const calls=group.calls.map(([index,pattern,start,end,reverse])=>{
      const {sequence,...metadata}=data.records[index],hit=descriptions[pattern];
      return {...metadata,...hit,primer,primerSequence:data.presets[primer],bindingStart:start,bindingEnd:end,searchStrand:reverse?'antisense':'sense',precomputed:true,
        confidence:hit.passed&&!hit.primerBulgeCount&&!hit.targetBulgeCount&&!hit.uncertainCount?'high':'review'};
    });
    if(builtinCache.size>=2)builtinCache.delete(builtinCache.keys().next().value);
    builtinCache.set(primer,calls);return calls;
  }
  function activeCalls(){
    if(state.mode==='builtin')return builtinCalls(state.legacyPrimer);
    if(state.mode==='legacy')return data.legacy.calls.filter(c=>c.primer===state.legacyPrimer).map(c=>{
      const s=data.legacy.summaries[c.primer+'::'+c.patternId],desc=A.describe(s.alignmentPrimer,s.alignmentTarget);
      return {...c,...s,...desc,...A.assess(desc,0,0),primer:c.primer,patternId:c.patternId,score:c.score,confidence:desc.indeterminate?'review':s.confidence||c.confidence||'review',legacy:true};
    });
    return (availableRun()?.calls||[]).filter(c=>c.primer===state.activePrimer);
  }
  function filteredCalls(){return activeCalls().filter(c=>RANKS.every(([r])=>!state.filters[r]||norm(c[r])===state.filters[r]));}
  function selectGene(gene){if(gene!=='all'&&!GENES.includes(gene))throw Error('未対応の遺伝子領域です');if(gene===state.gene)return;const interrupted=Boolean(state.worker||state.importing);if(interrupted)stop();state.gene=gene;state.mode='custom';state.legacyPrimer=null;state.type='U';state.strand='F';$('reference-phylum').value='';state.activePrimer=availableRun(gene)?.primers[0]?.name||null;resetFilters();clearError();$('run-status').textContent=interrupted?'領域切替に伴い処理を中止しました。':'';refresh();}

  function renderControls(){
    $('parallel-note').textContent='ブラウザが認識するCPUスレッド：'+cpuThreads()+'。自動では最大8並列で計算します。';
    const gene=$('gene-tabs');gene.replaceChildren();['all',...GENES].forEach(g=>button(gene,g==='all'?'全領域':g,state.gene===g,()=>selectGene(g)));
    $('dataset-note').textContent='内蔵参照：'+scopedRecords().length.toLocaleString()+'件。海綿動物はGenBank・RefSeqの配列変異を収録しています。通常の分類欄から6門を選択できます。内蔵プライマーの計算済み結果は全6門を同じ条件で照合しています。';
    const selector=$('reference-phylum'),saved=selector.value;selector.replaceChildren();const allOption=add(selector,'option','全門（現在の参照）');allOption.value='';[...new Set(scopedRecords().map(r=>r.phylum))].sort().forEach(p=>{const o=add(selector,'option',taxonLabel('phylum',p));o.value=p;});selector.value=[...selector.options].some(o=>o.value===saved)?saved:'';
    const mode=$('mode-tabs');mode.replaceChildren();if(['16S','12S'].includes(state.gene)){button(mode,'内蔵プライマーの計算済み結果（6門）',state.mode==='builtin',()=>{if(state.worker||state.importing)stop();state.mode='builtin';state.legacyPrimer=state.legacyPrimer||(state.gene==='12S'?'MiFish_U_F':'16S_ar_L');state.limit=1000;clearError();refresh();});button(mode,'旧版の保存結果（従来5門）',state.mode==='legacy',()=>{if(state.worker||state.importing)stop();state.mode='legacy';state.legacyPrimer=state.legacyPrimer||(state.gene==='12S'?'MiFish_U_F':'16S_ar_L');state.limit=1000;clearError();refresh();});}
    button(mode,'自由入力・参照配列から再計算',state.mode==='custom',()=>{state.mode='custom';state.limit=1000;refresh();});
    $('legacy-control').hidden=!presetMode();$('input-control').hidden=false;
    ['type-tabs','strand-tabs','legacy-tabs'].forEach(id=>$(id).replaceChildren());
    if(presetMode()){
      if(state.gene==='12S'){
        ['U','E','U2','M'].forEach(type=>button($('type-tabs'),'MiFish-'+type,type===state.type,()=>{state.type=type;state.legacyPrimer=`MiFish_${type}_${state.strand}`;state.limit=1000;refresh();}));
        ['F','R'].forEach(strand=>button($('strand-tabs'),strand==='F'?'順方向（F）':'逆方向（R）',strand===state.strand,()=>{state.strand=strand;state.legacyPrimer=`MiFish_${state.type}_${strand}`;state.limit=1000;refresh();}));
      }else ['16S_ar_L','16S_br_H'].forEach(p=>button($('legacy-tabs'),p,state.legacyPrimer===p,()=>{state.legacyPrimer=p;state.limit=1000;refresh();}));
    }
    const ps=$('result-primer-tabs');ps.replaceChildren();
    if(presetMode())add(ps,'span','表示中：'+state.legacyPrimer);
    else (availableRun()?.primers||[]).forEach(p=>button(ps,p.name,state.activePrimer===p.name,()=>{state.activePrimer=p.name;state.limit=1000;refresh();}));
    const box=$('rank-controls');box.replaceChildren();const pending=state.mode==='custom'&&!availableRun(),base=pending?scopedRecords():activeCalls(),unit=pending?'参照n=':'n=';
    RANKS.forEach(([rank,label],depth)=>{
      const section=add(box,'div',undefined,'rank-control');add(section,'h2',label);const tabs=add(section,'div',undefined,'tabs');
      if(depth>0&&!state.filters[RANKS[depth-1][0]]){add(tabs,'span','先に'+RANKS[depth-1][1]+'を選択してください。','note');return;}
      const prefix=base.filter(c=>RANKS.slice(0,depth).every(([r])=>!state.filters[r]||norm(c[r])===state.filters[r]));
      const select=value=>{if(value)state.filters[rank]=value;else delete state.filters[rank];RANKS.slice(depth+1).forEach(([r])=>delete state.filters[r]);if(pending&&rank==='phylum')$('reference-phylum').value=value||'';state.limit=1000;refresh();};
      button(tabs,'すべて · '+unit+prefix.length,!state.filters[rank],()=>select(null));
      const counts=new Map();prefix.forEach(c=>counts.set(norm(c[rank]),(counts.get(norm(c[rank]))||0)+1));
      if(state.filters[rank]&&!counts.has(state.filters[rank]))counts.set(state.filters[rank],0);
      [...counts].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([name,count])=>button(tabs,taxonLabel(rank,name)+' · '+unit+count,state.filters[rank]===name,()=>select(name)));
    });
  }
  function patternKey(c){return JSON.stringify([c.gene,state.group==='position'?c.positionKey:[c.alignmentPrimer,c.alignmentTarget]]);}
  function patterns(calls){
    const map=new Map();calls.filter(c=>c.passed).forEach(c=>{const k=patternKey(c);if(!map.has(k))map.set(k,[]);map.get(k).push(c);});
    const items=[...map].map(([key,members])=>{let score=-Infinity,identity=-Infinity;for(const c of members){if(c.score>score)score=c.score;if(c.identity>identity)identity=c.identity;}return {key,calls:members,summary:members[0],score,identity};});
    items.sort((a,b)=>(state.sort==='n'?b.calls.length-a.calls.length:state.sort==='identity'?b.identity-a.identity:b.score-a.score)||a.key.localeCompare(b.key));
    return items;
  }
  function alignment(parent,c,physical=false){
    const box=add(parent,'div',undefined,'alignment');
    for(const [label,seq] of [['P',c.alignmentPrimer],['T',c.alignmentTarget]]){
      const row=add(box,'div',undefined,'seqrow');add(row,'span',label,'label');
      [...seq].forEach((base,i)=>{const p=c.alignmentPrimer[i],t=c.alignmentTarget[i],changed=p==='-'||t==='-'||!A.compatible(p,t),degenerate=label==='P'&&p!=='-'&&A.BASES[p].length>1,ambiguous=label==='T'&&t!=='-'&&A.BASES[t].length>1;const cell=add(row,'span',base,'base'+(degenerate?' degenerate':'')+(ambiguous?' uncertain':'')+(changed?' changed':''));cell.title=base==='-'?'ギャップ':`${label}: ${base} = ${[...A.BASES[base]].join('/')}${changed?' · 非互換／ギャップ':''}`;});
    }
    if(physical){const row=add(box,'div',undefined,'seqrow');add(row,'span','B3′','label');[...c.alignmentTarget].forEach(base=>add(row,'span',A.COMP[base],'base'));}
    return box;
  }
  const genusCount=calls=>new Set(calls.filter(c=>norm(c.genus)!=='unclassified').map(c=>RANKS.map(([r])=>norm(c[r])).join('\t'))).size;
  function stat(label,value){const box=add($('analysis-summary'),'div',undefined,'stat');add(box,'strong',value.toLocaleString());add(box,'span',label);}
  function makeTable(parent,headers,rows){const table=add(parent,'table'),head=add(table,'thead'),h=add(head,'tr');headers.forEach(x=>add(h,'th',x));const body=add(table,'tbody');rows.forEach(row=>{const tr=add(body,'tr');row.forEach(x=>add(tr,'td',String(x)));});return table;}
  function taxonomyGroups(calls,rank){
    const depth=RANKS.findIndex(([r])=>r===rank);if(depth<0)throw Error('未対応の集計階層です');
    const groups=new Map();
    for(const c of calls){const path=RANKS.slice(0,depth+1).map(([r])=>norm(c[r])),key=JSON.stringify(path);if(!groups.has(key))groups.set(key,{key,path,calls:[]});groups.get(key).calls.push(c);}
    return [...groups.values()];
  }
  // Count each subordinate taxon once, keyed by its full parent path.
  // A green taxon has at least one perfect reference, irrespective of thresholds.
  function taxonMatches(calls,rank,unit){
    const depth=RANKS.findIndex(([r])=>r===rank),child=RANKS.findIndex(([r])=>r===unit);
    if(depth<0||unit!=='records'&&child<=depth)throw Error('階層と集計単位を確認してください');
    return taxonomyGroups(calls,rank).map(group=>{
      const units=new Map();let unclassifiedReferences=0,perfectReferences=0,indeterminateReferences=0;
      group.calls.forEach((c,i)=>{
        const perfect=c.perfect===true;
        if(perfect)perfectReferences++;if(c.indeterminate)indeterminateReferences++;
        if(unit!=='records'&&norm(c[unit])==='unclassified'){unclassifiedReferences++;return;}
        const key=unit==='records'?String(i):JSON.stringify(RANKS.slice(0,child+1).map(([r])=>norm(c[r])));
        units.set(key,units.get(key)===true||perfect);
      });
      const matched=[...units.values()].filter(Boolean).length;
      return {key:group.key,path:group.path,total:units.size,matched,other:units.size-matched,
        rate:units.size?100*matched/units.size:null,references:group.calls.length,perfectReferences,indeterminateReferences,unclassifiedReferences};
    });
  }
  function chartRows(calls){
    const query=state.chartQuery.trim().toLocaleLowerCase();
    const rows=taxonMatches(calls,state.chartRank,state.chartUnit).map(row=>({...row,label:row.path.map((name,i)=>taxonLabel(RANKS[i][0],name)).join(' / ')}));
    const matched=rows.filter(r=>!query||r.label.toLocaleLowerCase().includes(query));
    matched.sort((a,b)=>(state.chartSort==='name'?0:state.chartSort==='rate'?(b.rate??-1)-(a.rate??-1):b.matched-a.matched)||a.key.localeCompare(b.key));
    return {all:rows,matched};
  }
  function renderMatchChart(calls){
    syncLimit('chart-limit',state.chartLimit);const depth=RANKS.findIndex(([r])=>r===state.chartRank),allowed=[...RANKS.slice(depth+1).map(([r])=>r),'records'];
    if(!allowed.includes(state.chartUnit))state.chartUnit=allowed.includes('genus')?'genus':'records';
    const tabs=$('taxon-rank-tabs');tabs.replaceChildren();
    RANKS.forEach(([rank,label],index)=>{const b=button(tabs,label,rank===state.chartRank,()=>{state.chartRank=rank;state.chartLimit=200;state.chartQuery='';$('chart-search').value='';$('aggregate-rank').value=rank;renderTaxonomy(filteredCalls());tabs.querySelector('[aria-selected="true"]').focus({preventScroll:true});});b.id='chart-rank-'+rank;b.setAttribute('role','tab');b.setAttribute('aria-controls','taxon-chart-panel');b.tabIndex=rank===state.chartRank?0:-1;b.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(index+1)%RANKS.length;else if(e.key==='ArrowLeft')next=(index+RANKS.length-1)%RANKS.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=RANKS.length-1;else return;e.preventDefault();tabs.querySelectorAll('button')[next].click();};});
    $('taxon-chart-panel').setAttribute('aria-labelledby','chart-rank-'+state.chartRank);
    const selector=$('chart-unit'),saved=state.chartUnit;selector.replaceChildren();
    allowed.forEach(unit=>{const o=add(selector,'option',unit==='records'?'参照配列数':RANKS.find(([r])=>r===unit)[1]+'数');o.value=unit;});selector.value=saved;
    $('chart-sort').value=state.chartSort;
    const records=state.chartUnit==='records',unitLabel=records?'配列':RANKS.find(([r])=>r===state.chartUnit)[1];
    const yes=records?'プライマー全体と完全一致する配列':'完全一致する配列が1件以上ある'+unitLabel;
    const no=records?'完全一致しない配列・塩基が不明な配列':'完全一致する配列がない'+unitLabel;
    $('chart-explanation').textContent=records?'各分類群の配列を、プライマー全体と完全一致するもの（緑）と、それ以外（灰色）に分けています。':
      '緑は、プライマー全体と完全一致する配列が1件以上ある'+unitLabel+'の数です。灰色は、完全一致する配列がない'+unitLabel+'の数です。同じ'+unitLabel+'に一致する配列と一致しない配列が混在する場合も、緑に1'+unitLabel+'として数えます。';
    $('chart-explanation').textContent+=' 塩基が不明で完全一致か判断できない配列は灰色側に含めます。現在選択しているプライマーと参照配列の範囲で比較します。';
    if(!records)$('chart-explanation').textContent+=' 分類名が不明な参照配列は'+unitLabel+'数から除外します。';
    const {all,matched}=chartRows(calls),maximum=matched.reduce((m,r)=>Math.max(m,r.total),1),visible=matched.slice(0,state.chartLimit);
    const sums=all.reduce((s,r)=>({total:s.total+r.total,matched:s.matched+r.matched,other:s.other+r.other,unknown:s.unknown+r.unclassifiedReferences}),{total:0,matched:0,other:0,unknown:0});
    $('chart-summary').textContent=RANKS[depth][1]+'別 · '+(records?'完全一致 ':'一致する配列あり ')+sums.matched.toLocaleString()+unitLabel+' · '+(records?'それ以外 ':'一致する配列なし ')+sums.other.toLocaleString()+unitLabel+' · 合計 '+sums.total.toLocaleString()+unitLabel+' · 表示 '+visible.length+' / 検索該当 '+matched.length+' / 分類群 '+all.length+(sums.unknown?' · 分類名が不明な '+sums.unknown+'配列を除外':'');
    const legend=$('chart-legend');legend.replaceChildren();
    const swatch=(cls,label)=>{const item=add(legend,'span',undefined,'chart-legend-item');add(item,'span',undefined,'chart-swatch '+cls);add(item,'span',label);};
    swatch('bar-match',yes);swatch('bar-other',no);
    $('chart-axis').textContent='共通目盛：0 〜 '+maximum.toLocaleString()+' '+unitLabel+' · 数値は「'+(records?'完全一致 / それ以外':'一致する配列あり / なし')+'（緑の割合）」';
    const list=$('taxon-chart');list.replaceChildren();
    if(!matched.length)add(list,'p',calls.length?'条件に該当する分類群はありません。':Object.keys(state.filters).length?'選択した分類群に該当する結果がありません。分類群の選択は保持しています。':'名前と配列を入力するかテンプレートを選び、「照合する」を押してください。','note');
    visible.forEach(row=>{
      const b=add(list,'button',undefined,'chart-row');b.type='button';b.dataset.chartKey=row.key;
      b.setAttribute('aria-label',row.label+'：'+yes+' '+row.matched+'、'+no+' '+row.other+'、合計 '+row.total+' '+unitLabel+'、'+(row.rate===null?'割合算出不可':row.rate.toFixed(1)+'%'));
      const label=add(b,'span',undefined,'chart-label');add(label,'strong',taxonLabel(state.chartRank,row.path[depth]));
      if(depth)add(label,'small',row.path.slice(0,-1).map((name,i)=>taxonLabel(RANKS[i][0],name)).join(' > '));
      const track=add(b,'span',undefined,'chart-track'),total=add(track,'span',undefined,'chart-total');total.style.width=100*row.total/maximum+'%';
      for(const [cls,count] of [['bar-match',row.matched],['bar-other',row.other]]){const segment=add(total,'span',undefined,cls);segment.style.width=row.total?100*count/row.total+'%':'0%';}
      add(b,'span',(records?'一致 ':'あり ')+row.matched+' / '+(records?'その他 ':'なし ')+row.other+'（'+(row.rate===null?'—':row.rate.toFixed(1)+'%')+'）','chart-numbers');
      b.title=yes+' '+row.matched+' / '+no+' '+row.other+'。参照配列 '+row.references+'件、完全一致 '+row.perfectReferences+'件、Nのため判断できない '+row.indeterminateReferences+'件、分類名不明 '+row.unclassifiedReferences+'件。クリックで分類を絞り込みます。';
      b.onclick=()=>{state.filters=Object.fromEntries(row.path.map((name,i)=>[RANKS[i][0],name]));state.limit=1000;state.chartLimit=200;refresh();};
    });
    $('chart-more').hidden=visible.length>=matched.length;$('export-chart').disabled=!matched.length;
  }
  function renderTaxonomy(calls){
    const target=$('taxonomy-table');target.replaceChildren();$('aggregate-rank').value=state.chartRank;
    makeTable(target,['分類パス','対象n','条件を満たす配列数','条件に届かない配列数','判定不能n（標的N）','完全一致の配列数','完全一致率（対象nが分母）','平均互換一致率（判定不能を除く）'],taxonomyGroups(calls,state.chartRank).sort((a,b)=>a.key.localeCompare(b.key)).map(({path,calls:cs})=>{
      const determinate=cs.filter(c=>!c.indeterminate);return [path.map((name,i)=>taxonLabel(RANKS[i][0],name)).join(' / '),cs.length,cs.filter(c=>c.passed).length,cs.filter(c=>c.judgement==='below_threshold').length,cs.filter(c=>c.indeterminate).length,cs.filter(c=>c.perfect).length,(100*cs.filter(c=>c.perfect).length/cs.length).toFixed(1)+'%',determinate.length?(determinate.reduce((s,c)=>s+c.identity,0)/determinate.length).toFixed(1)+'%':'—'];}));
    renderMatchChart(calls);
  }
  function renderResults(){
    const calls=filteredCalls(),items=patterns(calls),passed=calls.filter(c=>c.passed);syncLimit('display-limit',state.limit);$('analysis-summary').replaceChildren();
    stat(state.mode==='legacy'?'旧版の成功呼出し n':'照合対象の参照記録 n',calls.length);stat('条件を満たす配列数',passed.length);stat('完全一致の配列数',calls.filter(c=>c.perfect).length);stat('変異パターン数',items.length);
    stat('判定不能 n（標的N）',calls.filter(c=>c.indeterminate).length);stat('条件に届かない配列数',calls.filter(c=>c.judgement==='below_threshold').length);
    const run=availableRun(),name=presetMode()?state.legacyPrimer:state.activePrimer||'未照合';
    $('status').textContent=`${regionLabel(state.gene)} / ${name} / n=${calls.length} / 属数=${genusCount(calls)} / ${state.group==='base'?'塩基種別':'位置のみ'} / ${state.mode==='builtin'?'内蔵参照・6門を同条件で計算：一致率≥60%、被覆率≥80%':state.mode==='legacy'?'旧部位・元スコアを保持（標的Nの判定は更新）':run?'新計算：一致率≥'+run.minIdentity+'%、被覆率≥'+run.minCoverage+'%':'プライマーを入力して「照合」を実行してください。'}\n${calls.length?'':'現在の条件に該当する結果はありません。'}`;
    $('current-region').textContent='対象領域：'+regionLabel(state.gene);
    $('status').textContent+='\n判定不能（採用整列に標的Nあり）='+calls.filter(c=>c.indeterminate).length+'件。通常の変異パターンから分離し、記録表・CSV・分類集計に保持しています。';
    $('grid').replaceChildren();$('record-view').replaceChildren();$('grid').hidden=state.view!=='cards';$('record-view').hidden=state.view==='cards';
    if(state.view==='cards')items.slice(0,state.limit).forEach((p,index)=>{
      const c=p.summary,complete=p.calls.length>0&&p.calls.every(x=>x.perfect===true),card=add($('grid'),'article',undefined,'tile'+(p.calls.some(x=>x.confidence==='review')?' review':'')+(complete?' perfect-match':''));
      card.tabIndex=0;card.setAttribute('role','button');card.dataset.patternKey=p.key;
      const heading=add(card,'h3'),title=add(heading,'span',c.legacy?'旧パターンP'+c.patternId:'変異パターン '+(index+1));if(state.gene==='all')add(title,'span',' · '+c.gene,'region-badge');if(complete)add(title,'span','完全一致','match-badge');add(heading,'span',p.calls.length+'件 · '+genusCount(p.calls)+'属');
      add(card,'p',`スコア=${p.score} · 一致率 ${c.identity.toFixed(1)}% · ${confidenceLabel(c)}`);alignment(card,c);
      add(card,'p',`不一致 ${c.mismatches} / P突出 ${c.primerBulges} / T突出 ${c.targetBulges}`);
      if(state.group==='position')add(card,'p','位置統合：塩基種 '+new Set(p.calls.map(x=>JSON.stringify([x.alignmentPrimer,x.alignmentTarget]))).size+'通り（図は一例）');
      card.onclick=()=>openPattern(p);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPattern(p);}};
    });
    else{
      const selected=state.view==='indeterminate'?calls.filter(c=>c.indeterminate):calls,sorted=[...selected].sort((a,b)=>b.score-a.score||a.accession.localeCompare(b.accession));
      if(state.view==='indeterminate')add($('record-view'),'p',selected.length?'標的Nがあるため採否は判定不能です。MM数は既知の非互換列のみで、不一致数0でも完全一致とは認めません。':'現在の条件に判定不能（標的N）の記録はありません。','warning');
      const table=makeTable($('record-view'),['領域','記録','分類','互換一致率（標的Nは一致に数えない）','保守値（同じ整列）','縮重位置数 / 候補配列数','被覆率','スコア','不一致/P突出/T突出','標的N数','判定'],sorted.slice(0,state.limit).map(c=>[c.gene,c.accession,organismLabel(c)+' / '+taxonLabel('genus',c.genus),c.identity.toFixed(1)+'%',c.identityConservative.toFixed(1)+'%',`${c.primerDegenerateCount} / ${c.primerVariants}`,c.coverage.toFixed(1)+'%',c.score,`${c.mismatchCount}/${c.primerBulgeCount}/${c.targetBulgeCount}`,c.targetNCount,c.indeterminate?'判定不能（標的N）':c.passed?'条件を満たす':'条件に届かない']));
      [...table.tBodies[0].rows].forEach((r,i)=>{r.tabIndex=0;r.onclick=()=>openPattern({summary:sorted[i],calls:[sorted[i]],score:sorted[i].score});r.onkeydown=e=>{if(e.key==='Enter')r.click();};});
    }
    $('more').hidden=(state.view==='cards'?items.length:state.view==='indeterminate'?calls.filter(c=>c.indeterminate).length:calls.length)<=state.limit;
    renderTaxonomy(calls);
    ['export-records','export-patterns'].forEach(id=>$(id).disabled=!calls.length);
    $('export-indeterminate').disabled=!calls.some(c=>c.indeterminate);
    $('view-cards').setAttribute('aria-selected',String(state.view==='cards'));$('view-table').setAttribute('aria-selected',String(state.view==='table'));
    $('view-indeterminate').setAttribute('aria-selected',String(state.view==='indeterminate'));
  }
  function taxonomyTree(calls){const root={count:0,children:new Map()};calls.forEach(c=>{let node=root;node.count++;RANKS.forEach(([rank,label])=>{const name=norm(c[rank]);if(!node.children.has(name))node.children.set(name,{count:0,children:new Map(),name,label,rank});node=node.children.get(name);node.count++;});});return root;}
  function appendTree(parent,node){const ul=add(parent,'ul',undefined,'tree');[...node.children.values()].sort((a,b)=>a.name.localeCompare(b.name)).forEach(child=>{const li=add(ul,'li');add(li,'span',child.label+' '+taxonLabel(child.rank,child.name)+' ');add(li,'b','n='+child.count);if(child.children.size)appendTree(li,child);});}
  function detail(c){
    const box=$('detail');box.replaceChildren();add(box,'h3',organismLabel(c));add(box,'p',RANKS.map(([r])=>taxonLabel(r,c[r])).join(' > '));alignment(box,c,true);
    add(box,'p','P/Tは同方向比較。B3′は物理的な対向鎖。Tの逆相補が対向鎖の注文表記です。','note');
    const entry=nameEntry('species',c.organism||c.species);
    if(entry?.ja){const sourceNote=add(box,'p',undefined,'note');add(sourceNote,'span','和名・日本語名称の出典：'+entry.source+' ');const link=add(sourceNote,'a','出典を確認');link.href=entry.url;link.target='_blank';link.rel='noopener noreferrer';}
    const dl=add(box,'dl');const orderB=A.reverseComplement(c.alignmentTarget.replace(/-/g,''));
    const fields=[['種',taxonLabel('species',c.species)],['遺伝子',c.gene],['プライマー',c.primer],['領域由来',c.regionSource],['探索鎖',c.searchStrand],['領域内開始',c.bindingStart],['領域内終了',c.bindingEnd??'旧データ未収録'],['互換一致率',c.identity.toFixed(2)+'%'],['被覆率',c.coverage.toFixed(2)+'%'],['スコア',c.score],['標的曖昧塩基数',c.uncertainCount],['不一致位置・塩基',c.mismatches],['プライマー側バルジ',c.primerBulges],['標的側バルジ',c.targetBulges],['対向標的鎖5′→3′',orderB],['注釈位置',c.location||'旧データ未収録'],['取得元',c.source||'元アトラス'],['取得日',c.retrieved||'2026-09スナップショット']];
    fields.splice(4,0,['プライマー配列5′→3′',c.primerSequence],['縮重位置数',c.primerDegenerateCount],['候補配列数（理論上）',c.primerVariants],['縮重位置・候補塩基',c.primerDegeneratePositions],['完全一致',c.perfect?'はい':'いいえ'],['文字通りのACGT完全一致',c.literalExact?'はい':'いいえ'],['互換一致率の保守値（同じ整列）',c.identityConservative.toFixed(2)+'%'],['標的候補の一部のみ互換の列数',c.possibleOnlyMatches],['標的曖昧位置・候補塩基',c.targetAmbiguousPositions]);
    fields.splice(4,0,['判定',c.indeterminate?'判定不能（標的N）':c.passed?'条件を満たす':'条件に届かない'],['標的N数（挿入列も含む）',c.targetNCount],['標的N位置',c.targetNPositions],['N以外と対向する被覆率',c.nonNCoverage.toFixed(2)+'%']);
    fields.forEach(([k,v])=>{add(dl,'dt',k);add(dl,'dd',valueJa(v));});
    add(box,'p','RやYなど複数の塩基を表す記号があるプライマーでは、候補のいずれかでプライマー全体が相手配列に合えば「完全一致」とします。すべての候補が合う必要はありません。保守値は同じ整列について標的候補の全部がプライマー集合に含まれる列だけを数えます。混合比・PCR効率・Tmは計算しません。','note');
    add(dl,'dt','アクセッション番号');const dd=add(dl,'dd');if(c.source==='local FASTA'){add(dd,'span',c.accession);}else{const a=add(dd,'a',c.accession);a.href='https://www.ncbi.nlm.nih.gov/nuccore/'+encodeURIComponent(c.accession);a.target='_blank';a.rel='noopener noreferrer';}
    if(c.indeterminate)add(box,'p','判定不能：標的Nは一致にもミスマッチにも数えません。標的Nとの対角比較は0点です（ギャップは別途−5点）。閾値を満たしても通常の変異パターンには採用しません。不一致数0は既知の非互換列がないという意味で、完全一致の証明ではありません。','warning');
    else if(!c.passed)add(box,'p','条件に届かないです。最高スコアの整列を示していますが、有効な結合部位とは認定していません。','warning');
    if(c.precomputed)add(box,'p','内蔵参照を6門とも同一条件で事前照合した結果です。一致率60%以上・被覆率80%以上を採用し、標的Nを含む採用整列は判定不能です。','note');
    if(c.legacy)add(box,'p','旧版の採用部位と元スコアは保持しています。一致率と標的Nの判定だけを標的N分離規則で再評価し、標的領域の再探索はしていません。','note');
  }
  function openPattern(p){
    $('dialog-title').textContent=`${p.summary.gene} / ${p.summary.primer} / ${p.summary.legacy?'P'+p.summary.patternId:'変異パターン'}`;
    $('dialog-summary').textContent=`n=${p.calls.length} · 属数=${genusCount(p.calls)} · 不一致数=${p.summary.mismatchCount} · P側突出数=${p.summary.primerBulgeCount} · T側突出数=${p.summary.targetBulgeCount}`;
    if(p.summary.indeterminate)$('dialog-summary').textContent+=' · 判定不能（標的N '+p.summary.targetNCount+'塩基）';
    $('tree').replaceChildren();appendTree($('tree'),taxonomyTree(p.calls));$('members').replaceChildren();
    const members=[...p.calls].sort((a,b)=>RANKS.map(([r])=>norm(a[r])).join('\t').localeCompare(RANKS.map(([r])=>norm(b[r])).join('\t'))||a.accession.localeCompare(b.accession));
    members.forEach((c,i)=>{const b=add($('members'),'button',undefined,'member'+(i?'':' active'));b.type='button';add(b,'strong',organismLabel(c));add(b,'span',c.accession+' / '+taxonLabel('genus',c.genus));b.onclick=()=>{$('members').querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');detail(c);};});
    detail(members[0]);if(!$('dialog').open)$('dialog').showModal();
  }
  function refresh(){renderControls();renderResults();renderTemplateButtons();updateBusy();}
  function parsePrimers(text){
    if(typeof text!=='string'||text.length>LIMITS.primerText)throw Error('プライマー入力は32,768文字以下にしてください');
    const rows=[],lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).map(l=>l.trim());let fasta=null;
    if(lines.some(l=>l.startsWith('>'))){lines.forEach(line=>{line=line.trim();if(!line)return;if(line.startsWith('>')){fasta={name:line.slice(1).trim(),sequence:''};rows.push(fasta);}else{if(!fasta)throw Error('FASTAヘッダがありません');fasta.sequence+=line.replace(/\s/g,'');}});}
    else lines.filter(l=>l.trim()).forEach((line,i)=>{const fields=line.trim().split(/[\s,]+/);if(fields.length===1)rows.push({name:'primer_'+(i+1),sequence:fields[0]});else if(fields.length===2)rows.push({name:fields[0],sequence:fields[1]});else throw Error('1行は「名前 配列」または配列だけにしてください');});
    if(!rows.length||rows.length>16)throw Error('プライマーは1–16本にしてください');
    const names=new Set();for(const p of rows){p.sequence=p.sequence.toUpperCase();fieldText(p.name,'プライマー名',LIMITS.primerName);if(!p.name||names.has(p.name))throw Error('プライマー名は空欄・重複不可');names.add(p.name);if(p.sequence.length<8||p.sequence.length>80||!/^[ACGTRYSWKMBDHVN]+$/.test(p.sequence))throw Error(p.name+': 8–80ntのDNA/IUPAC配列を入力してください（5′等の記号は除く。U・イノシンIは未対応）');Object.assign(p,A.primerInfo(p.sequence));}return rows;
  }
  const MIMAMMAL_PAIRS=[{"name":"MiMammal-1","forwardSequence":"GGGTTGGTAAATTTCGTGCCAGC","reverseSequence":"CATAGTGGGGTATCTAATCCCAGTTTG"},{"name":"MiMammal-2","forwardSequence":"GGACTGGTCAATTTCGTGCCAGC","reverseSequence":"CATAGTGAGGTATCTAATCTCAGTTTG"},{"name":"MiMammal-3","forwardSequence":"GGGTTGGTTAATTTCGTGCCAGC","reverseSequence":"CATAGTGGGGTATCTAATCCCAGTTTG"}];
  const ADDITIONAL_TEMPLATES=[{"id":"birt","name":"BirT","gene":"12S","forwardSequence":"YGGTAAATCYTGTGCCAGC","reverseSequence":"AAGTCCTTAGAGTTTYAAGCGTT","description":"BirT／12S／利用者資料の本体配列（Forward・Reverseとも5′→3′）：BirT-F_1st / BirT-R_1st"},{"id":"uceta","name":"uCeta","gene":"12S","forwardSequence":"GACACTGAAAATGTCTAGATGG","reverseSequence":"TYAATCGTATGACCGCGGTG","description":"uCeta／12S／利用者資料の本体配列（Forward・Reverseとも5′→3′）：uCeta-F_1st / uCeta-R_1st"},{"id":"ceph16s-m","name":"Ceph16S-M","gene":"16S","forwardSequence":"GRCTRGAATGAAWGGTTTGACG","reverseSequence":"CGCTGTTAYCCCTATGGTARCT","description":"Ceph16S-M／16S／利用者資料の本体配列（Forward・Reverseとも5′→3′）：Ceph16S-M_F_1st / Ceph16S-M_R_1st"},{"id":"v16s-u","name":"V16S-U","gene":"16S","forwardSequence":"ACGAGAAGACCCYRYGRARCTT","reverseSequence":"TCTHRRANAGGATTGCGCTGTTA","description":"V16S-U／16S／利用者資料の本体配列（Forward・Reverseとも5′→3′）：V16S-U_F_1st / V16S-U_R_1st"},{"id":"mideca","name":"MiDeca","gene":"16S","forwardSequence":"GGACGATAAGACCCTATAAA","reverseSequence":"ACGCTGTTATCCCTAAAGT","description":"MiDeca／16S／利用者資料の本体配列（Forward・Reverseとも5′→3′）：MiDeca-F_1st / MiDeca-R_1st"},{"id":"scle-12s","name":"Scle_12S","gene":"12S","forwardSequence":"CCAGCMGACGCGGTRANACTTA","reverseSequence":"AAWTTGACGACGGCCATGC","description":"Scle_12S／12S／イシサンゴ類／Scle_12S_Fw・Scle_12S_Rv（ともに5′→3′）；Nishitsuji et al. (2023)"}];
  const TEMPLATES=[
    {id:'mifish-u',name:'MiFish-U',gene:'12S',forward:'MiFish_U_F',reverse:'MiFish_U_R'},
    {id:'mifish-e',name:'MiFish-E',gene:'12S',forward:'MiFish_E_F',reverse:'MiFish_E_R'},
    {id:'mifish-u2',name:'MiFish-U2',gene:'12S',forward:'MiFish_U2_F',reverse:'MiFish_U2_R'},
    {id:'mifish-m',name:'MiFish-M',gene:'12S',forward:'MiFish_M_F',reverse:'MiFish_M_R'},
    {id:'16sarbr',name:'16Sarbr',gene:'16S',forward:'16S_ar_L',reverse:'16S_br_H'},
    {id:'mimammal',name:'MiMammal（3組）',gene:'12S',pairs:MIMAMMAL_PAIRS,description:'Mimammal 12S rRNA (MiMammal)／Illumina MiSeq用アンプリコン解析（利用者提示配列・5′→3′）'},
    ...MIMAMMAL_PAIRS.map((p,i)=>({...p,id:'mimammal-'+(i+1),gene:'12S',description:'MiMammal／12S rRNA／Illumina MiSeq用アンプリコン解析（利用者提示配列・5′→3′）'})),
    ...ADDITIONAL_TEMPLATES
  ];
  function inputRows(){return [...$('primer-rows').rows].map(row=>({name:row.querySelector('[data-field="name"]').value.trim(),forward:row.querySelector('[data-field="forward"]').value.replace(/\s/g,'').toUpperCase(),reverse:row.querySelector('[data-field="reverse"]').value.replace(/\s/g,'').toUpperCase()}));}
  function readPrimerTable(){
    const pairs=inputRows().filter(r=>r.name||r.forward||r.reverse),names=new Set(),primers=[];
    if(!pairs.length)throw Error('名前とForwardまたはReverseの配列を入力してください');
    for(const row of pairs){
      fieldText(row.name,'名前',LIMITS.primerName-10);
      if(!row.name||names.has(row.name))throw Error('名前は空欄・重複不可です');
      if(!row.forward&&!row.reverse)throw Error(row.name+': ForwardまたはReverseの配列を入力してください');
      names.add(row.name);
      for(const [side,sequence] of [['Forward',row.forward],['Reverse',row.reverse]])if(sequence){
        if(sequence.length<8||sequence.length>80||!/^[ACGTRYSWKMBDHVN]+$/.test(sequence))throw Error(row.name+' '+side+': 8–80ntのDNA/IUPAC配列を入力してください');
        // Reuse validation without serializing the name into a whitespace format.
        const checked=parsePrimers(sequence)[0];primers.push({...checked,name:row.name+' '+side,pairName:row.name,direction:side});
      }
    }
    if(primers.length>16)throw Error('ForwardとReverseを合わせて16本（8組）まで入力できます');
    return primers;
  }
  function appendPrimerRow(values={}){
    const body=$('primer-rows');if(body.rows.length>=8){fail('入力は8組までです');return;}
    const row=add(body,'tr');
    for(const field of ['name','forward','reverse']){
      const cell=add(row,'td'),input=add(cell,'input');input.type='text';input.dataset.field=field;input.value=values[field]||'';input.maxLength=field==='name'?118:240;input.spellcheck=false;
      input.setAttribute('aria-label',({name:'名前',forward:'Forward 5′→3′',reverse:'Reverse 5′→3′'})[field]+' '+body.rows.length+'行目');
      input.placeholder=field==='name'?'プライマーの名前':'5′→3′の配列';
      input.oninput=()=>{state.dirty=true;renderTemplateButtons();renderPrimerInfo();$('run-status').textContent='入力を変更しました。「照合する」を押すと結果を更新します。';};
    }
    const cell=add(row,'td'),remove=add(cell,'button','削除');remove.type='button';remove.onclick=()=>{row.remove();if(!body.rows.length)appendPrimerRow();state.dirty=true;renderTemplateButtons();renderPrimerInfo();};
  }
  function setPrimerRows(rows){$('primer-rows').replaceChildren();for(const row of rows.length?rows:[{}])appendPrimerRow(row);renderPrimerInfo();renderTemplateButtons();}
  // A template is selected exactly when all its named pairs are in the table.
  // This keeps overlapping bundles and individual buttons in sync after edits.
  function templateRows(template){return (template.pairs||[template]).map(p=>({name:p.name,forward:p.forwardSequence||data.presets[p.forward],reverse:p.reverseSequence||data.presets[p.reverse]}));}
  const samePrimerRow=(a,b)=>['name','forward','reverse'].every(field=>a[field]===b[field]);
  const hasPrimerInput=row=>Boolean(row.name||row.forward||row.reverse);
  const templatePresent=(template,rows)=>templateRows(template).every(pair=>rows.some(row=>samePrimerRow(row,pair)));
  function toggleTemplate(template){
    if(state.worker||state.importing)return;
    const rows=inputRows(),nodes=[...$('primer-rows').rows],pairs=templateRows(template),removing=templatePresent(template,rows);
    const additions=removing?[]:pairs.filter(pair=>!rows.some(row=>samePrimerRow(row,pair)));
    if(additions.some(pair=>rows.some(row=>row.name===pair.name))){fail('同じ名前の入力があります。手入力した行の名前を変更してから、テンプレートを追加してください。');return;}
    if(rows.filter(hasPrimerInput).length+additions.length>8){fail('入力は8組までです。不要な行やテンプレートを解除してから追加してください。');return;}
    const next=removing?rows.filter(row=>!pairs.some(pair=>samePrimerRow(row,pair))):rows.filter(hasPrimerInput).concat(additions);
    const genes=new Set(TEMPLATES.filter(t=>templatePresent(t,next)).map(t=>t.gene));
    // Preserve All; mixed-region selections must be evaluated across all regions.
    if(!removing&&state.gene!=='all')selectGene(genes.size>1?'all':template.gene);
    clearError();
    rows.forEach((row,i)=>{if(removing?pairs.some(pair=>samePrimerRow(row,pair)):!hasPrimerInput(row))nodes[i].remove();});
    for(const pair of additions)appendPrimerRow(pair);
    if(!$('primer-rows').rows.length)appendPrimerRow();
    state.mode='custom';state.dirty=true;state.limit=1000;renderPrimerInfo();refresh();
    $('run-status').textContent=template.name+(removing?'を解除しました。':'を追加しました。')+'対象領域：'+regionLabel(state.gene)+'。「照合する」を押すと結果を更新します。';
    $('template-'+template.id).focus({preventScroll:true});
  }
  function renderTemplateButtons(){
    const rows=inputRows();state.selectedTemplates=TEMPLATES.filter(t=>templatePresent(t,rows)).map(t=>t.id);
    const parent=$('template-buttons');parent.replaceChildren();
    for(const template of TEMPLATES){
      const selected=state.selectedTemplates.includes(template.id);
      const b=button(parent,template.name,selected,()=>toggleTemplate(template));
      if(template.description)b.title=template.description;
      b.id='template-'+template.id;b.setAttribute('aria-pressed',String(selected));
    }
  }
  function renderPrimerInfo(){
    const target=$('primer-degeneracy');target.replaceChildren();
    if(!inputRows().some(r=>r.name||r.forward||r.reverse)){add(target,'p','Forward・Reverseとも5′→3′で入力してください。片方だけでも照合できます。','note');return;}
    try{const primers=readPrimerTable();makeTable(target,['プライマー','長さ nt','縮重位置数','候補配列数'],primers.map(p=>[p.name,p.sequence.length,p.primerDegenerateCount,p.primerVariants]));}
    catch(error){add(target,'p',String(error.message),'note');}
  }
  function togglePanel(buttonId,panelId){const b=$(buttonId),panel=$(panelId);panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden));b.classList.toggle('active',!panel.hidden);}
  function updateBusy(){
    const busy=Boolean(state.worker||state.importing);$('run').disabled=busy;$('import').disabled=busy||state.gene==='all';$('cancel').disabled=!busy;
    for(const id of ['fasta-file','taxonomy-file','replace-data','parallel-count'])$(id).disabled=busy;for(const e of document.querySelectorAll('#primer-rows input,#primer-rows button,#template-buttons button,#add-primer-row'))e.disabled=busy;
    $('progress').hidden=!state.worker;
  }
  function stop(){state.importSerial++;state.importing=false;if(state.worker){state.worker.terminate();state.worker=null;}updateBusy();$('run-status').textContent='中止しました。直前に完了した結果は保持しています。';}
  function resetData(){
    if(state.worker||state.importing)stop();
    if(state.gene==='all'){state.records=data.records.map(r=>({...r}));state.runs={};}
    else{state.records=state.records.filter(r=>r.gene!==state.gene).concat(data.records.filter(r=>r.gene===state.gene).map(r=>({...r})));delete state.runs[state.gene];delete state.runs.all;}
    resultCache.clear();state.activePrimer=null;resetFilters();$('run-status').textContent=regionLabel(state.gene)+': 内蔵参照に戻しました。';refresh();
  }
  function clearInputs(){stop();state.records=data.records.map(r=>({...r}));state.runs={};resultCache.clear();state.activePrimer=null;state.dirty=false;for(const id of ['fasta-file','taxonomy-file'])$(id).value='';state.mode='custom';setPrimerRows([]);renderTemplateButtons();resetFilters();clearError();renderPrimerInfo();refresh();$('run-status').textContent='入力欄・追加参照・照合結果を消去し、内蔵参照に戻しました。';}
  function cpuThreads(){const n=Number(navigator.hardwareConcurrency);return Number.isFinite(n)&&n>=1?Math.min(512,Math.floor(n)):2;}
  function parallelism(totalWork,jobCount){
    const choice=$('parallel-count').value;
    if(!['auto','1','2','4','8'].includes(choice))throw Error('並列数を選択してください');
    const hardware=cpuThreads(),automatic=hardware>2?hardware-1:hardware;
    const requested=choice==='auto'?(totalWork<1000000?1:automatic):Number(choice);
    return Math.max(1,Math.min(8,hardware,requested,jobCount));
  }
  function alignmentJobs(records,primers){
    const jobs=[];let totalWork=0;
    primers.forEach((p,primerIndex)=>{
      let start=0,weight=0;
      const push=end=>{jobs.push({id:jobs.length,primerIndex,start,end,weight});totalWork+=weight;start=end;weight=0;};
      records.forEach((r,i)=>{
        const cost=2*r.sequence.length*p.sequence.length;
        if(i>start&&(i-start>=128||weight+cost>8000000))push(i);
        weight+=cost;
      });
      if(start<records.length)push(records.length);
    });
    jobs.sort((a,b)=>b.weight-a.weight||a.id-b.id);
    return {jobs,totalWork};
  }
  // Workers receive only the primer and target sequences and return compact hits
  // (PrimerAlign.alignBatch); record metadata is merged on the main thread by index.
  function createAlignmentPool({records,primers,onProgress,onComplete,onError}){
    const {jobs,totalWork}=alignmentJobs(records,primers),size=parallelism(totalWork,jobs.length),total=records.length*primers.length;
    const parts=new Array(jobs.length),slots=[];let next=0,finished=0,finishedCalls=0,closed=false,url=null,started=0,lastProgress=0;
    const pool={size,jobs:jobs.length,workers:[],terminate(){
      if(closed)return;closed=true;
      for(const w of pool.workers){w.onmessage=null;w.onerror=null;w.onmessageerror=null;w.terminate();}
      if(url){URL.revokeObjectURL(url);url=null;}
    },start(){
      started=performance.now();
      const body=String.raw`
self.onmessage=e=>{
  const {jobId,primer,targets}=e.data;
  try{
    const result=PrimerAlign.alignBatch(primer,targets,done=>self.postMessage({jobId,progress:done}));
    self.postMessage({jobId,done:true,result},[result.pattern.buffer,result.start.buffer,result.end.buffer,result.reverse.buffer,result.length.buffer]);
  }catch(error){self.postMessage({jobId,error:String(error.stack||error)});}
};`;
      url=URL.createObjectURL(new Blob([$('alignment-engine').textContent,body],{type:'text/javascript'}));
      try{
        for(let i=0;i<size;i++){
          const w=new Worker(url),slot={worker:w,job:null,progress:0};pool.workers.push(w);slots.push(slot);
          w.onerror=e=>reject(e.message||'並列照合でエラーが発生しました');
          w.onmessageerror=()=>reject('並列照合の結果を読み込めませんでした');
          w.onmessage=e=>{
            if(closed)return;
            try{
              const d=e.data,j=slot.job;if(!j||d.jobId!==j.id)return;
              if(d.error){reject(d.error);return;}
              if(d.done){
                const r=d.result,count=j.end-j.start;
                if(!r||!Array.isArray(r.patterns)||[r.pattern,r.start,r.end,r.reverse,r.length].some(a=>!ArrayBuffer.isView(a)||a.length!==count))throw Error('並列照合の結果件数が一致しません');
                parts[j.id]=r;
                finished++;finishedCalls+=count;slot.job=null;slot.progress=0;
                progress(finished===jobs.length);
                if(finished===jobs.length){
                  if(finishedCalls!==total)throw Error('並列照合の合計件数が一致しません');
                  // Jobs of one primer cover consecutive record ranges; join them in record order.
                  const results=primers.map((p,i)=>A.joinBatches(jobs.filter(x=>x.primerIndex===i).sort((a,b)=>a.start-b.start).map(x=>parts[x.id])));
                  if(results.some(r=>r.pattern.length!==records.length))throw Error('並列照合の合計件数が一致しません');
                  const stats={workers:size,jobs:jobs.length,elapsedMs:performance.now()-started};
                  pool.terminate();onComplete(results,stats);
                }else dispatch(slot);
              }else if(d.progress!==undefined){
                if(!Number.isFinite(d.progress)||d.progress<0||d.progress>j.end-j.start)throw Error('並列照合の進捗が不正です');
                slot.progress=Math.max(slot.progress,d.progress);progress(false);
              }
            }catch(error){reject(error);}
          };
        }
      }finally{if(url){URL.revokeObjectURL(url);url=null;}}
      for(const slot of slots)dispatch(slot);
    }};
    function reject(error){if(closed)return;pool.terminate();onError(error);}
    function progress(force){const now=performance.now();if(!force&&now-lastProgress<50)return;lastProgress=now;onProgress(finishedCalls+slots.reduce((sum,s)=>sum+s.progress,0),total);}
    function dispatch(slot){
      if(closed||next>=jobs.length)return;
      const j=jobs[next++];slot.job=j;slot.progress=0;
      try{slot.worker.postMessage({jobId:j.id,primer:primers[j.primerIndex].sequence,targets:records.slice(j.start,j.end).map(r=>r.sequence)});}
      catch(error){reject(error);}
    }
    return pool;
  }
  function run(){
    clearError();let startedWorker=null;try{
      if(state.importing||state.worker)throw Error('実行中の処理を完了または中止してください');
      const primers=readPrimerTable(),records=analysisRecords(),minIdentity=Number($('min-identity').value),minCoverage=Number($('min-coverage').value);
      if(!records.length)throw Error('この領域の参照配列がありません');
      if(records.length*primers.length>LIMITS.resultCalls)throw Error('照合結果は640,000件以下にしてください。門を絞るかプライマーを分けて実行してください');
      if(!Number.isFinite(minIdentity)||!Number.isFinite(minCoverage)||minIdentity<0||minIdentity>100||minCoverage<0||minCoverage>100)throw Error('閾値は0–100%にしてください');
      const primerBases=primers.reduce((sum,p)=>sum+p.sequence.length,0),work=GENES.map(g=>2*records.filter(r=>r.gene===g).reduce((sum,r)=>sum+r.sequence.length,0)*primerBases);
      if(work.some(cells=>cells>LIMITS.workCells))throw Error('照合量が上限を超えます。門を絞るか、プライマーを分けて実行してください');
      const gene=state.gene,results=new Map();
      // Reuse alignments of this exact record list; align each new primer sequence once.
      for(const p of primers)if(!results.has(p.sequence)){const stored=resultCache.get(records,p.sequence);if(stored)results.set(p.sequence,stored);}
      const reused=primers.filter(p=>results.has(p.sequence)).length,pending=[...new Set(primers.map(p=>p.sequence))].filter(s=>!results.has(s)).map(sequence=>({sequence}));
      const complete=execution=>{
        const previous={runs:{...state.runs},activePrimer:state.activePrimer,mode:state.mode,dirty:state.dirty,filters:state.filters,limit:state.limit};
        state.worker=null;updateBusy();
        try{
          // Merge hits with record metadata and judge them with the current thresholds.
          const metadata=records.map(({sequence,...rest})=>rest),calls=new Array(records.length*primers.length);
          primers.forEach((p,i)=>A.expandCalls(results.get(p.sequence),metadata,p,minIdentity,minCoverage,calls,i*records.length));
          const completed={calls,primers,minIdentity,minCoverage,execution};
          if(gene==='all')state.runs={all:completed};else{state.runs[gene]=completed;delete state.runs.all;}
          state.activePrimer=primers[0].name;state.mode='custom';state.dirty=false;state.limit=1000;
          refresh();
          const head=`完了：${primers.length}本 × ${records.length}参照記録 · `,time=`${execution.workers}並列 · 計算 ${(execution.elapsedMs/1000).toFixed(2)}秒`;
          $('run-status').textContent=head+(!reused?time:!execution.aligned?'保存済みの照合結果を再利用（再計算なし、現在の閾値で再判定）':`新規照合 ${execution.aligned}本・保存済みの照合結果を再利用 ${reused}本（現在の閾値で再判定） · `+time);
        }catch(renderError){
          state.runs=previous.runs;for(const key of ['activePrimer','mode','dirty','filters','limit'])state[key]=previous[key];
          try{refresh();}catch{}$('run-status').textContent='表示処理に失敗しました。直前の結果を保持しています。';fail(renderError);
        }
      };
      if(!pending.length){complete({workers:0,jobs:0,elapsedMs:0,aligned:0,reused});return;}
      const pool=createAlignmentPool({records,primers:pending,
        onProgress(done,total){if(state.worker!==pool)return;$('progress').value=done;$('run-status').textContent=`${pool.size}並列で照合 ${done}/${total}`;},
        onComplete(list,execution){
          if(state.worker!==pool)return;
          pending.forEach((p,i)=>{results.set(p.sequence,list[i]);resultCache.set(records,p.sequence,list[i]);});
          complete({...execution,aligned:primers.length-reused,reused});
        },
        onError(error){if(state.worker!==pool)return;stop();fail(error);}
      });
      state.worker=pool;startedWorker=pool;updateBusy();$('progress').value=0;$('progress').max=pending.length*records.length;
      $('run-status').textContent=`${pool.size}並列で両方向を照合しています…`+(reused?`（${reused}本は保存済みの照合結果を再利用）`:'');pool.start();
    }catch(error){if(startedWorker&&state.worker===startedWorker)stop();fail(error);}
  }
  function parseFasta(text,gene){
    if(typeof text!=='string'||text.length>LIMITS.fastaBytes)throw Error('FASTAは64MiB以下にしてください');
    if(!GENES.includes(gene))throw Error('未対応の遺伝子領域です');
    const rows=[],names=new Set();let r=null,bases=0;
    for(let line of inputLines(text.replace(/^\uFEFF/,''),LIMITS.line)){
      line=line.trim();if(!line||line.startsWith(';'))continue;
      if(line.startsWith('>')){
        if(rows.length>=LIMITS.records)throw Error('FASTAは20,000配列以下にしてください');
        const header=fieldText(line.slice(1).trim(),'FASTAヘッダ',LIMITS.header),accession=fieldText(header.split(/\s+/)[0],'アクセッション番号',LIMITS.accession);
        if(!accession||names.has(accession))throw Error('FASTAアクセッション番号が空欄または重複');names.add(accession);
        const organism=fieldText(header.slice(accession.length).trim()||accession,'生物名');
        r={id:accession+'::'+gene,accession,organism,species:'unclassified',gene,sequence:'',regionSource:'user_provided_gene_region',source:'local FASTA',retrieved:new Date().toISOString().slice(0,10),...Object.fromEntries(RANKS.map(([rank])=>[rank,'unclassified']))};rows.push(r);
      }else{
        if(!r)throw Error('FASTAの>ヘッダがありません');const part=line.replace(/\s/g,'').toUpperCase();
        if(!/^[ACGTRYSWKMBDHVN]+$/.test(part)||r.sequence.length+part.length>100000)throw Error(r.accession+': 配列長8–100,000nt、DNA/IUPAC文字のみ可');
        bases+=part.length;if(bases>LIMITS.bases)throw Error('読込FASTAの合計は5000万nt以下にしてください');r.sequence+=part;
      }
    }
    if(!rows.length)throw Error('FASTA配列がありません');for(const row of rows){if(row.sequence.length<8)throw Error(row.accession+': 配列は8nt以上にしてください');row.length=row.sequence.length;}return rows;
  }
  function parseTaxonomy(text){
    if(typeof text!=='string'||text.length>LIMITS.taxonomyBytes)throw Error('分類TSVは8MiB以下にしてください');
    const lines=inputLines(text.replace(/^\uFEFF/,''),8192),header=lines.next().value.split('\t').map(h=>h.trim()),map=new Map(),allowed=new Set(['accession','organism',...RANKS.map(([r])=>r),'species']);
    if(header.some(h=>!h)||new Set(header).size!==header.length)throw Error('分類TSVの列名が空欄または重複しています');
    if(!header.includes('accession'))throw Error('分類TSVにアクセッション番号の列（accession）が必要です');
    if(header.some(h=>!allowed.has(h)))throw Error('分類TSVに未対応の列名があります');
    for(const line of lines){
      if(!line.trim())continue;if(map.size>=LIMITS.records)throw Error('分類TSVは20,000行以下にしてください');const values=line.split('\t');
      if(values.length!==header.length)throw Error('分類TSVの列数がヘッダと異なります');
      const row=Object.fromEntries(header.map((h,i)=>[h,fieldText(values[i].trim(),h,h==='accession'?LIMITS.accession:LIMITS.field)]));
      if(!row.accession||map.has(row.accession))throw Error('分類TSVのアクセッション番号が空欄または重複');map.set(row.accession,row);
    }return map;
  }
  async function importData(){
    clearError();let token=null;
    try{
      if(state.worker||state.importing)throw Error('実行中の処理を完了または中止してください');
      if(state.gene==='all')throw Error('参照配列を読み込むときは、高度なオプションで対象領域を1つ選択してください');
      const f=$('fasta-file').files[0],tf=$('taxonomy-file').files[0],gene=state.gene,replace=$('replace-data').checked;
      if(!f)throw Error('FASTAを選択してください');
      if(f.size>LIMITS.fastaBytes)throw Error('FASTAは64MiB以下にしてください');
      if(tf&&tf.size>LIMITS.taxonomyBytes)throw Error('分類TSVは8MiB以下にしてください');
      token=++state.importSerial;state.importing=true;updateBusy();$('run-status').textContent=gene+': ファイルを読み込んでいます…';
      const current=()=>state.importing&&state.importSerial===token&&state.gene===gene;
      const fasta=await f.text();if(!current())return;const records=parseFasta(fasta,gene);
      if(tf){const taxonomy=await tf.text();if(!current())return;const metadata=parseTaxonomy(taxonomy);let matched=0;for(const r of records){const meta=metadata.get(r.accession);if(meta){matched++;for(const key of [...RANKS.map(([r])=>r),'species','organism'])if(meta[key])r[key]=norm(meta[key]);}}if(!matched)throw Error('FASTAと分類TSVのaccessionが一件も一致しません');}
      const next=replace?state.records.filter(r=>r.gene!==gene):[...state.records],keys=new Set(next.map(r=>r.gene+'::'+r.accession));
      for(const r of records){const key=gene+'::'+r.accession;if(keys.has(key))throw Error('参照アクセッション番号が重複: '+r.accession+'。置換を選ぶか名称を確認してください');keys.add(key);next.push(r);}
      if(next.filter(r=>r.gene===gene).length>LIMITS.records||next.length>LIMITS.totalRecords)throw Error('参照件数は各領域20,000件、全領域80,000件以下にしてください');
      if(next.reduce((s,r)=>s+r.sequence.length,0)>LIMITS.totalBases)throw Error('全参照の合計が1億5000万ntを超えます');
      if(!current())return;
      state.records=next;delete state.runs[gene];delete state.runs.all;resultCache.clear();state.activePrimer=null;state.mode='custom';resetFilters();$('run-status').textContent=`${gene}: ${records.length}配列を読み込みました。照合を実行してください。`;refresh();
    }catch(error){if(token===null||token===state.importSerial){fail(error);if(token!==null)$('run-status').textContent='読込に失敗しました。入力形式と上限を確認してください。';}}
    finally{if(token!==null&&token===state.importSerial){state.importing=false;updateBusy();}}
  }
  function exportChart(){
    const ja=$('csv-language').value==='ja',rankLabel=RANKS.find(([r])=>r===state.chartRank)[1];
    const rows=chartRows(filteredCalls()).matched.map(r=>({gene:state.gene,primer:presetMode()?state.legacyPrimer:state.activePrimer||'',taxon_rank:ja?rankLabel:state.chartRank,taxon:ja?taxonLabel(state.chartRank,r.path[r.path.length-1]):r.path[r.path.length-1],taxonomy_path:r.path.join(' / '),count_unit:ja?(state.chartUnit==='records'?'参照配列':RANKS.find(([rank])=>rank===state.chartUnit)[1]):state.chartUnit,target_units:r.total,matched_units:r.matched,other_units:r.other,match_rate:r.rate===null?'':r.rate.toFixed(2),reference_count:r.references,perfect_references:r.perfectReferences,indeterminate_references:r.indeterminateReferences,unclassified_references:r.unclassifiedReferences}));
    if(rows.length)save('taxon_matches_'+state.gene+'_'+state.chartRank+'.csv',exportCsv(rows,Object.keys(rows[0])));
  }
  function referenceFasta(records){return records.map(r=>'>'+r.id+' '+r.organism+' [accession='+r.accession+']\n'+r.sequence).join('\n')+'\n';}
  function save(name,text,type='text/csv;charset=utf-8'){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  const quote=v=>{let s=String(v??'');if(typeof v==='string'&&(/^[\s\u0000-\u001f\u007f-\u009f]*[=+\-@\uff1d\uff0b\uff0d\uff20]/u.test(s)||/^[\s\u0000-\u001f\u007f-\u009f]*[\t\r\n]/u.test(s)))s="'"+s;return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  function csv(records,fields){return '\uFEFF'+[fields.map(quote).join(','),...records.map(r=>fields.map(f=>quote(r[f])).join(','))].join('\r\n')+'\r\n';}
  function exportRecords(onlyIndeterminate=false){const fields=['gene','id','primer','primerSequence','primerDegenerateCount','primerVariants','primerDegeneratePositions','accession','organism',...RANKS.map(([r])=>r),'species','judgement','indeterminate','indeterminateReason','targetNCount','targetNPositions','unknownOpposedCount','identity','identityOptimistic','identityConservative','coveredMatches','possibleOnlyMatches','coverage','nonNCoverage','score','thresholdPassed','passed','perfect','literalExact','uncertainCount','targetAmbiguousPositions','mismatches','primerBulges','targetBulges','alignmentPrimer','alignmentTarget','searchStrand','bindingStart','bindingEnd','regionSource','source','taxid','genus_taxid','retrieved','location','feature_index','sequence_sha256','partial','mitochondrial'];const records=filteredCalls().filter(c=>!onlyIndeterminate||c.indeterminate);save(onlyIndeterminate?'primer_identity_indeterminate.csv':'primer_identity_records.csv',exportCsv(records,fields));}
  function exportPatterns(){const items=patterns(filteredCalls()).map((p,i)=>({pattern:i+1,group:state.group,gene:p.summary.gene,primer:p.summary.primer,primerSequence:p.summary.primerSequence,primerDegenerateCount:p.summary.primerDegenerateCount,primerVariants:p.summary.primerVariants,primerDegeneratePositions:p.summary.primerDegeneratePositions,n:p.calls.length,genera:genusCount(p.calls),score:p.score,identity:p.identity,identityConservative:p.summary.identityConservative,identityNote:'representative alignment; position grouping may include other identities',alignmentPrimer:p.summary.alignmentPrimer,alignmentTarget:p.summary.alignmentTarget,positionKey:p.summary.positionKey,baseVariants:new Set(p.calls.map(c=>JSON.stringify([c.alignmentPrimer,c.alignmentTarget]))).size}));if(items.length)save('primer_identity_patterns.csv',exportCsv(items,Object.keys(items[0])));}
  $('reference-phylum').onchange=()=>{if(state.worker)stop();$('run-status').textContent='対象の門の変更は未反映です。「照合する」を押してください。';};
  $('run').onclick=run;$('cancel').onclick=stop;$('import').onclick=importData;
  $('reset-data').onclick=resetData;$('clear-inputs').onclick=clearInputs;
  ['min-identity','min-coverage'].forEach(id=>$(id).addEventListener('input',()=>{state.dirty=true;$('run-status').textContent='入力変更は未反映です。「照合する」を押してください。';}));
  $('group-mode').onchange=e=>{state.group=e.target.value;state.limit=1000;renderResults();};$('sort').onchange=e=>{state.sort=e.target.value;renderResults();};
  $('reset-filters').onclick=()=>{resetFilters();refresh();};$('aggregate-rank').onchange=()=>{state.chartRank=$('aggregate-rank').value;state.chartLimit=200;renderTaxonomy(filteredCalls());};
  $('chart-unit').onchange=()=>{state.chartUnit=$('chart-unit').value;state.chartLimit=200;renderMatchChart(filteredCalls());};
  $('chart-sort').onchange=()=>{state.chartSort=$('chart-sort').value;state.chartLimit=200;renderMatchChart(filteredCalls());};
  $('chart-search').oninput=()=>{state.chartQuery=$('chart-search').value.slice(0,256);state.chartLimit=200;renderMatchChart(filteredCalls());};
  $('chart-more').onclick=()=>{state.chartLimit+=200;renderMatchChart(filteredCalls());};$('export-chart').onclick=exportChart;
  $('view-cards').onclick=()=>{state.view='cards';state.limit=1000;renderResults();};$('view-table').onclick=()=>{state.view='table';state.limit=1000;renderResults();};
  $('view-indeterminate').onclick=()=>{state.view='indeterminate';state.limit=1000;renderResults();};
  $('more').onclick=()=>{state.limit+=1000;renderResults();};$('close').onclick=()=>$('dialog').close();$('dialog').addEventListener('click',e=>{if(e.target===$('dialog'))$('dialog').close();});
  $('export-records').onclick=()=>exportRecords();$('export-indeterminate').onclick=()=>exportRecords(true);$('export-patterns').onclick=exportPatterns;$('export-reference').onclick=()=>save('reference_'+state.gene+'.fasta',referenceFasta(scopedRecords()),'text/plain;charset=utf-8');$('print').onclick=()=>window.print();
  // Small diagnostic API used by the reproducible browser tests; no network hooks.
  window.PrimerViewer={state,resultCache,MIMAMMAL_PAIRS,cpuThreads,parallelism,alignmentJobs,availableRun,scopedRecords,analysisRecords,readPrimerTable,setPrimerRows,TEMPLATES,selectGene,refresh,parsePrimers,parseFasta,parseTaxonomy,filteredCalls,patterns,taxonomyTree,taxonMatches,chartRows,renderTaxonomy,run,importData,stop,resetData,clearInputs,taxonLabel,nameEntry,organismLabel,exportCsv,CSV_HEADERS,LIMITS,referenceFasta};

  function syncLimit(id,value){const s=$(id),key=value===Number.MAX_SAFE_INTEGER?'all':String(value);if(![...s.options].some(o=>o.value===key)){const o=add(s,'option',value.toLocaleString());o.value=key;}s.value=key;}
  $('advanced-toggle').onclick=()=>togglePanel('advanced-toggle','advanced-panel');
  $('details-toggle').onclick=()=>togglePanel('details-toggle','details-panel');
  $('results-toggle').onclick=()=>togglePanel('results-toggle','results-panel');
  $('add-primer-row').onclick=()=>appendPrimerRow();
  $('display-limit').onchange=()=>{state.limit=$('display-limit').value==='all'?Number.MAX_SAFE_INTEGER:Number($('display-limit').value);renderResults();};
  $('chart-limit').onchange=()=>{state.chartLimit=$('chart-limit').value==='all'?Number.MAX_SAFE_INTEGER:Number($('chart-limit').value);renderMatchChart(filteredCalls());};
  setPrimerRows([]);refresh();updateBusy();
})();
