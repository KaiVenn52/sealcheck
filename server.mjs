import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'),port=Number(process.env.PORT||5181),prefix='/lcd',upstream='https://api-testnet.qore.host';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname===prefix||url.pathname.startsWith(prefix+'/')){
  if(!['GET','POST'].includes(req.method)){res.writeHead(405).end();return;}
  if(prefix==='/lcd'&&req.method!=='GET'){res.writeHead(405).end();return;}
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>65536){res.writeHead(413).end();return;}}
  const target=upstream+(prefix==='/lcd'?url.pathname.slice(prefix.length)+url.search:'');
  const response=await fetch(target,{method:req.method,headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0 CompetitionApp/0.1'},body:req.method==='POST'?body:undefined,signal:AbortSignal.timeout(15000)});
  res.writeHead(response.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(await response.text());return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
 const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 const file=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:file);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:502,{'Content-Type':'text/plain'});res.end(e.code==='ENOENT'?'Not found':'Upstream unavailable');}
}).listen(port,'0.0.0.0',()=>console.log(`App ready on ${port}`));
