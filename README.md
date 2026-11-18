# SealCheck

Try the [public review edition](https://kaivenn52.github.io/sealcheck/) to compare a matching simulation with a one-micro-QOR mismatch. The public edition uses sample data. Run the full app with the LCD proxy for live transactions.

Know exactly what you are signing. SealCheck lets a payer and recipient agree to a precise QoreChain payment intent, then check the resulting receipt against that original agreement.

## User flow

1. Enter the recipient bech32 address, exact QOR amount, reference and expiry. Create and export the intent JSON. Share it with the recipient.
2. Review the values, connect the official QoreX extension on QoreChain testnet (`qorechain-diana`), and approve the native transfer in the wallet. The app never handles seed phrases or keys.
3. Import the agreed intent, enter the transaction hash and verify. Export the raw node response and individual checks for review.

The native bank transfer binds its memo to a canonical SHA-256 intent digest. Verification checks network, success, hash, single transfer, recipient, exact micro-QOR amount, memo and deadline. Hybrid status requires the PQC extension and node-reported verified event. This is node-attested evidence; the browser does not independently validate consensus or the post-quantum signature.

The native chain does not enforce invoice uniqueness. The same intent can be paid more than once; always check existing receipts before approving another transfer. Expiry is enforced locally before signing and against inclusion time when verifying; it does not make the bank module reject late broadcasts.

## Development

`npm run dev` listens on http://127.0.0.1:5181. Production uses the same port by default. `/lcd` is restricted to GET requests against `https://api-testnet.qore.host`. A normal browser User-Agent avoids the upstream default-client rejection.

## Competition readiness

Created from the official create-qorechain-dapp scaffolder. Public MIT source: https://github.com/KaiVenn52/sealcheck. Still required: QoreX setup, a real hybrid testnet transaction and its address/hash, deployed demo, <=3-minute demonstration video and final submission. Registration is currently in progress.

## Evidence and limitations

This is a working local prototype. Automated tests use fixtures and an in-process blockchain. They do not prove public deployment, registration, eligibility, a live wallet transaction or a submitted entry. No live payment is claimed. Testnet assets have no monetary value.

Run `npm ci`, `npm test`, `npm run build`, then `npm start`. Node 24 is supported. The production server serves the build and proxies only the fixed official upstream. Set `PORT` for hosting; terminate TLS at your hosting platform. A static-only host cannot serve the RPC proxy. A Dockerfile is included, but the container has not yet been built or deployed. No secrets are needed by the frontend or proxy.

## AI assistance

See AI_USAGE.md. MIT licensed. This prototype has not undergone an independent security audit.
