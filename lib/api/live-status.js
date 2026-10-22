const {sb,requireAdmin}=require('./_supabase');
const {applyAuto,diagnose}=require('./_youtube');
module.exports=async(req,res)=>{
 try{
  if(req.method==='GET'){
   const q=await sb().from('live_status').select('*').eq('id',1).maybeSingle();
   if(q.error)throw q.error;
   const row=q.data||{id:1,is_live:false,title:'TCC Live'};
   // Admin "Test connection" button: /api/live-status?check=1 (admin only, never cached)
   if(req.query&&req.query.check){
    await requireAdmin(req);
    res.setHeader('Cache-Control','no-store');
    return res.json(await diagnose(row,req.query.channel));
   }
   const out=await applyAuto(row);
   const body={...out.row};
   if(out.auto){
    if(out.error)body.auto_error=String(out.error).slice(0,80);
    // automatic mode: let Vercel's edge share one YouTube check between all visitors for 30s
    res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=60');
   }else res.setHeader('Cache-Control','no-store');
   return res.json(body);
  }
  if(req.method==='POST'){
   await requireAdmin(req);
   const body=req.body?.data||req.body||{};
   const q=await sb().from('live_status').upsert({...body,id:1,updated_at:new Date().toISOString()},{onConflict:'id'}).select().single();
   if(q.error)throw q.error;
   return res.json(q.data);
  }
  return res.status(405).json({error:'Method not allowed'});
 }catch(e){return res.status(e.status||500).json({error:e.message||'Server error'})}
};
