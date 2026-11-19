import sampleProof from "./public-proof.json";
import { useState } from "react";
import {
  createIntent,
  digest,
  displayAmount,
  validateIntent,
  inspectReceipt,
  type Intent,
  type Check,
} from "./intent";
import {
  chainInfo,
  connect,
  download,
  exportIntent,
  jsonGet,
  requestPayment,
} from "./network";
import { reviewExample } from "./demo";
import "./style.css";
const REVIEW_BUILD = import.meta.env.VITE_REVIEW_BUILD === "true";
export function App() {
  const [tab, setTab] = useState("prepare"),
    [recipient, setRecipient] = useState(""),
    [amount, setAmount] = useState("12.50"),
    [reference, setReference] = useState("INV-204"),
    [hours, setHours] = useState(24);
  const [intent, setIntent] = useState<Intent | null>(null),
    [hash, setHash] = useState(""),
    [checks, setChecks] = useState<Check[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ack, setAck] = useState(false),
    [address, setAddress] = useState(""),
    [seal, setSeal] = useState(""),
    [receipt, setReceipt] = useState<unknown>(null),
    [source, setSource] = useState(""),
    [sent, setSent] = useState(false),
    [example, setExample] = useState(false);
  async function run(task: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  function clearResults() {
    setExample(false);
    setChecks([]);
    setReceipt(null);
    setSource("");
  }
  function edit(fn: () => void) {
    setSent(false);
    setHash("");
    fn();
    setIntent(null);
    setSeal("");
    setAck(false);
    clearResults();
  }
  async function prepare() {
    setSent(false);
    setHash("");
    const v = createIntent(recipient, amount, reference, hours);
    setIntent(v);
    setSeal(await digest(v));
    setAck(false);
    clearResults();
  }
  async function importIntent(f: File) {
    if (f.size > 12000) throw Error("Intent file too large.");
    const v = validateIntent(JSON.parse(await f.text()));
    setIntent(v);
    setSeal(await digest(v));
    setRecipient(v.recipient);
    setAmount(displayAmount(v.amountUqor));
    setReference(v.reference);
    setAck(false);
    clearResults();
  }
  async function verify() {
    clearResults();
    if (!intent) throw Error("Create or import the agreed intent first.");
    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(hash.trim()))
      throw Error("Enter a 64-character transaction hash.");
    const chain = await chainInfo();
    const data = await jsonGet(
      `/cosmos/tx/v1beta1/txs/${hash.trim().replace(/^0x/, "")}`,
    );
    setChecks(await inspectReceipt(intent, data, hash.trim(), chain));
    setReceipt(data);
    setSource(`QoreChain testnet node · ${new Date().toISOString()}`);
  }
  async function showExample(altered: boolean) {
    clearResults();
    const result = await reviewExample(altered);
    setIntent(result.intent);
    setSeal(result.seal);
    setRecipient(result.intent.recipient);
    setAmount(displayAmount(result.intent.amountUqor));
    setReference(result.intent.reference);
    setHash(result.hash);
    setChecks(result.checks);
    setSent(false);
    setAck(false);
    setExample(true);
    setTab("verify");
  }
  function showPrepare() {
    if (example) {
      edit(() => {
        setRecipient("");
        setAmount("12.50");
        setReference("INV-204");
      });
    }
    setTab("prepare");
  }
  const matched = checks.length === 7 && checks.every((c) => c.pass);
  return (
    <>
      <header>
        <a className="brand" href="./">
          SealCheck
        </a>
        <nav aria-label="Main">
          <button
            className={tab === "prepare" ? "active" : ""}
            disabled={busy}
            onClick={showPrepare}
          >
            Prepare payment
          </button>
          <button
            className={tab === "verify" ? "active" : ""}
            disabled={busy}
            onClick={() => setTab("verify")}
          >
            Verify receipt
          </button>
        </nav>
        {!REVIEW_BUILD && (
          <button
            className="connect"
            disabled={busy}
            onClick={() => run(async () => setAddress(await connect()))}
          >
            {address
              ? `${address.slice(0, 9)}…${address.slice(-5)}`
              : "Connect QoreX"}
          </button>
        )}
      </header>
      <main>
        {REVIEW_BUILD && (
          <p className="review-note">
            Public review edition. Run the full app with its QoreChain proxy for
            live wallet and receipt checks.
          </p>
        )}
        <h1>
          {tab === "prepare"
            ? "Know exactly what you are signing."
            : "A receipt you can check."}
        </h1>
        <p className="intro">
          {tab === "prepare"
            ? "Lock the recipient, amount and reference before payment."
            : "Compare a transaction with the intent agreed before payment."}
        </p>
        <div className="workspace">
          <section className="form-panel">
            {tab === "prepare" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(prepare);
                }}
              >
                <fieldset disabled={busy}>
                  <label>
                    Network
                    <select value="diana" disabled>
                      <option value="diana">QoreChain testnet</option>
                    </select>
                  </label>
                  <label>
                    Recipient
                    <input
                      required
                      value={recipient}
                      onChange={(e) => edit(() => setRecipient(e.target.value))}
                      placeholder="qor1… · full address with checksum"
                      spellCheck={false}
                    />
                  </label>
                  <label>
                    Token
                    <select value="QOR" disabled>
                      <option value="QOR">Test QOR</option>
                    </select>
                  </label>
                  <label>
                    Amount
                    <input
                      required
                      value={amount}
                      inputMode="decimal"
                      onChange={(e) => edit(() => setAmount(e.target.value))}
                    />
                  </label>
                  <label>
                    Invoice reference
                    <input
                      required
                      value={reference}
                      maxLength={64}
                      onChange={(e) => edit(() => setReference(e.target.value))}
                    />
                  </label>
                  <label>
                    Expiry
                    <select
                      value={hours}
                      onChange={(e) => edit(() => setHours(+e.target.value))}
                    >
                      <option value={1}>1 hour</option>
                      <option value={24}>24 hours</option>
                      <option value={72}>72 hours</option>
                    </select>
                  </label>
                  <button className="primary" disabled={busy}>
                    {busy ? "Working…" : "Create payment intent"}
                  </button>
                </fieldset>
              </form>
            ) : (
              <section className="verify-form">
                <h2>Check the receipt</h2>
                <div className="examples">
                  <p>Try a sample receipt. Both examples use simulated data.</p>
                  <button
                    className="outline"
                    disabled={busy}
                    onClick={() => run(() => showExample(false))}
                  >
                    Matching sample
                  </button>
                  <button
                    className="outline"
                    disabled={busy}
                    onClick={() => run(() => showExample(true))}
                  >
                    Amount mismatch sample
                  </button>
                </div>
                <section className="review-note" aria-label="Public chain evidence">
                  <h3>Public hybrid-signed transfer</h3>
                  <p>QoreChain testnet recorded {displayAmount(sampleProof.amountUqor)} QOR at block {sampleProof.height}. Its node reported a hybrid-signature extension and a verified event.</p>
                  <p>This public example demonstrates what the chain records. SealCheck did not create the transfer and has no payment intent for it.</p>
                  <a href={`https://api-testnet.qore.host/cosmos/tx/v1beta1/txs/${sampleProof.hash}`} target="_blank" rel="noreferrer">Open the original node receipt</a>
                </section>
                {!REVIEW_BUILD && (
                  <>
                    <p>
                      Import the exact intent shared before payment. A
                      screenshot or copied success message is not a receipt.
                    </p>
                    <label className="file-label">
                      Import payment intent
                      <input
                        disabled={busy}
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) run(() => importIntent(f));
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <label>
                      Transaction hash
                      <input
                        disabled={busy || example}
                        value={hash}
                        onChange={(e) => {
                          setHash(e.target.value);
                          clearResults();
                        }}
                        placeholder="64 hexadecimal characters"
                        spellCheck={false}
                      />
                    </label>
                    <button
                      className="primary"
                      disabled={busy || !intent || example}
                      onClick={() => run(verify)}
                    >
                      {busy ? "Checking testnet…" : "Verify on chain"}
                    </button>
                    <p className="fine">
                      Results rely on the fixed testnet node. Consensus and
                      signatures are not independently re-verified locally.
                    </p>
                  </>
                )}
              </section>
            )}
            {intent && tab === "prepare" && REVIEW_BUILD && (
              <button
                className="text-button"
                onClick={() => exportIntent(intent)}
              >
                Export payment intent
              </button>
            )}
            {intent && tab === "prepare" && !REVIEW_BUILD && (
              <section className="signing">
                <label className="check">
                  <input
                    disabled={busy}
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />
                  I checked the recipient and amount.
                </label>
                <p className="fine">
                  {sent
                    ? "Transfer submitted. Verify the receipt before considering another payment."
                    : "Prepared only; no signature yet. QoreX will ask you to approve a testnet transfer and fee. Native transfers can be repeated; check for an existing payment before signing."}
                </p>
                <button
                  className="outline"
                  disabled={!ack || busy || sent}
                  onClick={() =>
                    run(async () => {
                      setHash(await requestPayment(intent, seal));
                      setSent(true);
                      setTab("verify");
                    })
                  }
                >
                  Review transfer in QoreX
                </button>
                <button
                  className="text-button"
                  onClick={() => exportIntent(intent)}
                >
                  Export payment intent
                </button>
              </section>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
          <aside>
            <h2>Payment intent</h2>
            <dl>
              <div>
                <dt>Recipient</dt>
                <dd className="mono address">
                  {intent?.recipient || "Not set"}
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>
                  <strong>
                    {intent ? displayAmount(intent.amountUqor) : amount} QOR
                  </strong>
                </dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{intent?.reference || reference}</dd>
              </div>
              <div>
                <dt>Expiry</dt>
                <dd>
                  {intent
                    ? new Date(intent.expiresAt * 1000).toLocaleString()
                    : `${hours} hours`}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={example && !matched ? "status fail" : "status"}>
                    {example
                      ? matched
                        ? "Sample matched"
                        : "Sample mismatch"
                      : matched
                        ? "Matched on testnet"
                        : intent
                          ? "Prepared — not signed"
                          : "Draft — not signed"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Digest</dt>
                <dd className="mono digest">
                  {seal || "Create an intent to calculate its digest"}
                </dd>
              </div>
            </dl>
            <h2 className="checks-title">Receipt checks</h2>
            <ul className="checks">
              {(checks.length
                ? checks
                : [
                    "Network",
                    "Recipient",
                    "Amount",
                    "Intent",
                    "Hybrid proof",
                  ].map((label) => ({
                    label,
                    pass: false,
                    detail: "Not checked",
                  }))
              ).map((c) => (
                <li key={c.label}>
                  <strong>{c.label}</strong>
                  <span
                    className={checks.length ? (c.pass ? "pass" : "fail") : ""}
                  >
                    {checks.length ? (c.pass ? "✓ " : "× ") : "○ "}
                    {c.detail}
                  </span>
                </li>
              ))}
            </ul>
            <button
              className="outline"
              disabled={busy}
              onClick={() => setTab("verify")}
            >
              Open receipt checks
            </button>
            {source && <p className="fine">Fetched from {source}</p>}
            {!!receipt && (
              <button
                className="text-button"
                onClick={() =>
                  download("sealcheck-evidence.json", {
                    intent,
                    receipt,
                    checks,
                    source,
                  })
                }
              >
                Export verification evidence
              </button>
            )}
          </aside>
        </div>
      </main>
      <footer>
        <span>
          Testnet only.{" "}
          {example
            ? "Simulated receipt."
            : hash
              ? "Transaction entered."
              : "No payment sent."}
        </span>
        <a
          href="https://build.qorechain.io/rules"
          target="_blank"
          rel="noreferrer"
        >
          Built for QoreChain
        </a>
      </footer>
    </>
  );
}
