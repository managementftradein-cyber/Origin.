
(function ensureOriginFeatureShell(){
  if(document.querySelector('.tcc-feature')) return;
  document.body.innerHTML=`<div aria-label="TCC special sections" class="tcc-desktop-hub">
<span class="hub-label">TCC Hub</span>
<a href="community.html">Community</a>
<a href="news.html">TCC News</a>
<a href="prophetic-room.html">Prophetic Room</a>
<a class="hub-live" href="live.html"><span class="live-dot"></span> Live</a>
</div>
<nav class="tcc-feature-nav"><a href="index.html">TCC</a><a href="index.html">Home</a><a href="community.html">Community</a><a href="prophetic-room.html">Prophetic Room</a><a href="news.html">TCC News</a><a href="live.html"><span class="live-dot"></span> Live</a></nav><main class="tcc-feature"><section class="tcc-hero"><div class="tcc-kicker">Stay Connected</div><h1>TCC News</h1><p>Announcements, ministry updates, testimonies, events and church communications.</p></section><section class="tcc-wrap"><div class="tcc-news" id="news"><div class="tcc-empty">Loading TCC News…</div></div></section></main>
<link href="/assets/extracted/news-style-3.css" rel="stylesheet"/>


<div class="tcc-more-backdrop" id="tccMoreBackdrop"></div>
<div aria-hidden="true" class="tcc-more-sheet" id="tccMoreSheet">
<a href="community.html"><span class="more-icon">◆</span><span>Community</span></a>
<a href="/about"><span class="more-icon">◎</span><span>About</span></a>
<a href="news.html"><span class="more-icon">◈</span><span>TCC News</span></a>
<a href="prophetic-room.html"><span class="more-icon">✦</span><span>Prophetic Room</span></a>
<a href="live.html"><span class="more-icon">●</span><span>Live</span></a>
<a href="/find-us"><span class="more-icon">⌖</span><span>Find Us / Directions</span></a>
</div>
<nav aria-label="Mobile navigation" class="tcc-mobile-appbar">
<a href="index.html"><span class="icon">⌂</span><span>Home</span></a>
<a class="active" href="community.html"><span class="icon">◆</span><span>Community</span></a>
<a href="/contact"><span class="icon">✆</span><span>Contact</span></a>
<a href="/give"><span class="icon">♡</span><span>Give</span></a>
<button aria-expanded="false" class="tcc-more-btn" id="tccMoreBtn"><span class="icon">•••</span><span>More</span></button>
</nav>`;
})();

(()=>{const o=document.createElement('div');o.className='tcc-transition';o.innerHTML='<span>TCC</span>';document.body.appendChild(o);
document.querySelectorAll('a[href$=".html"]').forEach(a=>a.addEventListener('click',e=>{const h=a.getAttribute('href');if(!h||h.startsWith('http'))return;e.preventDefault();o.classList.add('active');setTimeout(()=>location.href=h,420)}));})();
