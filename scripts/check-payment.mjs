import { readFile } from 'node:fs/promises';
import { digest, inspectReceipt, validateIntent } from '../src/intent.ts';

const [file, rawHash, ...extra] = process.argv.slice(2);
if (!file || !/^(0x)?[a-f0-9]{64}$/i.test(rawHash || '') || extra.length) {
  console.error('Usage: npm run check:payment -- <intent.json> <transaction-hash>');
  process.exit(64);
}

const input = await readFile(file);
if (input.length > 12_000) throw Error('Intent file too large.');
const intent = validateIntent(JSON.parse(input.toString('utf8')));
const hash = rawHash.replace(/^0x/i, '').toUpperCase();
const origin = 'https://api-testnet.qore.host';

async function readNode(path) {
  const response = await fetch(origin + path, {
    headers: { 'User-Agent': 'Mozilla/5.0 SealCheck/0.1' },
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw Error('QoreChain returned HTTP ' + response.status);
  return response.json();
}

const [node, receipt] = await Promise.all([
  readNode('/cosmos/base/tendermint/v1beta1/node_info'),
  readNode('/cosmos/tx/v1beta1/txs/' + hash),
]);
const chain = node.default_node_info?.network;
const checks = await inspectReceipt(intent, receipt, hash, chain);
const match = checks.every(check => check.pass);

console.log(JSON.stringify({
  source: origin,
  checkedAt: new Date().toISOString(),
  chain,
  hash,
  seal: await digest(intent),
  match,
  checks,
}, null, 2));

if (!match) process.exitCode = 2;
