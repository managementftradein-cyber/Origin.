
(function ensureOriginFeatureShell(){
  if(document.querySelector('.tcc-feature')) return;
  document.body.innerHTML=`<div class="tcc-mobile-header">
<a class="tcc-mobile-header-brand" href="/index.html">
<img alt="TCC" src="/assets/logo-emblem.png"/>
<strong>THE CHRISTOCENTRIC CHURCH</strong>
</a>
<span class="tcc-mobile-header-title">Community</span>
</div>
<div aria-label="TCC special sections" class="tcc-desktop-hub">
<span class="hub-label">TCC Hub</span>
<a href="community.html">Community</a>
<a href="news.html">TCC News</a>
<a href="prophetic-room.html">Prophetic Room</a>
<a class="hub-live" href="live.html"><span class="live-dot"></span> Live</a>
</div>
<nav class="tcc-feature-nav"><a href="index.html">TCC</a><a href="index.html">Home</a><a href="community.html">Community</a><a href="prophetic-room.html">Prophetic Room</a><a href="news.html">TCC News</a><a href="live.html"><span class="live-dot"></span> Live</a></nav>
<main class="tcc-feature">
<section class="tcc-hero"><div class="tcc-kicker">TCC Community</div><h1>Connect &amp; grow together.</h1><p>Share what God is doing, ask for prayer, encourage one another and keep up with the church family — right here.</p></section>
<section class="tcc-wrap"><div class="tcc-main">
<div class="tcc-panel" id="authPanel" style="display:none">
<div class="tcc-authtabs">
<button class="active" id="tabLogin" type="button">Sign In</button>
<button id="tabSignup" type="button">Join Community</button>
</div>
<form class="tcc-authform active" id="loginForm">
<input autocomplete="username" name="email" placeholder="Email" required="" type="email"/>
<input autocomplete="current-password" name="password" placeholder="Password" required="" type="password"/>
<button class="tcc-btn" style="width:100%">Sign In</button>
<p class="tcc-msg" id="loginMsg"></p>
</form>
<div class="tcc-authform" id="signupGate">
<p style="margin:0 0 14px;color:#a69d8c;font-size:13px;line-height:1.6">Joining the community requires an invitation link from a department head. Ask the head of the department you'd like to join for your link, then open it here.</p>
<p class="tcc-msg" id="inviteStatusMsg"></p>
</div>
<form class="tcc-authform" id="signupForm" style="display:none">
<p id="signupDeptLabel" style="margin:0 0 14px;color:#c9a45c;font-size:13px"></p>
<input autocomplete="username" name="email" placeholder="Email" required="" type="email"/>
<input autocomplete="new-password" name="password" placeholder="Password (min. 6 characters)" required="" type="password"/>
<input aria-hidden="true" autocomplete="off" name="website" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" tabindex="-1" type="text"/>
<button class="tcc-btn" style="width:100%">Create Account</button>
<p class="tcc-msg" id="signupMsg"></p>
</form>
</div>
<div class="tcc-panel" id="profilePrompt" style="display:none">
<h3 style="margin-bottom:6px">Welcome! What should we call you?</h3>
<p style="margin-bottom:0">Set a display name so others in the community recognize you.</p>
<form id="profileForm">
<input maxlength="60" name="display_name" placeholder="Display name" required=""/>
<button class="tcc-btn">Save &amp; Continue</button>
<p class="tcc-msg" id="profileMsg"></p>
</form>
</div>
<div id="appPanel" style="display:none">
<div class="tcc-whoami"><span>Signed in as <b id="whoamiName"></b></span><button class="tcc-link-btn" id="signOutBtn">Sign Out</button></div>
<div class="tcc-panel tcc-composer">
<form id="postForm">
<textarea maxlength="3000" name="body" placeholder="Share an update, a testimony or a prayer point with the church family…" required=""></textarea>
<div id="imagePreviewWrap" style="display:none;margin-bottom:13px;position:relative">
<img id="imagePreview" style="width:100%;max-height:260px;object-fit:cover;border:1px solid rgba(var(--tcc-red-rgb),.25)"/>
<button class="tcc-link-btn" id="removeImageBtn" style="position:absolute;top:8px;right:8px;background:#080808cc;padding:6px 10px" type="button">Remove</button>
</div>
<input name="image_url" type="hidden"/>
<div class="tcc-composer-row">
<button class="tcc-btn outline" id="attachImageBtn" type="button">📷 Add Photo</button>
<button class="tcc-btn">Post</button>
</div>
<p class="tcc-msg" id="postMsg" style="margin-top:8px"></p>
</form>
<input accept="image/jpeg,image/png,image/webp,image/gif" hidden="" id="imageFileInput" type="file"/>
</div>
</div>
<div id="meetingBanner"></div>
<div class="tcc-feed" id="feed"><div class="tcc-empty">Loading community feed…</div></div>
<div class="tcc-feedmore" id="feedMore"></div>
</div></section>
</main>
<link href="/assets/extracted/community-style-4.css" rel="stylesheet"/>




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
<a href="/index.html?route=%2Fcontact"><span class="icon">✆</span><span>Contact</span></a>
<a href="/index.html?route=%2Fgive"><span class="icon">♡</span><span>Give</span></a>
<button aria-expanded="false" class="tcc-more-btn" id="tccMoreBtn"><span class="icon">•••</span><span>More</span></button>
</nav>`;
})();

(()=>{const o=document.createElement('div');o.className='tcc-transition';o.innerHTML='<span>TCC</span>';document.body.appendChild(o);
document.querySelectorAll('a[href$=".html"]').forEach(a=>a.addEventListener('click',e=>{const h=a.getAttribute('href');if(!h||h.startsWith('http'))return;e.preventDefault();o.classList.add('active');setTimeout(()=>location.href=h,420)}));})();
