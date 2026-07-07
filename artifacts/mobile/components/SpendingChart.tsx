import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useBudget } from "@/context/BudgetContext";
import { Colors } from "@/constants/colors";
import type { BudgetData } from "@/types";

// ─── Animated primitives ────────────────────────────────────────────────────
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Constants ──────────────────────────────────────────────────────────────
const CHART_H = 165;   // total SVG height
const PAD_L   = 48;    // left padding — room for Y-axis labels
const PAD_R   = 10;    // right padding
const PAD_T   = 8;     // top padding
const PAD_B   = 24;    // bottom padding — room for X-axis labels
const GRID_N  = 3;     // number of Y gridlines (including 0)
const ACCENT  = Colors.accentPositive;

type Range = "week" | "month" | "year";

interface DataPoint {
  label: string;
  value: number;
  showLabel: boolean;
}

// ─── Data computation ───────────────────────────────────────────────────────
function computeData(range: Range, data: BudgetData): DataPoint[] {
  const now = new Date();
  const curMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (range === "week") {
    return Array.from({ length: 7 }, (_, revI) => {
      const i = 6 - revI;
      const d = new Date(Date.now() - i * 86_400_000);
      const dateStr = d.toISOString().slice(0, 10);
      const monthStr = dateStr.slice(0, 7);
      const monthStart = `${monthStr}-01`;
      const deps = data.deposits
        .filter(x => x.date >= monthStart && x.date <= dateStr)
        .reduce((s, x) => s + x.amount, 0);
      const exps = data.expenses
        .filter(x => x.date >= monthStart && x.date <= dateStr)
        .reduce((s, x) => s + x.amount, 0);
      return {
        label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
        value: data.budget + deps - exps,
        showLabel: true,
      };
    });
  }

  if (range === "month") {
    const currentDay = now.getDate();
    const monthStart = `${curMonthStr}-01`;
    return Array.from({ length: currentDay }, (_, idx) => {
      const d = idx + 1;
      const dateStr = `${curMonthStr}-${String(d).padStart(2, "0")}`;
      const deps = data.deposits
        .filter(x => x.date >= monthStart && x.date <= dateStr)
        .reduce((s, x) => s + x.amount, 0);
      const exps = data.expenses
        .filter(x => x.date >= monthStart && x.date <= dateStr)
        .reduce((s, x) => s + x.amount, 0);
      return {
        label: String(d),
        value: data.budget + deps - exps,
        showLabel: d === 1 || d % 7 === 1 || d === currentDay,
      };
    });
  }

  if (range === "year") {
    const year = now.getFullYear();
    const curMonth = now.getMonth();
    let cumulative = 0;
    return Array.from({ length: curMonth + 1 }, (_, m) => {
      const monthStr = `${year}-${String(m + 1).padStart(2, "0")}`;
      const deps = data.deposits
        .filter(x => x.date.startsWith(monthStr))
        .reduce((s, x) => s + x.amount, 0);
      const exps = data.expenses
        .filter(x => x.date.startsWith(monthStr))
        .reduce((s, x) => s + x.amount, 0);
      cumulative += data.budget + deps - exps;
      return {
        label: new Date(year, m, 1).toLocaleDateString("en-US", { month: "short" }),
        value: cumulative,
        showLabel: true,
      };
    });
  }

  return [];
}

// ─── Catmull-Rom → cubic bezier path ────────────────────────────────────────
function buildSmoothPath(pts: { x: number; y: number }[], tension = 0.35): string {
  if (pts.length < 2) return "";
  const segs: string[] = [`M ${f(pts[0].x)},${f(pts[0].y)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    segs.push(`C ${f(cp1x)},${f(cp1y)} ${f(cp2x)},${f(cp2y)} ${f(p2.x)},${f(p2.y)}`);
  }
  return segs.join(" ");
}

const f = (n: number) => n.toFixed(1);

// ─── Y-axis label formatter ──────────────────────────────────────────────────
function fmtY(val: number, symbol: string): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return `${symbol}${(val / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `${symbol}${Math.round(val / 1000)}K`;
  if (abs >= 1_000)     return `${symbol}${(val / 1000).toFixed(1)}K`;
  return `${symbol}${Math.round(val)}`;
}

// ─── Insufficient data messages ─────────────────────────────────────────────
const EMPTY_MSGS: Record<Range, string> = {
  week:  "Add your first transaction\nto see your weekly balance trend",
  month: "Check back in a couple of days\nto see your monthly trend",
  year:  "Keep tracking through February\nto see your yearly trend",
};

// ─── Toggle config ───────────────────────────────────────────────────────────
const RANGES: { key: Range; label: string }[] = [
  { key: "week",  label: "Week"  },
  { key: "month", label: "Month" },
  { key: "year",  label: "Year"  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function SpendingChart() {
  const { data } = useBudget();
  const [range, setRange] = useState<Range>("month");
  const [svgTotalW, setSvgTotalW] = useState(0);

  const clipW = useSharedValue(0);
  const animatedClipProps = useAnimatedProps(() => ({ width: clipW.value }));

  // Data depends on expenses + deposits + budget + range
  const points = useMemo(
    () => computeData(range, data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, data.expenses, data.deposits, data.budget],
  );

  // Is the time window too narrow to draw a meaningful chart?
  const isInsufficient = useMemo(() => {
    if (data.budget === 0) return true;                              // not onboarded
    if (range === "week"  && data.expenses.length === 0 && data.deposits.length === 0) return true;
    if (range === "month" && new Date().getDate() < 2) return true; // day 1 of month
    if (range === "year"  && new Date().getMonth() < 1) return true; // January
    return false;
  }, [range, data.budget, data.expenses.length, data.deposits.length]);

  // Inner chart area dimensions
  const chartW = svgTotalW - PAD_L - PAD_R;   // drawable width
  const chartH = CHART_H   - PAD_T - PAD_B;   // drawable height

  // Min/max for scale (always include 0 in range so line is contextualised)
  const values  = points.map(p => p.value);
  const maxVal  = Math.max(...values, data.budget > 0 ? data.budget : 100, 0);
  const minVal  = Math.min(...values, 0);
  const valSpan = maxVal - minVal || 1;

  // Map data points to SVG coordinates
  const svgPts = useMemo(() => {
    if (svgTotalW <= 0 || points.length < 2) return [];
    return points.map((p, i) => ({
      x: PAD_L + (i / Math.max(points.length - 1, 1)) * chartW,
      y: PAD_T + (1 - (p.value - minVal) / valSpan) * chartH,
    }));
  }, [points, svgTotalW, chartW, chartH, minVal, valSpan]);

  // SVG paths
  const linePath = useMemo(() => buildSmoothPath(svgPts), [svgPts]);
  const areaPath = useMemo(() => {
    if (svgPts.length < 2) return "";
    const bot = PAD_T + chartH;
    return `${linePath} L ${f(svgPts[svgPts.length - 1].x)},${f(bot)} L ${f(svgPts[0].x)},${f(bot)} Z`;
  }, [linePath, svgPts, chartH]);

  // Horizontal gridlines
  const gridLines = useMemo(() => {
    return Array.from({ length: GRID_N + 1 }, (_, i) => {
      const t = i / GRID_N;
      return {
        y:     PAD_T + (1 - t) * chartH,
        label: fmtY(minVal + t * valSpan, data.currencySymbol),
      };
    });
  }, [minVal, valSpan, chartH, data.currencySymbol]);

  // Trigger left→right reveal animation whenever chart data changes
  useEffect(() => {
    if (isInsufficient || svgTotalW <= 0 || points.length < 2) return;
    clipW.value = 0;
    clipW.value = withTiming(chartW, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, [points, isInsufficient, svgTotalW]);

  return (
    <View style={styles.card}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Balance trend</Text>
        <View style={styles.toggle}>
          {RANGES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[styles.toggleBtn, range === r.key && styles.toggleBtnActive]}
              onPress={() => setRange(r.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, range === r.key && styles.toggleTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Chart area ──────────────────────────────────────────── */}
      <View
        style={styles.chartWrap}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setSvgTotalW(w);
        }}
      >
        {isInsufficient ? (
          /* Empty state */
          <View style={styles.emptyState}>
            <Feather name="bar-chart-2" size={30} color={Colors.border} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>{EMPTY_MSGS[range]}</Text>
          </View>
        ) : svgTotalW > 0 && svgPts.length >= 2 ? (
          <Svg width={svgTotalW} height={CHART_H}>
            <Defs>
              {/* Gradient fill beneath the line */}
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0"   stopColor={ACCENT} stopOpacity={0.38} />
                <Stop offset="0.8" stopColor={ACCENT} stopOpacity={0.04} />
                <Stop offset="1"   stopColor={ACCENT} stopOpacity={0} />
              </LinearGradient>
              {/* Animated clip — grows left→right to reveal the line */}
              <ClipPath id="reveal">
                <AnimatedRect
                  x={PAD_L}
                  y={0}
                  height={CHART_H}
                  animatedProps={animatedClipProps}
                />
              </ClipPath>
            </Defs>

            {/* Gridlines + Y labels (always visible — no clip) */}
            {gridLines.map((gl, i) => (
              <React.Fragment key={i}>
                <Line
                  x1={PAD_L} y1={gl.y}
                  x2={svgTotalW - PAD_R} y2={gl.y}
                  stroke={Colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD_L - 6}
                  y={gl.y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fontFamily="Inter_400Regular"
                  fill={Colors.textTertiary}
                >
                  {gl.label}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Area fill — clipped (reveals left→right) */}
            <Path
              d={areaPath}
              fill="url(#areaFill)"
              clipPath="url(#reveal)"
            />

            {/* Stroke line — clipped */}
            <Path
              d={linePath}
              stroke={ACCENT}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#reveal)"
            />

            {/* X-axis labels */}
            {points.map((pt, i) => {
              if (!pt.showLabel) return null;
              const x = svgPts[i]?.x ?? 0;
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={CHART_H - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="Inter_400Regular"
                  fill={Colors.textTertiary}
                >
                  {pt.label}
                </SvgText>
              );
            })}
          </Svg>
        ) : null}
      </View>

      {/* ── Legend ──────────────────────────────────────────────── */}
      {!isInsufficient && (
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Balance</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: ACCENT,
  },
  toggleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  chartWrap: {
    width: "100%",
    minHeight: CHART_H,
  },
  emptyState: {
    height: CHART_H,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
});
