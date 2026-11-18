import { digest, inspectReceipt, type Intent } from "./intent";

const recipient = "qor1qyqszqgpqyqszqgpqyqszqgpqyqszqgpxckac7";
const sender = "qor1qgpqyqszqgpqyqszqgpqyqszqgpqyqszhuscng";
const hash = "A".repeat(64);
const agreed: Intent = {
  version: 1,
  chainId: "qorechain-diana",
  recipient,
  amountUqor: "12500000",
  reference: "DEMO-204",
  expiresAt: Date.parse('2026-11-18T00:00:00Z') / 1000,
  nonce: "1".repeat(32),
};

export async function reviewExample(altered: boolean) {
  const seal = await digest(agreed);
  const receipt = {
    tx: {
      body: {
        messages: [
          {
            "@type": "/cosmos.bank.v1beta1.MsgSend",
            from_address: sender,
            to_address: recipient,
            amount: [
              {
                denom: "uqor",
                amount: altered ? "12500001" : agreed.amountUqor,
              },
            ],
          },
        ],
        memo: "sealcheck:v1:" + seal,
        extension_options: [
          { "@type": "/qorechain.pqc.v1.PQCHybridSignature" },
        ],
      },
    },
    tx_response: {
      code: 0,
      height: "100",
      timestamp: "2026-11-17T00:00:00Z",
      txhash: hash,
      events: [
        {
          type: "pqc_hybrid_verify",
          attributes: [{ key: "status", value: "verified" }],
        },
      ],
    },
  };
  const checks = await inspectReceipt(agreed, receipt, hash, agreed.chainId);
  return { intent: agreed, hash, seal, checks };
}
