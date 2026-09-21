

(function ensureOriginShell(){
  if(document.getElementById('app')) return;
  document.body.innerHTML=`
  <div id="launchScreen" aria-live="polite"><div class="launch-glow"></div><div class="launch-rays"></div><div class="launch-stars"></div><div class="launch-card"><div class="launch-brand"><img id="launchLogo" src="/assets/logo-emblem.png" alt="TCC"><span id="launchBrand">THE CHRISTOCENTRIC CHURCH</span></div><div id="launchCountdownView"><div class="launch-kicker">A new chapter is about to begin</div><h1 class="launch-title" id="launchTitle">THE ORIGIN IS NEAR</h1><p class="launch-subtitle" id="launchSubtitle">Christ at the centre. Everything else follows.</p><div class="launch-countdown"><div class="launch-unit"><span class="launch-number" id="launchDays">00</span><span class="launch-label">Days</span></div><div class="launch-unit"><span class="launch-number" id="launchHours">00</span><span class="launch-label">Hours</span></div><div class="launch-unit"><span class="launch-number" id="launchMinutes">00</span><span class="launch-label">Minutes</span></div><div class="launch-unit"><span class="launch-number" id="launchSeconds">00</span><span class="launch-label">Seconds</span></div></div><div class="launch-date" id="launchDateLabel"></div></div><div class="launch-live" id="launchLive"><h2 id="launchCompleteTitle">WE ARE LIVE</h2><p id="launchCompleteBody">Welcome to The Christocentric Church.</p><div class="launch-actions"><a class="launch-enter" href="/">Enter the Church Experience →</a></div></div><div class="launch-grace-peace" aria-label="Grace and Peace"><span>GRACE</span><i aria-hidden="true">•</i><span>PEACE</span></div></div></div>
  <div id="loader"><div class="loader-mark"><img src="/assets/logo-emblem.png" alt=""><div class="loader-line"></div></div></div>
  <div class="transition" id="transition"></div>
  <header id="header"><div class="wrap"><nav><a href="/" data-route="/" class="brand"><img src="/assets/logo-emblem.png" alt=""><span>THE <b>CHRISTOCENTRIC</b> CHURCH</span></a><div class="navlinks" id="navlinks"><a href="/" data-route="/">Home</a><a href="/about" data-route="/about">About</a><a href="/programs" data-route="/programs">Programs</a><a href="/partnership" data-route="/partnership">Partnership</a><a href="/college" data-route="/college">College</a><a href="/contact" data-route="/contact">Contact</a><a href="/give" data-route="/give" class="give">Give</a></div><button class="menu" id="menu" aria-label="Open menu">☰</button><a class="header-special" href="community.html">Community</a><a class="header-special" href="prophetic-room.html">Prophetic Room</a><a class="header-special" href="news.html">TCC News</a><a class="header-special" href="live.html"><span class="live-dot"></span> Live</a></nav></div></header>
  <main id="app"></main>
  <footer><div class="wrap"><div class="footgrid"><div><a href="/" data-route="/" class="brand"><img src="/assets/logo-emblem.png" alt=""><span>THE <b>CHRISTOCENTRIC</b> CHURCH</span></a><p style="margin-top:18px;max-width:330px">Christ at the center of worship, teaching, community and mission.</p></div><div><h4>Explore</h4><a href="/about" data-route="/about">About</a><br><a href="/programs" data-route="/programs">Programs</a><br><a href="/college" data-route="/college">College</a><br><a href="/partnership" data-route="/partnership">Partnership</a></div><div><h4>Connect</h4><a href="community.html">Community</a><br><a href="/contact" data-route="/contact">Contact</a><br><a href="/give" data-route="/give">Give</a><br><a href="/#gallery" data-route="/">Gallery</a></div><div><h4>Church</h4><p>Service times and location are managed from the admin dashboard.</p></div></div><div class="copyright"><span>© 2026 The Christocentric Church. All rights reserved.</span><span>Built with Christ at the center.</span></div></div></footer>
  <div class="tcc-more-backdrop" id="tccMoreBackdrop"></div><div class="tcc-more-sheet" id="tccMoreSheet" aria-hidden="true"><a href="community.html"><span class="more-icon">◆</span><span>Community</span></a><a href="news.html"><span class="more-icon">◈</span><span>TCC News</span></a><a href="prophetic-room.html"><span class="more-icon">✦</span><span>Prophetic Room</span></a><a href="live.html"><span class="more-icon">●</span><span>Live</span></a><a href="/find-us"><span class="more-icon">⌖</span><span>Find Us / Directions</span></a></div>
  <nav class="tcc-mobile-appbar" aria-label="Mobile navigation"><a href="index.html" data-route="/"><span class="icon">⌂</span><span>Home</span></a><a href="community.html"><span class="icon">◆</span><span>Community</span></a><a href="/index.html?route=%2Fcontact"><span class="icon">✆</span><span>Contact</span></a><a href="/index.html?route=%2Fgive"><span class="icon">♡</span><span>Give</span></a><button class="tcc-more-btn" id="tccMoreBtn" aria-expanded="false"><span class="icon">•••</span><span>More</span></button></nav>`;
})();
const app=document.getElementById('app'), transition=document.getElementById('transition'), loader=document.getElementById('loader'), header=document.getElementById('header'), menu=document.getElementById('menu'), nav=document.getElementById('navlinks');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const data={
 events:[
  {day:'07',mon:'SEP',title:'Sunday Celebration Service',meta:'Sunday · 9:00 AM · Main Auditorium',desc:'Worship, the Word and fellowship together.'},
  {day:'12',mon:'SEP',title:'Prayer & Word Encounter',meta:'Friday · 6:00 PM · Sanctuary',desc:'An evening devoted to prayer and spiritual renewal.'},
  {day:'21',mon:'SEP',title:'Kingdom Builders Gathering',meta:'Saturday · 10:00 AM · Fellowship Hall',desc:'Equipping believers to serve with purpose.'}
 ],
 departments:[
  ['01','Worship & Music','Lead the church into Christ-centered worship through vocals, instruments, production and excellence.'],
  ['02','Media & Broadcast','Extend the message beyond the building through livestream, photography, video and digital ministry.'],
  ['03','Welcome & Hospitality','Create a warm, orderly and Christ-centered experience for every person who walks through the doors.'],
  ['04','Children & Families','Help children and families grow in Scripture, faith, character and community.'],
  ['05','Outreach & Missions','Take the gospel into communities and places beyond the local church through practical love and mission.'],
  ['06','Discipleship','Build mature believers through teaching, mentoring, small groups and intentional spiritual formation.']
 ]
};
// The two arrays above are fallback/sample content, shown until loadLiveCollections()
// (below) replaces them with what's actually in Supabase — or if that fetch fails.
function mapEvent(e){
 const d=e.date?new Date(e.date):null;
 const meta=[d?d.toLocaleString('en-US',{weekday:'long'}):'',d?d.toLocaleString('en-US',{hour:'numeric',minute:'2-digit'}):'',e.location].filter(Boolean).join(' · ');
 return{day:d?String(d.getDate()).padStart(2,'0'):'--',mon:d?d.toLocaleString('en-US',{month:'short'}).toUpperCase():'',title:e.title||'Untitled Event',meta:meta||'Details to follow',desc:e.description||''};
}
function mapDept(d,i){return[String(i+1).padStart(2,'0'),d.name||'Department',d.description||''];}
async function loadLiveCollections(){
 try{
  const [er,dr]=await Promise.all([fetch('/api/events'),fetch('/api/departments')]);
  if(er.ok){const ej=await er.json();const items=ej.items||[];if(items.length)data.events=items.map(mapEvent)}
  if(dr.ok){const dj=await dr.json();const items=dj.items||[];if(items.length)data.departments=items.map(mapDept)}
 }catch(e){console.warn('Live collections unavailable',e)}
 const current=location.pathname.replace(/\/+$/,'')||'/';
 if(current==='/'||current==='/programs')pages[current]();
}


function shell(content,extra=''){app.innerHTML=content+extra; observe(); window.scrollTo({top:0,behavior:'instant'});}
function pageHero(label,title,text){return `<section class="page-hero"><div class="wrap"><div class="eyebrow">${label}</div><h1>${title}</h1><p>${text}</p></div></section>`}
let heroTimer=null;
function isVideoUrl(u){return /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(u||'')}
function heroSlideHTML(x,i){
 const video=x.media_type==='video'||isVideoUrl(x.url);
 const media=video?`<video src="${esc(x.url)}" autoplay muted loop playsinline preload="auto"></video>`:`<img src="${esc(x.url)}" alt="${esc(x.caption||'Church')}">`;
 return `<div class="hero-slide${i===0?' active':''}">${media}</div>`;
}
function startHeroCycle(container,intervalSeconds){
 clearInterval(heroTimer);
 if(!container)return;
 const slides=[...container.querySelectorAll('.hero-slide')];
 if(!slides.length)return;
 let idx=Math.max(0,slides.findIndex(s=>s.classList.contains('active')));
 const activate=i=>slides.forEach((s,j)=>{
  const vid=s.querySelector('video');
  if(j===i){s.classList.add('active');if(vid){try{vid.currentTime=0}catch(_){}vid.play().catch(()=>{})}}
  else{s.classList.remove('active');if(vid)vid.pause()}
 });
 activate(idx);
 if(slides.length>1)heroTimer=setInterval(()=>{idx=(idx+1)%slides.length;activate(idx)},Math.max(3,intervalSeconds||6)*1000);
}
function home(){
shell(`<section class="hero"><div class="hero-bg" id="heroBackground">${['hero-1.jpg','hero-2.jpg','hero-3.jpg'].map((x,i)=>heroSlideHTML({url:`/assets/${x}`},i)).join('')}</div><div class="wrap hero-content">
<div class="eyebrow" id="heroEyebrow">Christ at the Center</div><h1 id="heroTitle">Faith that <em>Expresses</em> Christ.</h1><p id="heroBody">A Christ-centered church family committed to worship, Scripture, community and a life that makes Jesus visible in the world.</p>
<div class="hero-actions"><a class="btn red-btn" href="/about" data-route="/about">Discover Our Story</a><a class="btn outline" href="/programs" data-route="/programs">Explore Programs</a></div>
<div class="hero-note"><div><span>WORSHIP</span><strong>Gather</strong></div><div><span>WORD</span><strong>Grow</strong></div><div><span>MISSION</span><strong>Go</strong></div></div>
</div></section>
<section class="section"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Our Foundation</div><h2>Everything points back to <span class="red">Christ.</span></h2><p>Our church is built around a simple conviction: Jesus is not one part of the church's life. He is the center of it.</p></div><div class="grid3">${[['01','Worship','We gather to honor Christ with wholehearted worship, prayer and thanksgiving.'],['02','The Word','We teach and live Scripture so faith becomes visible in everyday life.'],['03','Community','We walk together, carrying one another and building a family centered on Jesus.']].map(x=>`<article class="card reveal"><div class="num">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p><a href="/about" data-route="/about">Learn more →</a></article>`).join('')}</div></div></section>
<section class="section dark" id="gallery"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Moments</div><h2>Life together.</h2><p>Gatherings, worship, service and fellowship — moments that tell the story of a church family.</p></div><div class="gallery" id="homepageGallery">${['hero-1.jpg','hero-2.jpg','hero-3.jpg'].map((x,i)=>`<figure class="reveal"><img src="/assets/${x}" alt="Church gathering"><figcaption>${['Worship','Community','Mission'][i]}</figcaption></figure>`).join('')}</div></div></section>
<section class="section"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Upcoming</div><h2>Come and be part of it.</h2></div>${data.events.map(eventCard).join('')}<div style="margin-top:35px"><a class="btn red-btn" href="/programs" data-route="/programs">See All Programs</a></div></div></section>
<section class="section dark"><div class="wrap" style="display:flex;justify-content:space-between;align-items:center;gap:35px;flex-wrap:wrap"><div class="reveal"><div class="eyebrow">Take the next step</div><h2 class="serif" style="font-size:clamp(38px,5vw,65px);margin-top:15px">You belong here.</h2></div><a class="btn red-btn reveal" href="/contact" data-route="/contact">Plan a Visit</a></div></section>`);
startHeroCycle(document.getElementById('heroBackground'),6);
loadEditableHome();
}
async function loadEditableHome(){
 try{
  const r=await fetch('/api/site-content'); if(!r.ok) return; const d=await r.json(); const s=d.settings||{};
  if(s.hero_eyebrow) document.getElementById('heroEyebrow').textContent=s.hero_eyebrow;
  if(s.hero_title) document.getElementById('heroTitle').innerHTML=esc(s.hero_title).replace(/\breveals\b/i,'<em>reveals</em>');
  if(s.hero_body) document.getElementById('heroBody').textContent=s.hero_body;
  const bg=document.getElementById('heroBackground'); const slides=d.hero||[];
  if(bg && slides.length){
    const secs=Math.max(3,Math.min(30,Number(s.hero_interval_seconds)||6));
    bg.innerHTML=slides.slice(0,12).map(heroSlideHTML).join('');
    startHeroCycle(bg,secs);
  }
  const g=document.getElementById('homepageGallery'); const items=d.gallery||[];
  if(g && items.length){g.innerHTML=items.slice(0,9).map(x=>`<figure class="reveal"><img src="${esc(x.url)}" alt="${esc(x.caption||'TCC moment')}"><figcaption>${esc(x.caption||x.category||'TCC')}</figcaption></figure>`).join('');observe();}
 }catch(e){console.warn('Editable content unavailable',e)}
}

function eventCard(e){return `<div class="event reveal"><div class="datebox"><b>${e.day}</b><small>${e.mon}</small></div><div><h3>${e.title}</h3><p>${e.meta}</p><p>${e.desc}</p></div><a class="btn" href="/programs" data-route="/programs">Details</a></div>`}
function about(){shell(pageHero('Who we are','A church centered on Jesus.','A community pursuing Christ in worship, Scripture, discipleship and mission.')+`<section class="section"><div class="wrap about-grid"><div class="about-image reveal" id="aboutImage"></div><div class="reveal"><div class="eyebrow" id="aboutLabel">Our Story</div><h2 class="serif" id="aboutHeading" style="font-size:clamp(38px,5vw,65px);margin:18px 0">Christ is the center, not the accessory.</h2><p class="copy" id="aboutBody">The Christocentric Church exists to help people know Christ, become like Christ and make Christ known. We believe the gospel shapes the way we worship, lead, work, serve, build families and care for our communities.</p><div class="quote" id="aboutQuote">“In everything, Christ must have the first place.”</div><p class="copy">Our gatherings are designed to be both reverent and alive: biblical teaching, sincere worship, meaningful relationships and practical opportunities to serve.</p></div></div></section><section class="section dark"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Our Values</div><h2>Three movements. One center.</h2></div><div class="grid3">${[['Gather','We gather around Christ in worship and prayer.'],['Grow','We grow through Scripture, discipleship and community.'],['Go','We go into the world with the love and message of Jesus.']].map((x,i)=>`<div class="card reveal" style="background:#11100e;border-color:var(--line);color:#fff"><div class="num">0${i+1}</div><h3>${x[0]}</h3><p style="color:#aaa398">${x[1]}</p></div>`).join('')}</div></div></section>`);loadEditableAbout()}
async function loadEditableAbout(){try{const r=await fetch('/api/site-content');if(!r.ok)return;const s=(await r.json()).settings||{};if(s.about_label)document.getElementById('aboutLabel').textContent=s.about_label;if(s.about_heading)document.getElementById('aboutHeading').textContent=s.about_heading;if(s.about_body)document.getElementById('aboutBody').textContent=s.about_body;if(s.about_quote)document.getElementById('aboutQuote').textContent=s.about_quote;if(s.about_image_url)document.getElementById('aboutImage').style.backgroundImage=`url('${esc(s.about_image_url)}')`}catch(e){console.warn(e)}}

function programs(){shell(pageHero('Programs & Events','There is a place for you.','Gather with us, grow with us and find a meaningful way to serve.')+`<section class="section"><div class="wrap"><div class="filters"><button class="filter active" data-filter="all">All</button><button class="filter" data-filter="week">This Week</button><button class="filter" data-filter="month">This Month</button></div><div id="events">${data.events.map(eventCard).join('')}</div></div></section><section class="section dark"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Departments</div><h2>Serve where your gifts meet a need.</h2></div><div class="grid3">${data.departments.map(x=>`<article class="card reveal" style="background:#11100e;border-color:var(--line);color:#fff"><div class="num">${x[0]}</div><h3>${x[1]}</h3><p style="color:#aaa398">${x[2]}</p><a href="/contact" data-route="/contact" style="color:var(--red2)">I'm Interested →</a></article>`).join('')}</div></div></section>`); bindFilters()}
function bindFilters(){document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active'); document.querySelectorAll('#events .event').forEach((e,i)=>e.style.display=b.dataset.filter==='all'||(b.dataset.filter==='week'&&i<1)|| (b.dataset.filter==='month'&&i<3)?'grid':'none')})}
function partnership(){shell(pageHero('Partnership','Build with us.','Partnership is an invitation to invest your time, skills, resources and influence in the work God is doing through the church.')+`<section class="section"><div class="wrap"><div class="section-head reveal"><div class="eyebrow">Ways to Partner</div><h2>Different gifts. One mission.</h2></div><div class="grid3">${[['Prayer','Stand with the church in consistent prayer and spiritual support.'],['Service','Use your professional and practical gifts to strengthen ministry.'],['Resources','Help create spaces, tools and opportunities that serve people well.']].map((x,i)=>`<article class="card reveal"><div class="num">0${i+1}</div><h3>${x[0]}</h3><p>${x[1]}</p><a href="/contact" data-route="/contact">Start a conversation →</a></article>`).join('')}</div></div></section><section class="section dark"><div class="wrap" style="max-width:800px"><div class="eyebrow">Partnership</div><h2 class="serif" style="font-size:55px;margin:18px 0">Let’s build something that serves people and points to Christ.</h2><a class="btn red-btn" href="/contact" data-route="/contact">Contact Us</a></div></section>`)}
function college(){shell(pageHero('Church College','Learn. Grow. Lead.','A practical discipleship environment for believers who want deeper biblical foundations and ministry development.')+`<section class="section"><div class="wrap"><div class="about-grid"><div class="reveal"><div class="eyebrow">What to Expect</div><h2 class="serif" style="font-size:60px;margin:18px 0">Formation beyond Sunday.</h2><p class="copy">The Church College is designed around teaching, practice, mentorship and spiritual formation. Courses and schedules can be managed through the admin dashboard.</p><div style="margin-top:28px"><a class="btn red-btn" href="/contact" data-route="/contact">Ask About Enrollment</a></div></div><div class="card reveal"><div class="num">CC</div><h3>Coming alongside your calling.</h3><p>Explore biblical foundations, leadership, ministry skills and practical Christian living in an intentional learning environment.</p></div></div></div></section>`)}
async function give(){
shell(pageHero('Give','Give with purpose.','Your generosity helps create spaces for worship, discipleship, outreach, missions and care.')+`<section class="section"><div class="wrap" style="max-width:1000px"><div class="section-head reveal"><div class="eyebrow">Generosity</div><h2>Giving is worship expressed in action.</h2><p>Use the church account details below for offering and other gifts. Account information is managed securely from the Admin dashboard.</p></div><div id="givingAccounts" class="grid3"><div class="card"><p>Loading giving details…</p></div></div><div class="notice reveal" style="margin-top:18px"><strong>Offering note:</strong> Please use the correct account details and keep your transfer receipt/reference for your records.</div></div></section>`);
try{
 const r=await fetch('/api/giving'); const d=await r.json(); if(!r.ok) throw Error(d.error||'Could not load giving details');
 const el=document.getElementById('givingAccounts'); const rows=d.items||[];
 if(!rows.length){el.innerHTML='<div class="card"><h3>Giving details coming soon</h3><p>The church has not published an offering account yet. Please check back shortly.</p></div>';return}
 el.innerHTML=rows.map((x,i)=>`<article class="card reveal"><div class="num">${String(i+1).padStart(2,'0')}</div><h3>${esc(x.label||'Offering')}</h3><p><strong>Bank:</strong> ${esc(x.bank_name)}</p><p><strong>Account Name:</strong> ${esc(x.account_name)}</p><p><strong>Account Number:</strong> <span style="font-size:20px;letter-spacing:.06em">${esc(x.account_number)}</span></p>${x.sort_code?`<p><strong>Sort Code:</strong> ${esc(x.sort_code)}</p>`:''}${x.currency?`<p><strong>Currency:</strong> ${esc(x.currency)}</p>`:''}${x.instructions?`<p class="copy">${esc(x.instructions)}</p>`:''}</article>`).join('');observe();
}catch(e){const el=document.getElementById('givingAccounts');if(el)el.innerHTML='<div class="card"><h3>Giving details unavailable</h3><p>Please try again later or contact the church office.</p></div>';console.warn('Giving details unavailable',e)}
}
function contact(){shell(pageHero('Contact','We would love to hear from you.','Questions, prayer, visiting, volunteering or partnership — send us a message and the church team can respond.')+`<section class="section dark"><div class="wrap contact-grid"><div class="reveal"><div class="eyebrow">Connect</div><h2 class="serif" style="font-size:58px;margin:18px 0">Let’s start a conversation.</h2><div class="info-list"><div class="info-item"><small>Email</small><span id="contactEmail">hello@christocentricchurch.org</span></div><div class="info-item"><small>Phone</small><span id="contactPhone">Contact details managed in Admin</span></div><div class="info-item"><small>Services</small><span id="contactTimes">Service times managed in Admin</span></div></div></div><form class="form reveal" id="contactForm"><input name="name" placeholder="Your name" required><input name="email" type="email" placeholder="Email address"><input name="phone" placeholder="Phone number"><textarea name="message" placeholder="How can we help?" required></textarea><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" aria-hidden="true"><button class="btn red-btn" type="submit">Send Message</button><p id="contactStatus" style="font-size:12px;color:#aaa398"></p></form></div></section>`); document.getElementById('contactForm').onsubmit=submitContact;loadEditableContact()}
async function loadEditableContact(){try{const r=await fetch('/api/site-content');if(!r.ok)return;const s=(await r.json()).settings||{};if(s.email)document.getElementById('contactEmail').textContent=s.email;if(s.phone)document.getElementById('contactPhone').textContent=s.phone;if(s.service_times)document.getElementById('contactTimes').textContent=s.service_times}catch(e){console.warn(e)}}
async function submitContact(e){e.preventDefault();const form=e.currentTarget,status=document.getElementById('contactStatus');status.textContent='Sending…';try{const data=Object.fromEntries(new FormData(form));const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error||'Could not send');status.textContent='Thank you. Your message has been received.';form.reset()}catch(err){status.textContent='Message could not be sent. Please try again or use the church email.'}}
function observe(){document.querySelectorAll('.reveal').forEach((el,i)=>el.style.setProperty('--delay',(i%6)*70+'ms'));if(!('IntersectionObserver'in window)){document.querySelectorAll('.reveal').forEach(x=>x.classList.add('show'));return}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(x=>io.observe(x));}
function findUs(){shell(pageHero('Find Us','Come worship with us.','Get directions, service times and ways to reach the church office.')+`<section class="section"><div class="wrap" style="max-width:1000px"><div class="tcc-findus-grid" style="display:grid;grid-template-columns:1.1fr 1fr;gap:0;border:1px solid var(--line);background:#11100e">
<div style="padding:44px" class="reveal">
<div class="eyebrow">Visit TCC</div>
<h2 class="serif" style="font-size:38px;margin:14px 0">We'd love to see you.</h2>
<p class="copy" id="findUsAddress" style="margin-bottom:22px">Address is managed in the admin dashboard.</p>
<a class="btn red-btn" id="findUsDirections" target="_blank" rel="noopener" style="margin-bottom:32px;display:inline-block">Get Directions ↗</a>
<div class="info-list">
<div class="info-item"><small>Service Times</small><span id="findUsTimes">Managed in Admin</span></div>
<div class="info-item"><small>Phone</small><span id="findUsPhone">Managed in Admin</span></div>
<div class="info-item"><small>Email</small><span id="findUsEmail">hello@christocentricchurch.org</span></div>
</div>
<div style="margin-top:26px"><a class="btn" href="/contact" data-route="/contact">Contact the church office →</a></div>
</div>
<div style="min-height:420px"><iframe id="findUsMap" title="The Christocentric Church location map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:100%;border:0;display:block"></iframe></div>
</div></div></section>
<link rel="stylesheet" href="/assets/extracted/index-style-4.css">`);loadFindUs()}
async function loadFindUs(){
 try{
  const r=await fetch('/api/site-content'); if(!r.ok) return; const d=await r.json(); const s=d.settings||{};
  const address=s.location||window.TCC_CHURCH_ADDRESS||'';
  const map=document.getElementById('findUsMap'), dir=document.getElementById('findUsDirections'), addr=document.getElementById('findUsAddress');
  if(address){
    addr.textContent=address;
    map.src=s.map_url||('https://www.google.com/maps?q='+encodeURIComponent(address)+'&output=embed');
    dir.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address);
  }else{
    map.src='https://www.google.com/maps?q=The%20Christocentric%20Church&output=embed';
    dir.href='https://www.google.com/maps/search/?api=1&query=The%20Christocentric%20Church';
  }
  if(s.service_times)document.getElementById('findUsTimes').textContent=s.service_times;
  if(s.phone)document.getElementById('findUsPhone').textContent=s.phone;
  if(s.email)document.getElementById('findUsEmail').textContent=s.email;
 }catch(e){console.warn('Find Us content unavailable',e)}
}

const launchState={timer:null,shown:false};
function setLaunchVisible(v){const el=document.getElementById('launchScreen');if(!el)return;el.classList.toggle('active',v);document.body.classList.toggle('launch-open',v)}
function formatLaunchDate(iso,tz){try{return new Intl.DateTimeFormat(undefined,{dateStyle:'long',timeStyle:'short',timeZone:tz||undefined}).format(new Date(iso))}catch(_){return new Date(iso).toLocaleString()}}
function startLaunchCountdown(settings){const el=document.getElementById('launchScreen');if(!el)return;const enabled=!!settings.launch_enabled&&!!settings.launch_date;if(!enabled){setLaunchVisible(false);return}const target=new Date(settings.launch_date).getTime();if(Number.isNaN(target)){setLaunchVisible(false);return}document.getElementById('launchTitle').textContent=settings.launch_title||'THE ORIGIN IS NEAR';document.getElementById('launchSubtitle').textContent=settings.launch_subtitle||'Christ at the centre. Everything else follows.';document.getElementById('launchCompleteTitle').textContent=settings.launch_complete_title||'WE ARE LIVE';document.getElementById('launchCompleteBody').textContent=settings.launch_complete_body||'Welcome to The Christocentric Church.';document.getElementById('launchDateLabel').textContent='Launching '+formatLaunchDate(settings.launch_date,settings.launch_timezone);if(settings.logo_url)document.getElementById('launchLogo').src=settings.logo_url;setLaunchVisible(true);launchState.shown=true;const tick=()=>{const diff=target-Date.now();if(diff<=0){document.getElementById('launchCountdownView').style.display='none';document.getElementById('launchLive').style.display='block';if(launchState.timer)clearInterval(launchState.timer);return}const total=Math.floor(diff/1000);document.getElementById('launchDays').textContent=String(Math.floor(total/86400)).padStart(2,'0');document.getElementById('launchHours').textContent=String(Math.floor(total%86400/3600)).padStart(2,'0');document.getElementById('launchMinutes').textContent=String(Math.floor(total%3600/60)).padStart(2,'0');document.getElementById('launchSeconds').textContent=String(total%60).padStart(2,'0')};tick();if(launchState.timer)clearInterval(launchState.timer);launchState.timer=setInterval(tick,1000)}
async function loadLaunchGate(){try{const r=await fetch('/api/site-content',{cache:'no-store'});if(!r.ok)return false;const d=await r.json();const s=d.settings||{};startLaunchCountdown(s);return !!s.launch_enabled&&!!s.launch_date}catch(e){console.warn('Launch settings unavailable',e);return false}}
const pages={'/':home,'/about':about,'/programs':programs,'/partnership':partnership,'/college':college,'/give':give,'/contact':contact,'/find-us':findUs};
async function route(path,animate=true){path=path.split('?')[0].replace(/\/+$/,'')||'/';if(!pages[path])path='/';if(animate){transition.classList.remove('go');void transition.offsetWidth;transition.classList.add('go');await new Promise(r=>setTimeout(r,330))}pages[path]();document.querySelectorAll('[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route===path));history.replaceState({},'',path);nav.classList.remove('open');}
document.addEventListener('click',e=>{const a=e.target.closest('a[data-route]');if(!a)return;e.preventDefault();route(a.dataset.route,true)});
window.addEventListener('popstate',()=>route(location.pathname,false));
menu.onclick=()=>nav.classList.toggle('open');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>40),{passive:true});
window.addEventListener('load',()=>setTimeout(()=>loader.classList.add('hide'),500));
const initialRoute=new URLSearchParams(location.search).get('route');
loadLaunchGate().then(()=>route(initialRoute||location.pathname,false));
loadLiveCollections();
