
(function ensureOriginFeatureShell(){
  if(document.querySelector('.tcc-feature')) return;
  document.body.innerHTML=`<div aria-label="TCC special sections" class="tcc-desktop-hub">
<span class="hub-label">TCC Hub</span>
<a href="community.html">Community</a>
<a href="news.html">TCC News</a>
<a href="prophetic-room.html">Prophetic Room</a>
<a class="hub-live" href="live.html"><span class="live-dot"></span> Live</a>
</div>
<nav class="tcc-feature-nav"><a href="index.html">TCC</a><a href="index.html">Home</a><a href="community.html">Community</a><a href="prophetic-room.html">Prophetic Room</a><a href="news.html">TCC News</a><a href="live.html"><span class="live-dot"></span> Live</a></nav><main class="tcc-feature"><section class="tcc-hero"><div class="tcc-kicker">TCC Spiritual Experience</div><h1>The Prophetic Room</h1><p>A dedicated space for prophetic words, prayer, spiritual reflection and approved ministry messages.</p></section><section class="tcc-wrap"><div class="tcc-prophetic"><div class="tcc-panel"><div class="tcc-kicker">Prophetic Word</div><h2>Receive &amp; Reflect</h2><div class="tcc-empty" id="feed">No prophetic word has been published yet.</div></div><div class="tcc-panel"><div class="tcc-kicker">Prayer</div><h2>Send a Prayer Request</h2><form id="f"><input name="name" placeholder="Your name"/><input name="email" placeholder="Email" type="email"/><textarea name="request" placeholder="Your prayer request" rows="7"></textarea><input aria-hidden="true" autocomplete="off" name="website" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" tabindex="-1" type="text"/><button class="tcc-btn">Submit Request</button><p id="s"></p></form></div></div></section></main>
<link href="/assets/extracted/prophetic-room-style-3.css" rel="stylesheet"/>


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
