import assert from 'node:assert/strict';
import proof from '../src/public-proof.json' with { type: 'json' };

const origin = 'https://api-testnet.qore.host';
async function get(path) {
  const response = await fetch(origin + path, {
    headers: { 'User-Agent': 'Mozilla/5.0 SealCheck/0.1' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw Error('QoreChain API returned ' + response.status);
  return response.json();
}

const [node, transaction] = await Promise.all([
  get('/cosmos/base/tendermint/v1beta1/node_info'),
  get('/cosmos/tx/v1beta1/txs/' + proof.hash),
]);
assert.equal(node.default_node_info.network, proof.chain);
const { tx_response: receipt, tx: { body } } = transaction;
assert.equal(receipt.txhash, proof.hash);
assert.equal(receipt.height, proof.height);
assert.equal(receipt.timestamp, proof.timestamp);
assert.equal(receipt.code, 0);
assert.equal(body.messages.length, 1);
assert.equal(body.messages[0]['@type'], proof.messageType);
assert.deepEqual(body.messages[0].amount, [{ denom: 'uqor', amount: proof.amountUqor }]);
assert(body.extension_options.some(extension => extension['@type'] === proof.extensionType));
assert(receipt.events.some(event => event.type === 'pqc_hybrid_verify' &&
  event.attributes.some(attribute => attribute.key === 'status' && attribute.value === 'verified')));
console.log(JSON.stringify({
  ...proof, source: origin,
  observation: 'Public QoreChain testnet transfer, independent of SealCheck',
  nodeReportedHybridVerified: true,
}, null, 2));
