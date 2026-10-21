# trade.inc - Game Concept Draft

**Version:** 0.2 - finished-game implementation guide  
**Date:** 21 October 2026  
**Purpose:** describe the complete intended game and give its implementation a clear, practical guide.

This guide describes the finished game to be built. It is not a statement that the game is already implemented, and it does not assign work to individuals. It is intended to be supplied directly to a coding agent as a self-contained specification.

## How to use this guide

- **Game rule:** implement the stated behaviour. The gameplay, short-selling model, recovery rules, scheduling rules, content contract and technical stack in this version have been accepted as the implementation baseline.
- **UI proposal:** a suggested first interface, including layout, colours, wording, controls and screen composition. Implement it as a useful starting point; it may be tweaked later. UI details anywhere in this guide remain proposals rather than a permanently confirmed visual design.
- **Configurable default:** a usable starting value supplied so implementation can proceed. Authors can change it through settings or content without asking for a design decision or changing engine code.
- **Candidate content:** company ideas, sample text and example stories that are not an agreed final creative catalogue. Use labelled starter data as needed and keep it easy for the authors to replace or extend.

The coding agent should review this guide internally for consistency, then build the finished game using the rules and supplied defaults. Do not turn that internal review into a user-approval stage, re-ask answered rule questions, or wait for optional creative content and tuning values. Make routine implementation choices consistent with this guide and record them briefly. Later explicit instructions from the people directing the agent take precedence. This document does not impose a separate reduced scope.

Quick navigation: [time and pause](#6-time-pause-and-run-lifecycle), [outcomes and checkpoints](#7-wealth-victory-and-elimination), [trading](#9-buying-and-selling-owned-assets), [short selling](#10-short-selling), [prices and recovery](#11-price-movement-and-near-collapse-recovery), [event template](#15-content-contract), [UI proposal](#16-player-interface-and-screen-behaviour), [build sequence](#22-next-steps-in-order), [implementation baseline](#23-implementation-baseline-and-defaults), [authoring stocks and stories](#24-author-controlled-content-and-extension-workflow).

## 1. The game in one paragraph

trade.inc is a humorous, single-player trading game about trying to turn $20,000 into $1,000,000 before time runs out. The player follows an exaggerated world through news and market information, then buys, sells and shorts financial assets. The first UI proposal presents this through a flat world map and price charts. Some headlines move prices immediately; others develop into opportunities or disasters over time. A complete run covers 100 fictional days, with ten active minutes as the adjustable default duration. Modest wealth checkpoints eliminate badly struggling runs without requiring players to remain on a prescribed path to a million. Success means financial freedom; failure ends with a satirical return to employment.

## 2. Design priorities and limits

The game should be easy to understand, quick to start, funny to read and capable of producing dramatic changes in wealth. Events are the main source of interesting decisions, rather than decoration around a random chart.

Keep the implementation appropriate for a small university project with a short development period. Detailed rules should prevent incompatible implementations; they should not turn the application into a professional trading platform.

The intended qualities are:

1. **Readable opportunities.** A player can connect at least some news to plausible market actions.
2. **Meaningful uncertainty.** A clue can be incomplete, a rumour can be wrong, and a second event can interfere with a good plan.
3. **Large consequences.** Price changes must support the deliberately extreme $20,000-to-$1,000,000 challenge.
4. **Room to recover.** A bad trade does not automatically end a run. Survival checkpoints remain substantially below the winning target.
5. **Replayability.** Different event selections and timing make subsequent runs different.
6. **Clear feedback.** The player can see what they own, what they can afford, why an order failed and why a run ended.

**Scope limits:** local browser application, one player, fictional market data and authored event content. No accounts, multiplayer, live market API, online economy, payment system, backend, anti-cheat system or cloud saving is required. Loans and options are outside the current game specification. Formal course documentation is a later deliverable.

## 3. Premise, story and tone

**Agreed direction.** The player is a university dropout who wants financial freedom instead of ordinary employment. Their parents provide starting money and an ultimatum: prove that this trading plan works within 100 days.

The opening establishes three things quickly: the starting capital, the $1 million ambition and the deadline. The player should reach the main screen after a short introduction, rather than reading a long backstory.

**Proposed opening copy:** "You dropped out. Your parents are unconvinced. You have $20,000 and 100 days to prove that trading is, in fact, a career. Reach $1,000,000, survive their progress reviews, and earn your escape."

The humour belongs mainly in fictional companies, absurd headlines, character dialogue and ending scenes. Ordinary controls and status labels should remain clear. The first UI proposal uses the map heading **The world** and no footer. These presentation choices can be tweaked later.

**Ending direction:** a successful run celebrates financial freedom, potentially with a luxury-car image. A failed run requires the player to acknowledge or sign an obviously fictional employment contract or job application. These are game scenes, not real forms or external submissions. Exact artwork and dialogue are author-controlled creative content.

## 4. The player's repeated decisions

The basic loop is:

1. Notice a new map marker or news item.
2. Read its headline and, if useful, open its description.
3. Identify a possible effect on one or more assets.
4. Inspect the relevant asset and its chart.
5. Buy, sell, open a short or cover a short using the finished game's long and short controls.
6. Observe the resulting prices and total wealth.
7. Decide whether to hold, exit, move to another opportunity or keep cash available.
8. Survive the next wealth checkpoint and continue toward $1 million.

The player can also ignore a story. There is no requirement to click every marker, hold every asset or make a trade every day. Holding cash is a valid decision, although it will not by itself achieve the winning target.

The main strategic questions are how much to commit, whether to trust a clue, whether to profit from an immediate movement or a developing story, and whether money should remain available for another opportunity. Short selling adds a way to benefit from falling prices and introduces forced-closure risk.

## 5. Full-game settings and terminology

| Item | Value or rule | Status |
| --- | --- | --- |
| Fictional run length | 100 game days by default; unchanged when real duration is adjusted | Game rule / configured calendar |
| Active real-time duration | `durationSeconds`, default 600; 900 or 1,200 are valid examples | Configurable default |
| Time conversion | `secondsPerDay = durationSeconds / gameDays`; never hard-code six seconds | Game rule |
| Starting money | $20,000 / 2,000,000 integer cents | Configurable default |
| Initial positions | No holdings or shorts; all starting wealth is cash | Game rule |
| Winning wealth | At least $1,000,000 | Agreed |
| Wealth basis | Cash plus long-position value, minus short liabilities | Agreed direction |
| Early elimination | Total wealth at or below zero, or missing a checkpoint | Agreed |
| Final elimination | Deadline reached below the winning target | Agreed |
| Pause | Manual pause allowed; trading disabled while paused | Agreed |
| Short selling | Included alongside buying and selling | Game rule |
| Permanent asset failure | Not used; near-collapse assets recover | Agreed |
| Recovery target | The asset catalogue's original starting price | Agreed |
| Recovery timing | Guaranteed recovery, with timing varied by authored event | Agreed |

**Terms used throughout the guide:**

- **Asset:** a stock, cryptocurrency or commodity the player can trade.
- **Long position:** units the player owns and benefits from when their price rises.
- **Short position:** borrowed units sold now and bought back later; a falling price creates profit.
- **Cash balance:** cash recorded in the account, including any locked short-sale proceeds.
- **Available cash:** cash the player is permitted to spend after short-related reserves are deducted.
- **Total wealth / equity:** the value used to decide victory, bankruptcy and checkpoints.
- **Event definition:** an authored content object describing news and its effects.
- **Event instance:** a particular publication of an event during a run.
- **Root event:** an event eligible to be selected by the random scheduler.
- **Follow-up:** an event scheduled by another event, forming a storyline.

## 6. Time, pause and run lifecycle

### 6.1 A consistent, configurable game clock

**Game rule.** The clock starts with zero elapsed game days. The player-facing day counter begins on Day 1. A checkpoint labelled "Day 20" occurs at the **end of Day 20**. Its real-time deadline is derived from the configured run duration, not fixed in seconds.

| Point | 10-minute run | 15-minute run | 20-minute run |
| --- | --- | --- | --- |
| Start of Day 1 | 0 seconds | 0 seconds | 0 seconds |
| Start of Day 2 | 6 seconds | 9 seconds | 12 seconds |
| End of Day 10 | 1:00 | 1:30 | 2:00 |
| End of Day 20 | 2:00 | 3:00 | 4:00 |
| End of Day 50 | 5:00 | 7:30 | 10:00 |
| End of Day 100 | 10:00 | 15:00 | 20:00 |

Set `gameDays: 100` and `durationSeconds: 600` in one run-settings object. The ordinary pacing adjustment is to change `durationSeconds` only. Calculate `secondsPerDay = durationSeconds / gameDays` and `elapsedGameDays = activeElapsedSeconds * gameDays / durationSeconds`. Displayed current day is the whole elapsed-day count plus one, capped at the configured `gameDays`. Labels and countdowns use this same convention. The UI proposal's sample values must be replaced with values derived from the engine.

Changing duration to 900 seconds makes every game day last 9 seconds. Changing it to 1,200 seconds makes every day last 12 seconds. Checkpoints, event delays, trends, recovery, marker lifetimes and regular market steps keep their authored game-day values and automatically scale in real time. Longer duration gives more reading and reaction time, not additional simulated days or extra price-noise steps. Freeze the settings for an active run; changes apply to a new run.

Time passes while browsing news, changing the selected asset or entering a trade quantity. Reading a headline does not create a free pause or change the timing of that headline's effects.

### 6.2 Manual pause

**Agreed.** A pause control stops the game clock, background price movement, event publication, delayed effects, recovery progress and checkpoint progress. Buying, selling, shorting and covering are disabled while paused.

The player may still read already available news, select an asset and inspect its existing chart. A clear paused state and Resume control must be visible. Resuming continues from the same simulation moment; paused wall-clock time must not be caught up afterward.

**Game rule:** switching to another browser tab does not implicitly pause the run. The player should use Pause before leaving. Do not add hidden automatic pause behaviour.

### 6.3 Lifecycle

**Run states:** introduction, running, paused, won and lost. The introduction and finished states do not advance the simulation. Start creates a fresh run; Pause and Resume preserve it; Restart creates a new run rather than partially reusing old state.

Restart must clear cash changes, holdings, shorts, price history, event selections and instances, queued follow-ups, ongoing trends, recovery cycles, checkpoint results, elapsed time and previous outcome messages. UI selection may return to a sensible initial asset and an empty or first-news state.

## 7. Wealth, victory and elimination

### 7.1 How wealth is measured

**Agreed direction.** With owned assets only:

`total wealth = cash balance + sum(owned quantity * current price)`

With short positions:

`total wealth = cash balance + long-position value - current cost of covering every short`

Unrealised gains count. The player does not have to sell everything to win or pass a checkpoint. Spending cash on an asset does not itself reduce wealth, because the purchased position has corresponding value. Short-sale proceeds do not themselves increase wealth, because the obligation to buy back the borrowed units offsets them.

**Example:** $5,000 cash plus 100 owned units worth $150 each gives $20,000 wealth. That player is not broke merely because most of their money is invested.

### 7.2 Victory

**Agreed.** A running game ends successfully as soon as total wealth reaches or exceeds $1,000,000 within the allotted time. Victory does not wait until Day 100. Stop trading and simulation at the winning moment and show the result.

### 7.3 Immediate bankruptcy

**Agreed.** Total wealth at or below zero ends the run immediately. There is no additional immediate $1,000 minimum. Positive minimum wealth requirements are applied only at scheduled checkpoints.

With long positions, positive prices and no loans, immediate bankruptcy will be unusual. Low but positive wealth can remain playable until a checkpoint. Short-selling losses can make equity zero or negative. Do not add hidden fees or artificial debt merely to make bankruptcy more common.

### 7.4 Survival checkpoints

**Agreed.** Each checkpoint compares current total wealth with a required minimum once, at its deadline. A player below the requirement loses. A player exactly on the requirement passes.

Passing does not install a permanent wealth floor. For example, after passing a $20,000 check, temporarily falling to $15,000 is allowed until another checkpoint or bankruptcy occurs. The player can recover during that interval.

The player needs access to the next checkpoint's day, minimum and countdown and the complete schedule. The UI proposal places these in the top status/checkpoint area. A checkpoint should not be a hidden surprise or require cash liquidation.

### 7.5 Configurable survival schedule

**Configurable defaults.** Use this schedule initially so the coding agent does not need to ask for amounts. Authors can tune the dates and amounts later. The active-time column illustrates only the default ten-minute run; calculate it from settings for every run.

| Checkpoint, at end of day | Active elapsed time | Minimum total wealth |
| --- | --- | ---: |
| 10 | 1:00 | $5,000 |
| 20 | 2:00 | $10,000 |
| 40 | 4:00 | $20,000 |
| 60 | 6:00 | $35,000 |
| 80 | 8:00 | $60,000 |
| 95 | 9:30 | $100,000 |
| Final deadline: 100 | 10:00 | $1,000,000 to win |

The earlier checks are closer together and forgiving. Later minimums rise as the player's capital can grow. Even the example's last survival minimum is only one tenth of the winning target. This is deliberately not a required trajectory to $1 million.

Evaluate the schedule by playing. A player making modest progress should not be eliminated for failing to grow exponentially at a prescribed rate. A player repeatedly making disastrous trades should not remain indefinitely safe.

### 7.6 The exact deadline and simultaneous changes

**Game rule.** Process market changes due at a particular timestamp as a batch, settle any forced short closures, then evaluate wealth. Within that timestamp use this order:

1. Bankruptcy at wealth <= 0.
2. Victory at wealth >= $1,000,000.
3. Any scheduled checkpoint due at that time.
4. Final deadline failure if the active duration has expired.

A player reaching $1 million from an effect due exactly at the final deadline wins. Changes scheduled after the deadline never apply. A trade submitted after the game has reached its deadline is rejected. Never grant a temporary win from an intermediate calculation inside a batch of simultaneous changes.

## 8. Tradable asset catalogue

The catalogue is authored data, not a fixed list embedded in the engine. A larger roster may contain approximately eight stocks, one or two cryptocurrencies and commodities such as gold and silver, but no exact count is required. The UI proposal's example roster is not a limit.

**Author-supplied candidate ideas, not an agreed final roster:**

| ID / ticker | Display name | Type | Sector / note | Starter price | Starter noise per step |
| --- | --- | --- | --- | ---: | ---: |
| RMT | Reinmetall | Stock | defense | $100 | 0.015 |
| MCH | Macrohard | Stock | tech | $80 | 0.015 |
| ALB | AlphaBett | Stock | tech | $120 | 0.012 |
| CAI | ClosedAI | Stock | ai/tech | $75 | 0.020 |
| BMU | BMUU | Stock | automotives; pronounced "BM double U" | $60 | 0.012 |
| NRC | NotRugpullCoin | Cryptocurrency | crypto | $10 | 0.030 |

The names, tickers and themes are the authors' tentative ideas. Prices and volatility values are provisional seed settings supplied by this guide so implementation can run without another question; they are not agreed creative or balance decisions. Use these six as editable starter data, not an immutable finished roster. Section 24 includes copyable data and instructions for adding or changing entries.

These are fictional game prices. They do not represent current real-world quotes. Store each starting price as integer cents: for example, $100 is `startingPriceCents: 10000`. The catalogue's starting price also serves as that asset's recovery target after a near-collapse event.

Stocks should have identifiable business sectors so headlines can be interpreted. Crypto can have stronger background swings and absurd speculation stories. Commodities can react differently from company stocks, providing another place to move capital. These behaviours are authored and tuned, not fetched from a real market.

## 9. Buying and selling owned assets

**Game rules:**

- All assets use positive whole-number trading quantities, including cryptocurrencies and metals. Fractional holdings and fractional borrowed quantities are not supported.
- Orders execute immediately at the engine's current price. There are no order books, limit orders, slippage, transaction fees, taxes, dividends or interest in the base concept.
- Buy only when available cash covers the complete order value.
- Sell only units the player owns. Selling more than owned is rejected; it does not automatically become a short.
- Buying or selling does not pause the game. Bring the engine up to the current active time before accepting the request, rather than trading at an old displayed quote.
- Invalid quantities include zero, negative numbers, fractions, empty values and non-finite numbers.
- Rejected orders leave the entire account unchanged and give a short, specific explanation.
- A position can be increased or partially sold. Selling its final unit removes the holding.
- Store every price, cash balance, order value, reserve, profit/loss and total wealth as integer cents, not floating-point dollar values. A displayed $12.34 is stored as `1234`. Unit quantities are integers too. Time, percentage modifiers and weights can use fractions; after applying a percentage, round the resulting executable quote once to integer cents, with half-cents rounded upward, then enforce the one-cent floor. Format dollars and cents only for display.

**Buy example:** start with $20,000. Buy 50 units at $100, costing $5,000. Cash becomes $15,000, holdings are worth $5,000, and total wealth remains $20,000.

**Sell example:** those 50 units rise to $140. Total wealth is now $22,000. Selling 20 units returns $2,800 cash, leaving 30 units worth $4,200. Wealth remains $22,000 at that price.

## 10. Short selling

### 10.1 Scope and player meaning

**Game rule.** Short selling belongs in the finished game alongside buying and selling. The model reserves the player's own money as collateral, locks short-sale proceeds, automatically closes dangerous positions and allows large jumps to cause losses beyond the reserve.

The player shorts an asset when expecting its price to fall. Opening sells borrowed units; covering buys them back. The game should explain that a price rise creates losses and can force closure.

### 10.2 Simple collateral model

The following are accepted game rules; they do not attempt to reproduce a brokerage's complete margin system:

1. Each asset may have a long position or a short position, but not both at once. Close one direction before opening the other.
2. Opening a short reserves the player's own cash equal to 100% of the opening sale value.
3. The proceeds from selling the borrowed units are added to cash balance but remain locked.
4. Both the own-money reserve and sale proceeds stay unavailable for ordinary purchases until the corresponding units are covered.
5. Available cash equals cash balance minus locked sale proceeds minus reserved own collateral.
6. There are no borrowing fees, interest payments or loan facilities.
7. For the initial shorting implementation, one open short lot per asset is sufficient. Cover part or all of it; close it before opening another lot in that asset. Other assets may have their own positions.

Let `N` be the opening sale value of a short and `M` its current covering cost:

- Locked proceeds = `N`.
- Reserved own collateral = `N`.
- Position equity for the margin check = `2 * N - M`.
- Unrealised short profit = `N - M`.

The cash balance includes locked proceeds. Do not add short profit separately to total wealth, because cash minus the short liability already accounts for it.

The `2 * N` expression assumes the default 100% own-collateral setting. If that percentage is tuned, the general position-equity calculation is **locked proceeds + remaining own collateral - current covering cost**. The maintenance test compares that value with the configured fraction of remaining own collateral; do not leave a hard-coded 175% price threshold after changing the collateral settings.

### 10.3 Worked example

Start with $20,000 and no other positions. Short 50 units at $100:

| Quantity | After opening |
| --- | ---: |
| Opening short-sale value | $5,000 |
| Cash balance including sale proceeds | $25,000 |
| Locked sale proceeds | $5,000 |
| Reserved own collateral | $5,000 |
| Available cash | $15,000 |
| Current cost to cover | $5,000 |
| Total wealth | $20,000 |

If the price falls to $60, covering costs $3,000. Closing the entire short leaves $22,000 cash, no locked money and $22,000 total wealth: a $2,000 profit.

If instead the price rises to $150, covering costs $7,500. Closing leaves $17,500 total wealth: a $2,500 loss. The proceeds were never free profit.

### 10.4 Automatic liquidation

**Maintenance threshold:** automatically cover a short when its position equity falls to 25% or less of its remaining original own-money collateral. At a constant quantity, this is reached when the price rises to 175% of its entry price.

The 25% value is the supplied configurable default. The important rules are that the threshold is explicit, the UI can explain it and closure happens automatically when it is crossed.

Closure executes at the actual price reached by the simulation, not a guaranteed stop price. A sudden jump can overshoot the threshold. For example, 50 units shorted at $100 and suddenly quoted at $350 cost $17,500 to cover, producing a $12,500 loss, even though the own-money reserve was only $5,000.

If closing a short leaves available cash negative while other positions still have value, **settlement rule:** close all remaining positions at their current prices and release all reserves. Continue with cash only if resulting wealth is positive; otherwise end in bankruptcy. This avoids silently creating a loan or declaring a player with positive total wealth bankrupt solely because cash was temporarily negative.

Do not pause automatically to let the player escape a margin check. Announce which position was closed and why. At a shared timestamp, resolve required settlements before checking the run outcome.

### 10.5 Partial covering

**Game rule.** Covering part of a short reduces its borrowed quantity and releases the same proportion of original sale proceeds and own collateral. For example, covering 20 of 50 units releases 40% of each reserve. Apply the maintenance test to the remaining position.

Show borrowed quantity, current covering cost, available cash and the position's risk threshold in the short-trading view. Reaching the winning target uses equity after subtracting the covering cost; opening extra shorts must never manufacture a win.

## 11. Price movement and near-collapse recovery

### 11.1 Background movement

**Agreed direction.** Prices combine ordinary background movement with much stronger event effects. Charts display the history produced by the simulation; they do not generate independent random movement.

**Configured cadence:** update prices every 0.25 game days. Across 100 game days this produces approximately 400 regular price updates. The real interval is `0.25 * durationSeconds / gameDays`: 1.5 seconds at ten minutes, 2.25 seconds at fifteen minutes and 3 seconds at twenty minutes. Event effects may also produce updates at their own due times. The UI may refresh countdowns more often without generating additional price changes.

At a regular price step, apply a small random percentage movement using each asset's configured per-step volatility. Starting tuning ranges might be around 0.5-2% in either direction for stocks, stronger for crypto, and lower for metals. These are game settings, not realism claims.

Use the same game-time cadence when the real-time run duration changes. Faster rendering or more frequent browser callbacks must not make an asset more volatile. When a callback arrives late, process the elapsed simulation steps and scheduled boundaries in order.

### 11.2 Supported event effects

**Supported effect vocabulary:**

| Effect | Behaviour |
| --- | --- |
| `price_jump` | Apply one percentage multiplier once, after the specified delay. |
| `price_trend` | Spread a total percentage multiplier over a specified positive duration. |
| `near_collapse` | Apply a severe drop, then schedule the agreed guaranteed recovery. |

An event can affect multiple assets, with different directions and delays. A political shock may hurt one company and help another. A headline can also have no immediate effect while scheduling a meaningful follow-up.

For a jump, `-0.35` means a 35% fall and `1.0` means a 100% rise. A +100% jump doubles the price; it does not add one dollar.

**Trend rule:** a trend's `changeFraction` describes its total multiplier over its whole duration. A +100% trend doubles the price contribution over that duration, rather than doubling the price every update. For an elapsed segment, apply `(1 + changeFraction) ^ (segmentDays / durationDays)`. Require a trend fraction greater than -1.

Multiple ordinary jumps and trends combine multiplicatively. For example, +50% and -20% produce `1.5 * 0.8 = 1.2`, or +20% overall, before background noise. Do not add the percentages and call it +30%.

### 11.3 Prices stay positive

**Agreed.** Assets do not permanently collapse or disappear from trading. Severe crashes are followed by artificial recovery, keeping the market roster available throughout the run.

**Minimum quote:** $0.01. No background movement or ordinary event may produce a zero or negative price. Reject content specifying an ordinary -100% jump or an invalid multiplier. An intended near-collapse must use its explicit effect and recovery fields.

The minimum quote is an arithmetic floor, not an extra recovery target or an instruction that every asset should trade near a cent.

### 11.4 Guaranteed recovery

**Agreed.** A near-collapse recovery uses the asset catalogue's original starting price as its normal level. It does not restore the price immediately before the crash. Recovery is guaranteed, with waiting and recovery times authored separately for each event.

**Recovery sequence:**

1. Apply the severe drop at the event's effect time.
2. Wait the event's `waitDays` before artificial recovery starts.
3. Over the authored recovery duration, move the price toward the catalogue starting price.
4. Ensure that the recovery reaches the catalogue starting price by its completion, unless that level was already reached earlier.

**Example:** an asset began the run at $100, rose to $160 and then suffered a 95% crash. Its immediate price is $8. Its recovery target is **$100**, not $160. An authored wait of 4 days and recovery duration of 8 days mean a 24-second wait and a 48-second recovery at the default ten-minute duration. At fifteen minutes they become 36 and 72 seconds; at twenty minutes, 48 and 96 seconds. Calculate these from settings, not fixed real-second values.

**Recovery interaction rules:**

- Keep at most one active forced-recovery cycle per asset. A new near-collapse replaces the previous cycle with its newly authored timing.
- Ordinary news, trends and background movement can still affect the asset during the wait and recovery.
- During recovery, recalculate the upward pull using the current price and remaining recovery time. At completion, restore the starting price if it has not already been reached.
- If other positive movement reaches or exceeds the starting price sooner, end the artificial recovery. Do not force an above-baseline price downward merely to finish the cycle.
- The short-selling rules continue to apply throughout recovery. A short profitable during the crash can become dangerous during the rebound.
- The engine knows the timing. The UI need not expose an exact recovery countdown unless the authored news intentionally reveals it.

The recovery rule makes buying crashed assets an intentional strategy. A drop from $100 to $5 followed by restoration to $100 creates a 20-fold opportunity for a player buying at the bottom. Balance should make committing capital and timing the opportunity meaningful, rather than silently weakening the agreed guarantee. A won or lost run still freezes immediately; the recovery guarantee does not keep a finished simulation running.

**Recovery guard:** if overlapping ordinary effects or background movement reduce an asset below 10% of its catalogue starting price and it has no active recovery cycle, start a default recovery cycle. A provisional default is a 4-day wait and an 8-day recovery. Explicit near-collapse events supply their own timings and take priority. The guard starts once; remaining below the threshold must not reset its wait on every update. This closes the gap where an accidental combination of ordinary drops could otherwise leave an asset at a near-worthless price indefinitely. Unlike an authored chain, an incidental guard can start near the deadline. Default rule: keep its normal timing and let the final deadline stop it if necessary, rather than manufacturing a special last-second rebound. Use the 10% trigger, 4-day wait, 8-day recovery and stated late-run policy as the configurable defaults; no further approval is needed to implement them.

### 11.5 Rule order for simultaneous effects

**Game rule.** At a scheduled time boundary, first advance existing trends and recovery progress up to that time, then process the regular price step if one is due, then publish due events and apply their due immediate effects. Round executable prices consistently, settle short liquidations and evaluate the run.

Effects sharing a timestamp should be handled in a stable order, such as authored event ID and effect index, and evaluated as a single market batch. A near-collapse published at the exact moment an earlier recovery completes begins a new cycle after that earlier recovery is resolved.

## 12. World events and information

### 12.1 Authored content

**Agreed.** Developers author the events. The game should support all three information styles: naming relevant companies or sectors while leaving outcomes uncertain; giving direct directional hints; and requiring the player to infer the assets and direction.

The concept does not require live AI-generated headlines, online news or an API connection. Event text and effects are stored together as local content. The author's hidden effect definition determines the market behaviour; the player sees only the intended headline and description.

Initial content-pool labels can include politics, international conflict, food and resources, public health, company announcements, technology, crypto speculation and absurd market news. These are editable organisational labels, not mandatory real-world simulations or pending rule decisions.

### 12.2 Event presentation and timing

Each publication has a headline, description and either a map location or global placement. A new geographically located event creates a clickable marker. Selecting it reveals its news card and marks it read locally in the UI.

An effect starts relative to publication time, not relative to when the player reads the card. Unread news can still affect prices. Waiting before opening a card cannot postpone a crash or preserve an opportunity.

**Event rhythms:**

- **Immediate shock:** publication and price effect happen together. The player reacts to the new situation afterward.
- **Developing story:** publication provides a clue, followed by effects or a follow-up after a delay.
- **Ongoing influence:** an event creates a trend lasting several game days.
- **Near-collapse story:** a severe drop produces a future recovery opportunity and danger for shorts.

**Authoring guideline:** a developing story intended to be read and traded should usually provide at least 2-3 game days of reaction time, equivalent to 12-18 seconds at the default ten-minute duration, 18-27 seconds at fifteen minutes, or 24-36 seconds at twenty minutes. This is a guideline, not a ban on instant surprises. Content density and story length must leave time to read.

### 12.3 Clues and uncertainty

An event may name a company explicitly, mention only its sector, or provide an indirect clue. Clue style controls writing and presentation; it does not require a separate prediction system.

A clear clue need not guarantee profit. Another story can interfere, a rumour may later be disproved, or a delayed effect may take time to materialise. However, intentionally misleading news should be identifiable as an unreliable claim or be explained by a follow-up. Avoid making every readable clue arbitrarily wrong.

Do not display exact hidden percentage changes, future event queues or recovery timers by default. Exact values belong in content definitions and debugging tools. Event authors can intentionally disclose timing or direction in their text when that is part of the opportunity.

### 12.4 News availability

**UI proposal.** Markers remain on the map for an authored display duration. Older stories remain accessible in a small recent-news list for the remainder of the run. Removing a marker does not cancel its effects or follow-ups.

Global and online stories must also be accessible. A small News/stories control within the world panel can open the recent-news list and include global items. This is part of the first UI proposal, not a confirmed final layout or a new footer.

If several events share a location, group their markers or open a small list rather than making stories impossible to click. A full geographic mapping application, globe, navigation system or map search is unnecessary.

## 13. Storylines and follow-ups

**Story model.** A storyline is linked events using the same event format. A parent lists follow-up event IDs and delays measured from the parent's publication. A follow-up can itself list another follow-up. An empty list ends that branch.

Every listed follow-up is scheduled; a list of two means both occur. It is not an implicit random choice. Probability-based branching is not required for the first implementation. A false-rumour story can be written as a fixed chain whose later chapter disproves the original claim.

**Illustrative storyline A - Reinmetall budget freeze:**

| Offset from root publication | News | Possible market role |
| --- | --- | --- |
| Day 0 | Government considers a defence-spending freeze | Readable warning about RMT's contracts |
| Day 3 | Defence budget frozen; tanks told to carpool | Downward jump or trend for Reinmetall |
| Day 8 | Government discovers that carpooling tanks also costs money | Partial reversal or a new opportunity |

**Illustrative storyline B - ClosedAI printer launch:**

| Offset from root publication | News | Possible market role |
| --- | --- | --- |
| Day 0 | ClosedAI promises a model that understands printer errors | Speculative interest in CAI |
| Day 4 | First users report that the model has become the printer error | Strong negative effect; perhaps a near-collapse |
| Later | Rebranding campaign and the defined recovery cycle | Recovery toward the catalogue baseline |

These are technical sample stories for implementing and checking the mechanics. They are not the authors' agreed final creative content. Authors can replace or expand them through the content files. A near-collapse's recovery happens through its effect definition; a later narrative chapter must not apply the same recovery a second time.

Follow-up-only chapters must not be randomly published out of context. Chains must not contain cycles or missing references. Keep stories short enough to understand at the default ten-minute pace, while allowing the configured duration to provide more time when increased.

## 14. Event scheduling and replayability

### 14.1 Separate content from the schedule

**Agreed direction.** Specify how many events should be drawn within a game-time window and select them from eligible content pools. The content definition says what an event does; run settings determine which pools and how many opportunities the run uses.

**Quota rule:** window quotas count randomly selected **root events**. Story follow-ups are additional publications. Name the setting `rootCount` so the meaning is visible. For example, five roots with two two-chapter stories may produce seven total headlines. Implement this distinction directly; a root quota does not guarantee the same total number of headlines.

### 14.2 Scheduling method

1. Divide a window into as many time slots as its root count.
2. Choose one random publication time inside each slot.
3. Choose an eligible pool and event using configured weights.
4. Reserve that event so a non-repeatable story is not selected again in the run.
5. Schedule its follow-ups relative to their parent publications.

**No-repeat rule:** every event definition appears at most once per run. There is no need for repeatable events in a 50-100-event library supporting a much smaller run selection.

Do not guarantee a root quota by silently dropping unavailable events. Validate that the selected assets, pools and content can support the run settings. If content is insufficient, report the configuration problem clearly before starting or while preparing the schedule.

### 14.3 Default full-run density

**Configurable schedule default:**

| Game-time window | Root count |
| --- | ---: |
| Days 0-20 | 5 |
| Days 20-40 | 5 |
| Days 40-60 | 5 |
| Days 60-80 | 5 |
| Days 80-100 | 4 |

This gives 24 roots, roughly one every 25 real seconds at the default ten-minute duration before follow-ups. Average spacing becomes 37.5 seconds at fifteen minutes or 50 seconds at twenty minutes; the root count does not automatically increase. A run with several story chains may produce around 30-40 publications. Authors can adjust these values against reading time, opportunities and their actual library; implementation starts with the stated counts. A library of 50-100 events does not imply that all of them appear in one run.

Window boundaries are half-open: an event exactly at a shared boundary belongs to the later window. Publication times for new roots must be before the final deadline.

### 14.4 Finish stories within the run

**Game rule.** Choose a root only when enough time remains for its follow-ups and defined effects, including guaranteed recovery, to finish before the run deadline. Determine that horizon from the content chain. Late-run windows therefore need short events, not only long developing stories.

If content cannot fill a window under this rule, report an authoring/configuration problem; do not publish a warning whose promised follow-up is automatically impossible. A recovery that has already been superseded by another near-collapse uses the newer cycle's timing.

### 14.5 Randomness

Use randomness for root selection, slot timing and background prices. Keep authored text and effect definitions stable. Events can vary in clarity without the game generating new prose at runtime.

Use one randomness utility so debugging is manageable. A fixed seed for repeatable debugging is useful but optional. The concept does not require a player-facing seed field, daily challenges or a replay-sharing service.

## 15. Content contract

**Accepted baseline contract.** Implement these field names and rules so authors can add or edit data consistently. Validate the examples internally without asking for a separate schema-approval stage. An approved specification is not a claim that its code has already been implemented.

### 15.1 Asset example

```json
{
  "id": "RMT",
  "name": "Reinmetall",
  "category": "stock",
  "sector": "defense",
  "startingPriceCents": 10000,
  "noisePerStep": 0.015
}
```

All six fields are required. `startingPriceCents` is a positive integer in cents: `10000` means $100.00. Do not store a floating-point starting price in dollars. `noisePerStep` is the maximum absolute random percentage fraction at a configured regular price step: `0.015` means a uniform movement between -1.5% and +1.5% per step. Changing the step cadence requires retuning this value.

Allowed initial categories are `stock`, `crypto` and `commodity`. `sector` is an authoring/display label; it does not automatically cause effects on every matching asset. Effects reference explicit asset IDs.

### 15.2 Complete developing-story root example

```json
{
  "schemaVersion": 1,
  "id": "politics_defence_budget_warning",
  "pool": "politics",
  "headline": "Government considers a defence spending freeze",
  "description": "Reinmetall says this is probably a spreadsheet error. Investors are checking the defence budget.",
  "location": { "kind": "map", "lat": 52.52, "lon": 13.405 },
  "selection": { "randomEligible": true, "weight": 1 },
  "clueStyle": "contextual",
  "displayDays": 6,
  "effects": [],
  "followUps": [
    { "eventId": "politics_defence_budget_freeze", "delayDays": 3 }
  ]
}
```

### 15.3 Complete follow-up example

```json
{
  "schemaVersion": 1,
  "id": "politics_defence_budget_freeze",
  "pool": "politics",
  "headline": "Defence budget frozen; tanks told to carpool",
  "description": "Reinmetall warns that contracts will be delayed. Its spokesperson suggests waiting for the next budget meeting.",
  "location": { "kind": "map", "lat": 52.52, "lon": 13.405 },
  "selection": { "randomEligible": false, "weight": 0 },
  "clueStyle": "directional",
  "displayDays": 6,
  "effects": [
    {
      "assetId": "RMT",
      "type": "price_jump",
      "delayDays": 0,
      "durationDays": 0,
      "changeFraction": -0.35,
      "recovery": null
    }
  ],
  "followUps": []
}
```

### 15.4 Near-collapse effect example

The following is an effect object to place inside an event's `effects` array, not a complete event:

```json
{
  "assetId": "RMT",
  "type": "near_collapse",
  "delayDays": 0,
  "durationDays": 0,
  "changeFraction": -0.95,
  "recovery": { "waitDays": 4, "durationDays": 8 }
}
```

The global recovery target is already defined as the catalogue starting price, so authors do not choose a conflicting target inside this object.

### 15.5 Exact field meanings

All fields shown in the complete event examples are required. Use empty arrays rather than omitted arrays, and explicit `null` for an absent recovery object.

| Field | Meaning / requirement |
| --- | --- |
| `schemaVersion` | Exactly 1 for this contract. |
| `id` | Stable, unique, non-empty event ID. |
| `pool` | Named content pool used for root selection. |
| `headline` | Short player-visible headline. |
| `description` | Player-visible story detail and intended clues. |
| `location` | Map coordinates, or a global location. |
| `selection.randomEligible` | Whether the random scheduler may select it as a root. |
| `selection.weight` | Positive selection weight for roots; 0 for follow-up-only events. |
| `clueStyle` | `contextual`, `directional` or `indirect`; authoring metadata for the agreed clue variety. |
| `displayDays` | Positive marker-display duration from publication, measured in game days. Does not limit effect duration. |
| `effects` | Zero or more explicitly defined market effects. |
| `followUps` | Zero or more event references scheduled from this publication. |

A global location is exactly `{ "kind": "global", "lat": null, "lon": null }`. A map location requires finite latitude from -90 to 90 and longitude from -180 to 180. A global event belongs in the news list, not at an invented geographic point.

`clueStyle` is not the hidden actual effect and must not be used to calculate a price direction. A contextual headline can affect more than one sector; an indirect headline still has normal explicit engine effects.

### 15.6 Effect rules

Every effect object has the fields shown in the examples: `assetId`, `type`, `delayDays`, `durationDays`, `changeFraction` and `recovery`.

| Type | Duration | Fraction | Recovery |
| --- | --- | --- | --- |
| `price_jump` | Exactly 0 | Finite, greater than -1 | Exactly `null` |
| `price_trend` | Positive | Finite, greater than -1 | Exactly `null` |
| `near_collapse` | Exactly 0 for the immediate drop | Finite, greater than -1 and less than 0 | Required object with non-negative wait and positive duration |

All effect delays are finite and non-negative. Delays and durations use game days, including fractions where useful. All referenced asset IDs must exist and be enabled in a run for the event to be eligible.

In a near-collapse, the recovery wait begins when the drop actually applies, not when its warning headline was published. Ordinary severe-drop content intended to recover must use `near_collapse`, rather than relying on a later author remembering to add a second price effect. The recovery guard covers accidental combined falls.

A +100% trend lasting 4 days would use `type: "price_trend"`, `durationDays: 4`, `changeFraction: 1` and `recovery: null`.

### 15.7 Follow-up validation and authoring checklist

- Every follow-up has an existing `eventId` and a finite, non-negative `delayDays`.
- No event references itself, no chain contains a cycle, and no follow-up is listed twice.
- In the first implementation, a follow-up-only event should have one parent. This prevents separate roots from attempting to publish the same non-repeatable chapter twice.
- Follow-up-only chapters have `randomEligible: false` and weight 0. A referenced chapter must not also be an unrelated random root.
- Pools, asset references and event references resolve before a run starts.
- Root events with an empty effect list must still have a meaningful follow-up or an intentional information purpose; do not fill the game with consequence-free headlines by accident.
- Content must fit the timing of the intended run and supply enough eligible roots for its configured pools and quotas.
- Authors should provide readable text, plausible fictional geography where relevant and understandable market relationships. Engine constants or technical debugging notes do not belong in player-visible prose.
- Do not add a new effect string and assume the engine understands it. A new mechanic needs matching contracts, behaviour, validation and an example.

## 16. Player interface and screen behaviour

### 16.1 First-version layout proposal

**UI proposal.** Start with the map-focused UI draft, a charcoal base with blue accents, the heading **The world**, the right-side market and trading panels, and a large asset chart below the map. The chart and trading panel finish at the same lower edge. There is no footer.

Every layout, colour, label, control arrangement and screen composition in this section is a proposal for a first version and may receive later tweaks. These are not permanently confirmed UI requirements. Implement the proposal as the initial working interface without a separate approval question.

The current preview is an optional layout reference with fixed sample data. Its mock buy/sell behaviour is not the real simulation. The game's final UI reads engine state and sends actions through the engine. The following description is self-contained; access to an earlier preview or conversation is not required to implement it.

Suggested first screen composition:

```text
Brand / total wealth / available cash / day / time remaining / Pause
Next checkpoint: day, required wealth and countdown
+----------------------------------+-------------------------+
| The world                        | Markets                 |
| Flat map and event markers       | All assets / My holdings|
| Selected news headline and card  | Dynamic asset rows      |
+----------------------------------+-------------------------+
| Selected asset's large chart     | Trading panel           |
| Game-day and price axes          | Quantity, value, actions|
+----------------------------------+-------------------------+
```

Suggested editable palette: background `#121416`, panels `#1b1e23`, borders `#343a44`, primary text `#edf0f5`, secondary text `#a8b0bd`, and blue accent `#83aaff`. Positive and negative changes may use green/red with explicit signs. These are proposal values, not locked styling requirements.

### 16.2 Status and checkpoint area

Show total wealth, available cash, current game day and remaining active time. These numbers must all come from the same state. The next checkpoint shows its deadline, minimum wealth and time remaining. Its schedule is inspectable.

The introduction states the $1 million goal. **Proposed:** repeat it as a compact label near total wealth if needed for clarity, rather than restoring a footer. Pause/Resume belongs in the status area.

When shorts exist, available cash must account for locked proceeds and collateral. Provide the explanation in the short-trading view or a concise contextual label; never display locked sale proceeds as spendable money.

### 16.3 World and news card

The map stays flat. Located news appears as clickable markers; selecting a marker shows the headline and description without pausing. The selected marker is visually distinct. Read/unread state may use an additional shape or outline, so colour is not the only cue.

The card should identify the story's publication day, location or global status, and whether the text describes a developing situation when that information is intended to be public. It must not expose hidden future percentages accidentally.

**Proposed:** the world panel's story count can open the recent-news list described earlier, including global events. This extends the existing panel rather than adding another main screen region.

### 16.4 Markets

**UI proposal.** Provide separate **All assets** and **My holdings** views. All assets contains every enabled tradable asset, including those the player does not own. My holdings contains the player's open positions. In the finished short-selling version, that includes short positions with an explicit Short label; do not treat a borrowed position as owned units.

Each row identifies the asset, current price, price change since the run started and the player's position quantity or absence of a position. Price change is not the player's personal profit percentage. A player who bought later did not necessarily earn the displayed market return.

Selecting a row changes the chart and trading panel. It does not execute an order. The complete catalogue must remain accessible; if the final roster is longer than the panel, use a contained list scroll or compact rows rather than moving the trade controls out of reach. Avoid adding a complex search/filter system for a roster of roughly a dozen assets.

When the last unit of a holding is sold, remove it from My holdings. A short removed by covering or liquidation disappears from that view too. A simple empty message appears when there are no positions.

### 16.5 Chart

Show the selected asset's actual simulated price history, labelled in game days and game dollars. The history can begin at the starting price and extend through the run. The current price must match the market row and executable trade price at the same engine time.

Rescale axes so movements remain legible. Do not render fake movement while paused or after a run ends. A visual refresh does not generate another price update. Event annotations and hover details are optional polish; a clear basic line chart is sufficient.

### 16.6 Trading panel

Start with the proposed quantity field, order value and Buy/Sell controls. Show the selected asset, current price and owned quantity. Provide clear feedback for successful orders, insufficient cash, invalid quantities, missing holdings, paused state and a finished run.

**UI proposal for short trading:** add a Long / Short selection within this same panel. Long mode uses Buy and Sell; Short mode uses Short and Cover, with borrowed quantity, reserved collateral and liquidation information. Disable incompatible actions rather than silently closing and reversing positions.

### 16.7 End screen

Freeze the background game and display the outcome, final wealth, elapsed game time and reason. A checkpoint loss shows both the required wealth and actual wealth. Bankruptcy and deadline failure have distinct explanations. A forced short closure that did not itself end the game should not be presented as an automatic loss.

Provide a clear New run action. Use the proposed ending presentation and keep its artwork and dialogue replaceable by the authors. A final result should never disappear because a leftover timer updates the state afterward.

### 16.8 Basic usability

Use readable text, keyboard-operable controls and sufficient contrast. Positive/negative price changes include signs, not colour alone. Keep the current trade quantity visible. Rejected orders should explain the problem without destroying the entered value. Essential information must remain available without audio or hover.

Sound, transitions and animations are optional polish. They must not be required to understand events or delay the ability to trade.

## 17. Introduction, feedback and endings

**Proposed minimum introduction:** one short premise paragraph and a compact explanation of wealth, news, trading, checkpoints and Pause. Explain both long trading and short selling because both are part of the finished game.

Useful feedback is concise and tied to the player's action:

- "Bought 20 RMT for $2,400."
- "Not enough available cash. $3,000 is reserved as short collateral."
- "You own 5 units; you cannot sell 10."
- "Game paused. Resume before trading."
- "Short position closed automatically after a price rise."
- "Checkpoint missed: needed $35,000; total wealth was $28,400."

The winning ending can celebrate the player's escape without implying that the displayed wealth was all cash. The losing employment-contract scene should match the humour of the introduction. The player should always understand the numerical reason for the result before the joke lands.

## 18. Practical program boundaries

These boundaries support the concept without requiring a large architecture:

| Part | Responsibility |
| --- | --- |
| Engine | Time, prices, event queues and effects, recovery, trades, short accounting, checkpoints and outcomes. |
| UI | Render the proposed panels, remember local selection, and send player actions. |
| Content | Asset catalogue, headlines, descriptions, locations, effects and follow-up links. |
| Configuration | Adjustable run duration, asset selection, event windows, checkpoints and tuning values. |

Maintain one authoritative game state. Do not separately store cash or prices in different UI panels. Keep source content definitions unchanged during a run; runtime instances and queues belong in state.

Three conceptual engine operations are enough: create a run, advance time, and submit a trade. Restart creates a fresh run. A single application timer passes actual elapsed active time into the engine. Charts, events and individual assets do not own separate simulation clocks.

The engine should step through all elapsed market and scheduled boundaries in chronological order. A delayed browser callback must not skip a checkpoint, apply an effect twice or process a later event after the player already won. An outcome at an earlier boundary ends processing for that run.

**Implementation stack:** React, TypeScript and Vite. Use this accepted baseline without re-requesting a stack decision. It is a local interface and shared-data-contract choice, not a requirement for additional libraries, a backend or hosting.

This guide is self-contained; reading an earlier planning document or conversation is not required to start. Keep engine code, UI code, content and settings separate. A short `AGENTS.md` should point coding assistants to this guide and its contracts, and require unfinished behaviour to be labelled clearly. Do not stop the finished-game task at stubs or a static UI.

## 19. Finished-game configuration

### 19.1 Values that belong in settings

Use one obvious settings file, such as `src/config/gameConfig.ts`. Its data must be easy for the authors to adjust. These are developer/author settings; this guide does not require an in-game settings editor.

| Setting | Initial value | Meaning |
| --- | --- | --- |
| `gameDays` | 100 | Fictional calendar length; ordinary pacing changes leave this at 100. |
| `durationSeconds` | 600 | Active real-time duration. Use 900 for 15 minutes or 1200 for 20 minutes. |
| `startingCashCents` | 2000000 | $20,000 starting cash. |
| `targetWealthCents` | 100000000 | $1,000,000 winning wealth. |
| `priceStepDays` | 0.25 | Four regular price-noise updates per game day. |
| `minimumPriceCents` | 1 | One-cent positive quote floor. |
| `shortCollateralFraction` | 1 | Own-money collateral equal to the opening short-sale value. |
| `shortMaintenanceFraction` | 0.25 | Remaining position equity threshold for forced covering. |
| `recoveryGuardTriggerFraction` | 0.10 | Default guard below 10% of starting price if no cycle is active. |
| `defaultRecoveryWaitDays` | 4 | Guard waiting period. Authored near-collapse effects set their own. |
| `defaultRecoveryDurationDays` | 8 | Guard recovery duration. Authored effects set their own. |
| Checkpoints | Section 7.5's six entries | Store day and `minimumWealthCents` for each entry. |
| Event windows | Section 14.3's five entries | Store start/end game day, `rootCount` and pool weights. |
| Pool weights | 1 for each non-empty authored root pool initially | Equal pool probability until authors tune it. |
| Asset selection | Every valid entry in the asset catalogue | Do not maintain a second compulsory hard-coded list of tickers. |

The checkpoint defaults in integer cents are 500000, 1000000, 2000000, 3500000, 6000000 and 10000000, at days 10, 20, 40, 60, 80 and 95 respectively. The winning target is separate from survival thresholds.

All supplied defaults are usable without further clarification. They remain editable. A missing optional tuning preference is not a reason to stop implementation and ask the user.

### 19.2 Time and money units

Game days are the unit for event delays, trends, recovery, marker duration and checkpoint deadlines. Real seconds are used for active run duration and incoming clock deltas. Calculate their conversion once from the run settings and use it everywhere.

Changing `durationSeconds` must rescale the entire 100-day game automatically. No six-second assumptions may remain in price timers, event callbacks, UI countdowns, recovery code or tests. Do not multiply root counts or noise steps merely because the real run is longer. Validate positive finite duration and a positive whole-number calendar length. If the calendar length itself is changed, its checkpoints and scheduling windows must also fit that calendar; the standard pacing change only adjusts duration.

Every authoritative monetary field uses integer cents. Content uses `startingPriceCents`; run settings use `startingCashCents`, `targetWealthCents`, `minimumPriceCents` and `minimumWealthCents`. Holdings and borrowed units are integers. Fractions are allowed for time and percentage modifiers, not stored monetary balances.

### 19.3 The complete implementation target

Build the finished game described here, including long and short trading, event chains, near-collapse recovery, pause/resume, survival checkpoints, victory/failure and restart. The people instructing the coding agent may separately narrow a particular task. This guide itself describes the complete target and imposes no alternate edition, reduced roster cap or shortened-run requirement.

The introduction, endings, stories, company catalogue and market tuning must be replaceable data or clearly located content. No backend, account system or authoring CMS is required.

## 20. Balance and playtesting

### 20.1 The intended challenge

Turning $20,000 into $1 million requires a 50-fold increase. Ordinary realistic growth is not the aim. Large event multipliers, shorting opportunities and guaranteed recovery from severe crashes are intentional arcade mechanics.

Compounding means a later percentage gain produces a larger dollar gain when the player has more capital. That supports increasing checkpoint minimums, but survival must remain more forgiving than a required winning pace.

### 20.2 Questions to answer by playing

- Can a player who understands several major clues plausibly win?
- Does a run include enough usable opportunities without requiring a specific hidden event sequence?
- Can players survive a mistake and recover, particularly before early checkpoints?
- Are there quiet periods long enough to inspect a chart and plan a trade?
- Are the descriptions short enough to read before a developing story's consequence?
- Are crashes, recovery delays and checkpoint dates combining into unavoidable failures?
- Does buying every near-collapse automatically win with no meaningful decision, or does capital commitment and competing news still matter?
- Do shorts offer useful downside opportunities without becoming free extra spending money?
- Does one asset dominate so completely that the rest of the roster is irrelevant?
- Are wins earned through understandable decisions rather than only through random initial selection?

### 20.3 What can be tuned

Tune checkpoint amounts and dates, event density and weights, shock sizes, trend durations, recovery waits/durations, background volatility, short-maintenance values and the asset mix. Keep the default 100-day calendar and make real duration freely adjustable through `durationSeconds`. Ten minutes is the initial value, not a fixed rule or another approval request.

Do not silently change core rules during balancing. In particular, do not make guaranteed recoveries secretly fail, turn checkpoints into permanent floors, count locked short proceeds as profit or force everyone along an exact $1 million wealth curve.

## 21. Behaviour checks for implementation

These are acceptance examples for the eventual game, not a demand for a large automated testing framework. Use a small number of meaningful checks and a connected playthrough.

| Situation | Required result |
| --- | --- |
| Buy at the current price | Cash falls and owned value rises by the same amount; wealth is unchanged at that price. |
| Sell part of a holding | Cash and quantity update correctly; remaining units stay owned. |
| Invalid or unaffordable order | A readable error; no partial account mutation. |
| Fractional trading quantity | Reject it; holdings and borrowed quantities remain whole numbers. |
| Quote is $12.34 | Store 1234 integer cents; never a floating-point dollar balance. |
| Open a short | Proceeds are locked, own collateral is reserved, available cash falls, and wealth does not jump. |
| Cover part of a short | Correct covering cost and proportional reserve release; remaining liability stays counted. |
| Price jumps past a margin threshold | Cover at the actual new quote; handle settlement and bankruptcy consistently. |
| Wealth equals checkpoint minimum | Pass. |
| Wealth is one cent below checkpoint minimum | Lose. |
| Wealth falls after passing a checkpoint | Continue if positive; the old minimum is not an active floor. |
| Wealth reaches the target while invested | Win without requiring sale of positions. |
| Target reached from an effect exactly at the deadline | Win under the defined deadline order. |
| No target at final deadline | Lose and freeze. |
| Player opens or ignores a news card | Its effects keep their original schedule. |
| Publication plus delayed effect | Apply the effect at publication time plus its authored game-day delay, once. |
| Trend crosses several regular price steps | Apply the correct cumulative multiplier, not the whole multiplier at every step. |
| Near-collapse after a prior price rise | Recover toward catalogue starting price, not pre-crash price. |
| Another near-collapse during recovery | Replace the old recovery cycle once, using the newly authored timings. |
| Pause during an active trend | No price or clock progress; trading disabled; resume without catching up paused time. |
| Browser callback spans multiple events/checkpoints | Process them chronologically and stop at the first terminal outcome. |
| Duration changes from 600 to 900 or 1200 seconds | The same 100 days take 15 or 20 minutes; Day 20 ends at 180 or 240 seconds, and all day-based effects scale consistently. |
| Switch All assets / My holdings | All enabled assets remain purchasable through All assets; positions and counts stay correct. |
| Restart | Fresh account, clock, event queues, recovery state and histories. |
| Run has ended | No further trades, price changes, events or recovery progress. |
| Invalid content reference or cyclic story | Readable content error before the run begins. |
| Add a valid asset object | It is discovered, tradable and visible through the market UI without new engine branches or per-company components. |
| Add a valid root event or story chain | The scheduler discovers it through data; invalid IDs or timing are reported clearly. |

## 22. Next steps, in order

These are instructions for the coding agent building the finished game. Do not convert any step into a routine user-approval request. Work through the sequence using this guide and its supplied defaults.

1. **Review the concept internally.** Reconcile time units, integer money, short-accounting formulas, event fields, recovery and outcome ordering. Use the accepted baseline; do not ask the user to re-confirm it. Record ordinary implementation choices briefly.
2. **Set up the application and contracts.** Use React/TypeScript/Vite. Establish one game state, one clock, shared types and readable validation for settings and author content.
3. **Load editable starter content.** Add the candidate asset data and clearly labelled technical sample events. Include enough valid sample roots and short chains to exercise the configured complete run. These samples are replaceable and are not the final creative library. Do not block on authors supplying final stories.
4. **Implement accounting and trading.** Finish buys, sells, shorts, partial covers, collateral, forced closure, settlement and wealth calculations using integer cents. Invalid requests must leave the account unchanged.
5. **Implement the world simulation.** Add the configurable clock, regular price movement, event windows, delayed effects, story chains, trends, near-collapse recovery and the default recovery guard.
6. **Implement lifecycle and outcomes.** Finish manual pause/resume, checkpoints, bankruptcy, victory/deadline ordering, frozen completed runs and complete restart.
7. **Connect a usable first UI.** Follow Section 16's proposal as a starting point. Keep presentation replaceable, implement all required actions and information, and avoid embedding simulation rules in components. Exact visual composition can receive later tweaks without another approval gate.
8. **Verify the complete game.** Use Section 21's behaviour checks and play through several runs. Test 600-, 900- and 1200-second configurations without altering game-day content. Correct accounting and timing failures before adding polish.
9. **Support author expansion and tune.** Verify that new stocks and stories can be added through data alone. Keep the supplied defaults playable; authors can expand their creative catalogue and adjust balance later. Do not require the coding agent to invent and treat a final 50-100-story library as author-approved material.
10. **Finish and explain what works.** Complete the introduction and ending presentation, concise local setup instructions and a brief account of any genuine remaining limitations. Do not declare completion while required mechanics remain stubs. Formal course documentation is a separate later task.

This is an ordered work sequence, not an allocation to specific people.

## 23. Implementation baseline and defaults

### Accepted gameplay and technical rules

- Default fictional length is 100 game days. Real duration is configurable, initially 600 seconds; day pace and every timed mechanic scale from it.
- Start from the supplied $20,000 default and target $1,000,000 total wealth.
- Support long trades and short selling in the finished game.
- Use whole trading quantities and integer-cent prices, balances, collateral and wealth. Prices may display cents; fractional holdings are not allowed.
- Execute orders immediately at current quotes, with no fees, taxes, dividends, interest or limit-order system.
- Do not hold a long and short in the same asset simultaneously. Use one short lot per asset, with partial covering and proportional reserve release.
- Reserve 100% own-cash short collateral, lock short-sale proceeds and use the 25% maintenance threshold. Settle remaining positions if forced covering makes available cash negative; gaps may lose more than reserved collateral.
- Allow manual pause and disable trading while paused. Browser tab switching does not implicitly pause.
- Lose at total wealth <= 0, a missed checkpoint, or the final deadline below the target. There is no additional immediate $1,000 floor.
- Apply checkpoints once, at the end of the named game day. They are not permanent floors. Use the defined simultaneous-event and final-deadline order.
- Keep asset quotes at or above one cent. Near-collapse assets recover to catalogue starting price, with timings authored per event.
- Implement recovery-cycle replacement, interactions with other effects and the default 10% recovery guard, including its late-run policy.
- Count scheduled roots separately from follow-ups; use no repeats, validate story horizons and use the exact event fields in Section 15.
- Support direct, contextual and indirect clues as author-selected writing styles.
- Use the stated React/TypeScript/Vite baseline and small engine/UI/content/configuration boundaries.

### Presentation remains a proposal

The charcoal/blue map-focused screen, heading, no-footer layout, panel placement, All assets / My holdings controls, news list, chart, short-trading presentation, introduction text and ending artwork are a first-version UI/content proposal. They are not a confirmed final visual design. Use the proposal to produce a working first version; do not request another approval before doing so. Preserve the gameplay rules and access to the required information and actions when tweaking it.

### Author-editable values and candidate content

Checkpoint dates and amounts, the real run duration, asset names/tickers/prices, asset volatility, event pool weights and root counts, effect strengths, recovery waits/durations, story text, locations and ending copy/art are adjustable. Use the explicit defaults in this document where no replacement has been supplied. Candidate company ideas and sample stories are not an agreed final creative catalogue.

There are no pending routine rule or stack questions for the coding agent to ask before implementation. This guide describes the complete game and is not evidence that its code already exists.

## 24. Author-controlled content and extension workflow

### 24.1 What the authors supply

The authors create the creative stories and the tradable company/crypto catalogue. They also adjust the content and balance as the game develops. The application must make those changes straightforward rather than requiring edits to engine or UI source code.

| Author-controlled material | Where it belongs | What can change |
| --- | --- | --- |
| Stocks, cryptocurrencies and commodities | `src/content/assets.json` | IDs/tickers, display names, categories, sectors, starting prices in cents and per-step volatility. |
| World events and story chapters | `src/content/events.json` | Headlines, descriptions, clues, pools, locations, effects, delays, recovery timings and follow-up links. |
| Run and balance settings | `src/config/gameConfig.ts` | Duration, checkpoints, event windows, root counts, pool weights and global numeric defaults. |
| Introduction and ending text | One clearly located content file, such as `src/content/presentation.json` | Premise copy, success/failure copy and fictional employment-contract text. |
| Optional images and sounds | An obvious media directory such as `public/media/` | Replaceable visual and audio files referenced by content or presentation. |

Simple files are sufficient. Do not add an admin account, database, content server or in-game editor just to satisfy authoring. Provide a short example/template and a README describing how to edit and validate the files.

### 24.2 Candidate asset data

This is copyable starter data using the authors' six tentative ideas. Prices and noise values are editable implementation seeds, not final agreements. BMUU is pronounced "BM double U"; its displayed name remains `BMUU` and ticker remains `BMU`.

```json
[
  { "id": "RMT", "name": "Reinmetall", "category": "stock", "sector": "defense", "startingPriceCents": 10000, "noisePerStep": 0.015 },
  { "id": "MCH", "name": "Macrohard", "category": "stock", "sector": "tech", "startingPriceCents": 8000, "noisePerStep": 0.015 },
  { "id": "ALB", "name": "AlphaBett", "category": "stock", "sector": "tech", "startingPriceCents": 12000, "noisePerStep": 0.012 },
  { "id": "CAI", "name": "ClosedAI", "category": "stock", "sector": "ai/tech", "startingPriceCents": 7500, "noisePerStep": 0.020 },
  { "id": "BMU", "name": "BMUU", "category": "stock", "sector": "automotives", "startingPriceCents": 6000, "noisePerStep": 0.012 },
  { "id": "NRC", "name": "NotRugpullCoin", "category": "crypto", "sector": "crypto", "startingPriceCents": 1000, "noisePerStep": 0.030 }
]
```

The engine and market UI must consume the catalogue dynamically. Do not hard-code these six symbols as TypeScript enum members, create one component per company, or set an assumed fixed roster size. Include every valid catalogue entry by default. An optional exclusion/selection setting can be added for authors, but it must not require registering every new asset in a second file.

### 24.3 Adding or changing a stock

1. Copy an asset object in `assets.json` and give it a unique stable `id`. In this contract the ID also acts as the displayed ticker.
2. Set its display name, `category` and sector. Categories are `stock`, `crypto` and `commodity`; sectors are free descriptive labels, not hard-coded company logic.
3. Set positive integer `startingPriceCents`. For $125.50 enter `12550`. This also becomes its recovery baseline.
4. Set `noisePerStep` as a fraction, such as `0.015` for a possible -1.5% to +1.5% movement per regular step.
5. Save and validate. On a fresh run it must appear in the available market list, have price history, support trading and be usable by events without UI or engine edits.
6. Add event effects referencing the new ID if desired. A stock can still be loaded before a dedicated story is written.

Changing a display name or price does not require changing event references. Changing or deleting an ID does: update every referencing effect and any optional selection settings, then validate. Do not silently ignore broken references. Content changes apply to new runs; do not change a running asset's starting-price recovery target halfway through play.

### 24.4 Adding a standalone world event

1. Copy the complete event object in Section 15 into the `events.json` array and use a unique `id`.
2. Set its pool, headline and description. Authors choose whether clues are contextual, directional or indirect.
3. Set a map location or the documented global location. Set how long its marker stays visible in game days.
4. Set `randomEligible: true` and a positive weight for a root event.
5. Add effects referencing existing asset IDs. State the percentage fraction, game-day delay and duration explicitly; use a recovery object only for `near_collapse`.
6. For a standalone event, leave `followUps` as `[]`. For a linked story, follow the next subsection.
7. Validate, then start a fresh run. The scheduler should discover the new eligible event from data alone. It does not require a new engine branch, component, import statement or manual list of allowed event IDs.

### 24.5 Adding a storyline

1. Write each chapter as an ordinary event object with its own unique ID, text, location and effects.
2. Make the first chapter a root. Set subsequent chapters to `randomEligible: false` and weight 0.
3. Link chapters using `followUps`, whose `delayDays` is measured from the parent's publication. Every listed follow-up occurs; it is not an implicit random branch.
4. Check the full story horizon: parent delays, child delays, trends and recoveries must fit the remaining run for a root to be eligible.
5. Do not create missing references, cycles, duplicate follow-ups or multiple parents for one non-repeatable follow-up chapter.
6. Preview the chain with controlled timing or a repeatable internal seed. Check that its writing, clues, actual price effects and recovery behaviour agree.

The authors supply the creative narrative. The coding agent supplies reliable execution and clearly labelled technical examples; it should not present its placeholder text as an agreed final story library.

### 24.6 Editing and validation expectations

- Adding an entry to either content array is enough for discovery. Use simple data loaders and no hand-maintained registration switches.
- Report useful errors with file path, asset/event ID and field name, such as `events.json: politics_defence_budget_freeze.effects[0].assetId: unknown asset RMT`.
- Validate unique IDs, required fields, allowed values, integer cents, positive starting prices, safe whole quantities, valid percentages, coordinates, references, non-cyclic stories and enough eligible content for the configured root quotas.
- Make a local validation command available, such as `npm run validate:content`, as well as validation before a new run. Authors should not have to discover a malformed ID halfway through a run.
- Keep a copyable event template and asset example in the README or adjacent authoring instructions. Changing standard data should not require understanding React or simulation code.
- Use new runs to check saved edits. Re-reading content must not partially hot-swap an active run's balances, recovery baseline or pending story links.
- Supply functional sample content sufficient to run the configured schedule while final creative stories are being authored. Label it as sample content. Preserve strict quotas and validation rather than silently discarding roots or waiting for user clarification.
