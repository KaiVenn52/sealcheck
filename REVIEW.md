# Review evidence - 2026-11-18

UI reference: design-concept.png (frontend projects). Native React/CSS implementation follows the approved visual direction: white background, readable typography, restrained borders, dedicated transaction inspector. SealCheck uses forest green/serif; InvoiceGuard uses cobalt/sans serif.

Reviewed actual Chrome pages at desktop and 390px mobile width. SealCheck stacks fields and evidence panels, InvoiceGuard stacks its inspector and keeps the wide data table in a horizontally scrollable container. Temporary viewport overrides were reset. Desktop screenshots are in qa-desktop-final.jpg. SealCheck also has a saved mobile screenshot; InvoiceGuard mobile layout was observed, but its duplicate screenshot file was removed. No wallet transaction was executed during UI QA.

Intent generation and disabled signing gate were exercised. InvoiceGuard sample-verification rejection and selection of a saved one-micro-token draft were exercised. Cross-device import logic has validation tests; an actual two-user testnet exchange remains pending.

Open quality gates: actual wallet/testnet integration; public hosting and smoke test; genuine demo video; final competition form review and receipt. Container build remains untested. No winner outcome is implied.
