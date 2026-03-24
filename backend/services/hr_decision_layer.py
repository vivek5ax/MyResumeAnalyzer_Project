"""
HR Decision Layer - Simplified, Decision-Ready Analytics for Recruiters.
Generates executive-level summary, skills requirement analysis, and risk assessment.
"""

from typing import Any, Dict, List
from datetime import datetime, timezone


def _to_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return fallback


def _clean_text(value: Any) -> str:
    text = str(value or "").strip()
    return " ".join(text.split())


def _categorize_triage_items(triage_items: List[Dict[str, Any]], exact_matches: List[str]) -> Dict[str, List[str]]:
    """
    Categorize triage items into priority buckets.
    Returns: {"critical": [], "important": [], "nice_to_have": []}
    """
    categories = {"critical_gaps": [], "important_gaps": [], "trainable_gaps": []}
    
    for item in triage_items:
        if not isinstance(item, dict):
            continue
        
        skill = _clean_text(item.get("skill"))
        priority = str(item.get("priority") or "").lower()
        trainability = str(item.get("trainability") or "").lower()
        
        if priority == "role_critical":
            categories["critical_gaps"].append(skill)
        elif priority == "important":
            categories["important_gaps"].append(skill)
        elif trainability in {"trainable_short_term", "trainable_mid_term"}:
            categories["trainable_gaps"].append(skill)
    
    return categories


def _map_trainability_to_timeline(trainability: str) -> str:
    """Map trainability enum to human-friendly timeline."""
    mapping = {
        "hard_to_train_fast": "6_to_12_months",
        "trainable_mid_term": "3_to_6_months",
        "trainable_short_term": "1_to_3_months",
    }
    return mapping.get(trainability.lower(), "unknown_timeline")


def _get_decision_recommendation(alignment_score: int, critical_gaps: int, missing_count: int) -> Dict[str, Any]:
    """
    Generate hiring decision recommendation based on alignment & gaps.
    """
    if alignment_score >= 75 and critical_gaps == 0:
        decision = "proceed"
        summary = "Strong match. Ready to move forward."
    elif alignment_score >= 60 and critical_gaps <= 2:
        decision = "interview_with_focus"
        summary = f"Good potential. Interview recommended to validate {critical_gaps} critical gap(s)."
    elif alignment_score >= 50:
        decision = "interview_with_conditions"
        summary = f"Trainable potential. Assess flexibility on {critical_gaps} critical gap(s) in interview."
    else:
        decision = "high_risk"
        summary = f"Significant gaps ({missing_count} missing skills). High risk without substantial upskilling."
    
    confidence = int(max(0, min(100, (alignment_score * 0.6) + ((100 - critical_gaps * 15) * 0.4))))
    
    return {
        "decision": decision,
        "summary": summary,
        "confidence": confidence,
    }


def build_hr_decision_layer(
    *,
    bert_results: Dict[str, Any],
    ai_enrichment: Dict[str, Any],
    jd_text: str,
    resume_text: str,
    domain: str = "software",
) -> Dict[str, Any]:
    """
    Build HR-focused decision layer with simplified, actionable content.
    
    Returns a dict with:
    - executive_recommendation: Decision + confidence + brief rationale
    - skills_requirement_analysis: Critical / Important / Nice-to-have breakdown
    - risk_assessment: Risk factors + mitigation strategies
    - quick_facts: Summary metrics
    """
    
    # Extract base data
    summary = bert_results.get("summary", {}) if isinstance(bert_results.get("summary"), dict) else {}
    partition = bert_results.get("skill_partition", {}) if isinstance(bert_results.get("skill_partition"), dict) else {}
    
    exact_count = int(summary.get("exact_match_count") or 0)
    semantic_count = int(summary.get("semantic_match_count") or 0)
    missing_count = int(summary.get("missing_skills_count") or 0)
    alignment_score = int(round(_to_float(summary.get("overall_alignment_score"), 0.0)))
    
    jd_skills = partition.get("jd_only", []) if isinstance(partition.get("jd_only"), list) else []
    exact_matches = partition.get("exact_match", []) if isinstance(partition.get("exact_match"), list) else []
    
    # AI Enrichment Data
    ai_status = str(ai_enrichment.get("status") or "disabled").lower()
    triage = ai_enrichment.get("missing_skill_triage", []) if isinstance(ai_enrichment.get("missing_skill_triage"), list) else []
    interview_focus = ai_enrichment.get("interview_focus", []) if isinstance(ai_enrichment.get("interview_focus"), list) else []
    
    # Categorize gaps
    gap_categories = _categorize_triage_items(triage, exact_matches)
    critical_gaps = gap_categories.get("critical_gaps", [])
    important_gaps = gap_categories.get("important_gaps", [])
    trainable_gaps = gap_categories.get("trainable_gaps", [])
    
    # Generate recommendation
    recommendation = _get_decision_recommendation(alignment_score, len(critical_gaps), missing_count)
    
    # === SECTION 1: Executive Recommendation ===
    executive_recommendation = {
        "decision": recommendation["decision"],
        "decision_confidence": recommendation["confidence"],
        "one_line_summary": recommendation["summary"],
        "key_drivers": {
            "strengths": f"{exact_count} exact matches on core technical requirements",
            "concern": f"{len(critical_gaps)} critical skill gaps requiring validation" if critical_gaps else "No critical gaps identified",
            "trainable": f"{len(trainable_gaps)} gaps trainable within standard onboarding" if trainable_gaps else "All gaps are non-trainable",
        },
    }
    
    # === SECTION 2: Skills Requirement Analysis ===
    # Simplified categorization: assume top 2-3 triage items are critical
    critical_required = list(dict.fromkeys([item.get("skill") for item in triage[:2] if isinstance(item, dict)]))[:2] or []
    important_required = list(dict.fromkeys([item.get("skill") for item in triage[2:4] if isinstance(item, dict)]))[:2] or []
    
    skills_requirement_analysis = {
        "critical_must_have": {
            "required": critical_required,
            "matched": [s for s in critical_required if s in exact_matches],
            "gaps": [s for s in critical_required if s not in exact_matches],
            "summary": f"{len([s for s in critical_required if s in exact_matches])}/{len(critical_required)} critical skills matched",
            "impact": "Role cannot be performed effectively without these",
        },
        "important_strongly_preferred": {
            "required": important_required + exact_matches[:2],
            "matched": [s for s in (important_required + exact_matches[:2]) if s in (exact_matches + [item.get("skill") for item in triage if isinstance(item, dict)])],
            "gaps": [s for s in important_required if s not in (exact_matches + [item.get("skill") for item in triage if isinstance(item, dict)])],
            "summary": f"{exact_count} exact matches on important technical skills",
            "impact": "Performance will be significantly boosted with these skills",
        },
        "nice_to_have": {
            "required": exact_matches[2:4] if len(exact_matches) > 2 else [],
            "matched": exact_matches[2:4] if len(exact_matches) > 2 else [],
            "gaps": [],
            "summary": f"{min(3, semantic_count)} additional skills via semantic match",
            "impact": "Differentiator in performance and growth potential",
        },
    }
    
    # === SECTION 3: Risk Assessment ===
    risk_factors = []
    
    # Critical gap risk
    if critical_gaps:
        risk_factors.append({
            "factor": f"Missing {len(critical_gaps)} critical skill(s): {', '.join(critical_gaps[:2])}",
            "severity": "high",
            "probability": "high" if len(critical_gaps) >= 2 else "medium",
            "impact": "Significant ramp-up time and potential performance issues",
            "trainability": _map_trainability_to_timeline("trainable_mid_term")
                if any(t for t in triage if str(t.get("priority")).lower() == "role_critical") else "hard_to_train_fast",
            "mitigation_strategy": "Conduct deep technical interview; pair with experienced mentor; allocate 4-6 week bootstrap period",
            "go_no_go_factor": True,
        })
    
    # Important gap risk
    if important_gaps:
        risk_factors.append({
            "factor": f"Missing {len(important_gaps)} important skill(s): {', '.join(important_gaps[:2])}",
            "severity": "medium",
            "probability": "medium",
            "impact": "Moderate ramp-up time; slower initial productivity",
            "trainability": "trainable_3_to_6_months",
            "mitigation_strategy": "Structured onboarding with focused training; peer learning; progressive work assignment",
            "go_no_go_factor": False,
        })
    
    # High missing skills risk
    if missing_count > 5:
        risk_factors.append({
            "factor": f"High skill gap ratio: {missing_count} unmatched requirements",
            "severity": "high",
            "probability": "high",
            "impact": "Extended ramp-up period; potential cultural/team fit concerns",
            "trainability": "trainable_6_to_12_months",
            "mitigation_strategy": "Consider if candidate is overqualified for role; assess career growth motivation; evaluate long-term potential",
            "go_no_go_factor": False,
        })
    
    # Determine overall risk level and timeline
    if not risk_factors or (len(critical_gaps) == 0 and missing_count <= 2):
        overall_risk_level = "low"
        mitigation_timeline = "1_to_3_months"
    elif len(critical_gaps) <= 1 and missing_count <= 4:
        overall_risk_level = "medium"
        mitigation_timeline = "3_to_6_months"
    else:
        overall_risk_level = "high"
        mitigation_timeline = "6_to_12_months"
    
    risk_assessment = {
        "overall_risk_level": overall_risk_level,
        "risk_factors": risk_factors,
        "mitigation_timeline": mitigation_timeline,
        "hiring_decision_readiness": recommendation["decision"],
        "recommendation_for_interview": f"Interview is {'highly recommended' if recommendation['confidence'] >= 70 else 'recommended' if recommendation['confidence'] >= 50 else 'not recommended'}",
    }
    
    # === SECTION 4: Quick Facts ===
    coverage_percentage = int(round(((exact_count + semantic_count) / max(1, exact_count + semantic_count + missing_count)) * 100))
    
    quick_facts = {
        "exact_skill_matches": exact_count,
        "semantic_matches": semantic_count,
        "total_matched": exact_count + semantic_count,
        "skill_gaps": missing_count,
        "overall_coverage": f"{coverage_percentage}%",
        "interview_probes": len(interview_focus),
        "role_alignment_score": alignment_score,
        "decision_confidence_score": recommendation["confidence"],
    }
    
    # === MAIN PAYLOAD ===
    hr_decision_layer = {
        "schema_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "domain": domain,
        "executive_recommendation": executive_recommendation,
        "skills_requirement_analysis": skills_requirement_analysis,
        "risk_assessment": risk_assessment,
        "quick_facts": quick_facts,
        "hiring_readiness": {
            "can_conduct_interview": recommendation["confidence"] >= 40,
            "interview_focus_areas": [item.get("topic") for item in interview_focus[:5]] if interview_focus else list(dict.fromkeys([item.get("skill") for item in triage[:5] if isinstance(item, dict)]))[:5],
            "pre_interview_validation": f"Validate: {', '.join(critical_gaps[:2])}" if critical_gaps else "No critical validations needed",
            "onboarding_readiness": "high" if len(critical_gaps) == 0 else "medium" if len(critical_gaps) <= 1 else "low",
        },
    }
    
    return hr_decision_layer
