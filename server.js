const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------
function defaultState() {
  return {
    phase: 'lobby',
    companies: {
      A: { kind: 'IPO', name: 'Nimbus Tech', low: 90, high: 100, shares: 100000, cutoff: null, useOfFunds: 'Cloud infrastructure expansion' },
      B: { kind: 'FPO', name: 'Coral Foods', marketPrice: 250, discountPct: 5, shares: 60000, issuePrice: null, useOfFunds: 'Debt repayment' },
      C: { kind: 'RIGHTS_QIB', name: 'Solstice Energy', rightsPrice: 150, rightsRatio: 1, rightsShares: 4000, qibPrice: 180, qibShares: 40000, useOfFunds: 'New plant capex' },
    },
    investors: {
      1: { exchange: 'NSE', cash: 1500000, qib: false, existingC: true, fii: false, holdings: { A: 0, B: 0, C: 500 } },
      2: { exchange: 'NSE', cash: 1800000, qib: true, existingC: false, fii: false, holdings: { A: 0, B: 0, C: 0 } },
      3: { exchange: 'NSE', cash: 2000000, qib: true, existingC: false, fii: true, holdings: { A: 0, B: 0, C: 0 } },
      4: { exchange: 'BSE', cash: 1500000, qib: false, existingC: true, fii: false, holdings: { A: 0, B: 0, C: 500 } },
      5: { exchange: 'BSE', cash: 2000000, qib: true, existingC: false, fii: true, holdings: { A: 0, B: 0, C: 0 } },
      6: { exchange: 'BSE', cash: 1500000, qib: false, existingC: false, fii: false, holdings: { A: 0, B: 0, C: 0 } },
    },
    bidsIPO: [], bidsFPO: [], bidsRights: [], bidsQIB: [],
    orders: { NSE: [], BSE: [] },
    trades: [],
    prices: { NSE: { A: null, B: null, C: null }, BSE: { A: null, B: null, C: null } },
    haltedCompanies: [],
    frozenInvestors: [],
    sebiEvents: [
      { id: 's1', title: 'Accounting Fraud Rumor — Company A', desc: 'SEBI halts trading in Company A pending inquiry.', effect: 'halt', company: 'A', triggered: false },
      { id: 's2', title: 'Insider Trading Probe', desc: 'SEBI flags a desk for suspicious order patterns just before news broke. Freeze a desk from the panel below.', effect: 'freeze', triggered: false },
      { id: 's3', title: 'Investor Grievance Redressal Order', desc: "SEBI orders Company B to improve disclosure. No trading impact — discuss SEBI's investor-protection mandate with the room.", effect: 'announce', triggered: false },
    ],
    rbiEvents: [
      { id: 'r1', title: 'Repo Rate Hiked 50bps', desc: 'RBI tightens policy. All fresh limit/stop prices this round should be revised down — borrowing just got costlier.', effect: 'announce', triggered: false },
      { id: 'r2', title: 'Rupee Depreciates vs Dollar', desc: 'RBI intervenes in the forex market to defend the rupee. Import-heavy Company B feels margin pressure — announce to the room.', effect: 'announce', triggered: false },
      { id: 'r3', title: "RBI Bond Market Signal", desc: "RBI open market operations push bond yields down, making equities relatively more attractive. Discuss RBI's bond-market role vs SEBI's equity mandate.", effect: 'announce', triggered: false },
    ],
    globalEvents: [
      { id: 'g1', title: 'US Fed Hikes Rates', desc: 'Foreign Institutional Investors (FII-tagged desks) trim India exposure. Forces a partial sell for all FII desks.', effect: 'fii_outflow', triggered: false },
      { id: 'g2', title: 'IOSCO Cross-Border Alert', desc: "A global regulators' body flags unusual cross-listed activity. Company C trading is halted for review — a reminder that regulators coordinate across borders.", effect: 'halt', company: 'C', triggered: false },
      { id: 'g3', title: 'Global Risk-Off Sentiment', desc: 'Global markets sell off overnight. Announce to the room: expect wider bid-ask spreads this round.', effect: 'announce', triggered: false },
    ],
    eventLog: [],
    niftyConstituents: [
      { name: 'Vertex Industries', mcap: 520000 }, { name: 'Hallmark Bank', mcap: 480000 },
      { name: 'Orbit Energy', mcap: 410000 }, { name: 'Prime Motors', mcap: 390000 },
      { name: 'Meridian Retail', mcap: 350000 }, { name: 'Solace Pharma', mcap: 300000 },
      { name: 'Anchor Auto', mcap: 260000 }, { name: 'Loom Textiles', mcap: 180000 },
    ],
    sensexConstituents: [
      { name: 'Vertex Industries', mcap: 515000 }, { name: 'Hallmark Bank', mcap: 470000 },
      { name: 'Orbit Energy', mcap: 405000 }, { name: 'Prime Motors', mcap: 385000 },
      { name: 'Meridian Retail', mcap: 345000 }, { name: 'Solace Pharma', mcap: 295000 },
      { name: 'Anchor Auto', mcap: 255000 }, { name: 'Loom Textiles', mcap: 175000 },
    ],
  };
}

let state = defaultState();

function midPrice(cid) {
  const n = state.prices.NSE[cid], b = state.prices.BSE[cid];
  if (n && b) return (n + b) / 2;
  return n || b || null;
}
function broadcast() { io.emit('state', state); }
function log(text) { state.eventLog.push({ time: new Date().toLocaleTimeString('en-IN'), text }); }

// ---------------------------------------------------------------------
// ACTIONS (ported 1:1 from the original client-side logic)
// ---------------------------------------------------------------------
function setPhase(p) { state.phase = p; }

function submitIPOBid({ investor, qty, price }) {
  if (!qty || !price) return;
  state.bidsIPO = state.bidsIPO.filter(b => b.investor !== investor);
  state.bidsIPO.push({ investor, qty, price });
}
function submitFPOBid({ investor, qty }) {
  if (!qty) return;
  state.bidsFPO = state.bidsFPO.filter(b => b.investor !== investor);
  state.bidsFPO.push({ investor, qty });
}
function submitRightsBid({ investor, qty }) {
  if (!qty) return;
  state.bidsRights = state.bidsRights.filter(b => b.investor !== investor);
  state.bidsRights.push({ investor, qty });
}
function submitQIBBid({ investor, qty }) {
  if (!qty) return;
  state.bidsQIB = state.bidsQIB.filter(b => b.investor !== investor);
  state.bidsQIB.push({ investor, qty });
}

function computeAllotment() {
  const A = state.companies.A;
  const bids = state.bidsIPO.slice().sort((a, b) => b.price - a.price);
  let cum = 0, cutoff = A.low;
  for (const b of bids) { cum += b.qty; cutoff = b.price; if (cum >= A.shares) break; }
  const qual = bids.filter(b => b.price >= cutoff);
  const totalAtCutoff = qual.reduce((s, b) => s + b.qty, 0);
  const ratioA = totalAtCutoff > 0 ? Math.min(1, A.shares / totalAtCutoff) : 0;
  A.cutoff = cutoff;
  qual.forEach(b => {
    let alloted = Math.floor(b.qty * ratioA);
    const inv = state.investors[b.investor];
    const affordable = Math.floor(inv.cash / cutoff);
    alloted = Math.max(0, Math.min(alloted, affordable));
    if (alloted > 0) { inv.holdings.A += alloted; inv.cash -= alloted * cutoff; }
  });
  state.prices.NSE.A = cutoff; state.prices.BSE.A = cutoff;

  const B = state.companies.B;
  B.issuePrice = Math.round(B.marketPrice * (1 - B.discountPct / 100));
  const totalFPO = state.bidsFPO.reduce((s, b) => s + b.qty, 0);
  const ratioB = totalFPO > 0 ? Math.min(1, B.shares / totalFPO) : 0;
  state.bidsFPO.forEach(b => {
    let alloted = Math.floor(b.qty * ratioB);
    const inv = state.investors[b.investor];
    const affordable = Math.floor(inv.cash / B.issuePrice);
    alloted = Math.max(0, Math.min(alloted, affordable));
    if (alloted > 0) { inv.holdings.B += alloted; inv.cash -= alloted * B.issuePrice; }
  });
  state.prices.NSE.B = B.issuePrice; state.prices.BSE.B = B.issuePrice;

  const C = state.companies.C;
  const totalRights = state.bidsRights.reduce((s, b) => s + b.qty, 0);
  const ratioR = totalRights > 0 ? Math.min(1, C.rightsShares / totalRights) : 0;
  state.bidsRights.forEach(b => {
    const inv = state.investors[b.investor];
    if (!inv.existingC) return;
    const entitlement = inv.holdings.C * C.rightsRatio;
    const capped = Math.min(b.qty, entitlement);
    let alloted = Math.floor(capped * ratioR);
    const affordable = Math.floor(inv.cash / C.rightsPrice);
    alloted = Math.max(0, Math.min(alloted, affordable));
    if (alloted > 0) { inv.holdings.C += alloted; inv.cash -= alloted * C.rightsPrice; }
  });
  const totalQIB = state.bidsQIB.reduce((s, b) => s + b.qty, 0);
  const ratioQ = totalQIB > 0 ? Math.min(1, C.qibShares / totalQIB) : 0;
  state.bidsQIB.forEach(b => {
    const inv = state.investors[b.investor];
    if (!inv.qib) return;
    let alloted = Math.floor(b.qty * ratioQ);
    const affordable = Math.floor(inv.cash / C.qibPrice);
    alloted = Math.max(0, Math.min(alloted, affordable));
    if (alloted > 0) { inv.holdings.C += alloted; inv.cash -= alloted * C.qibPrice; }
  });
  const refPriceC = Math.round((C.rightsPrice + C.qibPrice) / 2);
  state.prices.NSE.C = refPriceC; state.prices.BSE.C = refPriceC;

  state.phase = 'allotment';
}

function submitOrder({ investor, company, side, type, qty, price, stopPrice, targetPrice }) {
  if (state.frozenInvestors.includes(investor)) return { error: 'This desk is frozen this round.' };
  if (state.haltedCompanies.includes(company)) return { error: 'Trading in this company is halted right now.' };
  if (!qty) return { error: 'Quantity required.' };
  const exch = state.investors[investor].exchange;
  const order = {
    id: Date.now() + '-' + investor, investor, company, side, type, qty, remaining: qty,
    price: price || null, stopPrice: stopPrice || null, targetPrice: targetPrice || null,
    status: (type === 'stop' || type === 'stoplimit') ? 'waiting-trigger' : 'active',
    bracketId: null,
  };
  if (type === 'bracket') {
    order.bracketRole = 'entry'; order.bracketId = order.id;
    order.type = order.price ? 'limit-entry' : 'market-entry';
  }
  state.orders[exch].push(order);
  return {};
}

function tryTrade(buy, sell, exch, cid) {
  const buyer = state.investors[buy.investor], seller = state.investors[sell.investor];
  const qty = Math.min(buy.remaining, sell.remaining);
  if (seller.holdings[cid] < qty) return false;
  let price;
  const buyIsMarket = buy.type === 'market' || buy.type === 'market-entry';
  const sellIsMarket = sell.type === 'market' || sell.type === 'market-entry';
  if (buyIsMarket && sellIsMarket) price = state.prices[exch][cid] || sell.price || buy.price || 100;
  else if (buyIsMarket) price = sell.price;
  else if (sellIsMarket) price = buy.price;
  else price = Math.round((buy.price + sell.price) / 2);
  const cost = qty * price;
  if (buyer.cash < cost) return false;
  buyer.cash -= cost; buyer.holdings[cid] += qty;
  seller.cash += cost; seller.holdings[cid] -= qty;
  buy.remaining -= qty; sell.remaining -= qty;
  state.trades.push({ time: new Date().toLocaleTimeString('en-IN'), exchange: exch, company: cid, qty, price, buyer: buy.investor, seller: sell.investor, settlement: 'pending' });
  state.prices[exch][cid] = price;
  return true;
}

function runMatching(exch) {
  ['A', 'B', 'C'].forEach(cid => {
    if (state.haltedCompanies.includes(cid)) return;
    state.orders[exch].filter(o => o.company === cid && o.status === 'waiting-trigger').forEach(o => {
      const last = state.prices[exch][cid];
      if (last == null) return;
      const hit = o.side === 'sell' ? last <= o.stopPrice : last >= o.stopPrice;
      if (hit) { o.status = 'active'; o.type = (o.type === 'stop') ? 'market' : 'limit'; }
    });
    let buys = state.orders[exch].filter(o => o.company === cid && o.side === 'buy' && o.remaining > 0 && o.status === 'active').sort((a, b) => {
      const am = (a.type === 'market' || a.type === 'market-entry'), bm = (b.type === 'market' || b.type === 'market-entry');
      if (am && !bm) return -1; if (bm && !am) return 1; return (b.price || 0) - (a.price || 0);
    });
    let sells = state.orders[exch].filter(o => o.company === cid && o.side === 'sell' && o.remaining > 0 && o.status === 'active').sort((a, b) => {
      const am = (a.type === 'market' || a.type === 'market-entry'), bm = (b.type === 'market' || b.type === 'market-entry');
      if (am && !bm) return -1; if (bm && !am) return 1; return (a.price || 0) - (b.price || 0);
    });
    let bi = 0, si = 0, guard = 0;
    while (bi < buys.length && si < sells.length && guard < 2000) {
      guard++;
      const b = buys[bi], s = sells[si];
      if (b.remaining <= 0) { bi++; continue; } if (s.remaining <= 0) { si++; continue; }
      if (b.investor === s.investor) { if (b.remaining <= s.remaining) bi++; else si++; continue; }
      const bIsMarket = b.type === 'market' || b.type === 'market-entry';
      const sIsMarket = s.type === 'market' || s.type === 'market-entry';
      if (!bIsMarket && !sIsMarket && b.price < s.price) break;
      const ok = tryTrade(b, s, exch, cid);
      if (!ok) { bi++; continue; }
      if (b.remaining === 0) bi++;
      if (s.remaining === 0) si++;
    }
    state.orders[exch].filter(o => o.company === cid && o.bracketRole === 'entry' && o.remaining === 0 && !o.expanded).forEach(entry => {
      entry.expanded = true;
      const filledQty = entry.qty;
      if (entry.targetPrice) state.orders[exch].push({ id: entry.bracketId + '-t', investor: entry.investor, company: cid, side: 'sell', type: 'limit', qty: filledQty, remaining: filledQty, price: entry.targetPrice, status: 'active', bracketId: entry.bracketId, bracketRole: 'target' });
      if (entry.stopPrice) state.orders[exch].push({ id: entry.bracketId + '-s', investor: entry.investor, company: cid, side: 'sell', type: 'stop', qty: filledQty, remaining: filledQty, stopPrice: entry.stopPrice, status: 'waiting-trigger', bracketId: entry.bracketId, bracketRole: 'stop' });
    });
    const brackets = {};
    state.orders[exch].filter(o => o.company === cid && (o.bracketRole === 'target' || o.bracketRole === 'stop')).forEach(o => {
      brackets[o.bracketId] = brackets[o.bracketId] || []; brackets[o.bracketId].push(o);
    });
    Object.values(brackets).forEach(pair => {
      if (pair.length === 2) {
        const filled = pair.find(o => o.remaining === 0);
        if (filled) { pair.forEach(o => { if (o.remaining > 0) { o.remaining = 0; o.status = 'cancelled-oco'; } }); }
      }
    });
    state.orders[exch] = state.orders[exch].filter(o => o.remaining > 0 || o.status === 'waiting-trigger');
  });
}

function settleTrades() {
  state.trades.forEach(t => { if (t.settlement === 'pending') t.settlement = 'settled'; });
  log('Clearing house ran T+1 settlement — all pending trades marked settled.');
}

function triggerRegEvent({ bucket, id }) {
  const ev = state[bucket].find(e => e.id === id);
  if (!ev || ev.triggered) return;
  ev.triggered = true;
  if (ev.effect === 'halt') { if (!state.haltedCompanies.includes(ev.company)) state.haltedCompanies.push(ev.company); }
  if (ev.effect === 'fii_outflow') {
    Object.keys(state.investors).forEach(iid => {
      const inv = state.investors[iid];
      if (inv.fii) {
        ['A', 'B', 'C'].forEach(cid => {
          const sellQty = Math.floor(inv.holdings[cid] * 0.3);
          const p = midPrice(cid);
          if (sellQty > 0 && p) { inv.holdings[cid] -= sellQty; inv.cash += sellQty * p; }
        });
      }
    });
  }
  log(ev.title);
}
function freezeSelected({ id }) {
  if (id && !state.frozenInvestors.includes(id)) state.frozenInvestors.push(id);
  log('Desk ' + id + ' frozen by SEBI');
}
function liftHalts() { state.haltedCompanies = []; log('All halts lifted'); }
function unfreezeAll() { state.frozenInvestors = []; log('All desks unfrozen'); }
function resetGame() { state = defaultState(); }
function updateCompany({ id, patch }) {
  Object.keys(patch).forEach(k => { state.companies[id][k] = (typeof patch[k] === 'string' && !isNaN(Number(patch[k])) && k !== 'name' && k !== 'useOfFunds') ? Number(patch[k]) : patch[k]; });
}

// ---------------------------------------------------------------------
// SOCKET WIRING
// ---------------------------------------------------------------------
io.on('connection', (socket) => {
  socket.emit('state', state);

  const wrap = (fn) => (payload) => { try { fn(payload); broadcast(); } catch (e) { console.error(e); } };

  socket.on('setPhase', wrap((p) => setPhase(p)));
  socket.on('submitIPOBid', wrap(submitIPOBid));
  socket.on('submitFPOBid', wrap(submitFPOBid));
  socket.on('submitRightsBid', wrap(submitRightsBid));
  socket.on('submitQIBBid', wrap(submitQIBBid));
  socket.on('computeAllotment', wrap(() => computeAllotment()));
  socket.on('submitOrder', wrap(submitOrder));
  socket.on('runMatching', wrap((exch) => runMatching(exch)));
  socket.on('settleTrades', wrap(() => settleTrades()));
  socket.on('triggerRegEvent', wrap(triggerRegEvent));
  socket.on('freezeSelected', wrap(freezeSelected));
  socket.on('liftHalts', wrap(() => liftHalts()));
  socket.on('unfreezeAll', wrap(() => unfreezeAll()));
  socket.on('resetGame', wrap(() => resetGame()));
  socket.on('updateCompany', wrap(updateCompany));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Capital Markets Live running on port ' + PORT));
