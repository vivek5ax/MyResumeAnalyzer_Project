import React, { forwardRef } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const COLORS = {
    primary: '#4f46e5',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9'
};

const FormalReport = forwardRef(({ data }, ref) => {
    // ALWAYS return the outer div with the ref, so react-to-print finds something.
    // We conditionally render the contents inside.
    return (
        <div ref={ref} className="formal-report-container">
            {(!data || !data.bert_results || !data.bert_results.resume_clusters) ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading Report Data...</div>
            ) : (
                <ReportContent data={data} />
            )}
        </div>
    );
});

// Move the actual rendering into a sub-component so we don't pollute the forwardRef with complex logic before the early return.
const ReportContent = ({ data }) => {
    const { parser_results, bert_results } = data || {};
    const { jd_data, resume_data } = parser_results || {};
    const { partition, score, resume_clusters, jd_clusters } = bert_results || {};

    // Ensure we have the minimum data before rendering internal elements
    if (!resume_clusters || !partition) return null;

    // 1. Data Prep: Radar Chart
    const radarData = Object.keys(resume_clusters).map(cat => ({
        subject: cat,
        A: resume_clusters[cat].length,
        fullMark: Math.max(10, resume_clusters[cat].length + 2)
    }));

    let topSkillCategory = "Various Categories";
    let isFocused = false;
    let totalSkills = 0;
    if (radarData.length > 0) {
        const sortedRadar = [...radarData].sort((a, b) => b.A - a.A);
        topSkillCategory = sortedRadar[0].subject;
        isFocused = sortedRadar[0].A >= (sortedRadar[1]?.A || 0) * 1.5;
        totalSkills = radarData.reduce((acc, curr) => acc + curr.A, 0);
    }

    // 2. Data Prep: Match Confidence
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

    // 3. Data Prep: Category Comparison
    const safeJdClusters = jd_clusters || {};
    const comparisonData = Object.keys(safeJdClusters).map(cat => ({
        category: cat,
        resume: resume_clusters[cat]?.length || 0,
        jd: safeJdClusters[cat]?.length || 0
    }));

    return (
        <div ref={ref} className="formal-report-container">
            {/* INLINE STYLES FOR PRINTING TO OVERRIDE DARK THEME */}
            <style type="text/css" media="print">
                {`
                @page { size: portrait; margin: 15mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                .formal-report-container { background: white !important; color: #0f172a !important; font-family: 'Inter', sans-serif; }
                .report-page { page-break-after: always; padding: 20px; box-sizing: border-box; }
                .report-page:last-child { page-break-after: avoid; }
                .no-break { page-break-inside: avoid; }
                h1, h2, h3, h4, p, span, td, th { color: #0f172a !important; }
                .text-muted { color: #475569 !important; }
                tr { page-break-inside: avoid; }
                `}
            </style>

            {/* --- PAGE 1: EXECUTIVE SUMMARY --- */}
            <div className="report-page">
                {/* Header */}
                <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24pt', color: '#1e293b', fontWeight: '800' }}>Executive Semantic Analysis</h1>
                        <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '10pt' }}>Resume Screening & Capability Matching Report</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '9pt', fontWeight: 'bold' }}>Date: {new Date().toLocaleDateString()}</p>
                        <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '9pt' }}>Domain: {data.domain || 'Unspecified'}</p>
                    </div>
                </div>

                {/* KPI Section */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
                    <div style={{ flex: 1, padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <h3 className="text-muted" style={{ margin: '0 0 10px 0', fontSize: '11pt', textTransform: 'uppercase' }}>Overall Alignment Score</h3>
                        <div style={{ fontSize: '36pt', fontWeight: '900', color: score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger }}>
                            {Math.round(score)}%
                        </div>
                    </div>
                    <div style={{ flex: 2, padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 className="text-muted" style={{ margin: '0 0 10px 0', fontSize: '11pt', textTransform: 'uppercase' }}>Candidate Profile Synopsis</h3>
                        <p style={{ fontSize: '11pt', lineHeight: '1.6', margin: 0 }}>
                            This candidate demonstrates a <strong>{isFocused ? "Highly Specialized" : "Well-Rounded"}</strong> skillset,
                            with <strong>{topSkillCategory}</strong> being their strongest domain.
                            The semantic engine identified <strong>{totalSkills}</strong> distinct professional capabilities
                            that align with the provided job description requirements.
                        </p>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="no-break" style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '14pt', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1rem' }}>Expertise Fingerprint</h2>
                    <div style={{ width: '100%', height: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#cbd5e1" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10, fontWeight: 600 }} />
                                <Radar name="Candidate" dataKey="A" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.4} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Confidence Distribution */}
                <div className="no-break">
                    <h2 style={{ fontSize: '14pt', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1rem' }}>Match Quality Confidence</h2>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={buckets} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                                <Bar dataKey="count" name="Skills" radius={[4, 4, 0, 0]} barSize={40}>
                                    {buckets.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- PAGE 2: DETAILED MATCH LEDGER --- */}
            <div className="report-page">
                <h2 style={{ fontSize: '16pt', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1.5rem' }}>Detailed Capability Match Ledger</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #cbd5e1', width: '60%' }}>Skill / Capability</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #cbd5e1', width: '20%' }}>Match Quality</th>
                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #cbd5e1', width: '20%' }}>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allMatches.sort((a, b) => b.score - a.score).map((match, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{match.skill}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    {match.score >= 0.9 ? 'Exact / High' : match.score >= 0.8 ? 'Strong' : match.score >= 0.7 ? 'Moderate' : 'Weak'}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: match.score >= 0.9 ? COLORS.success : match.score >= 0.7 ? COLORS.warning : COLORS.danger }}>
                                    {(match.score * 100).toFixed(0)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- PAGE 3: CATEGORY COMPARISON --- */}
            <div className="report-page">
                <h2 style={{ fontSize: '16pt', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '1.5rem' }}>Requirement vs. Candidate Comparison</h2>

                <div style={{ width: '100%', height: '400px', marginBottom: '3rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#334155' }} angle={-45} textAnchor="end" height={80} interval={0} />
                            <YAxis tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                            <Bar dataKey="jd" name="Job Requirement" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resume" name="Candidate Possesses" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <h3 style={{ fontSize: '12pt', marginBottom: '10px' }}>Unsolicited / Extra Talents Highlights</h3>
                <p style={{ fontSize: '10pt', color: '#475569', marginBottom: '1rem' }}>These skills were found on the resume but were not explicitly required by the Job Description.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(bert_results.extra_resume_skills || []).map((skill, i) => (
                        <span key={i} style={{ padding: '4px 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '9pt', color: '#334155' }}>
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default FormalReport;
