#!/usr/bin/env python3
"""Scale simulation for the 2026-08-13 Morpho sNUSD flashloan case.

Model: constant-product pool (USDC/sNUSD) + Morpho borrow at oracle*LLTV.
Anchors: real trade values. Pool depth is an ASSUMPTION (historical pool
state JSON was not saved), calibrated so the average buy price at the real
trade size matches the observed 0.68618681 USDC/sNUSD.
"""

from pathlib import Path

# --- real anchors from daily/2026-08-15.md (Ethereum mainnet, tx ...c4e72) ---
LLTV = 0.915                   # market LTV / liquidation trigger
DONATION_NET = 130.347532      # USDC, donation cost not recovered
GAS_USD = 0.43
ACTUAL_BUY_USDC = 709.926805
ACTUAL_SNUSD = 1034.596985500417093984
ACTUAL_AVG_PRICE = ACTUAL_BUY_USDC / ACTUAL_SNUSD  # ~0.68618681
ORACLE_PRICE = 1006.940350 / (ACTUAL_SNUSD * LLTV)  # back-computed from real trade; ~1.06391

# --- pool depth assumption (ponytail: single initial-price knob; swap for
# real pool reserves if historical state is ever archived) ---
ASSUMED_INITIAL_PRICE = 0.60   # USDC per sNUSD, marginal price before the buy


def pool_depth():
    # avg_price(u) = p0 + u / R_snusd under constant product; fit R at the real trade.
    r_snusd = ACTUAL_BUY_USDC / (ACTUAL_AVG_PRICE - ASSUMED_INITIAL_PRICE)
    r_usdc = ASSUMED_INITIAL_PRICE * r_snusd
    return r_usdc, r_snusd


def buy_snusd(u, r_usdc, r_snusd):
    """Constant-product buy: spend u USDC, receive sNUSD."""
    return r_snusd * u / (r_usdc + u)


def net_profit(u, r_usdc, r_snusd):
    s = buy_snusd(u, r_usdc, r_snusd)
    borrowable = s * ORACLE_PRICE * LLTV  # ponytail: skips market-supply cap
    return borrowable - u - DONATION_NET - GAS_USD, s, borrowable


def main():
    out = Path("outputs/20260816-scale-simulation")
    out.mkdir(parents=True, exist_ok=True)
    r_usdc, r_snusd = pool_depth()

    rows = []
    prev_net = None
    peak = max_u = None
    zero_u = []
    for u in range(100, 20001, 50):
        net, s, borrowable = net_profit(u, r_usdc, r_snusd)
        rows.append((u, s, u / s, borrowable, net))
        if peak is None or net > peak:
            peak, max_u = net, u
        if prev_net is not None and prev_net * net < 0:
            zero_u.append(u)
        prev_net = net

    # --- checks: real trade must reproduce observed values ---
    net_real, s_real, borrow_real = net_profit(ACTUAL_BUY_USDC, r_usdc, r_snusd)
    assert abs(s_real - ACTUAL_SNUSD) / ACTUAL_SNUSD < 1e-9, s_real
    assert abs(borrow_real - 1006.940350) < 0.01, borrow_real
    assert abs(net_real - (166.666013 - GAS_USD)) < 0.02, net_real
    assert zero_u, "profit never crossed zero in scanned range"

    print(f"pool assumption: initial marginal price {ASSUMED_INITIAL_PRICE} "
          f"USDC/sNUSD -> reserves {r_usdc:,.0f} USDC / {r_snusd:,.0f} sNUSD")
    print(f"real-trade check: buy {ACTUAL_BUY_USDC} -> {s_real:.6f} sNUSD, "
          f"borrow {borrow_real:.6f}, net {net_real:.6f} (record: 166.666013)")
    print(f"peak net profit {peak:.2f} USDC at buy size ~{max_u} USDC "
          f"({max_u/ACTUAL_BUY_USDC:.1f}x real size)")
    print(f"net profit returns to zero at ~{zero_u[-1]} USDC "
          f"({zero_u[-1]/ACTUAL_BUY_USDC:.1f}x real size)")

    with (out / "simulation.csv").open("w") as f:
        f.write("buy_usdc,snusd_received,avg_price,borrowable_usdc,net_profit_usdc\n")
        for r in rows:
            f.write(",".join(f"{x:.10f}" for x in r) + "\n")
    print("saved:", out / "simulation.csv")

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib import font_manager
        font_manager.fontManager.addfont("/mnt/c/Windows/Fonts/msyh.ttc")
        plt.rcParams["font.family"] = "Microsoft YaHei"
        plt.rcParams["axes.unicode_minus"] = False
    except ImportError:
        print("matplotlib not available; CSV only. Run: uv run --with matplotlib "
              "tools/snusd-scale-simulation.py")
        return

    # --- plot ---
    us = [r[0] for r in rows]
    nets = [r[4] for r in rows]
    avgs = [r[2] for r in rows]

    fig, ax1 = plt.subplots(figsize=(11, 6.5))
    ax1.axhline(0, color="#999", lw=1)
    ax1.plot(us, nets, color="#3f67b5", lw=2.5, label="净利润 (借出 − 买入 − donation − gas)")
    ax1.axvline(ACTUAL_BUY_USDC, color="#15171a", ls="--", lw=1.5,
                label=f"真实交易 买入 {ACTUAL_BUY_USDC:.0f} USDC")
    ax1.axvline(max_u, color="#c05621", ls=":", lw=1.5, label=f"最优规模 ~{max_u} USDC (峰值 {peak:.0f})")
    ax1.axvline(zero_u[-1], color="#9b2c2c", ls=":", lw=1.5, label=f"盈亏平衡 ~{zero_u[-1]} USDC")
    ax1.scatter([ACTUAL_BUY_USDC], [net_real], color="#15171a", zorder=5)
    ax1.set_xlabel("闪电贷买入规模 (USDC)")
    ax1.set_ylabel("净利润 (USDC)", color="#3f67b5")
    ax1.tick_params(axis="y", labelcolor="#3f67b5")
    ax1.set_ylim(min(nets) - 20, max(nets) * 1.15)

    ax2 = ax1.twinx()
    ax2.plot(us, avgs, color="#e07a5f", lw=2, label="DEX 池子均价 (USDC/sNUSD)")
    ax2.axhline(ORACLE_PRICE * LLTV, color="#6b7280", ls="-.", lw=1.2,
                label=f"可借上限 oracle×LTV = {ORACLE_PRICE*LLTV:.4f}")
    ax2.set_ylabel("池子均价 (USDC/sNUSD)", color="#e07a5f")
    ax2.tick_params(axis="y", labelcolor="#e07a5f")

    l1, lb1 = ax1.get_legend_handles_labels()
    l2, lb2 = ax2.get_legend_handles_labels()
    ax1.legend(l1 + l2, lb1 + lb2, loc="upper right", fontsize=9, framealpha=0.95)
    ax1.set_title("sNUSD 闪电贷套利：规模 vs 净利润（模拟，非真实收益）", fontsize=13)
    fig.tight_layout()
    chart = out / "profit-vs-scale.png"
    fig.savefig(chart, dpi=150)
    print("saved:", chart)


if __name__ == "__main__":
    main()
