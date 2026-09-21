
(()=>{const o=document.createElement('div');o.className='tcc-transition';o.innerHTML='<span>TCC</span>';document.body.appendChild(o);
document.querySelectorAll('a[href$=".html"]').forEach(a=>a.addEventListener('click',e=>{const h=a.getAttribute('href');if(!h||h.startsWith('http'))return;e.preventDefault();o.classList.add('active');setTimeout(()=>location.href=h,420)}));})();
