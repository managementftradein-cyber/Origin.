
(function(){
  const btn=document.getElementById('tccMoreBtn');
  const sheet=document.getElementById('tccMoreSheet');
  const backdrop=document.getElementById('tccMoreBackdrop');
  function toggle(open){
    sheet.classList.toggle('open',open); backdrop.classList.toggle('open',open);
    btn.setAttribute('aria-expanded',String(open));
  }
  if(btn){
    btn.addEventListener('click',()=>toggle(!sheet.classList.contains('open')));
    backdrop.addEventListener('click',()=>toggle(false));
    sheet.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
  }
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('.tcc-mobile-appbar a').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();
    if(href===current) a.classList.add('active');
    else a.classList.remove('active');
  });
})();
