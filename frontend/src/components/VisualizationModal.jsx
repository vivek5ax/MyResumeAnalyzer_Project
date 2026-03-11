import React from 'react';
import ReactDOM from 'react-dom';
import { X, BarChart3, PieChart as PieChartIcon, Target, AlertTriangle, Layers, BookOpen, Activity, Zap } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const VisualizationModal = ({ isOpen, onClose, isClosing, data }) => {
    if (!isOpen) return null;

    const bertResults = data.bert_results || {};
    const summary = bertResults.summary || { overall_alignment_score: 0, exact_match_count: 0, semantic_match_count: 0, missing_skills_count: 0 };
    const partition = bertResults.skill_partition || { exact_match: [], strong_semantic: [], moderate_semantic: [], irrelevant: [] };

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
    const jdClusters = bertResults.jd_skill_clusters || {};
    const resumeClusters = bertResults.resume_skill_clusters || {};
    const allCategories = Array.from(new Set([...Object.keys(jdClusters), ...Object.keys(resumeClusters)]));
    const categoryData = allCategories.map(cat => ({
        category: cat,
        jd: jdClusters[cat] ? jdClusters[cat].length : 0,
        resume: resumeClusters[cat] ? resumeClusters[cat].length : 0
    })).sort((a, b) => b.jd - a.jd).slice(0, 8); // Top 8 categories for sanity

    // 4. Missing Skills Priority
    const missingPriorityData = (bertResults.missing_from_resume || [])
        .slice(0, 5) // Top 5 urgent
        .map(skill => ({
            name: skill.skill,
            weight: skill.weight || 1
        }));

    // 5. Radar Chart (Profile)
    const radarData = Object.keys(resumeClusters).map(cat => ({
        subject: cat,
        A: resumeClusters[cat].length,
        fullMark: Math.max(10, resumeClusters[cat].length + 2)
    }));

    // Radar Conclusion Logic
    let topSkillCategory = "Various Categories";
    let isFocused = false;
    let totalSkills = 0;
    if (radarData.length > 0) {
        const sortedRadar = [...radarData].sort((a, b) => b.A - a.A);
        topSkillCategory = sortedRadar[0].subject;
        isFocused = sortedRadar[0].A >= (sortedRadar[1]?.A || 0) * 1.5;
        totalSkills = radarData.reduce((acc, curr) => acc + curr.A, 0);
    }

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
                <div style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', flex: 1, background: 'transparent' }}>

                    {/* Section 1: Executive Overview */}
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

                        {/* 4. Missing Skills Priority (Moved up) */}
                        <div className="content-card" style={{ background: '#1e293b', padding: '2rem', borderTop: `4px solid ${COLORS.danger}` }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                <AlertTriangle size={20} color={COLORS.danger} />
                                Urgent Missing Priorities
                            </h3>
                            {missingPriorityData.length > 0 ? (
                                <div style={{ height: 220, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={missingPriorityData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 600, fill: 'white' }} width={240} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value) => [value, 'JD Importance Weight']} />
                                            <Bar dataKey="weight" name="Priority Weight" radius={[0, 6, 6, 0]} barSize={24}>
                                                {
                                                    missingPriorityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS.danger} fillOpacity={1 - (index * 0.15)} />
                                                    ))
                                                }
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.success, fontWeight: 'bold' }}>
                                    🎉 No critical skills missing!
                                </div>
                            )}
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '2rem', marginTop: '1rem', flex: 1, minHeight: 450 }}>
                                <div style={{ width: '100%', height: '100%' }}>
                                    {radarData.length >= 3 ? (
                                        <ResponsiveContainer width="100%" height="100%">
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
                                {/* Radar Conclusion Sidebar */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid #334155' }}>
                                    <h4 style={{ color: COLORS.success, fontSize: '1.2rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Target size={20} /> Analysis Conclusion
                                    </h4>
                                    {radarData.length >= 3 ? (
                                        <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
                                            Based on the semantic extraction of <strong style={{ color: 'white' }}>{totalSkills}</strong> categorizable skills, the candidate's expertise is heavily anchored in <strong style={{ color: 'white' }}>{topSkillCategory}</strong>.
                                            <br /><br />
                                            This distribution suggests a <strong style={{ color: COLORS.info }}>{isFocused ? 'highly specialized' : 'well-rounded'}</strong> professional profile across the required functional areas.
                                        </p>
                                    ) : (
                                        <p style={{ color: '#94a3b8', fontSize: '1.05rem', fontStyle: 'italic', margin: 0 }}>
                                            Insufficient data to form a conclusive profile.
                                        </p>
                                    )}
                                </div>
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
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                                    <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

                    {/* Section 4: Additional Information */}
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
