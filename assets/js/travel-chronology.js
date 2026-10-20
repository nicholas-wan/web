/* Progressive enhancement for the static travel chronology. */
(() => {
  'use strict';
  const section = document.querySelector('.journal-chronology');
  const grid = document.querySelector('.travel-grid');
  const heading = document.querySelector('.travel-archive-heading');
  if (!section || !grid || !heading) return;
  const track = section.querySelector('.chronology-track');
  const scroller = section.querySelector('.chronology-scroll');
  const links = [...track.querySelectorAll('.chronology-trip')];
  const detail = section.querySelector('.chronology-detail');
  const controls = section.querySelector('.chronology-controls');
  const buttons = controls.querySelectorAll('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  links.forEach((link, i) => {
    const destination = link.getAttribute('href');
    const cardLink = [...grid.querySelectorAll('a.travel-card__image[href]')].find(a => a.getAttribute('href') === destination);
    const card = cardLink && cardLink.closest('.travel-card');
    if (!card) return;
    const name = link.querySelector('.chronology-label').textContent;
    const dates = card.querySelector('.date').textContent.trim();
    link.setAttribute('aria-label', name + ', ' + dates + ', ' + link.dataset.countries + '; find journal');
    const describe = () => { detail.textContent = name + ' · ' + dates + ' · ' + link.dataset.countries; };
    link.addEventListener('pointerenter', describe);
    link.addEventListener('focus', () => {
      describe();
      // Reveal the label, which extends beyond the dot's anchor box.
      const label = link.querySelector('.chronology-name').getBoundingClientRect();
      const bounds = scroller.getBoundingClientRect();
      if (label.left < bounds.left + 4) scroller.scrollLeft += label.left - bounds.left - 4;
      else if (label.right > bounds.right - 4) scroller.scrollLeft += label.right - bounds.right + 4;
    });
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      describe();
      grid.querySelectorAll('.is-timeline-selected').forEach(c => c.classList.remove('is-timeline-selected'));
      card.classList.add('is-timeline-selected');
      cardLink.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY + card.getBoundingClientRect().top - 30, behavior: reduced.matches ? 'instant' : 'smooth' });
    });
  });
  const updateControls = () => {
    buttons[0].disabled = scroller.scrollLeft <= 1;
    buttons[1].disabled = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    controls.hidden = scroller.scrollWidth <= scroller.clientWidth + 2;
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => scroller.scrollBy({ left: (i ? 1 : -1) * scroller.clientWidth * .8, behavior: reduced.matches ? 'instant' : 'smooth' })));
  scroller.addEventListener('scroll', updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(scroller);
  updateControls();
  const syncHidden = () => { section.hidden = heading.hidden; };
  new MutationObserver(syncHidden).observe(heading, { attributes: true, attributeFilter: ['hidden'] });
  syncHidden();
  let inView = false;
  const pause = () => section.classList.toggle('is-paused', !inView || document.hidden);
  document.addEventListener('visibilitychange', pause);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView && !reduced.matches) section.classList.add('is-revealed');
    pause();
  }, { threshold: .2 }).observe(section);
  pause();
})();

/* Destination scenes: sequential visible tour, with manual interaction priority. */
(() => {
  'use strict';
  const section = document.querySelector('.journal-chronology');
  if (!section) return;
  const track = section.querySelector('.chronology-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [];
  const pulse = document.createElement('span');
  pulse.className = 'chronology-pulse';
  pulse.setAttribute('aria-hidden', 'true');
  pulse.hidden = true;
  track.append(pulse);
  let active = null, hovered = null, inView = false, nextIndex = 0, keyboardPaused = false;
  let guideTimer, guideAnimation, guideRun = 0;
  const stop = entry => {
    if (!entry) return;
    clearTimeout(entry.timer);
    clearTimeout(entry.intent);
    entry.run++;
    entry.art.classList.remove('is-active');
    entry.art.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
    if (active === entry) active = null;
  };
  const stopGuide = (preserve = null) => {
    clearTimeout(guideTimer);
    guideTimer = null;
    guideRun++;
    if (guideAnimation) guideAnimation.cancel();
    guideAnimation = null;
    pulse.hidden = true;
    if (active && active.automatic && active !== preserve) stop(active);
  };
  const stopAll = () => { stopGuide(); entries.forEach(stop); };
  section.addEventListener('tour-pause', () => { stopAll(); schedule(500); });
  // Pointer focus can remain on an icon after the mouse leaves. Only keyboard
  // focus should keep the tour paused once hover has ended.
  const canGuide = () => inView && !section.hidden && !document.hidden && !reduced.matches && !hovered && !keyboardPaused && !section.classList.contains('tour-paused');
  const play = (entry, automatic = false) => {
    entries.forEach(item => clearTimeout(item.intent));
    if (!entry.visible || document.hidden || reduced.matches || section.hidden) return false;
    // Taking over the currently playing scene must not reset its pose.
    if (active === entry && !automatic) { entry.automatic = false; return true; }
    if (active && active !== entry) stop(active);
    stop(entry);
    active = entry;
    entry.automatic = automatic;
    entry.endsAt = performance.now() + entry.duration + 80;
    nextIndex = (entries.indexOf(entry) + 1) % entries.length;
    const run = entry.run;
    entry.art.classList.add('is-active');
    if (automatic) section.dispatchEvent(new CustomEvent('timeline-destination', { detail: { href: entry.trip.getAttribute('href') } }));
    entry.timer = setTimeout(() => {
      if (entry.run === run) stop(entry);
    }, entry.duration + 80);
    return true;
  };
  const position = entry => {
    const dot = entry.trip.querySelector('.chronology-dot').getBoundingClientRect();
    return dot.left + dot.width / 2 - track.getBoundingClientRect().left;
  };
  const schedule = delay => {
    clearTimeout(guideTimer);
    if (active && !active.automatic) delay = Math.max(delay, active.endsAt - performance.now() + (nextIndex === 0 ? 2000 : 650));
    if (canGuide()) guideTimer = setTimeout(() => { guideTimer = null; startSequence(); }, delay);
  };
  function startSequence() {
    if (!canGuide()) return;
    const visible = entries.slice(nextIndex).concat(entries.slice(0, nextIndex)).filter(entry => entry.visible);
    if (!visible.length) return;
    const run = ++guideRun;
    let previous = position(visible[0]);
    const step = index => {
      if (run !== guideRun || !canGuide()) return;
      if (index === visible.length) { pulse.hidden = true; schedule(2000); return; }
      const entry = visible[index];
      if (!entry.visible) { stopGuide(); schedule(2000); return; }
      const next = position(entry);
      pulse.hidden = false;
      const perform = () => {
        if (run !== guideRun || !canGuide()) return;
        pulse.style.transform = 'translateX(' + next + 'px)';
        if (guideAnimation) guideAnimation.cancel();
        guideAnimation = null;
        previous = next;
        if (!play(entry, true)) { stopGuide(); schedule(2000); return; }
        guideTimer = setTimeout(() => { guideTimer = null; step(index + 1); }, entry.duration + 160);
      };
      // A chronological wrap fades to the first stop; never sweep backwards
      // across the dated line as if returning through time.
      if (!index) perform();
      else if (next <= previous) guideTimer = setTimeout(perform, 2000);
      else {
        guideAnimation = pulse.animate([
          { transform: 'translateX(' + previous + 'px)' },
          { transform: 'translateX(' + next + 'px)' }
        ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
        guideAnimation.finished.then(perform).catch(() => {});
      }
    };
    step(0);
  }
  const observer = new IntersectionObserver(items => items.forEach(item => {
    const entry = entries.find(candidate => candidate.art === item.target);
    if (!entry) return;
    entry.visible = item.isIntersecting && item.intersectionRatio > .5;
    if (!entry.visible) {
      if (active === entry && entry.automatic) stopGuide();
      stop(entry);
    }
    if (entry.visible && document.activeElement === entry.trip && active !== entry) {
      stopGuide(); play(entry);
    } else if (entry.visible && !active && !guideTimer && pulse.hidden) schedule(500);
  }), { threshold: [0, .5, 1] });
  section.querySelectorAll('.authored-scene').forEach(art => {
    const trip = art.closest('.chronology-trip');
    const entry = { trip, art, duration: Number(art.dataset.duration), visible: false, run: 0 };
    entries.push(entry);
    observer.observe(art);
    trip.addEventListener('pointerenter', () => {
      keyboardPaused = false;
      hovered = entry;
      stopGuide(entry);
      entries.forEach(item => clearTimeout(item.intent));
      entry.intent = setTimeout(() => play(entry), 100);
    });
    trip.addEventListener('pointerleave', () => {
      if (hovered === entry) hovered = null;
      // A previous keyboard check can leave :focus-visible on the old icon.
      // Leaving a pointer interaction explicitly hands control back to the tour.
      keyboardPaused = false;
      clearTimeout(entry.intent);
      schedule(nextIndex === 0 ? 2000 : 650);
    });
    trip.addEventListener('focus', () => { keyboardPaused = trip.matches(':focus-visible'); stopGuide(entry); play(entry); });
  });
  section.addEventListener('focusout', () => { keyboardPaused = false; setTimeout(() => schedule(nextIndex === 0 ? 2000 : 650), 0); });
  section.querySelector('.chronology-scroll').addEventListener('scroll', () => {
    stopGuide(); schedule(2000);
  }, { passive: true });
  new IntersectionObserver(items => {
    const wasInView = inView;
    inView = items[0].isIntersecting && items[0].intersectionRatio >= .5;
    if (inView && !wasInView) schedule(500);
    else if (!inView) stopAll();
  }, { threshold: [0, .5, 1] }).observe(section);
  new MutationObserver(() => {
    if (section.hidden) stopAll(); else schedule(500);
  }).observe(section, { attributes: true, attributeFilter: ['hidden'] });
  reduced.addEventListener('change', () => { stopAll(); schedule(2000); });
  document.addEventListener('visibilitychange', () => { stopAll(); if (!document.hidden) schedule(2000); });
  window.addEventListener('pagehide', stopAll);
  window.polishTimelineReplay = index => {
    const entry = entries[Math.max(0, Math.min(entries.length - 1, Number(index) || 0))];
    stopGuide();
    if (entry) stop(entry);
    if (entry && play(entry)) schedule(2000);
  };
  window.polishTimelineTour = () => {
    stopAll();
    nextIndex = 0;
    schedule(0);
  };
})();

(()=>{
 const root=document.documentElement;root.classList.add('timeline-review','polish-travel');
 const timeline=document.querySelector('.journal-chronology');
 const track=timeline.querySelector('.chronology-track');
 const links=[...track.querySelectorAll('.chronology-trip')];
 // Fit all ten stops within one view; dates carry time, spacing carries order.
 const scroller=timeline.querySelector('.chronology-scroll');
 let previousWidth=0;
 function fit(){
  const available=scroller.clientWidth;if(!available||available===previousWidth)return;previousWidth=available;
  const width=Math.min(152,Math.floor((available-16)/5.5)),height=Math.round(width*2/3),inset=width/2+8;
  root.style.setProperty('--timeline-icon-width',width+'px');root.style.setProperty('--timeline-icon-height',height+'px');
  root.style.setProperty('--timeline-line',(height+(matchMedia('(max-width:980px)').matches?100:76))+'px');root.style.setProperty('--timeline-inset',inset+'px');
  track.style.minWidth='0';
  links.forEach((link,i)=>{const fraction=i/(links.length-1);link.style.left='calc('+fraction*100+'% + '+(inset-2*inset*fraction)+'px)';});
 }
 new ResizeObserver(fit).observe(scroller);fit();
 const grid=document.querySelector('.travel-grid'),map=document.querySelector('.travel-atlas__layout'),heading=document.querySelector('.photo-explore__map-heading');
 if(grid&&map&&heading){const section=document.createElement('section');section.className='travel-atlas travel-atlas--map';section.setAttribute('aria-label','Explore by destination');grid.after(section);section.append(heading,map);}
 if(grid){
  const cards=[...grid.querySelectorAll('.travel-card')];
  grid.classList.add('compact-journals');grid.id='journal-preview';
  const toolbar=document.createElement('div');toolbar.className='journal-preview-controls';
  const label=document.createElement('label');label.textContent='Journal preview';
  const select=document.createElement('select');select.setAttribute('aria-label','Preview a journal');
  cards.forEach((card,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=card.querySelector('h2').textContent+' · '+card.querySelector('.date').textContent.trim();select.append(option);});label.append(select);
  const expand=document.createElement('button');expand.type='button';expand.textContent='Show all 10 journals';expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-controls',grid.id);
  toolbar.append(label,expand);grid.after(toolbar);
  const ordered=links.map(link=>cards.find(c=>c.querySelector('.travel-card__image').getAttribute('href')===link.getAttribute('href'))).filter(Boolean);
  const neighbours=[-1,1].map(step=>{const button=document.createElement('button');button.type='button';button.className='journal-neighbour '+(step<0?'journal-earlier':'journal-later');grid.append(button);return {button,step,card:null};});
  neighbours.forEach(n=>n.button.addEventListener('click',()=>{if(n.card)show(n.card);}));
  function show(card){if(card.classList.contains('preview-selected'))return;const hadSelection=cards.some(c=>c.classList.contains('preview-selected'));cards.forEach(c=>c.classList.toggle('preview-selected',c===card));select.value=String(cards.indexOf(card));const href=card.querySelector('.travel-card__image').getAttribute('href');links.forEach(link=>{const chosen=link.getAttribute('href')===href;link.classList.toggle('journal-is-selected',chosen);const cue=link.querySelector('.chronology-preview-cue');if(cue)cue.textContent=chosen?'Showing below ↓':'Preview ↓';});
   neighbours.forEach(n=>{n.card=ordered[ordered.indexOf(card)+n.step];n.button.replaceChildren();n.button.disabled=!n.card;n.button.classList.toggle('is-empty',!n.card);if(!n.card){n.button.setAttribute('aria-label',n.step<0?'No newer journal':'No older journal');return;}const img=n.card.querySelector('img').cloneNode(true);img.alt='';img.classList.remove('journal-photo-pending','journal-photo-failed');img.sizes='(min-width:1100px) 220px, 45vw';const direction=document.createElement('span');direction.className='neighbour-direction';direction.textContent=n.step<0?'← Newer trip':'Older trip →';const title=document.createElement('span');title.className='neighbour-title';title.textContent=n.card.querySelector('h2').textContent.trim();n.button.append(img,direction,title);n.button.setAttribute('aria-label','Preview '+title.textContent);});
   if(hadSelection&&!grid.classList.contains('journals-expanded')&&matchMedia('(min-width:1100px) and (prefers-reduced-motion:no-preference)').matches)neighbours.forEach(n=>{if(n.card)n.button.animate([{opacity:.3,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.8,.2,1)'});});
  }
  select.addEventListener('change',()=>show(cards[Number(select.value)]));
  expand.addEventListener('click',()=>{const open=grid.classList.toggle('journals-expanded');expand.setAttribute('aria-expanded',String(open));expand.textContent=open?'Collapse journals':'Show all 10 journals';});
  let hoverIntent;
  links.forEach(link=>{const card=cards.find(c=>c.querySelector('.travel-card__image').getAttribute('href')===link.getAttribute('href'));if(!card)return;link.setAttribute('aria-controls',grid.id);link.setAttribute('aria-describedby','journal-preview-help');const cue=document.createElement('span');cue.className='chronology-preview-cue';cue.textContent='Preview ↓';link.querySelector('.chronology-name').append(cue);link.addEventListener('pointerenter',()=>{clearTimeout(hoverIntent);hoverIntent=setTimeout(()=>show(card),250);});link.addEventListener('pointerleave',()=>clearTimeout(hoverIntent));link.addEventListener('focus',()=>{clearTimeout(hoverIntent);show(card);});link.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;e.preventDefault();e.stopImmediatePropagation();clearTimeout(hoverIntent);show(card);card.querySelector('.travel-card__image').focus({preventScroll:true});card.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});},true);});
  timeline.addEventListener('timeline-destination',event=>{const card=cards.find(c=>c.querySelector('.travel-card__image').getAttribute('href')===event.detail.href);if(card){clearTimeout(hoverIntent);show(card);}});
  show(cards[0]);
  const archive=document.querySelector('.travel-archive-heading');archive.querySelector('h2').textContent='Travel journals';archive.querySelector('p').textContent='Explore the timeline';
  const help=document.createElement('p');help.id='journal-preview-help';help.className='journal-preview-help';help.textContent='Hover a trip to preview its journal. Click to bring the card into view.';timeline.prepend(help);
  const sync=()=>toolbar.hidden=grid.hidden;new MutationObserver(sync).observe(grid,{attributes:true,attributeFilter:['hidden']});sync();
 }
})();

(()=>{
 const root=document.documentElement,source=document.querySelector('.journal-chronology'),grid=document.querySelector('.travel-grid');if(!source||!grid)return;
 root.classList.add('mobile-variant-a');
 const list=document.createElement('section');list.className='mobile-journal-list';list.setAttribute('aria-label','Travel journals timeline');
 const entries=[...source.querySelectorAll('.chronology-trip')].map((trip,i)=>{
  const original=[...grid.querySelectorAll('.travel-card')].find(c=>c.querySelector('a').getAttribute('href')===trip.getAttribute('href'));if(!original)return null;
  const row=document.createElement('article');row.className='mobile-journal-row';const icon=trip.cloneNode(true);icon.removeAttribute('aria-controls');icon.hidden=false;
  icon.querySelector('.chronology-preview-cue')?.remove();icon.classList.remove('journal-is-selected');icon.removeAttribute('aria-describedby');
  const art=icon.querySelector('.authored-scene');art.classList.remove('is-active');
  // The desktop SVG remains in the DOM, so local paint-server IDs must differ.
  art.querySelectorAll('[id]').forEach(el=>{const old=el.id;el.id='mobile-'+old;art.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(a.value.includes('url(#'+old+')'))n.setAttribute(a.name,a.value.replaceAll('url(#'+old+')','url(#mobile-'+old+')'));});});});
  const card=original.cloneNode(true);card.className='mobile-journal-card';card.removeAttribute('style');card.removeAttribute('data-reveal');card.querySelectorAll('noscript').forEach(n=>n.remove());card.querySelector('img').sizes='(max-width:736px) calc(100vw - 154px), 800px';card.querySelector('.actions')?.remove();card.querySelector('header p')?.remove();
  const photo=card.querySelector('a.travel-card__image,a.image');if(photo){const cue=document.createElement('span');cue.className='mobile-photo-cta';cue.textContent='Read journal →';photo.setAttribute('aria-label','Read journal — '+trip.querySelector('.chronology-label').textContent);cue.setAttribute('aria-hidden','true');photo.append(cue);}
  row.append(icon,card);list.append(row);return {row,icon,art,index:i,visible:false};
 }).filter(Boolean);grid.before(list);
 const media=matchMedia('(max-width:736px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');let timer,active,frame;
 function clear(){clearTimeout(timer);if(active)active.art.classList.remove('is-active');active=null;}
 function play(entry){clear();active=entry;void entry.art.getBoundingClientRect();entry.art.classList.add('is-active');timer=setTimeout(()=>{clear();update();},Number(entry.art.dataset.duration)||6200);}
 // Repeat the scene nearest where phone readers look (about 40% down the screen); the playing scene
 // keeps a 28px advantage so it does not flicker between two rows mid-scroll.
 function update(){
  if(!media.matches||reduced.matches||document.hidden||list.hidden){clear();return;}
  let nearest=null,distance=Infinity;
  entries.forEach(entry=>{const box=entry.art.getBoundingClientRect(),visible=Math.min(innerHeight,box.bottom)-Math.max(0,box.top);if(!box.height||visible<box.height/2)return;const delta=Math.abs((box.top+box.bottom)/2-innerHeight*.4)-(entry===active?28:0);if(delta<distance){nearest=entry;distance=delta;}});
  if(nearest!==active){if(nearest)play(nearest);else clear();}
 }
 function requestUpdate(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;update();});}
 entries.forEach(e=>e.icon.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();e.row.classList.add('mobile-selected');entries.filter(x=>x!==e).forEach(x=>x.row.classList.remove('mobile-selected'));update();}));
 const observer=new IntersectionObserver(requestUpdate,{threshold:[0,.5,1]});entries.forEach(e=>observer.observe(e.art));
 window.addEventListener('scroll',requestUpdate,{passive:true});window.addEventListener('resize',requestUpdate);
 media.addEventListener('change',update);reduced.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 new MutationObserver(()=>{list.hidden=grid.hidden;update();}).observe(grid,{attributes:true,attributeFilter:['hidden']});

})();

/* Keep photos outside the reading area inert, including the hidden presentation. */
(() => {
 const images=new Set(document.querySelectorAll('img[data-journal-src]'));
 function warm(){images.forEach(img=>{if(!img.isConnected||!img.dataset.journalSrc){observer.unobserve(img);images.delete(img);return;}const r=img.getBoundingClientRect();if(!r.width||r.top>innerHeight+200||r.bottom< -200||getComputedStyle(img).visibility==='hidden')return;
  img.classList.add('journal-photo-pending');const done=()=>{img.classList.remove('journal-photo-pending');if(!img.naturalWidth)img.classList.add('journal-photo-failed');};img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
  if(img.dataset.journalSrcset)img.srcset=img.dataset.journalSrcset;
  img.src=img.dataset.journalSrc;delete img.dataset.journalSrc;delete img.dataset.journalSrcset;observer.unobserve(img);images.delete(img);
 });}
 const observer=new IntersectionObserver(warm,{rootMargin:'200px'});images.forEach(img=>observer.observe(img));
 const grid=document.querySelector('.travel-grid');
 new MutationObserver(()=>{grid.querySelectorAll('img[data-journal-src]').forEach(img=>{if(!images.has(img)){images.add(img);observer.observe(img);}});warm();}).observe(grid,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',warm);warm();
})();

/* CSS backgrounds ignore loading=lazy: attach the full vector map on approach. */
(() => {
 const atlas=document.querySelector('.travel-atlas__layout');
 const warm=()=>{atlas.style.setProperty('--travel-map-art','url("../../images/travel/world-map.svg")');observer.disconnect();};
 const observer=new IntersectionObserver(items=>{if(!atlas.hidden&&items.some(e=>e.isIntersecting))warm();},{rootMargin:'200px'});
 observer.observe(atlas);atlas.addEventListener('pointerdown',warm,{once:true});atlas.addEventListener('focusin',warm,{once:true});
})();
