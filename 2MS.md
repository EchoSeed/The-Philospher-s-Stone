# Secondary Market Specialist

> Trigger when the user needs help with mortgage secondary market operations: rate lock management, pipeline monitoring, hedging strategies, GSE loan delivery, pricing engine configuration, trade settlement, or investor compliance. Also relevant for explaining how closed loans are converted into sellable assets and how lender capital is recycled.

## Overview

This skill covers the full lifecycle of mortgage loan monetization — from daily rate sheet generation through GSE delivery and post-closing reconciliation. It equips the specialist to manage interest rate risk via hedging, track pipeline health across lock expirations and fallout risk, price loans accurately using LLPA matrices, and settle trades with investors cleanly. The unifying goal is protecting the lender's profit margin between loan commitment and investor sale while keeping capital continuously recycling into new originations.

## When to Use

- User asks how mortgage rate sheets or pricing engines are built and updated daily
- User needs to manage, monitor, or extend rate locks across an active loan pipeline
- User is implementing or explaining a hedging strategy for interest rate risk in a mortgage pipeline
- User is preparing loan packages for delivery to Fannie Mae, Freddie Mac, or correspondent investors
- User needs to reconcile trade proceeds, resolve purchase advice discrepancies, or close out investor transactions
- User asks how the secondary mortgage market works and how it connects to primary market origination
- User is generating reports on pricing performance, hedging effectiveness, or pipeline saleability

## Core Workflow

1. Pull current capital markets data and update the pricing engine with today's par rate and market-driven adjustments — publish the daily rate sheet before loan officers begin quoting borrowers.
2. Monitor the active pipeline: identify locks expiring within 10 days, flag fallout risk, assess saleability against current investor guidelines, and escalate URGENT expirations for immediate action or extension decisions.
3. Evaluate hedge position against current pipeline composition — recalibrate notional hedge amounts if pipeline size, fallout assumptions, or rate environment have shifted materially since last hedge reset.
4. Package conforming loans meeting GSE eligibility criteria into delivery pools, verify all documentation and underwriting conditions are satisfied, and submit to Fannie Mae or Freddie Mac (or correspondent investor) per trade commitment.
5. Receive purchase advice from investor, reconcile proceeds against committed trade price, resolve any price exceptions or suspense conditions, and post final entries to close each transaction on the books.
6. Generate end-of-day reports: pipeline aging, lock expiration summary, hedge P&L scenario table, and post-closing reconciliation status — distribute to capital markets leadership and operations teams.

## Key Patterns

### Rate Sheet as Upstream Signal
The daily rate sheet is not just a pricing output — it is the downstream expression of secondary market appetite flowing upstream into origination. When investor guidelines tighten or MBS spreads widen, those signals must be reflected in the rate sheet immediately, or the lender will commit to loans it cannot sell profitably. Always trace rate sheet changes back to their market cause before publishing.

### Fallout Asymmetry in Lock Management
Borrower fallout is inversely correlated with rate direction: fallout spikes when rates drop (borrowers chase better deals elsewhere) and collapses when rates rise (borrowers cling to their locked rate). Model pipeline size with this asymmetry in mind — a falling-rate environment will shrink your deliverable pipeline faster than any operational issue, and a rising-rate environment will compress it with extension requests instead.

### Hedge Recalibration Cadence
A static hedge decays in accuracy almost immediately due to mortgage negative convexity — the duration of the underlying loans shifts with rate moves. Treat the hedge ratio as a daily variable, not a set-and-forget parameter. When rates fall sharply, prepayment acceleration shortens effective duration; when rates rise, extension risk lengthens it. Both scenarios require hedge adjustment to maintain coverage.

### LLPA Stacking Awareness
Loan-level price adjustments from multiple risk attributes (credit score, LTV, lock period, loan purpose, property type) stack multiplicatively in effective rate impact. A loan with a marginal credit score AND high LTV AND a 45-day lock can price itself out of competitiveness before a loan officer realizes it. Always surface the full LLPA composition to originators so they can counsel borrowers on tradeoffs.

### GSE Delivery as Capital Recycling
GSE delivery is not just a transaction — it is the mechanism that converts illiquid loan commitments back into lendable cash. Delays in delivery (due to documentation exceptions, guideline mismatches, or suspended conditions) directly constrain the lender's ability to fund new originations. Treat delivery pipeline clearance as a liquidity management function, not just an administrative one.

### Purchase Advice Discrepancy Triage
When investor purchase advice proceeds differ from committed trade price, triage by cause before escalating: fee calculation differences are usually resolvable with documentation; rate or note discrepancies may require investor negotiation; eligibility exceptions may result in loan repurchase demands. Categorize exceptions by type on receipt to route them to the right resolution path without delay.

## Edge Cases & Warnings

- ⚠️ Lock extensions in a rapidly rising-rate environment can create a compounding cost spiral — each extension adds expense while the investor delivery window may also be shifting. Establish a maximum extension cost threshold per loan beyond which fallout (letting the lock expire) is preferable to continued extension.
- ⚠️ Negative convexity means your hedge will underperform in large, fast rate moves in either direction. Do not assume a hedge calibrated for ±25bps will hold in a ±100bps shock — run scenario tables across wide shock ranges before finalizing hedge notional.
- ⚠️ GSE guideline changes (new LLPAs, eligibility updates, documentation requirements) can render in-pipeline loans unsaleable after lock — monitor agency announcements daily and assess pipeline exposure to any announced changes before their effective date.
- ⚠️ Fallout on hedged positions creates 'over-hedging' exposure: if borrowers fall out faster than expected, the lender still holds the short MBS position without a corresponding loan asset to offset. Build fallout rate assumptions into hedge sizing and update them when rate direction shifts.
- ⚠️ Post-closing reconciliation exceptions that age past investor cure windows (typically 30–90 days depending on investor) can convert from price adjustments into repurchase demands. Track exception age aggressively and escalate stale items before they breach cure deadlines.
- ⚠️ Correspondent investor delivery requires strict adherence to each investor's unique guideline set — unlike GSEs, correspondents may have overlapping but non-identical requirements. Maintain a per-investor eligibility matrix and validate loans against the correct set before committing a delivery trade.

## Quick Reference

- Par rate = base market rate before any LLPAs; offered rate = par rate + all applicable LLPAs converted to rate equivalent
- LLPA-to-rate conversion rule of thumb: 4 points of LLPA ≈ 1% of rate (verify against current investor grid)
- 45-day lock typically carries a 0.125% rate premium over a 30-day lock; 60-day adds further — confirm with current pricing engine
- DV01 (dollar value of 1 basis point) = notional × duration × 0.0001; use to size hedge notional against pipeline exposure
- Standard mortgage pipeline hedge ratio: 75–90% of pipeline notional, adjusted downward for expected fallout
- Lock expiration alert thresholds: >10 days = OK, 6–10 days = WARNING, 1–5 days = URGENT, <0 days = EXPIRED
- Extension cost benchmark: ~0.07 bps per day; a 10-day extension on a $400K loan ≈ $280 in cost
- GSE conforming loan limit: verify current FHFA limit annually — loans above limit require jumbo or non-QM investor delivery
- Weighted Average Coupon (WAC) = sum of (each loan rate × balance) / total pool balance; MBS coupon = WAC minus servicing spread (typically 25–50bps)
- Purchase advice discrepancy types: fee calc (resolvable), rate/note mismatch (negotiable), eligibility exception (repurchase risk) — triage on receipt
- Pipeline saleability check: verify current lock status, LTV within investor max, credit score above floor, DTI within guideline, and all PTD conditions cleared
- Post-closing reconciliation close-out sequence: receive purchase advice → compare to trade ticket → identify exceptions → cure or escalate → post final proceeds → archive loan file

---

## Resources

### 📎 secondary_market_concepts.md
_Foundational reference covering all seven core concepts of secondary market operations with technical definitions, plain-language explanations, and strategic insights_

# Secondary Market Operations — Core Concepts Reference

## 1. Secondary Mortgage Market

**Technical:** A financial marketplace where existing mortgage loans and mortgage-backed securities (MBS) are bought and sold among institutional investors, GSEs, and other entities — distinct from the primary market where loans are originated.

**Plain language:** After a bank gives someone a home loan, it doesn't always keep that loan. Instead, it sells it to investors on a kind of 'used loan marketplace' — this is the secondary market.

**Strategic insight:** The secondary market doesn't just provide liquidity — it fundamentally determines who can get a mortgage and on what terms. Because lenders underwrite to the standards of whoever will buy the loan, the secondary market's appetite and guidelines flow upstream and shape origination decisions. A tightening in secondary market appetite can effectively lock entire borrower segments out of homeownership before any regulator formally acts. The tail wags the dog.

**Analogy:** The secondary mortgage market is like a restaurant supply chain. The primary market is the farm — it grows the product (loans). But the farm can't afford to wait months to get paid per harvest; it needs cash now to plant the next crop. So it sells its harvest wholesale to a distributor (the secondary market), who repackages it and sells portions to grocery chains and restaurants (investors). The farm keeps farming, the distributor keeps flowing product, and consumers (investors) get a steady, standardized supply.

---

## 2. Rate Lock Management

**Technical:** The process of committing to a specific interest rate and terms for a mortgage loan for a defined period, requiring monitoring of lock expirations, extensions, and fallout to manage pipeline risk and investor delivery obligations.

**Plain language:** When a borrower 'locks in' their mortgage rate, the specialist has to track that promise carefully — like a countdown clock — to make sure the loan closes and is sold before the locked rate expires.

**Strategic insight:** Rate lock management is a behavioral economics problem disguised as an operational one. Fallout is highly correlated with rate movements: when rates drop after a borrower locks, fallout surges because borrowers go find a better deal. When rates rise, fallout plummets because the lock is suddenly valuable. This creates a natural asymmetry — extensions cluster in rising-rate environments, fallout clusters in falling ones. Pipeline modeling must account for rate direction, not just lock calendar.

**Analogy:** A rate lock is like a coupon with an expiration date at a store running low on inventory. The store (lender) has promised to honor that price, but if you don't redeem it before it expires, the deal is gone. The specialist is the store manager watching every coupon in circulation, alerting staff when one is about to expire, and deciding whether printing a 'coupon extension' is worth the cost.

**Alert thresholds:**
- >10 days remaining: OK
- 6–10 days remaining: WARNING
- 1–5 days remaining: URGENT
- Expired: EXPIRED — escalate immediately

---

## 3. Hedging

**Technical:** A risk mitigation strategy using financial instruments (e.g., MBS forward commitments, options, or Treasury futures) to offset interest rate exposure in a mortgage pipeline, protecting profitability against market fluctuations between lock and sale.

**Plain language:** Since mortgage rates change constantly, the specialist places offsetting financial 'bets' to protect the company from losing money if rates move in the wrong direction before loans are sold.

**Strategic insight:** The most counterintuitive aspect of mortgage hedging is that it must account for borrower optionality — and that optionality works against the lender in both directions. When rates fall, prepayments accelerate (negative convexity), shortening duration just when the hedge assumes longer duration. When rates rise, loans extend. A static hedge decays in accuracy almost immediately. Effective hedging requires continuous recalibration — it is less a one-time bet and more like steering a ship whose rudder changes size with the weather.

**Analogy:** Hedging a mortgage pipeline is like being a fruit vendor who promises customers today's apple price for delivery next week, but hasn't bought the apples yet. If apple prices spike, you lose money. So you pre-buy apple futures — if prices rise, your futures gain value and offset your loss. You're not trying to profit twice; you're making sure the price swing doesn't determine whether you stay in business.

**Key formula:**
- DV01 = Notional × Duration × 0.0001
- Pipeline P&L on rate shock = −DV01 × shock_in_bps
- Hedge gain = DV01_hedge × shock_in_bps (short position)
- Standard hedge ratio: 75–90% of pipeline notional

---

## 4. Pricing Engine & Rate Sheet

**Technical:** A rules-based algorithmic system that calculates loan-level pricing adjustments (LLPAs) based on risk attributes, investor guidelines, and current market conditions, outputting daily rate sheets that define available mortgage products and their costs.

**Plain language:** A daily pricing tool — like a menu — that tells loan officers exactly what interest rates and fees to offer customers, updated based on what's happening in financial markets that day.

**Strategic insight:** The rate sheet is the downstream expression of secondary market appetite made visible to originators. Every basis point of spread widening in MBS markets, every tightening of GSE guidelines, flows through the pricing engine onto the rate sheet. Lenders who lag in updating their pricing engine absorb losses silently — they lock loans at rates they cannot sell at a profit.

**Analogy:** A pricing engine is like an airline seat pricing algorithm made visible. The base fare (par rate) is what the market charges for money today. Every risk characteristic — low credit score, high LTV, longer lock period — is like a checked bag, a middle seat, or a last-minute booking fee. The algorithm stacks these costs transparently so the loan officer knows exactly what the borrower's risk profile actually costs to serve.

**LLPA stacking example (simplified Fannie Mae-style):**

| Credit Score | LLPA (%) | LTV Band | LLPA (%) |
|---|---|---|---|
| 760–850 | 0.000 | 0–60% | 0.000 |
| 740–759 | 0.250 | 60–70% | 0.250 |
| 720–739 | 0.500 | 70–75% | 0.500 |
| 700–719 | 1.000 | 75–80% | 0.750 |
| 680–699 | 1.500 | 80–85% | 1.500 |
| 660–679 | 2.500 | 85–97% | 2.750 |

Conversion: ~4 points of LLPA ≈ 1% rate increase. Lock period add-on: +0.125% for 45-day vs. 30-day lock.

---

## 5. GSE Delivery

**Technical:** The process of selling conforming mortgage loans to Fannie Mae or Freddie Mac by packaging and delivering loan files that meet specific underwriting, documentation, and eligibility guidelines in exchange for cash or MBS.

**Plain language:** Selling bundles of qualifying home loans to large government-backed companies like Fannie Mae, which then pool them into investment products — a primary way lenders free up cash to make more loans.

**Strategic insight:** GSE delivery is the mechanism that converts illiquid loan commitments back into lendable cash. Delays in delivery directly constrain new origination capacity. Treat delivery pipeline clearance as a liquidity management function. Also note: GSE delivery is the central execution node connecting pricing, investor relations, and settlement — a bottleneck here cascades across the entire secondary market operation.

**Key pool metrics:**
- Weighted Average Coupon (WAC) = Σ(loan_rate × balance) / total_balance
- MBS coupon = WAC − servicing spread (typically 25–50bps retained by servicer)
- Proceeds at par = pool balance (simplified; actual pricing reflects MBS market price)

---

## 6. Pipeline Management

**Technical:** Systematic monitoring and administration of a lender's aggregate portfolio of in-process mortgage loans, tracking lock status, fallout risk, saleability, and compliance to optimize loan delivery and minimize rate lock extension costs.

**Plain language:** Keeping close watch over all loans currently in progress — like tracking packages on a conveyor belt — to make sure none fall through the cracks, expire, or fail to meet the rules before they're sold.

**Key saleability checklist:**
- Lock status: active, not expired
- LTV: within investor maximum
- Credit score: at or above investor floor
- DTI: within guideline limit
- All prior-to-document (PTD) conditions cleared
- Loan amount: at or below conforming limit (for GSE delivery)
- Property type: eligible per investor guidelines

---

## 7. Trade Settlement & Post-Closing Reconciliation

**Technical:** The operational process of finalizing the transfer of mortgage loan ownership to investors, resolving purchase advice discrepancies, reconciling proceeds against committed trade prices, and clearing any suspense conditions or exceptions.

**Plain language:** The final accounting step after a loan is sold — making sure the company actually received the right amount of money, fixing any mismatches, and closing out the books on each transaction cleanly.

**Exception triage framework:**
- Fee calculation difference → resolvable with documentation; correct and resubmit
- Rate or note discrepancy → requires investor negotiation; escalate to capital markets
- Eligibility exception → potential repurchase demand; escalate to legal/compliance immediately

**Aging risk:** Exceptions that age past investor cure windows (typically 30–90 days) convert from price adjustments into repurchase demands. Track exception age daily and escalate stale items before breach of cure deadline.

**Close-out sequence:**
1. Receive purchase advice from investor
2. Compare to committed trade ticket
3. Identify and categorize exceptions
4. Cure or escalate by exception type
5. Post final proceeds to ledger
6. Archive loan file and mark transaction closed

### 📎 workflow_checklists.md
_Operational checklists for daily rate sheet publication, pipeline review, hedge recalibration, GSE delivery, and trade reconciliation_

# Secondary Market Specialist — Operational Checklists

## Daily Rate Sheet Publication Checklist

1. Pull current MBS market pricing and Treasury benchmark rates (pre-market open)
2. Calculate today's par rate from capital markets desk or pricing vendor feed
3. Apply current LLPA matrix (verify no GSE guideline changes since last update)
4. Apply lock period adjustments (30-day par, 45-day +0.125%, 60-day per current grid)
5. Apply any product-specific overlays (jumbo, FHA, VA, USDA if applicable)
6. Review output for anomalies — any rate outside expected range triggers manual review
7. Obtain capital markets leadership sign-off before distribution
8. Publish to loan officers and LOS system before 9:00 AM local time
9. Log publication timestamp and par rate benchmark for end-of-day reporting
10. Monitor market for intraday repricing triggers (MBS price move >25bps typically triggers reprice)

---

## Daily Pipeline Review Checklist

1. Export full pipeline from LOS with lock status, expiration dates, and loan amounts
2. Flag all locks expiring within 10 days — sort by days remaining ascending
3. Escalate URGENT (1–5 days) to origination team for immediate close or extension decision
4. Review EXPIRED locks — determine if loan is still viable; if so, re-lock at current market
5. Assess fallout risk: compare current market rates to locked rates; rising-rate = low fallout risk, falling-rate = high fallout risk
6. Check saleability of near-closing loans against current investor guidelines
7. Identify any loans with pending PTD conditions that may delay delivery
8. Update pipeline report with status changes and distribute to operations and capital markets teams
9. Confirm hedge position aligns with updated pipeline size and composition
10. Document any loans removed from pipeline (fallout, denial, withdrawal) for reporting

---

## Hedge Recalibration Checklist

1. Pull current pipeline notional balance (locked loans expected to close)
2. Adjust for current fallout rate assumption (update if rate environment has shifted direction)
3. Calculate net pipeline notional requiring hedge coverage
4. Compare to current hedge notional — identify over-hedge or under-hedge position
5. Run DV01 calculation: Notional × Duration × 0.0001
6. Run scenario P&L table across rate shocks: −100, −50, −25, 0, +25, +50, +100 bps
7. Identify scenarios where net P&L falls outside acceptable loss threshold
8. Execute hedge adjustments (buy or sell MBS forwards, adjust notional) to rebalance
9. Document hedge action, rationale, and resulting hedge ratio
10. Report hedge effectiveness metric to capital markets leadership

---

## GSE Loan Delivery Checklist

1. Identify loans ready for delivery: closed, funded, all PTD and PTF conditions cleared
2. Confirm loan eligibility: conforming balance, LTV within limit, credit score at floor, DTI compliant
3. Verify documentation completeness: note, deed of trust, title, appraisal, compliance disclosures
4. Match loans to open trade commitments (best execution: price vs. commitment terms)
5. Build delivery pool in GSE portal (Fannie Mae Selling System / Freddie Mac Loan Advisor)
6. Submit pool for purchase review and receive pool number
7. Monitor for any GSE suspense conditions or exception notices
8. Cure exceptions within investor timeline (document all cure actions)
9. Confirm purchase advice received and record committed settlement date
10. Proceed to trade settlement and reconciliation workflow

---

## Trade Settlement & Reconciliation Checklist

1. Receive purchase advice from GSE or correspondent investor
2. Compare purchase advice proceeds to committed trade price — document any variance
3. Categorize variances by type:
   - Fee/escrow calculation difference (resolvable)
   - Rate or note discrepancy (negotiable)
   - Eligibility exception (repurchase risk — escalate)
4. Initiate cure for resolvable items: submit corrected documentation to investor
5. Escalate non-resolvable items to capital markets and compliance leadership
6. Confirm wire receipt of proceeds from investor
7. Reconcile wire amount against purchase advice net proceeds
8. Post final entries to general ledger: debit cash, credit mortgage pipeline asset
9. Flag any aged exceptions (>30 days) for priority escalation before cure window closes
10. Archive loan file with all settlement documentation and mark transaction closed in system
11. Include transaction in end-of-day post-closing reconciliation report

### 📎 risk_and_compliance_guide.md
_Risk management frameworks, investor guideline compliance principles, and regulatory context for secondary market operations_

# Secondary Market Risk & Compliance Guide

## Interest Rate Risk Framework

### Sources of Rate Risk in the Mortgage Pipeline

The mortgage pipeline carries interest rate risk from two primary sources that must be managed simultaneously:

**Commitment risk** arises the moment a borrower is quoted a rate. The lender has made a promise at a fixed price but has not yet sold the loan. Any adverse rate movement between commitment and sale erodes margin.

**Fallout risk** creates the opposite exposure: if rates improve and the borrower refinances elsewhere, the lender's hedge position (typically a short MBS commitment) may be left without a corresponding loan asset to offset it — creating an over-hedged, long-market exposure.

### Negative Convexity and Its Operational Implications

Mortgage assets exhibit negative convexity: their duration shortens when rates fall (prepayments accelerate) and lengthens when rates rise (fewer refinances). This means:

- A hedge calibrated at current duration will be too small when rates fall and too large when rates rise, in both cases in an adverse direction for the lender.
- Hedge effectiveness degrades continuously with time and rate movement.
- Recalibration must occur at minimum daily; more frequently in volatile markets.
- Scenario analysis across wide rate shocks (±100bps) is essential — do not rely only on small shock scenarios.

### Acceptable Loss Thresholds

Capital markets leadership should define and document:
- Maximum tolerable P&L loss per 25bps rate shock (absolute dollars)
- Maximum hedge ratio deviation from target before mandatory rebalancing
- Maximum extension cost per loan before fallout is preferred over extension
- Maximum aged exception balance before escalation protocol triggers

---

## Investor Guideline Compliance

### GSE Conforming Standards (Fannie Mae / Freddie Mac)

Loans delivered to GSEs must meet eligibility requirements across multiple dimensions. Key areas requiring pre-delivery verification:

**Loan amount:** Must not exceed current FHFA conforming loan limit (verify annually; high-cost area limits differ from standard limits).

**Credit:** Minimum credit score per product type and LTV tier. Score used is the middle of three bureau scores for the primary borrower (or lowest middle score for co-borrower scenarios, per GSE guidelines).

**LTV/CLTV:** Maximum varies by occupancy type, number of units, and product. Investment property and multi-unit properties carry lower LTV maximums than primary residence single-family.

**DTI:** Maximum 45–50% depending on product and AUS finding. Manual underwrite limits are stricter.

**Documentation:** Full documentation required unless AUS specifies reduced documentation eligibility.

**Property eligibility:** Condominiums require project approval. Manufactured housing has specific title and site requirements. Rural properties require appraisal comment on marketability.

### Guideline Change Monitoring Protocol

GSE guideline changes are announced via Selling Guide updates, Lender Letters (Fannie Mae), or Single-Family Seller/Servicer Guide Bulletins (Freddie Mac). The secondary market specialist should:

1. Subscribe to GSE announcement feeds and review all bulletins on publication date.
2. Assess pipeline exposure to any announced changes before effective date.
3. Flag loans in pipeline that may become ineligible under new guidelines — determine if grandfather provisions apply.
4. Communicate guideline changes to origination and underwriting teams with effective date and impact summary.
5. Update internal eligibility matrices and pricing engine parameters on effective date.

### Correspondent Investor Guidelines

Correspondent investors maintain their own overlays on top of agency guidelines, which may be more restrictive. Common correspondent overlays include:

- Higher minimum credit score floors (e.g., 640 vs. GSE minimum of 620)
- Lower maximum DTI (e.g., 43% vs. GSE maximum of 50%)
- Property type restrictions (e.g., no condotels, no rural properties exceeding acreage limit)
- Geographic restrictions (e.g., declining market designations requiring additional LTV reduction)
- Seasoning requirements on prior derogatory events

Maintain a per-investor eligibility matrix and validate each loan against the correct investor's requirements before committing a delivery trade. Do not assume GSE eligibility equals any correspondent's eligibility.

---

## Regulatory Context

### Truth in Lending Act (TILA) / Regulation Z

Rate lock disclosures and fee tolerances are governed by TILA. Material increases in fees between Loan Estimate and Closing Disclosure require re-disclosure and a three-business-day waiting period. Secondary market specialists must ensure that pricing changes after lock are handled within tolerance rules — not passed to borrowers in ways that trigger re-disclosure violations.

### RESPA / Regulation X

Mortgage servicing transfer notifications and escrow account disclosures are required when loan ownership transfers to investors. Coordinate with servicing and compliance teams on the timing and content of required borrower notices associated with GSE delivery.

### Fair Lending

Pricing must be applied consistently and documented by objective criteria (credit score, LTV, loan amount, lock period). Any manual pricing exception must be documented with business justification, applied without regard to protected class characteristics, and logged for fair lending monitoring. Secondary market pricing practices are subject to HMDA analysis and regulatory examination.

### QM / ATR

Loans delivered to GSEs generally receive GSE QM safe harbor status. Confirm QM status for all loans prior to delivery — non-QM loans require different investor channels and carry higher repurchase risk if ATR documentation is deficient.

---

## Repurchase Risk Management

Repurchase demands arise when investors determine that a delivered loan did not meet the representations and warranties made at delivery. Primary causes:

- Underwriting defects (income miscalculation, undisclosed liabilities, inflated appraisal)
- Documentation defects (missing signatures, expired documents, title issues)
- Fraud (identity, income, property, or occupancy misrepresentation)
- Early payment default (EPD) — loan defaults within first 12 payments, triggering investor review

**Mitigation practices:**
- Pre-delivery quality control review of all loans above defined balance threshold
- Vendor management controls on third-party appraisers and title agents
- Fraud detection tools integrated into the LOS prior to lock confirmation
- EPD monitoring report — flag any delivered loan that misses first or second payment for immediate review
- Maintain repurchase reserve in accordance with accounting standards and investor demand history

---
_Generated by Philosopher's Stone v4 — EchoSeed_
Philosopher's Stone v4 × Skill Forge × EchoSeed — AI Agent Markdown Forge
