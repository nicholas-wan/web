/* Phone travel rail: which destination scenes play, and how (9 Nov 2026; lab/travel-motion-r2 has the
   comparison, measurements and reviews). travel-chronology.js builds the rows and hands each update here.
   - Every scene at least half on screen plays; the one nearest 40% down is the focus (ring, loupe).
   - Mid-flick (over 900px/s) playing scenes freeze, and arrivals are set on their opening frame and held at
     a lighter tint, so the frame on screen is exactly where each carries on. On the stop (or below 400px/s)
     they start top to bottom, 70ms apart: the sky comes up to full and the scene runs its own animation
     fast for half a second (the Liberty ferry pulls away, Seoul's doors swing open, Cologne lights, night falls on Paris).
     Small movers can't be seen mid-flick, so this puts the motion where the eye is, and keeps flicks smooth.
   - A scene opens just before its own main moment, on its first pass only; repeats run from 0, since each
     scene's last frame matches its first. Two passes, then it plays on to a lit frame and rests there until
     the page scrolls about a row. */
(() => {
 'use strict';
 const OPEN={guangzhou:700,australia:1500,germany:150,usacanada:300,seoul:800};
 const REST={chengdu_zhangjiajie:1600,guangzhou:2400,japan:1600,australia:3000,germany:2400,usacanada:6500,perth:1400,europe:1800,siliconvalley:3400,seoul:2400};
 const FAST=900,SLOW=400,SETTLE=140,NUDGE=150,STAGGER=70,PASSES=2;
 const BURST=[[3,250],[2,150],[1.4,150]];// rate, ms
 const STEADY=new Set(['mm-flag']);// sped up, Perth's flag shows how stiff its wave is
 const ease='cubic-bezier(.3,.6,.3,1)',key=e=>(e.icon.getAttribute('href')||'').replace(/^.*?travel_\d{4}_/,'');
 // Out-and-back pushes layered on the scene, so they start and end on the pose already showing.
 const push=(sel,peak,duration,o={})=>({sel,duration,...o,kf:[{transform:'none'},{transform:peak,offset:.35},{transform:'none'}]});
 const PUSH={chengdu_zhangjiajie:[push('.cn-fo-clump','rotate(-9deg)',950),push('.cn-fo-fern','rotate(10deg)',900,{delay:80})],
  japan:[push('.mm-leaf','translate(-14px,-3px)',900,{step:45}),push('.cn-fuji-maple','rotate(2.5deg)',900)]};
 // The Eiffel Tower's hourly sparkle, on every other light (all of them turned the tower white).
 const SPARKLE=[{opacity:0,transform:'scale(1)'},{opacity:1,transform:'scale(1.7)',offset:.2},{opacity:.8,transform:'scale(1.2)',offset:.6}];
 const playing=new Map();let ctx,focus=null,flicking=false,lastY=scrollY,lastT=performance.now(),speed=0,settleTimer,wait;

 // The slowest animation: Perth's flag skips the beat's speed-up, so it runs behind the rest.
 const clock=s=>s.anims.length?Math.min(...s.anims.map(a=>a.currentTime||0)):0;
 function schedule(s){clearTimeout(s.timer);s.timer=setTimeout(s.ending?()=>hold(s):s.loop,Math.max(120,(s.ending?s.rest:s.full)-clock(s)));}
 function beat(e,s,delay){
  const rate=r=>s.anims.forEach(a=>{if(!STEADY.has(a.animationName))a.playbackRate=r;});let t=delay;
  BURST.forEach(([r,ms])=>{s.bursts.push(setTimeout(()=>rate(r),t));t+=ms;});
  s.bursts.push(setTimeout(()=>{rate(1);schedule(s);},t));// the scene clock ran ahead
  (PUSH[key(e)]||[]).forEach(p=>e.art.querySelectorAll(p.sel).forEach((el,i)=>{try{s.fx.push(el.animate(p.kf,{duration:p.duration,delay:delay+(p.delay||0)+(p.step||0)*i,easing:ease,composite:'add'}));}catch(x){}}));
  if(key(e)==='europe')e.art.querySelectorAll('.mm-star').forEach((el,i)=>{if(i%2===0)s.fx.push(el.animate(SPARKLE,{duration:900,delay:delay+100+i*2,easing:ease,fill:'backwards'}));});
 }
 // Golden Gate fog drifts across, apart from the scene's own loop, which never rewinds it.
 const drift=e=>key(e)!=='siliconvalley'?[]:[['.gg-fog',-12],['.gg-fog-front',10]].flatMap(([sel,dx])=>[...e.art.querySelectorAll(sel)].map(el=>
  el.animate([{transform:'none'},{transform:`translateX(${dx}px)`},{transform:'none'}],{duration:9000,iterations:Infinity,easing:'ease-in-out',composite:'add'})));
 function start(e,held){
  if(playing.has(e))return playing.get(e);
  const a=e.art,k=key(e),at=OPEN[k]||0;a.classList.toggle('is-held',held);a.classList.add('is-active');
  const anims=a.getAnimations({subtree:true}).filter(x=>x.animationName);
  const s={anims,extra:drift(e),full:+a.dataset.duration||6200,rest:REST[k]||1500,passes:0,held,bursts:[],fx:[]};
  const seek=t=>anims.forEach(x=>{x.currentTime=t;x.play();});
  s.loop=()=>{seek(0);if(++s.passes>=PASSES)s.ending=true;schedule(s);};
  if(at)seek(at);playing.set(e,s);
  if(held)freeze(s);else schedule(s);
  return s;
 }
 // WebKit can resolve a pause a frame late against a bogus clock (seen 9 Nov 2026: Sydney's ferry paused at
 // 3s read -11s and vanished), so pin the time it paused at.
 const halt=x=>{const t=x.currentTime;x.pause();if(t!=null)x.currentTime=t;};
 function hold(s){clearTimeout(s.timer);s.resting=true;s.restAt=scrollY;s.anims.concat(s.extra).forEach(halt);}
 function freeze(s){clearTimeout(s.timer);s.bursts.forEach(clearTimeout);s.bursts=[];s.anims.forEach(x=>{x.playbackRate=1;});s.anims.concat(s.extra).forEach(halt);s.fx=s.fx.filter(x=>x.playState!=='finished');s.fx.forEach(halt);}
 // play() rewinds an animation sitting at its end; leave those for the loop's own rewind.
 function resume(s){if(s.resting){s.resting=s.ending=false;s.passes=0;}s.anims.concat(s.extra).forEach(x=>{if(!(x.currentTime>=x.effect.getComputedTiming().endTime))x.play();});s.fx.forEach(x=>{if(x.playState==='paused')x.play();});schedule(s);}
 function stop(e){const s=playing.get(e);if(!s)return;freeze(s);s.extra.concat(s.fx).forEach(x=>{if(!x.animationName)x.cancel();});e.art.classList.remove('is-active','is-held');playing.delete(e);}
 function pick(e){if(focus!==e){focus?.art.classList.remove('is-focus');focus=e;e?.art.classList.add('is-focus');}}

 function update(c){
  ctx=c;const {entries,media,reduced,list}=c;
  // body.is-preload (main.css) turns all animation off; a scene started then holds none.
  if(document.body.classList.contains('is-preload')){clearTimeout(wait);wait=setTimeout(()=>update(c),120);return;}
  if(!media.matches||reduced.matches||document.hidden||list.hidden){[...playing.keys()].forEach(stop);pick(null);return;}
  let nearest=null,distance=Infinity;const shown=[];
  entries.forEach(e=>{const box=e.art.getBoundingClientRect(),visible=Math.min(innerHeight,box.bottom)-Math.max(0,box.top);if(!box.height||visible<box.height/2)return;shown.push(e);const d=Math.abs((box.top+box.bottom)/2-innerHeight*.4)-(e===focus?28:0);if(d<distance){nearest=e;distance=d;}});
  [...playing.keys()].forEach(e=>{if(!shown.includes(e))stop(e);});
  if(flicking){shown.forEach(e=>start(e,true));return;}
  let k=0;shown.forEach(e=>{if(!playing.has(e))beat(e,start(e,false),Math.min(300,k++*STAGGER));});
  pick(nearest);
 }
 function settle(){
  speed=0;const was=flicking;flicking=false;if(!ctx)return;
  // A rested scene stays put until the page has moved about a row, flick or not.
  const due=s=>!s.resting||Math.abs(scrollY-s.restAt)>=NUDGE;
  if(was){let k=0;[...playing].sort((a,b)=>a[0].art.getBoundingClientRect().top-b[0].art.getBoundingClientRect().top).forEach(([e,s])=>{
   if(due(s))resume(s);if(s.held){s.held=false;e.art.classList.remove('is-held');beat(e,s,Math.min(300,k++*STAGGER));}});}
  else playing.forEach(s=>{if(s.resting&&due(s))resume(s);});
  update(ctx);
 }
 addEventListener('scroll',()=>{
  const now=performance.now();speed=speed*.5+Math.abs(scrollY-lastY)/Math.max(8,now-lastT)*500;lastY=scrollY;lastT=now;
  if(!flicking&&speed>FAST&&ctx&&!ctx.reduced.matches){flicking=true;playing.forEach(freeze);}
  clearTimeout(settleTimer);
  if(flicking&&speed<SLOW)settle();else settleTimer=setTimeout(settle,SETTLE);
 },{passive:true});
 // A page restored from the back-forward cache picks its scenes up again.
 addEventListener('pageshow',e=>{if(e.persisted&&ctx){flicking=false;[...playing.keys()].forEach(stop);update(ctx);}});
 // reset: the artwork just moved or arrived, so playing scenes start again with their animations.
 window.travelRail={update,reset:()=>[...playing.keys()].forEach(stop)};
})();
