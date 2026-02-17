# Secondary Market Loan Operations

> Activate this skill when managing mortgage loan sales to investors, establishing daily pricing strategies, monitoring rate-locked pipelines, executing hedging strategies to mitigate interest rate risk, ensuring investor guideline compliance, or reconciling post-closing settlements. This skill synthesizes market intelligence, regulatory adherence, and transaction execution to maximize profitability while protecting against volatility in the post-origination lifecycle of residential mortgage loans.

## Overview

Secondary Market Loan Operations orchestrates the complete post-origination journey of mortgage loans from rate lock commitment through final investor delivery. This skill balances three competing imperatives: maximizing sale profitability through strategic pricing, mitigating interest rate exposure through derivative hedging, and ensuring regulatory compliance across government-sponsored enterprise (GSE) and correspondent lending channels. The specialist serves as the critical liaison between production teams originating loans and external investors purchasing them, managing real-time pipeline risk while maintaining saleability standards that satisfy investor underwriting guidelines and federal regulations.

## When to Use

- Daily creation and adjustment of mortgage rate sheets based on market movements and investor pricing matrices
- Monitoring loan pipeline for rate lock expirations, fallout risk, and optimal delivery timing
- Executing hedging strategies using mortgage-backed securities (MBS), Treasury futures, or interest rate swaps
- Negotiating and settling loan sale transactions with GSEs (Fannie Mae, Freddie Mac) or correspondent aggregators
- Validating loan packages against investor guidelines before commitment and delivery
- Conducting post-closing reconciliation to verify pricing adjustments, servicing release premiums, and investor remittances
- Analyzing macroeconomic trends (Federal Reserve policy, Treasury yields) to inform pricing strategy
- Responding to rate lock extension requests or float-down scenarios within policy parameters

## Core Workflow

1. **Market Analysis & Rate Sheet Publication**: Evaluate overnight market conditions (MBS pricing, Treasury yields, economic indicators) and update pricing engine parameters to generate competitive rate sheets reflecting current investor appetites and target profit margins
2. **Pipeline Intake & Lock Management**: Receive rate lock requests from loan officers, validate against policies (lock periods, extension protocols), commit locks in system, and update hedging position to reflect new mandatory delivery obligations
3. **Real-Time Pipeline Monitoring**: Track all locked loans through origination workflow, flag expiration risks, assess fallout probability based on historical data, and coordinate with production on closing timelines to prevent lock violations
4. **Hedging Execution & Adjustment**: Place derivative trades (forward MBS sales, Treasury short positions) proportional to pipeline volume, adjust hedge ratios as locks fall out or close, and monitor mark-to-market performance against protected loan value
5. **Investor Delivery Preparation**: Pre-screen closed loans for investor guideline compliance, organize loan packages by investor and product type, submit trade commitments specifying pricing and settlement dates, and prepare required documentation (warranties, certifications)
6. **Trade Settlement & Reconciliation**: Deliver loan files and collateral documentation, confirm funds transfer from investor, reconcile pricing adjustments and service release premiums against initial commitments, and resolve any purchase discrepancies
7. **Performance Reporting**: Generate management reports on pricing margin realization, hedging effectiveness (gain/loss attribution), pipeline conversion rates, and investor delivery performance to inform strategic adjustments

## Key Patterns

### Dynamic Rate Sheet Calibration

Systematically adjust pricing based on market volatility, competitive positioning, and capacity constraints. Rate sheets must balance attractiveness to borrowers against profitability requirements while maintaining investor saleability.

```python
from dataclasses import dataclass
from typing import Dict, List
from decimal import Decimal
from datetime import datetime

@dataclass
class MarketInput:
    """Current market conditions driving pricing"""
    mbs_current_coupon: Decimal  # FNMA 30yr current coupon price
    treasury_10yr_yield: Decimal
    volatility_index: Decimal  # Measure of rate uncertainty
    spread_to_treasuries: int  # Basis points
    timestamp: datetime

@dataclass
class InvestorPricing:
    """Investor's purchase price for specific loan profile"""
    investor_name: str
    base_price: Decimal  # Par = 100.000
    rate_adjustment: Decimal  # Price change per 0.125% rate
    lock_period_adjustment: Dict[int, Decimal]  # Days -> price hit

class RateSheetEngine:
    """Generate daily mortgage pricing across rate/fee matrix"""
    
    def __init__(self, target_margin_bps: int = 150):
        self.target_margin_bps = target_margin_bps
        self.base_servicing_value = Decimal("1.25")  # 125 bps value
        
    def calculate_borrower_rate(
        self,
        market: MarketInput,
        investor: InvestorPricing,
        lock_days: int = 30,
        credit_score: int = 740,
        ltv: int = 80
    ) -> Dict[str, Decimal]:
        """
        Derive borrower rate from investor pricing plus margin target
        
        Returns dict with rates and corresponding lender credits/costs
        """
        # Start with investor's base price for market rate
        market_rate = Decimal("6.50")  # Example starting point
        investor_price = investor.base_price
        
        # Apply lock period adjustment
        lock_adjustment = investor.lock_period_adjustment.get(lock_days, Decimal("0"))
        investor_price += lock_adjustment
        
        # Apply LLPA (loan-level price adjustments) for risk factors
        llpa_adjustment = self._calculate_llpa(credit_score, ltv)
        investor_price += llpa_adjustment
        
        # Calculate margin-adjusted pricing
        target_margin_price = Decimal(self.target_margin_bps) / Decimal("100")
        adjusted_price = investor_price - target_margin_price
        
        # Generate rate/price matrix
        rate_sheet = {}
        for rate_increment in range(-4, 5):  # -0.50% to +0.50%
            rate = market_rate + (Decimal(rate_increment) * Decimal("0.125"))
            
            # Price moves inverse to rate
            price_change = Decimal(rate_increment) * investor.rate_adjustment
            final_price = adjusted_price + price_change
            
            # Convert price to borrower cost/credit (par = 100.000)
            points = (Decimal("100") - final_price)
            
            rate_sheet[float(rate)] = {
                "rate": rate,
                "points": points,
                "investor_price": final_price,
                "lender_margin_bps": self.target_margin_bps
            }
        
        return rate_sheet
    
    def _calculate_llpa(self, credit_score: int, ltv: int) -> Decimal:
        """Loan-level price adjustments for risk"""
        adjustment = Decimal("0")
        
        # Credit score impacts
        if credit_score < 680:
            adjustment -= Decimal("1.50")
        elif credit_score < 720:
            adjustment -= Decimal("0.50")
        
        # LTV impacts
        if ltv > 80:
            adjustment -= Decimal("0.75")
        
        return adjustment

# Example usage
market = MarketInput(
    mbs_current_coupon=Decimal("101.25"),
    treasury_10yr_yield=Decimal("4.25"),
    volatility_index=Decimal("0.12"),
    spread_to_treasuries=175,
    timestamp=datetime.now()
)

investor = InvestorPricing(
    investor_name="FNMA",
    base_price=Decimal("100.500"),
    rate_adjustment=Decimal("0.375"),  # Per 0.125% rate change
    lock_period_adjustment={30: Decimal("0"), 45: Decimal("-0.125"), 60: Decimal("-0.250")}
)

engine = RateSheetEngine(target_margin_bps=150)
rate_options = engine.calculate_borrower_rate(market, investor, lock_days=30, credit_score=740, ltv=80)

for rate, terms in sorted(rate_options.items()):
    print(f"Rate: {rate:.3f}% | Points: {terms['points']:.3f} | Investor Price: {terms['investor_price']:.3f}")
```

### Pipeline Risk Monitoring & Fallout Prediction

Track all rate-locked loans with time-to-expiration visibility and statistical fallout modeling to optimize hedge ratios and prevent lock violations.

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional
import statistics

@dataclass
class RateLock:
    """Individual rate lock commitment"""
    loan_id: str
    borrower_name: str
    lock_date: datetime
    expiration_date: datetime
    locked_rate: Decimal
    loan_amount: Decimal
    lock_period_days: int
    current_rate: Decimal  # Market rate at time of check
    loan_stage: str  # "Processing", "Underwriting", "Clear to Close", etc.
    
    @property
    def days_to_expiration(self) -> int:
        """Days remaining until rate lock expires"""
        return (self.expiration_date - datetime.now()).days
    
    @property
    def in_the_money_bps(self) -> int:
        """How many basis points borrower saves vs current market"""
        return int((self.current_rate - self.locked_rate) * 10000)
    
    @property
    def fallout_risk_score(self) -> float:
        """
        Predict probability of loan falling out (0-1 scale)
        Factors: time pressure, rate incentive, stage completion
        """
        # Time pressure (closer to expiration = lower fallout)
        if self.days_to_expiration < 7:
            time_factor = 0.2
        elif self.days_to_expiration < 15:
            time_factor = 0.5
        else:
            time_factor = 0.8
        
        # Rate incentive (better rate locked = lower fallout)
        if self.in_the_money_bps > 50:
            rate_factor = 0.1
        elif self.in_the_money_bps > 0:
            rate_factor = 0.3
        else:
            rate_factor = 0.7  # Out of money, high fallout risk
        
        # Stage completion (further along = lower fallout)
        stage_factors = {
            "Processing": 0.6,
            "Underwriting": 0.5,
            "Conditionally Approved": 0.3,
            "Clear to Close": 0.1
        }
        stage_factor = stage_factors.get(self.loan_stage, 0.5)
        
        # Weighted average
        return (time_factor * 0.3 + rate_factor * 0.4 + stage_factor * 0.3)

class PipelineMonitor:
    """Real-time tracking and risk analysis of rate-locked pipeline"""
    
    def __init__(self, locks: List[RateLock]):
        self.locks = locks
    
    def expiring_soon(self, days_threshold: int = 7) -> List[RateLock]:
        """Identify locks at risk of expiration"""
        return [
            lock for lock in self.locks 
            if 0 < lock.days_to_expiration <= days_threshold
        ]
    
    def fallout_exposure(self, fallout_threshold: float = 0.5) -> Dict[str, any]:
        """
        Calculate expected fallout and associated hedge adjustment
        
        Returns total pipeline value at risk of fallout
        """
        high_risk_locks = [
            lock for lock in self.locks 
            if lock.fallout_risk_score >= fallout_threshold
        ]
        
        total_at_risk = sum(lock.loan_amount for lock in high_risk_locks)
        weighted_fallout_value = sum(
            lock.loan_amount * lock.fallout_risk_score 
            for lock in high_risk_locks
        )
        
        return {
            "high_risk_count": len(high_risk_locks),
            "total_amount_at_risk": total_at_risk,
            "expected_fallout_value": weighted_fallout_value,
            "recommended_hedge_reduction": weighted_fallout_value,
            "high_risk_loans": high_risk_locks
        }
    
    def pipeline_summary(self) -> Dict[str, any]:
        """Generate executive summary of pipeline status"""
        total_locks = len(self.locks)
        total_volume = sum(lock.loan_amount for lock in self.locks)
        
        avg_days_to_exp = statistics.mean(
            lock.days_to_expiration for lock in self.locks
        )
        
        in_the_money_count = sum(
            1 for lock in self.locks if lock.in_the_money_bps > 0
        )
        
        avg_fallout_risk = statistics.mean(
            lock.fallout_risk_score for lock in self.locks
        )
        
        return {
            "total_locks": total_locks,
            "total_volume": total_volume,
            "avg_days_to_expiration": round(avg_days_to_exp, 1),
            "in_the_money_locks": in_the_money_count,
            "in_the_money_pct": round(in_the_money_count / total_locks * 100, 1),
            "avg_fallout_risk": round(avg_fallout_risk, 3),
            "expiring_7_days": len(self.expiring_soon(7)),
            "expiring_15_days": len(self.expiring_soon(15))
        }

# Example usage
pipeline = [
    RateLock(
        loan_id="LN12345",
        borrower_name="Smith, John",
        lock_date=datetime.now() - timedelta(days=25),
        expiration_date=datetime.now() + timedelta(days=5),
        locked_rate=Decimal("6.50"),
        loan_amount=Decimal("450000"),
        lock_period_days=30,
        current_rate=Decimal("6.75"),
        loan_stage="Clear to Close"
    ),
    RateLock(
        loan_id="LN12346",
        borrower_name="Jones, Mary",
        lock_date=datetime.now() - timedelta(days=10),
        expiration_date=datetime.now() + timedelta(days=20),
        locked_rate=Decimal("6.625"),
        loan_amount=Decimal("325000"),
        lock_period_days=30,
        current_rate=Decimal("6.50"),
        loan_stage="Underwriting"
    )
]

monitor = PipelineMonitor(pipeline)
summary = monitor.pipeline_summary()
fallout = monitor.fallout_exposure(fallout_threshold=0.4)

print(f"Pipeline Volume: ${summary['total_volume']:,.0f}")
print(f"Avg Days to Expiration: {summary['avg_days_to_expiration']}")
print(f"Expected Fallout: ${fallout['expected_fallout_value']:,.0f}")
```

### Hedging Strategy Execution

Protect pipeline value against interest rate movements using derivative instruments, dynamically adjusting hedge ratios based on pull-through expectations.

```python
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional
from decimal import Decimal

class HedgeInstrument(Enum):
    """Types of derivative instruments for hedging"""
    MBS_TBA = "Mortgage-Backed Security To-Be-Announced"
    TREASURY_FUTURE = "10-Year Treasury Note Future"
    INTEREST_RATE_SWAP = "Interest Rate Swap"

@dataclass
class HedgePosition:
    """Individual hedge trade"""
    instrument: HedgeInstrument
    notional_amount: Decimal
    entry_price: Decimal
    current_price: Decimal
    trade_date: datetime
    settlement_date: datetime
    
    @property
    def unrealized_pnl(self) -> Decimal:
        """Mark-to-market profit/loss"""
        return (self.current_price - self.entry_price) * self.notional_amount / Decimal("100")

class HedgingEngine:
    """Manage derivative hedging to offset pipeline interest rate risk"""
    
    def __init__(self, pipeline_volume: Decimal, pull_through_rate: float = 0.85):
        self.pipeline_volume = pipeline_volume
        self.pull_through_rate = pull_through_rate
        self.positions: List[HedgePosition] = []
        
    @property
    def effective_exposure(self) -> Decimal:
        """Pipeline volume adjusted for expected fallout"""
        return self.pipeline_volume * Decimal(str(self.pull_through_rate))
    
    @property
    def total_hedge_notional(self) -> Decimal:
        """Sum of all hedge position notional values"""
        return sum(pos.notional_amount for pos in self.positions)
    
    @property
    def hedge_ratio(self) -> float:
        """Percentage of effective exposure that is hedged"""
        if self.effective_exposure == 0:
            return 0.0
        return float(self.total_hedge_notional / self.effective_exposure)
    
    def calculate_optimal_hedge(
        self,
        target_ratio: float = 0.90,
        instrument: HedgeInstrument = HedgeInstrument.MBS_TBA
    ) -> Decimal:
        """
        Determine hedge notional needed to achieve target ratio
        
        Args:
            target_ratio: Desired hedge coverage (0.90 = 90% hedged)
            instrument: Which derivative to use
            
        Returns:
            Notional amount to trade (positive = sell/short)
        """
        target_notional = self.effective_exposure * Decimal(str(target_ratio))
        current_notional = self.total_hedge_notional
        adjustment_needed = target_notional - current_notional
        
        return adjustment_needed
    
    def place_hedge_trade(
        self,
        notional: Decimal,
        entry_price: Decimal,
        instrument: HedgeInstrument = HedgeInstrument.MBS_TBA,
        settlement_days: int = 30
    ) -> HedgePosition:
        """Execute new hedge position"""
        position = HedgePosition(
            instrument=instrument,
            notional_amount=notional,
            entry_price=entry_price,
            current_price=entry_price,  # Will update with market moves
            trade_date=datetime.now(),
            settlement_date=datetime.now() + timedelta(days=settlement_days)
        )
        self.positions.append(position)
        return position
    
    def update_market_prices(self, current_mbs_price: Decimal):
        """Mark hedge positions to current market"""
        for pos in self.positions:
            if pos.instrument == HedgeInstrument.MBS_TBA:
                pos.current_price = current_mbs_price
    
    def hedge_effectiveness_report(self) -> Dict[str, any]:
        """
        Measure how well hedges offset pipeline value changes
        
        In practice, compare hedge P&L to pipeline mark-to-market
        """
        total_hedge_pnl = sum(pos.unrealized_pnl for pos in self.positions)
        
        return {
            "pipeline_volume": self.pipeline_volume,
            "effective_exposure": self.effective_exposure,
            "pull_through_rate": self.pull_through_rate,
            "total_hedge_notional": self.total_hedge_notional,
            "hedge_ratio": round(self.hedge_ratio, 3),
            "unrealized_hedge_pnl": total_hedge_pnl,
            "position_count": len(self.positions)
        }

# Example workflow
hedge_engine = HedgingEngine(
    pipeline_volume=Decimal("15000000"),  # $15MM pipeline
    pull_through_rate=0.85  # Expect 85% to close
)

# Calculate how much to hedge
optimal_hedge = hedge_engine.calculate_optimal_hedge(target_ratio=0.90)
print(f"Need to hedge: ${optimal_hedge:,.0f}")

# Execute MBS TBA forward sale
hedge_engine.place_hedge_trade(
    notional=optimal_hedge,
    entry_price=Decimal("101.25"),  # MBS price at entry
    instrument=HedgeInstrument.MBS_TBA
)

# Market moves - MBS price drops (rates rise)
hedge_engine.update_market_prices(current_mbs_price=Decimal("100.75"))

# Check effectiveness
report = hedge_engine.hedge_effectiveness_report()
print(f"Hedge Ratio: {report['hedge_ratio']:.1%}")
print(f"Hedge P&L: ${report['unrealized_hedge_pnl']:,.2f}")
```

### Investor Guideline Compliance Validation

Systematically verify loan eligibility against investor purchase criteria before commitment and delivery to prevent repurchase exposure.

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class ComplianceStatus(Enum):
    COMPLIANT = "Meets all guidelines"
    WARNING = "Meets guidelines with minor exceptions"
    VIOLATION = "Fails critical guideline"

@dataclass
class InvestorGuideline:
    """Individual underwriting or documentation requirement"""
    guideline_id: str
    category: str  # "Credit", "Property", "Documentation", etc.
    rule: str
    is_critical: bool  # True = hard stop, False = compensating factors allowed
    
@dataclass
class LoanProfile:
    """Loan characteristics for guideline checking"""
    loan_id: str
    loan_amount: Decimal
    property_value: Decimal
    ltv: float
    credit_score: int
    dti: float
    occupancy: str  # "Primary", "Second Home", "Investment"
    property_type: str  # "SFR", "Condo", "2-4 Unit", etc.
    documentation_type: str  # "Full Doc", "Bank Statement", etc.
    loan_purpose: str  # "Purchase", "Refinance"
    
    # Documentation completeness flags
    has_appraisal: bool = False
    has_title_commitment: bool = False
    has_income_verification: bool = False
    has_asset_verification: bool = False

class InvestorGuidelineValidator:
    """Check loan eligibility against investor purchase criteria"""
    
    def __init__(self, investor_name: str):
        self.investor_name = investor_name
        self.guidelines = self._load_guidelines()
    
    def _load_guidelines(self) -> List[InvestorGuideline]:
        """
        Load investor-specific guidelines
        In production, pull from database or API
        """
        if self.investor_name == "FNMA":
            return [
                InvestorGuideline(
                    guideline_id="FNMA_LTV_001",
                    category="LTV Requirements",
                    rule="Primary Residence: Max 97% LTV",
                    is_critical=True
                ),
                InvestorGuideline(
                    guideline_id="FNMA_CREDIT_001",
                    category="Credit Requirements",
                    rule="Minimum 620 credit score",
                    is_critical=True
                ),
                InvestorGuideline(
                    guideline_id="FNMA_DTI_001",
                    category="DTI Requirements",
                    rule="Maximum 50% debt-to-income ratio",
                    is_critical=True
                ),
                InvestorGuideline(
                    guideline_id="FNMA_APPRAISAL_001",
                    category="Documentation",
                    rule="Full appraisal required for all loans",
                    is_critical=True
                )
            ]
        elif self.investor_name == "FHLMC":
            return [
                InvestorGuideline(
                    guideline_id="FHLMC_LTV_001",
                    category="LTV Requirements",
                    rule="Primary Residence: Max 95% LTV (standard)",
                    is_critical=True
                ),
                InvestorGuideline(
                    guideline_id="FHLMC_CREDIT_001",
                    category="Credit Requirements",
                    rule="Minimum 640 credit score",
                    is_critical=True
                )
            ]
        return []
    
    def validate_loan(self, loan: LoanProfile) -> Dict[str, any]:
        """
        Comprehensive guideline check
        
        Returns:
            Dict with overall status and violation details
        """
        violations = []
        warnings = []
        
        # LTV checks
        if loan.occupancy == "Primary":
            max_ltv = 97.0 if self.investor_name == "FNMA" else 95.0
            if loan.ltv > max_ltv:
                violations.append({
                    "guideline_id": f"{self.investor_name}_LTV_001",
                    "violation": f"LTV {loan.ltv}% exceeds max {max_ltv}%",
                    "is_critical": True
                })
        
        # Credit score checks
        min_credit = 620 if self.investor_name == "FNMA" else 640
        if loan.credit_score < min_credit:
            violations.append({
                "guideline_id": f"{self.investor_name}_CREDIT_001",
                "violation": f"Credit score {loan.credit_score} below minimum {min_credit}",
                "is_critical": True
            })
        
        # DTI checks
        if loan.dti > 50.0:
            violations.append({
                "guideline_id": f"{self.investor_name}_DTI_001",
                "violation": f"DTI {loan.dti}% exceeds maximum 50%",
                "is_critical": True
            })
        
        # Documentation checks
        if not loan.has_appraisal:
            violations.append({
                "guideline_id": f"{self.investor_name}_APPRAISAL_001",
                "violation": "Missing required appraisal",
                "is_critical": True
            })
        
        if not loan.has_title_commitment:
            warnings.append({
                "guideline_id": f"{self.investor_name}_TITLE_001",
                "warning": "Title commitment not yet received",
                "is_critical": False
            })
        
        # Determine overall status
        if any(v["is_critical"] for v in violations):
            status = ComplianceStatus.VIOLATION
        elif warnings:
            status = ComplianceStatus.WARNING
        else:
            status = ComplianceStatus.COMPLIANT
        
        return {
            "loan_id": loan.loan_id,
            "investor": self.investor_name,
            "status": status,
            "is_saleable": (status != ComplianceStatus.VIOLATION),
            "critical_violations": [v for v in violations if v["is_critical"]],
            "warnings": warnings,
            "violation_count": len(violations),
            "warning_count": len(warnings)
        }
    
    def batch_validate(self, loans: List[LoanProfile]) -> Dict[str, any]:
        """Validate multiple loans and summarize results"""
        results = [self.validate_loan(loan) for loan in loans]
        
        saleable_count = sum(1 for r in results if r["is_saleable"])
        violation_count = sum(1 for r in results if r["status"] == ComplianceStatus.VIOLATION)
        
        return {
            "total_loans": len(loans),
            "saleable_loans": saleable_count,
            "unsaleable_loans": violation_count,
            "saleable_pct": round(saleable_count / len(loans) * 100, 1),
            "detailed_results": results
        }

# Example validation workflow
loan = LoanProfile(
    loan_id="LN12345",
    loan_amount=Decimal("450000"),
    property_value=Decimal("500000"),
    ltv=90.0,
    credit_score=680,
    dti=45.0,
    occupancy="Primary",
    property_type="SFR",
    documentation_type="Full Doc",
    loan_purpose="Purchase",
    has_appraisal=True,
    has_title_commitment=False,
    has_income_verification=True,
    has_asset_verification=True
)

validator = InvestorGuidelineValidator(investor_name="FNMA")
validation_result = validator.validate_loan(loan)

print(f"Loan {loan.loan_id} Status: {validation_result['status'].value}")
print(f"Saleable: {validation_result['is_saleable']}")
if validation_result['critical_violations']:
    print("Critical Violations:")
    for v in validation_result['critical_violations']:
        print(f"  - {v['violation']}")
```

## Concept Reference

| Concept | Technical | Plain | Importance |
|---------|-----------|-------|------------|
| Secondary Market Specialist | A financial professional responsible for the post-origination sale of mortgage loans to secondary market investors, managing pricing strategy, risk mitigation, and investor relations | A person who sells home loans to investors after they've been approved, makes sure the company gets the best price, and handles all the paperwork and compliance | 1.00 |
| Rate Sheet Management | The systematic process of analyzing current market conditions, investor pricing matrices, and yield spread premiums to establish and continuously update daily mortgage rate sheets | Creating and updating the daily list of interest rates offered to borrowers, based on what's happening in the financial markets and what will be profitable | 0.95 |
| Rate Lock | A contractual commitment guaranteeing a specific interest rate and associated pricing terms for a defined period, creating mandatory delivery obligations | A promise to a borrower that their interest rate won't change for a certain period (usually 30-60 days) while their loan is being processed, even if market rates move | 0.93 |
| Pipeline Monitoring | The real-time tracking and analysis of all mortgage loan applications from initial rate lock through final delivery, assessing lock expiration dates, fallout risk, and closing probability | Keeping track of all the home loans in progress, watching their deadlines, and making sure they'll actually close before the locked-in interest rate expires | 0.92 |
| Investor Guidelines | Comprehensive underwriting, documentation, and eligibility standards established by secondary market purchasers that specify acceptable loan characteristics, quality requirements, and delivery protocols | The specific rules and requirements that investors set about what kinds of loans they're willing to buy, including borrower credit scores, property types, and required documentation | 0.91 |
| Hedging Activities | The utilization of financial derivative instruments, including mortgage-backed securities (MBS), Treasury futures, and interest rate swaps, to offset interest rate risk exposure in the locked loan pipeline | Using financial tools to protect the company from losing money if interest rates change between when a rate is locked and when the loan is sold to investors | 0.90 |
| Regulatory Compliance | Adherence to federal and state mortgage lending regulations including TILA-RESPA Integrated Disclosure (TRID), Equal Credit Opportunity Act (ECOA), Home Mortgage Disclosure Act (HMDA), and quality control standards | Following all the laws and regulations that govern mortgage lending, including consumer protection rules and fair lending requirements | 0.90 |
| Loan Saleability | The assessment of whether a mortgage loan meets all investor purchase criteria, including underwriting guidelines, documentation completeness, and compliance with regulatory requirements | Whether a loan meets all the requirements needed for an investor to buy it, making sure nothing will prevent the sale from going through | 0.89 |
| Trade Settlements | The finalization of loan sale transactions involving the exchange of loan documentation, title transfer, funds disbursement, and reconciliation of all pricing adjustments and fees | Completing the actual sale of loans to investors by exchanging all documents, transferring ownership, and making sure all money and paperwork match up correctly |
Philosopher's Stone v4 × Skill Forge × EchoSeed
