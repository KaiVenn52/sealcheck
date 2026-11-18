export type Intent={version:1;chainId:'qorechain-diana';recipient:string;amountUqor:string;reference:string;expiresAt:number;nonce:string};
export type Check={label:string;pass:boolean;detail:string};
const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l';
export function validRecipient(a:string){
 if(a!==a.toLowerCase()||!/^qor1[0-9a-z]{38}$/.test(a))return false;
 const p='qor',v=[...p].map(c=>c.charCodeAt(0)>>5).concat([0],[...p].map(c=>c.charCodeAt(0)&31),[...a.slice(4)].map(c=>alphabet.indexOf(c)));
 if(v.some(n=>n<0))return false;let chk=1;const gen=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
 for(const n of v){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^n;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=gen[i];}return(chk>>>0)===1;
}
export function units(input:string){if(!/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(input))throw Error('Use a positive amount with at most 6 decimal places.');const [w,p='']=input.split('.');const n=BigInt(w)*1000000n+BigInt(p.padEnd(6,'0'));if(n<=0n)throw Error('Amount must be greater than zero.');return n.toString();}
export function displayAmount(n:string){return`${BigInt(n)/1000000n}.${(BigInt(n)%1000000n).toString().padStart(6,'0').replace(/0+$/,'')||'00'}`;}
export function validateIntent(value:unknown):Intent{const v=value as Intent;if(!v||Object.keys(v).sort().join(',')!=='amountUqor,chainId,expiresAt,nonce,recipient,reference,version'||v.version!==1||v.chainId!=='qorechain-diana')throw Error('Unsupported intent schema or network.');if(typeof v.recipient!=='string'||!validRecipient(v.recipient))throw Error('Use a qor1 recipient with a valid checksum.');if(typeof v.amountUqor!=='string'||!/^[1-9]\d{0,17}$/.test(v.amountUqor))throw Error('Invalid amount.');if(typeof v.reference!=='string'||v.reference.length<1||v.reference.length>64||/[\u0000-\u001f\u007f]/.test(v.reference))throw Error('Reference must be 1–64 printable characters.');if(!Number.isSafeInteger(v.expiresAt)||v.expiresAt<=0||typeof v.nonce!=='string'||!/^[0-9a-f]{32}$/.test(v.nonce))throw Error('Invalid expiry or nonce.');return v;}
export function canonical(value:Intent){const v=validateIntent(value);return JSON.stringify({version:1,chainId:v.chainId,recipient:v.recipient,amountUqor:v.amountUqor,reference:v.reference,expiresAt:v.expiresAt,nonce:v.nonce});}
export async function digest(v:Intent){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v)));return[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function createIntent(recipient:string,amount:string,reference:string,hours:number):Intent{if(![1,24,72].includes(hours))throw Error('Invalid expiry.');return validateIntent({version:1,chainId:'qorechain-diana',recipient:recipient.trim(),amountUqor:units(amount),reference:reference.trim(),expiresAt:Math.floor(Date.now()/1000)+hours*3600,nonce:[...crypto.getRandomValues(new Uint8Array(16))].map(v=>v.toString(16).padStart(2,'0')).join('')});}
export async function inspectReceipt(v:Intent,p:any,hash:string,network:string):Promise<Check[]>{validateIntent(v);const r=p?.tx_response,b=p?.tx?.body,m=b?.messages?.length===1?b.messages[0]:null,a=m?.amount;const check=(label:string,pass:boolean,detail:string)=>({label,pass:!!pass,detail});const event=r?.events?.some((e:any)=>e.type==='pqc_hybrid_verify'&&e.attributes?.some((a:any)=>a.key==='status'&&a.value==='verified'));const ext=b?.extension_options?.some((e:any)=>typeof e['@type']==='string'&&e['@type'].endsWith('.PQCHybridSignature'));const time=Date.parse(r?.timestamp??'');
 const observed=a?.[0]?.amount;
 const singleQor=Array.isArray(a)&&a.length===1&&a[0]?.denom==='uqor';
 const readableAmount=singleQor&&typeof observed==='string'&&/^(0|[1-9]\d{0,29})$/.test(observed);
 const amountDetail=readableAmount?'Expected '+displayAmount(v.amountUqor)+' QOR; receipt '+displayAmount(observed)+' QOR':'Expected one QOR amount';
 return[
 check('Network',network===v.chainId,network||'Not established'),
 check('Transaction',r?.code===0&&r?.txhash?.toUpperCase()===hash.replace(/^0x/,'').toUpperCase()&&/^\d+$/.test(String(r?.height))&&BigInt(r.height)>0n,'Successful transaction and matching hash required'),
 check('Recipient',m?.['@type']==='/cosmos.bank.v1beta1.MsgSend'&&validRecipient(m?.from_address??'')&&m?.to_address===v.recipient,'Single native transfer to the prepared recipient'),
 check('Amount',singleQor&&observed===v.amountUqor,amountDetail),
 check('Intent',b?.memo===`sealcheck:v1:${await digest(v)}`,'Memo binds recipient, amount, reference, expiry and nonce'),
 check('Expiry',Number.isFinite(time)&&Math.floor(time/1000)<=v.expiresAt,'Block timestamp must precede expiry'),
 check('Hybrid proof',event&&ext,'Node must report the hybrid extension and verified event')];}
