import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
  Rect,
  Line,
  Polygon,
} from '@react-pdf/renderer';

const colors = {
  ink: '#0f172a',
  slate: '#334155',
  muted: '#64748b',
  line: '#d9e2ef',
  panel: '#f8fafc',
  panelBlue: '#eef4ff',
  panelMint: '#ecfeff',
  panelRose: '#fff1f2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  neutral: '#cbd5e1',
  purple: '#8b5cf6',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    paddingTop: 28,
    paddingRight: 30,
    paddingBottom: 24,
    paddingLeft: 30,
    backgroundColor: colors.white,
    fontFamily: 'Helvetica',
    color: colors.slate,
    fontSize: 10,
  },
  bgBandTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#e8f0ff',
    opacity: 0.65,
  },
  bgBandBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
    backgroundColor: '#ecfeff',
    opacity: 0.5,
  },
  topBand: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.info,
    paddingBottom: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 9,
    color: colors.muted,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.ink,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    padding: 9,
  },
  cardBlue: {
    backgroundColor: colors.panelBlue,
  },
  cardMint: {
    backgroundColor: colors.panelMint,
  },
  cardRose: {
    backgroundColor: colors.panelRose,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.ink,
  },
  statLabel: {
    marginTop: 2,
    fontSize: 8,
    color: colors.muted,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kvKey: {
    fontSize: 8,
    color: colors.muted,
  },
  kvValue: {
    fontSize: 8,
    color: colors.ink,
    fontWeight: 700,
    maxWidth: 180,
    textAlign: 'right',
  },
  paragraph: {
    fontSize: 9,
    color: colors.slate,
    lineHeight: 1.42,
  },
  listRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listMark: {
    width: 10,
    fontSize: 9,
    color: colors.muted,
  },
  listText: {
    flex: 1,
    fontSize: 9,
    color: colors.slate,
    lineHeight: 1.34,
  },
  table: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: '#ebf4ff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  cellL: {
    flex: 1.7,
    fontSize: 8.5,
    color: colors.ink,
  },
  cellC: {
    flex: 1,
    fontSize: 8.5,
    color: colors.slate,
    textAlign: 'center',
  },
  cellHead: {
    fontWeight: 700,
    color: colors.ink,
    fontSize: 8.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 8.5,
    color: colors.slate,
  },
  badge: {
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
});

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const cleanName = (value, fallback) => {
  if (!value) return fallback;
  const normalized = String(value)
    .replace(/\.(pdf|txt|docx)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return normalized || fallback;
};

const skillName = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return item.skill || item.name || item.topic || '';
  return String(item);
};

const decisionLabel = (score) => {
  if (score >= 75) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 45) return 'Conditional Match';
  return 'Low Match';
};

const decisionColor = (score) => {
  if (score >= 75) return colors.success;
  if (score >= 60) return colors.warning;
  if (score >= 45) return '#f97316';
  return colors.danger;
};

const makeCategories = (jdClusters, resumeClusters) => {
  const categorySet = Array.from(new Set([
    ...Object.keys(jdClusters || {}),
    ...Object.keys(resumeClusters || {}),
  ])).slice(0, 8);

  return categorySet.map((name) => {
    const jd = Object.keys(jdClusters?.[name] || {}).length;
    const resume = Object.keys(resumeClusters?.[name] || {}).length;
    const fit = Math.round((Math.min(jd, resume) / Math.max(1, Math.max(jd, resume))) * 100);
    return { name: cleanName(name, 'Category'), jd, resume, fit };
  });
};

const confidenceBuckets = (partition) => {
  const exact = (partition?.exact_match || []).map((s) => ({ skill: skillName(s), score: 1 }));
  const strong = (partition?.strong_semantic || []).map((s) => ({ skill: skillName(s), score: toNum(s?.score, 0) }));
  const moderate = (partition?.moderate_semantic || []).map((s) => ({ skill: skillName(s), score: toNum(s?.score, 0) }));
  const all = [...exact, ...strong, ...moderate];

  return [
    { range: '90-100%', count: all.filter((s) => s.score >= 0.9).length, fill: colors.success },
    { range: '80-89%', count: all.filter((s) => s.score >= 0.8 && s.score < 0.9).length, fill: colors.info },
    { range: '70-79%', count: all.filter((s) => s.score >= 0.7 && s.score < 0.8).length, fill: colors.warning },
    { range: 'Below 70%', count: all.filter((s) => s.score < 0.7).length, fill: colors.danger },
  ];
};

const Footer = ({ page }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>Resume Analyzer - Visual Report</Text>
    <Text style={styles.footerText}>Page {page}</Text>
  </View>
);

const PageBackground = () => (
  <>
    <View style={styles.bgBandTop} fixed />
    <View style={styles.bgBandBottom} fixed />
  </>
);

const ScoreGauge = ({ score }) => {
  const pct = clamp(Math.round(score), 0, 100);
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const fillLen = (pct / 100) * circumference;

  return (
    <View style={[styles.card, styles.cardBlue, { alignItems: 'center' }]}>
      <Svg width={140} height={140}>
        <Circle cx={70} cy={70} r={radius} stroke={colors.neutral} strokeWidth={16} fill="none" />
        <Circle
          cx={70}
          cy={70}
          r={radius}
          stroke={decisionColor(score)}
          strokeWidth={16}
          fill="none"
          strokeDasharray={`${fillLen} ${circumference}`}
          strokeDashoffset={0}
          transform="rotate(-90 70 70)"
        />
      </Svg>
      <Text style={{ marginTop: -88, fontSize: 22, color: colors.ink, fontWeight: 700 }}>{pct}%</Text>
      <Text style={{ marginTop: 26, fontSize: 8.5, color: colors.muted }}>Overall Alignment Score</Text>
    </View>
  );
};

const MatchDonut = ({ exactPct, semanticPct, missingPct }) => {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;

  const e = clamp(exactPct, 0, 100);
  const s = clamp(semanticPct, 0, 100);
  const m = clamp(missingPct, 0, 100);

  const eLen = (e / 100) * circumference;
  const sLen = (s / 100) * circumference;
  const mLen = (m / 100) * circumference;

  return (
    <View style={[styles.card, styles.cardMint, { alignItems: 'center' }]}>
      <Svg width={140} height={140}>
        <Circle cx={70} cy={70} r={radius} stroke={colors.neutral} strokeWidth={16} fill="none" />
        <Circle cx={70} cy={70} r={radius} stroke={colors.success} strokeWidth={16} fill="none" strokeDasharray={`${eLen} ${circumference}`} strokeDashoffset={0} transform="rotate(-90 70 70)" />
        <Circle cx={70} cy={70} r={radius} stroke={colors.info} strokeWidth={16} fill="none" strokeDasharray={`${sLen} ${circumference}`} strokeDashoffset={-eLen} transform="rotate(-90 70 70)" />
        <Circle cx={70} cy={70} r={radius} stroke={colors.danger} strokeWidth={16} fill="none" strokeDasharray={`${mLen} ${circumference}`} strokeDashoffset={-(eLen + sLen)} transform="rotate(-90 70 70)" />
      </Svg>
      <Text style={{ marginTop: -88, fontSize: 9, color: colors.ink, fontWeight: 700 }}>Match Mix</Text>
      <View style={{ marginTop: 28, width: '100%' }}>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Exact {Math.round(e)}%</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.info }]} /><Text style={styles.legendText}>Semantic {Math.round(s)}%</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Missing {Math.round(m)}%</Text></View>
      </View>
    </View>
  );
};

const CategoryBarChart = ({ categories }) => {
  const maxVal = Math.max(1, ...categories.map((c) => Math.max(c.jd, c.resume)));

  return (
    <View style={[styles.card, styles.cardBlue]}>
      {categories.length > 0 ? (
        categories.slice(0, 6).map((c, idx) => {
          const jdW = (c.jd / maxVal) * 210;
          const rsW = (c.resume / maxVal) * 210;
          return (
            <View key={`${c.name}-${idx}`} style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 8.5, color: colors.ink, marginBottom: 2 }}>{c.name}</Text>
              <Svg width={280} height={30}>
                <Rect x={0} y={2} width={210} height={9} fill="#e5edf7" />
                <Rect x={0} y={2} width={jdW} height={9} fill={colors.danger} />
                <Rect x={0} y={16} width={210} height={9} fill="#e5edf7" />
                <Rect x={0} y={16} width={rsW} height={9} fill={colors.success} />
              </Svg>
              <Text style={{ fontSize: 7.5, color: colors.muted }}>JD {c.jd} | Resume {c.resume} | Fit {c.fit}%</Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.paragraph}>Category comparison unavailable for this profile.</Text>
      )}
      <View style={{ marginTop: 4 }}>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>JD demand</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Resume coverage</Text></View>
      </View>
    </View>
  );
};

const RadarProfile = ({ categories }) => {
  if (!categories.length) {
    return (
      <View style={[styles.card, styles.cardMint]}>
        <Text style={styles.paragraph}>Radar profile unavailable due to insufficient category data.</Text>
      </View>
    );
  }

  const size = 220;
  const cx = 110;
  const cy = 110;
  const outer = 72;
  const plot = categories.slice(0, 6);
  const angles = plot.map((_, i) => ((Math.PI * 2) / plot.length) * i - Math.PI / 2);

  const point = (r, a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const jdPts = plot.map((c, i) => point((clamp(c.jd, 0, 10) / 10) * outer, angles[i]));
  const rsPts = plot.map((c, i) => point((clamp(c.resume, 0, 10) / 10) * outer, angles[i]));

  const jdPoly = jdPts.map((p) => `${p.x},${p.y}`).join(' ');
  const rsPoly = rsPts.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={[styles.card, styles.cardMint]}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((k, idx) => (
          <Circle key={`ring-${idx}`} cx={cx} cy={cy} r={outer * k} stroke="#dce6f3" strokeWidth={1} fill="none" />
        ))}
        {angles.map((a, idx) => {
          const p = point(outer, a);
          return <Line key={`axis-${idx}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#dce6f3" strokeWidth={1} />;
        })}
        <Polygon points={jdPoly} fill="#fca5a5" stroke={colors.danger} strokeWidth={1.2} opacity={0.5} />
        <Polygon points={rsPoly} fill="#86efac" stroke={colors.success} strokeWidth={1.2} opacity={0.5} />
      </Svg>
      <View>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>JD profile layer</Text></View>
        <View style={styles.legendRow}><View style={[styles.legendSwatch, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Resume profile layer</Text></View>
      </View>
    </View>
  );
};

const ConfidenceHistogram = ({ buckets }) => {
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <View style={[styles.card, styles.cardRose]}>
      <Svg width={300} height={130}>
        {buckets.map((b, i) => {
          const x = 18 + i * 68;
          const h = (b.count / maxCount) * 74;
          const y = 95 - h;
          return (
            <View key={`bucket-${i}`}>
              <Rect x={x} y={y} width={44} height={h} fill={b.fill} />
              <Text x={x + 22} y={108} style={{ fontSize: 7, textAnchor: 'middle' }}>{b.range}</Text>
              <Text x={x + 22} y={y - 4} style={{ fontSize: 7, textAnchor: 'middle' }}>{String(b.count)}</Text>
            </View>
          );
        })}
      </Svg>
      <Text style={{ fontSize: 8, color: colors.muted }}>Confidence distribution for exact + semantic matches</Text>
    </View>
  );
};

const ResumePDFReport = ({ analysisData }) => {
  const data = analysisData || {};
  const summary = data?.bert_results?.summary || {};
  const partition = data?.bert_results?.skill_partition || {};
  const jdClusters = data?.bert_results?.jd_skill_clusters || {};
  const resumeClusters = data?.bert_results?.resume_skill_clusters || {};
  const missingRaw = Array.isArray(data?.bert_results?.missing_from_resume) ? data.bert_results.missing_from_resume : [];

  const ai = data?.ai_enrichment || {};
  const narrative = ai?.report_narrative || {};
  const triage = Array.isArray(ai?.missing_skill_triage) ? ai.missing_skill_triage : [];
  const interviewFocusRaw = Array.isArray(ai?.interview_focus) ? ai.interview_focus : [];

  const exact = Math.max(0, Math.round(toNum(summary.exact_match_count, 0)));
  const semantic = Math.max(0, Math.round(toNum(summary.semantic_match_count, 0)));
  const missing = Math.max(0, Math.round(toNum(summary.missing_skills_count, 0)));
  const total = Math.max(1, Math.round(toNum(summary.total_jd_skills, exact + semantic + missing || 1)));

  const weightedScore = ((exact + semantic * 0.6) / total) * 100;
  const score = clamp(toNum(summary.overall_alignment_score, weightedScore), 0, 100);

  const exactPct = (exact / total) * 100;
  const semanticPct = (semantic / total) * 100;
  const missingPct = (missing / total) * 100;

  const decision = decisionLabel(score);
  const candidate = cleanName(data.resume_filename, 'Candidate');
  const role = cleanName(data.jd_filename, 'Target Role');
  const domain = cleanName(data.domain, 'General');

  const categories = makeCategories(jdClusters, resumeClusters);
  const buckets = confidenceBuckets(partition);

  const topExact = (Array.isArray(partition.exact_match) ? partition.exact_match : [])
    .map(skillName)
    .filter(Boolean)
    .slice(0, 6);

  const topStrong = (Array.isArray(partition.strong_semantic) ? partition.strong_semantic : [])
    .map((s) => ({ skill: skillName(s), score: toNum(s?.score, 0) }))
    .filter((s) => s.skill)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const missingList = missingRaw
    .map((m) => ({
      skill: skillName(m),
      priority: String(m?.priority || 'important').toLowerCase(),
      weight: toNum(m?.weight, 1),
    }))
    .filter((m) => m.skill)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);

  const interviewFocus = interviewFocusRaw
    .map((it) => {
      if (typeof it === 'string') return it;
      if (typeof it === 'object') return it.objective || it.topic || it.question || '';
      return '';
    })
    .filter(Boolean)
    .slice(0, 5);

  const fallbackExec = `This profile shows ${Math.round(score)}% alignment for ${domain}, with ${exact} exact and ${semantic} semantic matches out of ${total} required skills. The current risk is driven by ${missing} missing skill${missing === 1 ? '' : 's'}, which should be validated in a focused interview plan.`;

  const strengths = Array.isArray(narrative?.strengths) && narrative.strengths.length
    ? narrative.strengths.slice(0, 5)
    : [
        `${exact} exact skills directly overlap with role requirements.`,
        `${semantic} additional skills are semantically related to required competencies.`,
        `Best performing category fit: ${categories[0]?.name || 'General'} (${categories[0]?.fit || 0}% category fit).`,
      ];

  const risks = Array.isArray(narrative?.risk_flags) && narrative.risk_flags.length
    ? narrative.risk_flags.slice(0, 5)
    : (triage.length
      ? triage.slice(0, 5).map((t) => t.reason || `${t.skill} is missing and marked ${t.priority || 'important'}.`)
      : missingList.map((m) => `${m.skill} appears as a priority gap (weight ${m.weight.toFixed(1)}).`));

  const onboardingPlan = Array.isArray(narrative?.onboarding_plan) && narrative.onboarding_plan.length
    ? narrative.onboarding_plan.slice(0, 5)
    : [
        'Week 1-2: establish baseline on missing role-critical tools and vocabulary.',
        'Week 3-4: assign scoped delivery tasks in strongest matched categories.',
        'Week 5-6: validate independent execution on medium-complexity stories.',
      ];

  const interviewStrategy = narrative?.interview_strategy ||
    'Use scenario-based and project-depth questions for each high-priority missing skill. Ask for architecture decisions, measurable outcomes, and trade-off reasoning.';

  const finalRecommendation = narrative?.final_recommendation ||
    (score >= 75
      ? 'Proceed to final rounds with role-context depth checks.'
      : score >= 60
      ? 'Proceed to technical round with targeted gap validation.'
      : score >= 45
      ? 'Run focused technical assessment before progression.'
      : 'Consider alternate role mapping or hold for this requirement profile.');

  const generatedOn = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <PageBackground />
        <View style={styles.topBand}>
          <Text style={styles.title}>Executive Resume Analysis Report</Text>
          <Text style={styles.subtitle}>Color-enhanced formal report with structured fit analysis and recruiter-grade insights</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.col, styles.card, styles.cardBlue]}>
            <View style={styles.kvRow}><Text style={styles.kvKey}>Candidate</Text><Text style={styles.kvValue}>{candidate}</Text></View>
            <View style={styles.kvRow}><Text style={styles.kvKey}>Role</Text><Text style={styles.kvValue}>{role}</Text></View>
            <View style={styles.kvRow}><Text style={styles.kvKey}>Domain</Text><Text style={styles.kvValue}>{domain}</Text></View>
            <View style={styles.kvRow}><Text style={styles.kvKey}>Required Skills</Text><Text style={styles.kvValue}>{total}</Text></View>
            <View style={[styles.badge, { backgroundColor: decisionColor(score) }]}>
              <Text style={styles.badgeText}>{decision} ({Math.round(score)}%)</Text>
            </View>
          </View>
          <View style={styles.col}><ScoreGauge score={score} /></View>
          <View style={styles.col}><MatchDonut exactPct={exactPct} semanticPct={semanticPct} missingPct={missingPct} /></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Explanation</Text>
          <View style={[styles.card, styles.cardMint]}>
            <Text style={styles.paragraph}>{narrative?.executive_overview || fallbackExec}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Summary</Text>
          <View style={styles.row}>
            <View style={[styles.col, styles.card]}><Text style={styles.statValue}>{exact}</Text><Text style={styles.statLabel}>Exact Matches</Text></View>
            <View style={[styles.col, styles.card]}><Text style={styles.statValue}>{semantic}</Text><Text style={styles.statLabel}>Semantic Matches</Text></View>
            <View style={[styles.col, styles.card]}><Text style={styles.statValue}>{missing}</Text><Text style={styles.statLabel}>Missing Skills</Text></View>
          </View>
        </View>

        <Footer page={1} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <PageBackground />
        <View style={styles.topBand}>
          <Text style={styles.title}>Visualization Replica Section</Text>
          <Text style={styles.subtitle}>Bar comparison, radar profile, and confidence distribution matching visualization-page logic</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bar Chart Skill Comparison (JD vs Resume)</Text>
          <CategoryBarChart categories={categories} />
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Radar Skill Profile</Text>
              <RadarProfile categories={categories} />
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Confidence Distribution</Text>
              <ConfidenceHistogram buckets={buckets} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Comparison Table</Text>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cellL, styles.cellHead]}>Category</Text>
              <Text style={[styles.cellC, styles.cellHead]}>JD</Text>
              <Text style={[styles.cellC, styles.cellHead]}>Resume</Text>
              <Text style={[styles.cellC, styles.cellHead]}>Fit</Text>
            </View>
            {categories.length > 0 ? (
              categories.map((c, idx) => (
                <View key={`${c.name}-${idx}`} style={styles.tableRow}>
                  <Text style={styles.cellL}>{c.name}</Text>
                  <Text style={styles.cellC}>{c.jd}</Text>
                  <Text style={styles.cellC}>{c.resume}</Text>
                  <Text style={[styles.cellC, { color: decisionColor(c.fit), fontWeight: 700 }]}>{c.fit}%</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}><Text style={styles.cellL}>No category data available</Text><Text style={styles.cellC}>-</Text><Text style={styles.cellC}>-</Text><Text style={styles.cellC}>-</Text></View>
            )}
          </View>
        </View>

        <Footer page={2} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <PageBackground />
        <View style={styles.topBand}>
          <Text style={styles.title}>Detailed Insights and Decision Guidance</Text>
          <Text style={styles.subtitle}>Stronger explanations generated from match evidence, gap triage, and interview focus</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Strength Signals</Text>
              <View style={[styles.card, styles.cardMint]}>
                {strengths.map((item, idx) => (
                  <View key={`str-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{item}</Text></View>
                ))}
                {topExact.slice(0, 2).map((s, idx) => (
                  <View key={`x-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{s} is a direct exact match.</Text></View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Risk Flags</Text>
              <View style={[styles.card, styles.cardRose]}>
                {risks.map((item, idx) => (
                  <View key={`risk-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{item}</Text></View>
                ))}
                {missingList.slice(0, 2).map((m, idx) => (
                  <View key={`m-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{m.skill} requires priority attention.</Text></View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onboarding and Mitigation Plan</Text>
          <View style={[styles.card, styles.cardBlue]}>
            {onboardingPlan.map((item, idx) => (
              <View key={`onb-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{item}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interview Focus Areas</Text>
          <View style={styles.card}>
            {(interviewFocus.length ? interviewFocus : topStrong.map((s) => `Validate practical depth for ${s.skill}.`).slice(0, 5)).map((item, idx) => (
              <View key={`int-${idx}`} style={styles.listRow}><Text style={styles.listMark}>-</Text><Text style={styles.listText}>{item}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Final Recommendation</Text>
          <View style={[styles.card, { borderColor: decisionColor(score), borderWidth: 1.4 }]}>
            <Text style={styles.paragraph}>{finalRecommendation}</Text>
            <Text style={[styles.paragraph, { marginTop: 6 }]}>{interviewStrategy}</Text>
            <Text style={[styles.paragraph, { marginTop: 8, color: colors.muted }]}>Generated on {generatedOn} for domain {domain}.</Text>
          </View>
        </View>

        <Footer page={3} />
      </Page>
    </Document>
  );
};

export default ResumePDFReport;
