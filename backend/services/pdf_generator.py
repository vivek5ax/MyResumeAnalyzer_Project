import io
from datetime import datetime

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _to_float(value, fallback=0.0):
    try:
        return float(value)
    except Exception:
        return fallback


def _to_int(value, fallback=0):
    try:
        return int(value)
    except Exception:
        return fallback


def _recommendation(score, critical_missing):
    if score >= 75 and critical_missing <= 3:
        return "Strong shortlist"
    if score >= 55:
        return "Interview with focus areas"
    return "High risk for this role"


def _chart_to_image(fig, width, height):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=170, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return Image(buf, width=width, height=height)


def _create_gauge(score):
    score = max(0, min(100, _to_float(score)))
    fig, ax = plt.subplots(figsize=(4, 2.6), subplot_kw={"projection": "polar"})

    theta = np.linspace(np.pi, 0, 240)
    ax.plot(theta, np.ones_like(theta), color="#dbe4f3", linewidth=18)

    value_theta = np.linspace(np.pi, np.pi - (score / 100.0) * np.pi, 240)
    color = "#10b981" if score >= 75 else ("#f59e0b" if score >= 50 else "#ef4444")
    ax.plot(value_theta, np.ones_like(value_theta), color=color, linewidth=18)

    ax.text(0, 0.0, f"{int(round(score))}%", ha="center", va="center", fontsize=24, fontweight="bold", color="#0f172a")
    ax.text(0, -0.45, "Overall Alignment", ha="center", va="center", fontsize=9, color="#475569")

    ax.set_theta_zero_location("W")
    ax.set_theta_direction(-1)
    ax.set_axis_off()

    return _chart_to_image(fig, width=3.1 * inch, height=2.2 * inch)


def _create_match_donut(summary):
    exact = _to_int(summary.get("exact_match_count", 0))
    semantic = _to_int(summary.get("semantic_match_count", 0))
    missing = _to_int(summary.get("missing_skills_count", 0))

    values = [exact, semantic, missing]
    labels = ["Exact", "Semantic", "Missing"]
    colors_map = ["#10b981", "#3b82f6", "#ef4444"]

    if sum(values) == 0:
        values = [1]
        labels = ["No Data"]
        colors_map = ["#94a3b8"]

    fig, ax = plt.subplots(figsize=(4, 2.8))
    wedges, _ = ax.pie(values, colors=colors_map, startangle=90, wedgeprops={"width": 0.38, "edgecolor": "white"})
    ax.legend(wedges, labels, loc="lower center", bbox_to_anchor=(0.5, -0.17), ncol=len(labels), frameon=False, fontsize=8)
    ax.set_title("Match Distribution", fontsize=11, color="#0f172a", pad=6)
    ax.axis("equal")

    return _chart_to_image(fig, width=3.2 * inch, height=2.35 * inch)


def _create_funnel(summary):
    jd_total = _to_int(summary.get("total_jd_skills", 0))
    exact = _to_int(summary.get("exact_match_count", 0))
    semantic = _to_int(summary.get("semantic_match_count", 0))
    missing = _to_int(summary.get("missing_skills_count", 0))

    stages = ["JD Skills", "Exact", "Semantic", "Missing"]
    values = [jd_total, exact, semantic, missing]
    colors_map = ["#6366f1", "#10b981", "#3b82f6", "#ef4444"]

    fig, ax = plt.subplots(figsize=(6.4, 2.6))
    bars = ax.bar(stages, values, color=colors_map)
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f"{int(h)}", xy=(bar.get_x() + bar.get_width() / 2, h), xytext=(0, 3), textcoords="offset points", ha="center", fontsize=8)

    ax.set_title("Match Funnel", fontsize=11, color="#0f172a", pad=8)
    ax.grid(axis="y", linestyle="--", alpha=0.24)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    return _chart_to_image(fig, width=6.3 * inch, height=2.5 * inch)


def _create_confidence_buckets(partition):
    all_matches = [
        *[{"score": 1.0} for _ in partition.get("exact_match", [])],
        *partition.get("strong_semantic", []),
        *partition.get("moderate_semantic", []),
    ]

    scores = [_to_float(item.get("score", 0.0), 0.0) for item in all_matches]
    bins = {
        "90-100%": len([s for s in scores if s >= 0.9]),
        "80-89%": len([s for s in scores if 0.8 <= s < 0.9]),
        "70-79%": len([s for s in scores if 0.7 <= s < 0.8]),
        "Below 70%": len([s for s in scores if s < 0.7]),
    }

    fig, ax = plt.subplots(figsize=(6.4, 2.6))
    labels = list(bins.keys())
    values = list(bins.values())
    colors_map = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]

    bars = ax.bar(labels, values, color=colors_map)
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f"{int(h)}", xy=(bar.get_x() + bar.get_width() / 2, h), xytext=(0, 3), textcoords="offset points", ha="center", fontsize=8)

    ax.set_title("Confidence Distribution", fontsize=11, color="#0f172a", pad=8)
    ax.grid(axis="y", linestyle="--", alpha=0.24)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    return _chart_to_image(fig, width=6.3 * inch, height=2.5 * inch)


def _create_category_comparison(jd_clusters, resume_clusters):
    categories = sorted(set([*jd_clusters.keys(), *resume_clusters.keys()]))[:10]
    if not categories:
        categories = ["No Data"]

    jd_counts = [len(jd_clusters.get(cat, [])) for cat in categories]
    res_counts = [len(resume_clusters.get(cat, [])) for cat in categories]

    x = np.arange(len(categories))
    width = 0.38

    fig, ax = plt.subplots(figsize=(6.4, 3.0))
    ax.bar(x - width / 2, jd_counts, width, color="#14b8a6", label="JD")
    ax.bar(x + width / 2, res_counts, width, color="#3b82f6", label="Resume")

    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=35, ha="right", fontsize=8)
    ax.set_title("Category Coverage (JD vs Resume)", fontsize=11, color="#0f172a", pad=8)
    ax.legend(frameon=False, fontsize=8)
    ax.grid(axis="y", linestyle="--", alpha=0.2)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    return _chart_to_image(fig, width=6.3 * inch, height=2.8 * inch)


def _compute_category_rows(jd_clusters, partition, missing_from_resume):
    matched_set = set([s.lower() for s in partition.get("exact_match", [])])
    matched_set.update([str(item.get("similar_to", "")).lower() for item in partition.get("strong_semantic", [])])
    matched_set.update([str(item.get("similar_to", "")).lower() for item in partition.get("moderate_semantic", [])])

    rows = []
    for category, skills in jd_clusters.items():
        required = [str(s).strip() for s in skills if str(s).strip()]
        req_count = len(required)
        covered = len([s for s in required if s.lower() in matched_set])
        missing_items = [m for m in missing_from_resume if category in m.get("categories", [])]
        missing_count = len(missing_items)
        risk_weight = round(sum([_to_float(item.get("weight", 1.0), 1.0) for item in missing_items]), 2)
        coverage_pct = int(round((covered / req_count) * 100)) if req_count else 0
        rows.append({
            "category": category,
            "coverage_pct": coverage_pct,
            "missing_count": missing_count,
            "risk_weight": risk_weight,
        })

    rows.sort(key=lambda r: (r["risk_weight"], r["missing_count"]), reverse=True)
    return rows


def _create_risk_heatmap(category_rows):
    top_rows = category_rows[:8] if category_rows else []
    if not top_rows:
        top_rows = [{"category": "No Data", "coverage_pct": 0, "missing_count": 0, "risk_weight": 0}]

    matrix = np.array([
        [row["coverage_pct"], row["missing_count"], row["risk_weight"]]
        for row in top_rows
    ], dtype=float)

    if matrix.shape[0] == 0:
        matrix = np.array([[0, 0, 0]], dtype=float)

    normalized = matrix.copy()
    for col in range(normalized.shape[1]):
        maxv = np.max(normalized[:, col])
        normalized[:, col] = normalized[:, col] / maxv if maxv > 0 else normalized[:, col]

    fig, ax = plt.subplots(figsize=(6.4, 2.8))
    im = ax.imshow(normalized, aspect="auto", cmap="YlGnBu")

    ax.set_xticks(range(3))
    ax.set_xticklabels(["Coverage", "Missing", "Risk"], fontsize=8)
    ax.set_yticks(range(len(top_rows)))
    ax.set_yticklabels([r["category"] for r in top_rows], fontsize=8)

    for i in range(len(top_rows)):
        raw = [top_rows[i]["coverage_pct"], top_rows[i]["missing_count"], top_rows[i]["risk_weight"]]
        for j in range(3):
            ax.text(j, i, str(raw[j]), ha="center", va="center", fontsize=7, color="#0f172a")

    ax.set_title("Category Risk Heatmap", fontsize=11, color="#0f172a", pad=8)
    fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)

    return _chart_to_image(fig, width=6.3 * inch, height=2.7 * inch)


def _header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.line(doc.leftMargin, A4[1] - 42, A4[0] - doc.rightMargin, A4[1] - 42)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(A4[0] - doc.rightMargin, 26, f"Page {doc.page}")
    canvas.restoreState()


def generate_formal_pdf(data):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=48,
        bottomMargin=34,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=22, leading=24, textColor=colors.HexColor("#0f172a"), spaceAfter=4)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#64748b"), spaceAfter=12)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13, leading=16, textColor=colors.HexColor("#1e293b"), spaceBefore=8, spaceAfter=8)
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9.5, leading=13, textColor=colors.HexColor("#334155"))

    bert_results = data.get("bert_results", {})
    summary = bert_results.get("summary", {})
    partition = bert_results.get("skill_partition", {})
    jd_clusters = bert_results.get("jd_skill_clusters", {})
    resume_clusters = bert_results.get("resume_skill_clusters", {})
    missing_from_resume = bert_results.get("missing_from_resume", [])
    evidence = bert_results.get("match_evidence", [])

    score = _to_float(summary.get("overall_alignment_score", 0))
    critical_missing = len([item for item in missing_from_resume if _to_float(item.get("weight", 1), 1) >= 1.3])
    recommendation = _recommendation(score, critical_missing)

    weighted_risk = round(sum([_to_float(item.get("weight", 1), 1) for item in missing_from_resume]), 2)
    semantic_scores = [_to_float(item.get("score", 0), 0) for item in partition.get("strong_semantic", []) + partition.get("moderate_semantic", [])]
    semantic_reliability = int(round((sum(semantic_scores) / len(semantic_scores)) * 100)) if semantic_scores else 0
    total_weighted_demand = _to_float(summary.get("total_jd_skills", 0), 0) + weighted_risk
    weighted_coverage = round(((_to_float(summary.get("exact_match_count", 0), 0) + _to_float(summary.get("semantic_match_count", 0), 0)) / total_weighted_demand) * 100, 1) if total_weighted_demand > 0 else 0

    story = []

    # Page 1: Executive snapshot
    story.append(Paragraph("Resume Analysis Report", title_style))
    candidate_name = data.get("resume_filename", "Candidate")
    jd_name = data.get("jd_filename", "Job Description")
    generated_on = datetime.now().strftime("%B %d, %Y %H:%M")
    story.append(Paragraph(f"Candidate: {candidate_name} | Role Source: {jd_name} | Generated: {generated_on}", subtitle_style))

    gauge = _create_gauge(score)
    donut = _create_match_donut(summary)
    top_visual = Table([[gauge, donut]], colWidths=[3.2 * inch, 3.2 * inch])
    top_visual.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(top_visual)
    story.append(Spacer(1, 0.08 * inch))

    story.append(Paragraph("Executive Decision", h2))
    story.append(Paragraph(f"Recommendation: <b>{recommendation}</b>. This scorecard combines exact matches, semantic matches, weighted missing risk, and category coverage.", body))
    story.append(Spacer(1, 0.08 * inch))

    kpi_data = [
        ["Weighted Coverage", f"{weighted_coverage}%", "Weighted Risk Index", str(weighted_risk)],
        ["Critical Missing", str(critical_missing), "Semantic Reliability", f"{semantic_reliability}%"],
    ]
    kpi_table = Table(kpi_data, colWidths=[1.6 * inch, 1.45 * inch, 1.8 * inch, 1.45 * inch])
    kpi_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0f172a")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dbe4f3")),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(kpi_table)

    # Page 2: Compact visual analysis
    story.append(PageBreak())
    story.append(Paragraph("Visual Analysis Summary", h2))
    story.append(_create_funnel(summary))
    story.append(Spacer(1, 0.05 * inch))
    story.append(_create_confidence_buckets(partition))
    story.append(Spacer(1, 0.05 * inch))
    story.append(_create_category_comparison(jd_clusters, resume_clusters))

    # Page 3: Risk and evidence
    story.append(PageBreak())
    story.append(Paragraph("Risk, Gaps, and Evidence", h2))

    category_rows = _compute_category_rows(jd_clusters, partition, missing_from_resume)
    story.append(_create_risk_heatmap(category_rows))
    story.append(Spacer(1, 0.05 * inch))

    top_missing = sorted(missing_from_resume, key=lambda item: _to_float(item.get("weight", 1), 1), reverse=True)[:8]
    if top_missing:
        story.append(Paragraph("Top Missing Priorities", body))
        missing_table_data = [["Skill", "Weight", "Category"]]
        for item in top_missing:
            categories = ", ".join(item.get("categories", [])[:2])
            missing_table_data.append([
                str(item.get("skill", "-")),
                str(round(_to_float(item.get("weight", 1), 1), 2)),
                categories or "-",
            ])

        missing_table = Table(missing_table_data, colWidths=[2.6 * inch, 1.0 * inch, 2.7 * inch], repeatRows=1)
        missing_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff7ed")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#7c2d12")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#fed7aa")),
            ("FONTSIZE", (0, 1), (-1, -1), 8.5),
            ("ALIGN", (1, 1), (1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(missing_table)
        story.append(Spacer(1, 0.06 * inch))

    if evidence:
        story.append(Paragraph("Top Evidence Rows", body))
        evidence_data = [["Skill", "Type", "Confidence"]]
        for row in evidence[:10]:
            confidence = _to_float(row.get("confidence", 0), 0)
            evidence_data.append([
                str(row.get("skill", "-")),
                str(row.get("match_type", "-")),
                f"{confidence * 100:.1f}%",
            ])

        evidence_table = Table(evidence_data, colWidths=[3.0 * inch, 2.0 * inch, 1.3 * inch], repeatRows=1)
        evidence_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eff6ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#bfdbfe")),
            ("FONTSIZE", (0, 1), (-1, -1), 8.5),
            ("ALIGN", (2, 1), (2, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(evidence_table)

    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    buffer.seek(0)
    return buffer
