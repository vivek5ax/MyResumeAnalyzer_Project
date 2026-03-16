import React from 'react';
import ReactDOM from 'react-dom';
import { X, BarChart3, PieChart as PieChartIcon, Target, AlertTriangle, Layers, Activity, Zap, ShieldAlert, Gauge, GitCompareArrows } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';

const VisualizationModal = ({ isOpen, onClose, isClosing, data }) => {
    if (!isOpen) return null;

    const skillsMapRef = React.useRef(null);
    const visualScrollRef = React.useRef(null);
    const [skillsMapVisible, setSkillsMapVisible] = React.useState(false);

    const bertResults = data.bert_results || {};
    const summary = bertResults.summary || { overall_alignment_score: 0, exact_match_count: 0, semantic_match_count: 0, missing_skills_count: 0 };
    const partition = bertResults.skill_partition || { exact_match: [], strong_semantic: [], moderate_semantic: [], irrelevant: [] };
    const missingFromResume = bertResults.missing_from_resume || [];
    const jdClusters = bertResults.jd_skill_clusters || {};
    const jdCategorizedSkills = data.jd_skills?.categorized_skills || {};
    const resumeCategorizedSkills = data.resume_skills?.categorized_skills || {};

    // Default Colors
    const COLORS = {
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        neutral: '#cbd5e1',
        purple: '#8b5cf6'
    };

    // 1. Gauge Data
    const score = summary.overall_alignment_score;
    const gaugeColor = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger;
    const gaugeData = [
        { name: 'Score', value: score, fill: gaugeColor },
        { name: 'Remaining', value: Math.max(100 - score, 0), fill: COLORS.neutral }
    ];

    // 2. Match Distribution Data
    const matchData = [
        { name: 'Exact Matches', value: summary.exact_match_count, fill: COLORS.success },
        { name: 'Semantic Matches', value: summary.semantic_match_count, fill: COLORS.info },
        { name: 'Missing Skills', value: summary.missing_skills_count, fill: COLORS.danger }
    ].filter(item => item.value > 0);

    // 3. Category Comparison Data (Grouped Bar)
    const resumeClusters = bertResults.resume_skill_clusters || {};
    const allCategories = Array.from(new Set([...Object.keys(jdClusters), ...Object.keys(resumeClusters)]));
    const categoryData = allCategories.map(cat => ({
        category: cat,
        jd: jdClusters[cat] ? jdClusters[cat].length : 0,
        resume: resumeClusters[cat] ? resumeClusters[cat].length : 0
    })).sort((a, b) => b.jd - a.jd).slice(0, 8); // Top 8 categories for sanity

    const semanticScores = [
        ...(partition.strong_semantic || []).map((entry) => Number(entry.score || 0)),
        ...(partition.moderate_semantic || []).map((entry) => Number(entry.score || 0)),
    ];
    const semanticReliability = semanticScores.length
        ? Math.round((semanticScores.reduce((acc, cur) => acc + cur, 0) / semanticScores.length) * 100)
        : 0;

    const weightedRiskIndex = Math.round(missingFromResume.reduce((acc, item) => acc + Number(item.weight || 1), 0) * 10) / 10;
    const criticalMissingCount = missingFromResume.filter((item) => Number(item.weight || 1) >= 1.3).length;

    const matchedJdSkillSet = new Set([
        ...(partition.exact_match || []).map((value) => String(value || '').toLowerCase()),
        ...(partition.strong_semantic || []).map((value) => String(value.similar_to || '').toLowerCase()),
        ...(partition.moderate_semantic || []).map((value) => String(value.similar_to || '').toLowerCase()),
    ]);

    const exactMatchSet = new Set((partition.exact_match || []).map((value) => String(value || '').toLowerCase()));
    const strongMatchSet = new Set((partition.strong_semantic || []).map((value) => String(value.similar_to || '').toLowerCase()));
    const moderateMatchSet = new Set((partition.moderate_semantic || []).map((value) => String(value.similar_to || '').toLowerCase()));
    const missingSkillSet = new Set((missingFromResume || []).map((item) => String(item.skill || '').toLowerCase()));

    const totalWeightedDemand = summary.total_jd_skills + weightedRiskIndex;
    const weightedCoverageScore = totalWeightedDemand > 0
        ? Math.round((((summary.exact_match_count + summary.semantic_match_count) / totalWeightedDemand) * 100) * 10) / 10
        : 0;

    const categoryHeatmapRows = Object.keys(jdClusters).map((category) => {
        const requiredSkills = jdClusters[category] || [];
        const requiredCount = requiredSkills.length;
        const coveredCount = requiredSkills.filter((skill) => matchedJdSkillSet.has(String(skill || '').toLowerCase())).length;
        const missingItems = missingFromResume.filter((item) => (item.categories || []).includes(category));
        const missingCount = missingItems.length;
        const weightedRisk = Math.round(missingItems.reduce((acc, item) => acc + Number(item.weight || 1), 0) * 10) / 10;
        const coveragePct = requiredCount > 0 ? Math.round((coveredCount / requiredCount) * 100) : 0;
        return {
            category,
            requiredCount,
            coveredCount,
            missingCount,
            weightedRisk,
            coveragePct,
        };
    }).sort((a, b) => b.weightedRisk - a.weightedRisk);

    const maxRiskValue = Math.max(1, ...categoryHeatmapRows.map((row) => row.weightedRisk || 0));
    const maxMissingValue = Math.max(1, ...categoryHeatmapRows.map((row) => row.missingCount || 0));

    const normalizeSkill = (skill) => {
        if (typeof skill === 'object' && skill !== null) {
            return String(skill.skill || '').trim();
        }
        return String(skill || '').trim();
    };

    const skillBoxCategories = Array.from(new Set([
        ...Object.keys(jdClusters || {}),
        ...Object.keys(jdCategorizedSkills || {}),
        ...Object.keys(resumeCategorizedSkills || {}),
    ]));

    const categorySkillBoxData = skillBoxCategories.map((category) => {
        const requiredSource = (jdClusters?.[category] && jdClusters[category].length > 0)
            ? jdClusters[category]
            : ((jdCategorizedSkills?.[category] && jdCategorizedSkills[category].length > 0)
                ? jdCategorizedSkills[category]
                : (resumeCategorizedSkills?.[category] || []));

        const resumeSource = (resumeCategorizedSkills?.[category] && resumeCategorizedSkills[category].length > 0)
            ? resumeCategorizedSkills[category]
            : (resumeClusters?.[category] || []);

        const requiredSkills = Array.from(new Set((requiredSource || []).map(normalizeSkill).filter(Boolean)));
        const resumeCategorySet = new Set((resumeSource || []).map(normalizeSkill).filter(Boolean).map((value) => value.toLowerCase()));

        const skillItems = requiredSkills.map((skill) => {
            const normalized = skill.toLowerCase();
            let status = 'missing';

            if (exactMatchSet.has(normalized)) {
                status = 'exact';
            } else if (strongMatchSet.has(normalized)) {
                status = 'strong';
            } else if (moderateMatchSet.has(normalized)) {
                status = 'moderate';
            } else if (resumeCategorySet.has(normalized)) {
                status = 'strong';
            } else if (!missingSkillSet.has(normalized) && matchedJdSkillSet.has(normalized)) {
                status = 'strong';
            }

            return { skill, status };
        });

        const presentCount = skillItems.filter((item) => item.status !== 'missing').length;
        const coverage = requiredSkills.length > 0 ? Math.round((presentCount / requiredSkills.length) * 100) : 0;

        return {
            category,
            total: requiredSkills.length,
            present: presentCount,
            coverage,
            skillItems,
        };
    }).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

    const syntheticFallbackTiles = [
        {
            category: 'Exact Matches',
            skillItems: (partition.exact_match || []).map((skill) => ({ skill: String(skill || ''), status: 'exact' })),
        },
        {
            category: 'Strong Semantic',
            skillItems: (partition.strong_semantic || []).map((item) => ({ skill: String(item?.similar_to || item?.skill || ''), status: 'strong' })),
        },
        {
            category: 'Moderate Semantic',
            skillItems: (partition.moderate_semantic || []).map((item) => ({ skill: String(item?.similar_to || item?.skill || ''), status: 'moderate' })),
        },
        {
            category: 'Missing Skills',
            skillItems: (missingFromResume || []).map((item) => ({ skill: String(item?.skill || ''), status: 'missing' })),
        },
    ].map((tile) => {
        const cleanedItems = tile.skillItems
            .map((entry) => ({ skill: String(entry.skill || '').trim(), status: entry.status }))
            .filter((entry) => entry.skill.length > 0);
        const total = cleanedItems.length;
        const present = cleanedItems.filter((entry) => entry.status !== 'missing').length;
        const coverage = total > 0 ? Math.round((present / total) * 100) : 0;
        return {
            category: tile.category,
            total,
            present,
            coverage,
            skillItems: cleanedItems,
        };
    }).filter((tile) => tile.total > 0);

    const treemapTiles = (categorySkillBoxData.length > 0 ? categorySkillBoxData : syntheticFallbackTiles)
        .sort((a, b) => b.total - a.total);

    const maxCategoryTileSize = Math.max(1, ...treemapTiles.map((item) => item.total || 0));
    const CATEGORY_SWATCHES = ['#1d4ed8', '#2563eb', '#3b82f6', '#0ea5e9', '#06b6d4', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

    React.useEffect(() => {
        if (!isOpen) {
            setSkillsMapVisible(false);
            return undefined;
        }

        const target = skillsMapRef.current;
        const scrollRoot = visualScrollRef.current || null;
        if (!target || typeof IntersectionObserver === 'undefined') {
            setSkillsMapVisible(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setSkillsMapVisible(true);
                    }
                });
            },
            { threshold: 0.15, root: scrollRoot }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [isOpen]);

    const funnelData = [
        { stage: 'JD Skills', value: summary.total_jd_skills, fill: '#6366f1' },
        { stage: 'Exact', value: summary.exact_match_count, fill: '#10b981' },
        { stage: 'Semantic', value: summary.semantic_match_count, fill: '#3b82f6' },
        { stage: 'Missing', value: summary.missing_skills_count, fill: '#ef4444' },
    ];

    // 5. Radar Chart (Profile)
    const radarData = Object.keys(resumeClusters).map(cat => ({
        subject: cat,
        A: resumeClusters[cat].length,
        fullMark: Math.max(10, resumeClusters[cat].length + 2)
    }));

    // 6. Extra Skills Badges
    const extraSkills = bertResults.extra_resume_skills || [];

    // 7. Match Confidence Table Data
    const exactMatches = (partition.exact_match || []).map(s => ({ skill: s, type: 'Exact Match', score: 1.0, color: COLORS.success }));
    const strongSemantics = (partition.strong_semantic || []).map(s => ({ skill: s.skill, type: 'Strong Semantic', score: s.score, color: COLORS.info }));
    const moderateSemantics = (partition.moderate_semantic || []).map(s => ({ skill: s.skill, type: 'Moderate Semantic', score: s.score, color: COLORS.warning }));
    const matchTableData = [...exactMatches, ...strongSemantics, ...moderateSemantics].sort((a, b) => b.score - a.score);

    // 8. Semantic Confidence Distribution (Combined with Exact Matches)
    const allMatches = [
        ...(partition.exact_match || []).map(skill => ({ skill, score: 1.0 })),
        ...(partition.strong_semantic || []),
        ...(partition.moderate_semantic || [])
    ];
    const buckets = [
        { range: '90-100%', count: allMatches.filter(s => s.score >= 0.9).length, fill: '#10b981' },
        { range: '80-89%', count: allMatches.filter(s => s.score >= 0.8 && s.score < 0.9).length, fill: '#3b82f6' },
        { range: '70-79%', count: allMatches.filter(s => s.score >= 0.7 && s.score < 0.8).length, fill: '#f59e0b' },
        { range: 'Below 70%', count: allMatches.filter(s => s.score < 0.7).length, fill: '#ef4444' }
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#1e293b', color: 'white', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', border: '1px solid #334155' }}>
                    {label && <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '1.05rem', color: '#94a3b8' }}>{label}</p>}
                    {payload.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.color || entry.fill }}></div>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{entry.name}:</span>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: entry.color || entry.fill }}>{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const modalContent = (
        <div className="modal-overlay" style={{ zIndex: 10000, background: 'rgba(0,0,0,0.85)' }}>
            <div className={`modal-content modal-content-full ${isClosing ? 'slide-down' : ''}`} style={{ background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)', maxWidth: '1400px', margin: '2rem auto' }}>

                {/* Header */}
                <div className="modal-header" style={{
                    padding: '1.5rem 3rem',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                            <BarChart3 size={32} color="#38bdf8" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Visual Analytics Dashboard</h2>
                            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Comprehensive breakdown of candidate alignment</p>
                        </div>
                    </div>

                    <button className="modal-close-btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Dashboard Grid */}
                <div ref={visualScrollRef} className="visual-analytics-scroll" style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1, background: 'transparent' }}>

                    {/* Section 1: Executive Overview (Moved to top) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

                        {/* 1. Alignment Gauge */}
                        <div className="content-card" style={{ background: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', borderTop: `4px solid ${gaugeColor}` }}>
                            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <Target size={20} color={gaugeColor} />
                                Overall Alignment Score
                            </h3>
                            <div style={{ height: 180, width: '100%', position: 'relative', marginTop: '1rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={100} outerRadius={140} dataKey="value" stroke="none" />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                                    <span style={{ fontSize: '3.5rem', fontWeight: '900', color: gaugeColor, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{score}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Match Distribution */}
                        <div className="content-card" style={{ background: '#1e293b', padding: '2rem', borderTop: `4px solid ${COLORS.purple}` }}>
                            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <PieChartIcon size={20} color={COLORS.purple} />
                                Match Distribution
                            </h3>
                            <div style={{ height: 280, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={matchData}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = outerRadius + 20;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                return (
                                                    <text x={x} y={y} fill="#cbd5e1" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="13" fontWeight="600">
                                                        {name} {(percent * 100).toFixed(0)}%
                                                    </text>
                                                );
                                            }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Phase 1: Executive Intelligence Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div className="content-card" style={{ background: '#1e293b', borderTop: '4px solid #6366f1', padding: '1rem 1.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#93c5fd', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ fontSize: '1.1rem', lineHeight: 1 }}>📈</span><span>Weighted Coverage</span></span>
                                <Gauge size={18} color="#60a5fa" />
                            </div>
                            <p style={{ margin: '0.5rem 0 0', color: '#ffffff', fontSize: '1.55rem', fontWeight: 900 }}>{weightedCoverageScore}%</p>
                        </div>

                        <div className="content-card" style={{ background: '#1e293b', borderTop: '4px solid #ef4444', padding: '1rem 1.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🔥</span><span>Weighted Risk Index</span></span>
                                <ShieldAlert size={18} color="#f87171" />
                            </div>
                            <p style={{ margin: '0.5rem 0 0', color: '#ffffff', fontSize: '1.55rem', fontWeight: 900 }}>{weightedRiskIndex}</p>
                        </div>

                        <div className="content-card" style={{ background: '#1e293b', borderTop: '4px solid #f59e0b', padding: '1rem 1.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#fcd34d', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span><span>Critical Missing</span></span>
                                <AlertTriangle size={18} color="#fbbf24" />
                            </div>
                            <p style={{ margin: '0.5rem 0 0', color: '#ffffff', fontSize: '1.55rem', fontWeight: 900 }}>{criticalMissingCount}</p>
                        </div>

                        <div className="content-card" style={{ background: '#1e293b', borderTop: '4px solid #22c55e', padding: '1rem 1.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✨</span><span>Semantic Reliability</span></span>
                                <GitCompareArrows size={18} color="#4ade80" />
                            </div>
                            <p style={{ margin: '0.5rem 0 0', color: '#ffffff', fontSize: '1.55rem', fontWeight: 900 }}>{semanticReliability}%</p>
                        </div>
                    </div>

                    {/* Phase 1: Match Progression */}
                    <div className="content-card" style={{ background: '#1e293b', padding: '1.4rem', borderTop: `4px solid ${COLORS.info}` }}>
                        <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            <Target size={20} color={COLORS.info} />
                            Match Funnel View
                        </h3>
                        <div style={{ height: 290, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelData} margin={{ top: 8, right: 20, left: 0, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="stage" tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Skills" radius={[8, 8, 0, 0]}>
                                        {funnelData.map((entry, idx) => (
                                            <Cell key={`fn-${entry.stage}-${idx}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Phase 1: Category Risk Heatmap */}
                    <div className="content-card" style={{ background: '#1e293b', padding: '1.4rem', borderTop: `4px solid ${COLORS.warning}` }}>
                        <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                            <Layers size={20} color={COLORS.warning} />
                            Category Risk Heatmap
                        </h3>
                        <div style={{ border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 1.8fr) repeat(3, minmax(110px, 1fr))', background: '#0b1222', borderBottom: '1px solid #334155' }}>
                                <div style={{ padding: '0.55rem 0.7rem', color: '#93a5c9', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase' }}>Category</div>
                                <div style={{ padding: '0.55rem 0.6rem', color: '#93a5c9', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase' }}>Coverage %</div>
                                <div style={{ padding: '0.55rem 0.6rem', color: '#93a5c9', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase' }}>Missing Count</div>
                                <div style={{ padding: '0.55rem 0.6rem', color: '#93a5c9', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase' }}>Risk Weight</div>
                            </div>

                            {categoryHeatmapRows.map((row, idx) => {
                                const coverageAlpha = 0.12 + (row.coveragePct / 100) * 0.62;
                                const missingAlpha = 0.12 + ((row.missingCount || 0) / maxMissingValue) * 0.62;
                                const riskAlpha = 0.12 + ((row.weightedRisk || 0) / maxRiskValue) * 0.62;

                                return (
                                    <div key={`${row.category}-${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(170px, 1.8fr) repeat(3, minmax(110px, 1fr))', borderBottom: idx === categoryHeatmapRows.length - 1 ? 'none' : '1px solid #334155', background: '#0f172a' }}>
                                        <div style={{ padding: '0.58rem 0.7rem', color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 700 }}>{row.category}</div>
                                        <div style={{ padding: '0.58rem 0.6rem', background: `rgba(34,197,94,${coverageAlpha})`, color: '#dcfce7', fontWeight: 800, fontSize: '0.8rem' }}>{row.coveragePct}%</div>
                                        <div style={{ padding: '0.58rem 0.6rem', background: `rgba(245,158,11,${missingAlpha})`, color: '#fef3c7', fontWeight: 800, fontSize: '0.8rem' }}>{row.missingCount}</div>
                                        <div style={{ padding: '0.58rem 0.6rem', background: `rgba(239,68,68,${riskAlpha})`, color: '#fee2e2', fontWeight: 800, fontSize: '0.8rem' }}>{row.weightedRisk}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.8rem' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontWeight: 700 }}>Color intensity indicates magnitude.</span>
                            <span style={{ color: '#86efac', fontSize: '0.74rem', fontWeight: 700 }}>Green: stronger coverage</span>
                            <span style={{ color: '#fcd34d', fontSize: '0.74rem', fontWeight: 700 }}>Amber: more missing skills</span>
                            <span style={{ color: '#fca5a5', fontSize: '0.74rem', fontWeight: 700 }}>Red: higher weighted risk</span>
                        </div>
                    </div>

                    {/* Section 2: Deep Category Analysis */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* 3. Category Comparison Bar Chart */}
                        <div className="content-card" style={{ background: '#1e293b', padding: '2rem', borderTop: `4px solid ${COLORS.info}` }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <Layers size={20} color={COLORS.info} />
                                Discovered Categories (JD vs Resume)
                            </h3>
                            <div style={{ height: 450, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 0, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} interval={0} tick={{ fontSize: 13, fill: 'white', fontWeight: 600 }} dx={-5} dy={10} />
                                        <YAxis tick={{ fontSize: 13, fill: 'white', fontWeight: 600 }} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} />
                                        <Bar dataKey="jd" name="Job Requirement" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={32} />
                                        <Bar dataKey="resume" name="Resume Possesses" fill={COLORS.info} radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 5. Resume Profile Radar */}
                        <div className="content-card" style={{ background: '#1e293b', padding: '2rem', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${COLORS.success}` }}>
                            <h3 style={{ margin: '0 0 0 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <Activity size={20} color={COLORS.success} />
                                Resume Expertise Profile
                            </h3>
                            <div style={{ marginTop: '1rem', minHeight: 450, width: '100%' }}>
                                {radarData.length >= 3 ? (
                                    <ResponsiveContainer width="100%" height={450}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid gridType="circle" stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 13, fontWeight: 600 }} />
                                            <Radar name="Resume Expertise" dataKey="A" stroke={COLORS.success} strokeWidth={2} fill={COLORS.success} fillOpacity={0.4} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                        Not enough distinct categories mapped for radar visualization (Need ≥ 3).
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Section 3: Semantic Match Quality (Combined Block) */}
                    <div className="content-card" style={{ background: '#1e293b', padding: '2.5rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(600px, 2.5fr)', gap: '3rem', borderTop: `5px solid ${COLORS.info}` }}>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                                <Activity size={24} color={COLORS.info} />
                                Semantic Convergence & Match Quality Analysis
                            </h3>
                            <p style={{ margin: '0 0 1rem 0', color: '#94a3b8', fontSize: '0.95rem' }}>A detailed breakdown of how well the candidate's skills semantically align with the job requirements.</p>
                        </div>

                        {/* 8. Semantic Confidence Distribution */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 1.5rem 0', color: '#cbd5e1', fontSize: '1.05rem', fontWeight: '600' }}>Confidence Distribution</h4>
                            <div style={{ height: 250, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={buckets} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                        <XAxis dataKey="range" tick={{ fontSize: 13, fill: 'white', fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: 'white', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Skills" radius={[6, 6, 0, 0]} barSize={40}>
                                            {buckets.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 7. Match Quality Ledger Table (4 Column Grid) */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 1.5rem 0', color: '#cbd5e1', fontSize: '1.05rem', fontWeight: '600' }}>Detailed Match Ledger</h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' }}>

                                {/* 90-100% Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                                    <div style={{ background: '#10b98115', padding: '0.75rem', borderBottom: '2px solid #10b981', textAlign: 'center', fontWeight: 'bold', color: '#34d399', fontSize: '0.85rem' }}>90-100% Match</div>
                                    <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {allMatches.filter(s => s.score >= 0.9).length > 0 ? allMatches.filter(s => s.score >= 0.9).map((match, i) => (
                                            <div key={i} style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', borderLeft: `4px solid #10b981`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{match.skill}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981' }}>{(match.score * 100).toFixed(0)}%</span>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>None</p>}
                                    </div>
                                </div>

                                {/* 80-89% Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                                    <div style={{ background: '#3b82f615', padding: '0.75rem', borderBottom: '2px solid #3b82f6', textAlign: 'center', fontWeight: 'bold', color: '#60a5fa', fontSize: '0.85rem' }}>80-89% Match</div>
                                    <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {allMatches.filter(s => s.score >= 0.8 && s.score < 0.9).length > 0 ? allMatches.filter(s => s.score >= 0.8 && s.score < 0.9).map((match, i) => (
                                            <div key={i} style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', borderLeft: `4px solid #3b82f6`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{match.skill}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#3b82f6' }}>{(match.score * 100).toFixed(0)}%</span>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>None</p>}
                                    </div>
                                </div>

                                {/* 70-79% Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                                    <div style={{ background: '#f59e0b15', padding: '0.75rem', borderBottom: '2px solid #f59e0b', textAlign: 'center', fontWeight: 'bold', color: '#fbbf24', fontSize: '0.85rem' }}>70-79% Match</div>
                                    <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {allMatches.filter(s => s.score >= 0.7 && s.score < 0.8).length > 0 ? allMatches.filter(s => s.score >= 0.7 && s.score < 0.8).map((match, i) => (
                                            <div key={i} style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', borderLeft: `4px solid #f59e0b`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{match.skill}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f59e0b' }}>{(match.score * 100).toFixed(0)}%</span>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>None</p>}
                                    </div>
                                </div>

                                {/* Below 70% Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                                    <div style={{ background: '#ef444415', padding: '0.75rem', borderBottom: '2px solid #ef4444', textAlign: 'center', fontWeight: 'bold', color: '#f87171', fontSize: '0.85rem' }}>Below 70%</div>
                                    <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {allMatches.filter(s => s.score < 0.7).length > 0 ? allMatches.filter(s => s.score < 0.7).map((match, i) => (
                                            <div key={i} style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', borderLeft: `4px solid #ef4444`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600', color: 'white', fontSize: '0.85rem' }}>{match.skill}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444' }}>{(match.score * 100).toFixed(0)}%</span>
                                            </div>
                                        )) : <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic', margin: '1rem 0' }}>None</p>}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Section 4: Category Skill Box Matrix */}
                    <div
                        ref={skillsMapRef}
                        className={`content-card category-skill-map ${skillsMapVisible ? 'is-visible' : ''}`}
                        style={{
                            background: 'linear-gradient(180deg, #141d2e 0%, #0f172a 100%)',
                            borderTop: '4px solid #0ea5e9',
                            padding: '1.5rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                                <Layers size={20} color="#38bdf8" />
                                Domain Category Skill Boxes
                            </h3>
                            <div className="category-skill-legend">
                                <span className="legend-chip legend-exact">Exact</span>
                                <span className="legend-chip legend-strong">Strong</span>
                                <span className="legend-chip legend-moderate">Moderate</span>
                                <span className="legend-chip legend-missing">Missing</span>
                            </div>
                        </div>

                        <p style={{ margin: '0.5rem 0 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            Treemap layout: larger tiles represent larger skill categories, and inner partitions represent individual skill names with match status colors.
                        </p>
                        <p style={{ margin: '0 0 0.8rem', color: '#7dd3fc', fontSize: '0.8rem', fontWeight: 700 }}>
                            Showing {treemapTiles.length} categories in this run.
                        </p>

                        <div className="category-skill-grid">
                            {treemapTiles.length > 0 ? (
                                treemapTiles.map((item, categoryIndex) => {
                                    const ratio = item.total / maxCategoryTileSize;
                                    const colSpan = Math.max(3, Math.min(5, Math.round(2 + (ratio * 3))));
                                    const categoryBorder = item.coverage >= 75
                                        ? 'rgba(16,185,129,0.55)'
                                        : item.coverage >= 45
                                            ? 'rgba(59,130,246,0.55)'
                                            : 'rgba(239,68,68,0.55)';
                                    const swatch = CATEGORY_SWATCHES[categoryIndex % CATEGORY_SWATCHES.length];

                                    return (
                                    <div
                                        key={`${item.category}-${categoryIndex}`}
                                        className="category-box"
                                        style={{
                                            '--fall-delay': `${categoryIndex * 85}ms`,
                                            '--tile-col-span': colSpan,
                                            borderColor: categoryBorder,
                                            background: `linear-gradient(180deg, ${swatch}22 0%, #13233d 84%)`,
                                        }}
                                    >
                                        <div className="category-box-header">
                                            <h4>{item.category}</h4>
                                            <span>{item.present}/{item.total} • {item.coverage}%</span>
                                        </div>

                                        <div className="skill-mini-grid">
                                            {item.skillItems.map((skillItem, skillIndex) => (
                                                <div
                                                    key={`${item.category}-${skillItem.skill}-${skillIndex}`}
                                                    className={`skill-mini-box ${skillItem.status}`}
                                                    style={{ '--fall-delay': `${(categoryIndex * 85) + (skillIndex * 22)}ms` }}
                                                    title={`${skillItem.skill} (${skillItem.status})`}
                                                >
                                                    {skillItem.skill}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                                })
                            ) : (
                                <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No category/skill map available for this run.</div>
                            )}
                        </div>
                    </div>

                    {/* Section 5: Additional Information */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr)', gap: '2rem' }}>
                        {/* 6. Extra Skills Cloud */}
                        <div className="content-card" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', padding: '2.5rem', borderTop: `4px solid ${COLORS.warning}` }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <Zap size={20} color={COLORS.warning} />
                                Unsolicited Candidate Talents
                            </h3>
                            <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.95rem' }}>Skills present in the resume that were not specifically requested by the Job Description.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                                {extraSkills.length > 0 ? extraSkills.map((skill, i) => (
                                    <div key={i} style={{ padding: '0.6rem 1.2rem', background: 'rgba(245, 158, 11, 0.15)', border: `1px solid ${COLORS.warning}40`, borderRadius: '30px', color: '#fcd34d', fontSize: '0.9rem', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        {skill}
                                    </div>
                                )) : (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No extra unrequired skills detected.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default VisualizationModal;
