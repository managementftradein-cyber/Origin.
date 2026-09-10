
(function(){
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const timeAgo=iso=>{if(!iso)return'';const s=Math.max(1,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(s<60)return s+'s ago';const m=Math.floor(s/60);if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';const d=Math.floor(h/24);if(d<7)return d+'d ago';return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'})};
const initials=name=>String(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
let profile=null;
const FEED_PAGE_SIZE=10;
let feedCursor=null,feedLoading=false,feedExhausted=false;
function skeletonCard(){return `<div class="tcc-skel"><div class="tcc-skel-head"><div class="tcc-skel-avatar"></div><div style="flex:1"><div class="tcc-skel-line" style="width:130px"></div><div class="tcc-skel-line" style="width:70px;margin-top:6px"></div></div></div><div class="tcc-skel-line" style="width:96%"></div><div class="tcc-skel-line" style="width:82%"></div><div class="tcc-skel-line" style="width:55%"></div></div>`}
function skeletonHTML(n){return Array.from({length:n}).map(skeletonCard).join('')}
function emptyState(icon,title,body){return `<div class="tcc-empty"><div class="tcc-empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`}

async function api(path,method='GET',body=null,auth=false){
 const opt={method,headers:{}};
 if(body){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body)}
 if(auth){const t=await window.TCCUser.token();if(!t)throw Error('Please sign in to continue');opt.headers.Authorization=`Bearer ${t}`}
 const r=await fetch(path,opt);let d={};try{d=await r.json()}catch(_){}
 if(!r.ok)throw Error(d.error||`Request failed (${r.status})`);
 return d;
}

function renderAuthState(){
 const signedIn=!!window.TCCUser.user;
 $('#authPanel').style.display=signedIn?'none':'block';
 $('#appPanel').style.display=signedIn&&profile?.display_name?'block':'none';
 $('#profilePrompt').style.display=signedIn&&!profile?.display_name?'block':'none';
 if(signedIn)$('#whoamiName').textContent=profile?.display_name||window.TCCUser.user.email;
}

function postCard(p){
 const mine=p.mine?`<button class="tcc-action danger" data-delpost="${esc(p.id)}">Remove</button>`:'';
 return `<article class="tcc-post" data-post="${esc(p.id)}">
  <div class="tcc-post-head"><div class="tcc-post-author"><div class="tcc-avatar">${esc(initials(p.author))}</div><div><div><b>${esc(p.author)}</b></div><div class="tcc-post-time">${esc(timeAgo(p.created_at))}</div></div></div></div>
  <div class="tcc-post-body">${esc(p.body)}</div>
  ${p.image_url?`<img class="tcc-post-image" src="${esc(p.image_url)}" alt="" loading="lazy">`:''}
  <div class="tcc-post-actions">
   <button class="tcc-action ${p.liked_by_me?'liked':''}" data-like="${esc(p.id)}">♥ <span>${p.like_count}</span></button>
   <button class="tcc-action" data-toggle-comments="${esc(p.id)}">💬 <span>${p.comment_count}</span> Comments</button>
   ${mine}
  </div>
  <div class="tcc-comments" id="comments-${esc(p.id)}">
   <div class="tcc-comment-list"></div>
   ${window.TCCUser.user?`<form class="tcc-comment-form" data-commentform="${esc(p.id)}"><input placeholder="Write a comment…" maxlength="1000" required><button>Send</button></form>`:''}
  </div>
 </article>`;
}

function commentRow(c){
 const mine=c.mine?` <button class="tcc-action danger" data-delcomment="${esc(c.id)}" style="padding:0;font-size:10px">Remove</button>`:'';
 return `<div class="tcc-comment"><div class="tcc-avatar" style="width:28px;height:28px;font-size:11px">${esc(initials(c.author))}</div><div class="tcc-comment-body"><b>${esc(c.author)} · ${esc(timeAgo(c.created_at))}${mine}</b>${esc(c.body)}</div></div>`;
}

async function loadFeed(reset=true){
 const el=$('#feed');
 if(reset){feedCursor=null;feedExhausted=false;el.innerHTML=skeletonHTML(3);$('#feedMore').innerHTML=''}
 if(feedLoading||(feedExhausted&&!reset))return;
 feedLoading=true;if(!reset)renderLoadMore();
 try{
  const qs=new URLSearchParams({type:'feed',limit:FEED_PAGE_SIZE});
  if(feedCursor)qs.set('before',feedCursor);
  const d=await api('/api/community?'+qs.toString());
  const items=d.items||[];
  if(reset)el.innerHTML='';
  if(!items.length&&reset){
   el.innerHTML=emptyState('✦','No posts yet','Be the first to share something with the church family.');
   feedExhausted=true;
  }else{
   el.insertAdjacentHTML('beforeend',items.map(postCard).join(''));
   if(items.length)feedCursor=items[items.length-1].created_at;
   feedExhausted=items.length<FEED_PAGE_SIZE;
  }
  bindFeed();
 }catch(e){
  if(reset)el.innerHTML=emptyState('⚠','Could not load the feed',e.message);
 }finally{feedLoading=false;renderLoadMore()}
}

function renderLoadMore(){
 const el=$('#feedMore');if(!el)return;
 if(feedLoading){el.innerHTML=$('#feed').children.length?'<button class="tcc-btn outline" disabled>Loading…</button>':'';return}
 if(feedExhausted){el.innerHTML='';return}
 el.innerHTML='<button class="tcc-btn outline" id="loadMoreBtn">Load more</button>';
 $('#loadMoreBtn').onclick=()=>loadFeed(false);
}

function bindFeed(){
 document.querySelectorAll('[data-like]').forEach(b=>b.onclick=async()=>{
  if(!window.TCCUser.user){alert('Please sign in to like a post.');return}
  const id=b.dataset.like;
  try{
   const r=await api('/api/community?type=like','POST',{post_id:id},true);
   b.classList.toggle('liked',r.liked);
   const span=b.querySelector('span'),cur=Number(span.textContent)||0;
   span.textContent=Math.max(0,cur+(r.liked?1:-1));
  }catch(e){alert(e.message)}
 });
 document.querySelectorAll('[data-toggle-comments]').forEach(b=>b.onclick=async()=>{
  const id=b.dataset.toggleComments,box=$('#comments-'+id);
  const opening=!box.classList.contains('open');
  box.classList.toggle('open');
  if(opening&&!box.dataset.loaded){
   box.dataset.loaded='1';
   const list=box.querySelector('.tcc-comment-list');
   try{const d=await api('/api/community?type=comments&post_id='+encodeURIComponent(id));list.innerHTML=(d.items||[]).map(commentRow).join('')||'<p style="color:#777;font-size:12px">No comments yet.</p>'}catch(e){list.innerHTML=`<p style="color:#e0a1a1;font-size:12px">${esc(e.message)}</p>`}
  }
 });
 document.querySelectorAll('[data-commentform]').forEach(f=>f.onsubmit=async e=>{
  e.preventDefault();const id=f.dataset.commentform,input=f.querySelector('input'),text=input.value.trim();if(!text)return;
  try{
   await api('/api/community?type=comment','POST',{post_id:id,body:text},true);input.value='';
   const box=$('#comments-'+id),d=await api('/api/community?type=comments&post_id='+encodeURIComponent(id));
   box.querySelector('.tcc-comment-list').innerHTML=(d.items||[]).map(commentRow).join('');
   bumpCount(id,'toggle-comments',d.items.length);
  }catch(err){alert(err.message)}
 });
 document.querySelectorAll('[data-delpost]').forEach(b=>b.onclick=async()=>{
  if(!confirm('Remove this post?'))return;
  try{await api('/api/community?type=post','DELETE',{id:b.dataset.delpost},true);loadFeed()}catch(e){alert(e.message)}
 });
 document.querySelectorAll('[data-delcomment]').forEach(b=>b.onclick=async()=>{
  if(!confirm('Remove this comment?'))return;
  const post=b.closest('.tcc-post').dataset.post;
  try{
   await api('/api/community?type=comment','DELETE',{id:b.dataset.delcomment},true);
   const box=$('#comments-'+post),d=await api('/api/community?type=comments&post_id='+encodeURIComponent(post));
   box.querySelector('.tcc-comment-list').innerHTML=(d.items||[]).map(commentRow).join('')||'<p style="color:#777;font-size:12px">No comments yet.</p>';
   bumpCount(post,'toggle-comments',d.items.length);
  }catch(e){alert(e.message)}
 });
}

function bumpCount(postId,attr,n){
 const btn=document.querySelector(`[data-${attr}="${postId}"]`);
 if(btn)btn.querySelector('span').textContent=n;
}

let inviteToken=null;
async function checkActiveMeeting(){
 const el=$('#meetingBanner');
 if(!window.TCCUser.user){el.innerHTML='';return}
 try{
  const token=await window.TCCUser.token();
  const r=await fetch('/api/meetings?type=active',{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok){el.innerHTML='';return}
  const d=await r.json();const items=d.items||[];
  if(!items.length){el.innerHTML='';return}
  const m=items[0];
  el.innerHTML=`<div class="tcc-panel" style="border-color:#d9b65d;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
   <div><b style="color:#d9b65d">Live now:</b> ${esc(m.title)} <span style="color:#a69d8c">(${esc(m.department_name)})</span></div>
   <button class="tcc-btn" id="joinMeetingBtn" data-id="${esc(m.id)}">Join Meeting</button>
  </div>`;
  $('#joinMeetingBtn').onclick=async()=>{
   const btn=$('#joinMeetingBtn');btn.disabled=true;btn.textContent='Joining…';
   try{
    const rr=await fetch('/api/meetings?type=join',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({meeting_id:m.id})});
    const dd=await rr.json();
    if(!rr.ok) throw Error(dd.error||'Could not join the meeting');
    window.open(dd.join_url,'_blank','noopener');
   }catch(err){alert(err.message)}finally{btn.disabled=false;btn.textContent='Join Meeting'}
  };
 }catch(_){el.innerHTML=''}
}

async function checkInvite(){
 const params=new URLSearchParams(location.search);
 const token=params.get('invite');
 if(!token){$('#inviteStatusMsg').textContent='No invitation link detected. Open the link your department head sent you to continue.';return}
 $('#inviteStatusMsg').textContent='Checking your invitation…';
 try{
  const r=await fetch(`/api/roles?type=validate-invite&token=${encodeURIComponent(token)}`);
  const d=await r.json();
  if(!d.valid){$('#inviteStatusMsg').textContent=d.error||'This invitation link is no longer valid.';return}
  inviteToken=token;
  $('#signupGate').style.display='none';
  $('#signupForm').style.display='';
  $('#signupDeptLabel').textContent=`You're joining: ${d.department_name}`;
 }catch(_){$('#inviteStatusMsg').textContent='Could not verify your invitation link. Please try again.'}
}

function bindAuthTabs(){
 $('#tabLogin').onclick=()=>{$('#tabLogin').classList.add('active');$('#tabSignup').classList.remove('active');$('#loginForm').classList.add('active');$('#signupGate').classList.remove('active');$('#signupForm').classList.remove('active')};
 $('#tabSignup').onclick=()=>{$('#tabSignup').classList.add('active');$('#tabLogin').classList.remove('active');$('#loginForm').classList.remove('active');$('#signupGate').classList.remove('active');$('#signupForm').classList.remove('active');(inviteToken?$('#signupForm'):$('#signupGate')).classList.add('active')};
 $('#loginForm').onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget,msg=$('#loginMsg'),btn=f.querySelector('button');btn.disabled=true;msg.className='tcc-msg';msg.textContent='Signing in…';
  try{await window.TCCUser.login(f.email.value,f.password.value);await afterAuth()}catch(err){msg.textContent=err.message}finally{btn.disabled=false}
 };
 $('#signupForm').onsubmit=async e=>{
  e.preventDefault();
  if(!inviteToken){$('#signupMsg').textContent='Your invitation link is missing or invalid.';return}
  const f=e.currentTarget,msg=$('#signupMsg'),btn=f.querySelector('button');btn.disabled=true;msg.className='tcc-msg';msg.textContent='Creating your account…';
  try{
   const r=await fetch('/api/roles?type=apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:inviteToken,email:f.email.value,password:f.password.value,website:f.website.value})});
   const d=await r.json();
   if(!r.ok) throw Error(d.error||'Could not create your account.');
   await window.TCCUser.login(f.email.value,f.password.value);
   await afterAuth();
  }catch(err){msg.textContent=err.message;btn.disabled=false}
 };
 $('#profileForm').onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget,msg=$('#profileMsg'),btn=f.querySelector('button');btn.disabled=true;msg.textContent='Saving…';
  try{profile=await api('/api/community?type=profile','POST',{display_name:f.display_name.value},true);renderAuthState();loadFeed()}catch(err){msg.textContent=err.message}finally{btn.disabled=false}
 };
 $('#signOutBtn').onclick=async()=>{await window.TCCUser.logout();profile=null;renderAuthState();loadFeed()};
 $('#attachImageBtn').onclick=()=>$('#imageFileInput').click();
 $('#imageFileInput').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  if(file.size>4*1024*1024){$('#postMsg').textContent='Image must be 4MB or smaller.';return}
  const btn=$('#attachImageBtn');btn.disabled=true;btn.textContent='Uploading…';
  const reader=new FileReader();
  reader.onload=async()=>{
   try{
    const parts=String(reader.result).split(',');
    const d=await api('/api/community-upload','POST',{contentType:file.type,dataBase64:parts[1]},true);
    $('#postForm input[name=image_url]').value=d.url;
    $('#imagePreview').src=d.url;$('#imagePreviewWrap').style.display='block';
    $('#postMsg').textContent='';
   }catch(err){$('#postMsg').textContent=err.message}
   finally{btn.disabled=false;btn.textContent='📷 Add Photo'}
  };
  reader.readAsDataURL(file);
 };
 $('#removeImageBtn').onclick=()=>{$('#postForm input[name=image_url]').value='';$('#imagePreviewWrap').style.display='none'};
 $('#postForm').onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget,msg=$('#postMsg'),btn=f.querySelector('.tcc-composer-row button:last-child');btn.disabled=true;msg.textContent='Posting…';
  try{
   await api('/api/community?type=post','POST',{body:f.body.value,image_url:f.image_url.value},true);
   f.reset();$('#imagePreviewWrap').style.display='none';msg.textContent='';await loadFeed();
  }catch(err){msg.textContent=err.message}finally{btn.disabled=false}
 };
}

async function afterAuth(){
 try{profile=await api('/api/community?type=profile','GET',null,true)}
 catch(err){
  profile=null;
  if(/suspended/i.test(err.message||'')){
   await window.TCCUser.logout();
   $('#loginMsg').textContent='Your account has been suspended. Contact your department head or the church office for help.';
  }
 }
 renderAuthState();
 loadFeed();
 checkActiveMeeting();
}

(async function boot(){
 bindAuthTabs();
 checkInvite();
 try{
  await window.TCCUser.init();
  if(window.TCCUser.user){
   try{profile=await api('/api/community?type=profile','GET',null,true)}
   catch(err){
    profile=null;
    if(/suspended/i.test(err.message||'')){
     await window.TCCUser.logout();
     $('#loginMsg').textContent='Your account has been suspended. Contact your department head or the church office for help.';
    }
   }
  }
 }catch(e){console.warn(e)}
 renderAuthState();
 loadFeed();
 checkActiveMeeting();
})();
})();
