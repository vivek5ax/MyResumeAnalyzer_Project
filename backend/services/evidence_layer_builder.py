from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List


def _to_float(value: Any, fallback: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return fallback


def _clean_text(value: Any) -> str:
    text = str(value or "").strip()
    return " ".join(text.split())


def _dedupe(items: List[str]) -> List[str]:
    out: List[str] = []
    seen = set()
    for item in items:
        text = _clean_text(item)
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
    return out


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _source_mode(ai_status: str) -> str:
    return "hybrid" if ai_status == "success" else "deterministic"


def _fit_label(alignment_score: int, missing_count: int) -> Dict[str, str]:
    if alignment_score >= 75 and missing_count <= 4:
        return {"label": "Strong Match", "tier": "strong_match"}
    if alignment_score >= 55:
        return {"label": "Interview with Focus Areas", "tier": "borderline"}
    return {"label": "High Risk", "tier": "high_risk"}


def _fallback_triage(missing_skills: List[str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for idx, skill in enumerate(missing_skills[:8]):
        priority = "role_critical" if idx < 2 else ("important" if idx < 5 else "nice_to_have")
        impact = "high" if idx < 2 else ("medium" if idx < 5 else "low")
        trainability = "hard_to_train_fast" if idx < 2 else ("trainable_mid_term" if idx < 5 else "trainable_short_term")
        out.append(
            {
                "skill": skill,
                "priority": priority,
                "impact": impact,
                "trainability": trainability,
                "confidence": round(max(0.35, 0.82 - idx * 0.06), 2),
                "reason": f"{skill} appears in JD gaps and should be validated as a hiring risk.",
                "evidence": {
                    "jd_snippet": skill,
                    "resume_signal": "not_found",
                },
                "recommended_action": "Assess practical depth in interview and define upskilling feasibility.",
                "source_mode": "deterministic",
            }
        )
    return out


def _fallback_interview_focus(triage_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for idx, item in enumerate(triage_items[:6]):
        skill = _clean_text(item.get("skill"))
        if not skill:
            continue
        out.append(
            {
                "topic": skill,
                "objective": f"Validate practical ownership in {skill}.",
                "question": f"Describe one recent project where you applied {skill}. What were your design and delivery decisions?",
                "expected_strong_signal": "Clear ownership, architecture rationale, measurable outcome.",
                "red_flag_signal": "Generic or theoretical explanation without implementation details.",
                "confidence": round(max(0.4, 0.8 - idx * 0.06), 2),
                "source_mode": "deterministic",
            }
        )
    return out


def _fallback_mappings(partition: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    seen = set()
    for bucket in ["strong_semantic", "moderate_semantic"]:
        rows = partition.get(bucket, []) if isinstance(partition.get(bucket), list) else []
        for row in rows:
            if not isinstance(row, dict):
                continue
            src = _clean_text(row.get("skill"))
            dst = _clean_text(row.get("similar_to"))
            if not src or not dst:
                continue
            key = (src.lower(), dst.lower())
            if key in seen:
                continue
            seen.add(key)
            out.append(
                {
                    "source_term": src,
                    "normalized_term": dst,
                    "relation": "related",
                    "confidence": round(max(0.5, _to_float(row.get("confidence"), 0.0)), 2),
                    "evidence": "Derived from deterministic semantic matching.",
                    "source_mode": "deterministic",
                }
            )
            if len(out) >= 12:
                return out
    return out


def _build_trace_tabs(match_evidence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    buckets = {
        "ready_signals": {"label": "Ready Signals", "types": {"exact"}},
        "needs_validation": {"label": "Needs Validation", "types": {"strong_semantic", "moderate_semantic"}},
        "risk_gaps": {"label": "Risk Gaps", "types": {"missing"}},
    }

    tabs: List[Dict[str, Any]] = []
    for tab_id, cfg in buckets.items():
        rows = []
        for row in match_evidence:
            if not isinstance(row, dict):
                continue
            if str(row.get("match_type") or "").lower() not in cfg["types"]:
                continue
            rows.append(
                {
                    "skill": _clean_text(row.get("skill")) or "Unknown Skill",
                    "match_type": _clean_text(row.get("match_type")) or "unknown",
                    "confidence": round(max(0.0, min(1.0, _to_float(row.get("confidence"), 0.0))), 2),
                    "jd_context": _clean_text(row.get("jd_snippet"))[:260] or "No JD context captured.",
                    "resume_context": _clean_text(row.get("resume_snippet"))[:260] or "No resume context captured.",
                    "reason": "Evidence derived from semantic matching pipeline.",
                    "source_mode": "deterministic",
                }
            )
        tabs.append(
            {
                "tab_id": tab_id,
                "label": cfg["label"],
                "count": len(rows),
                "rows": rows[:16],
            }
        )
    return tabs


def build_evidence_layer_payload(
    *,
    session_id: str,
    domain: str,
    bert_results: Dict[str, Any],
    ai_enrichment: Dict[str, Any],
    jd_text: str,
    resume_text: str,
    persona: str = "hr",
) -> Dict[str, Any]:
    summary = bert_results.get("summary", {}) if isinstance(bert_results.get("summary"), dict) else {}
    partition = bert_results.get("skill_partition", {}) if isinstance(bert_results.get("skill_partition"), dict) else {}
    match_evidence = bert_results.get("match_evidence", []) if isinstance(bert_results.get("match_evidence"), list) else []

    exact_count = int(summary.get("exact_match_count") or 0)
    semantic_count = int(summary.get("semantic_match_count") or 0)
    missing_count = int(summary.get("missing_skills_count") or 0)
    alignment_score = int(round(_to_float(summary.get("overall_alignment_score"), 0.0)))

    missing_from_resume = bert_results.get("missing_from_resume", []) if isinstance(bert_results.get("missing_from_resume"), list) else []
    missing_skills = _dedupe([item.get("skill") for item in missing_from_resume if isinstance(item, dict)])

    ai_status = str(ai_enrichment.get("status") or "disabled").lower()
    ai_quality = ai_enrichment.get("quality", {}) if isinstance(ai_enrichment.get("quality"), dict) else {}
    ai_warnings = ai_quality.get("warnings", []) if isinstance(ai_quality.get("warnings"), list) else []
    ai_coverage = max(0.0, min(1.0, _to_float(ai_quality.get("coverage_score"), 0.0)))
    ai_risk = str(ai_quality.get("hallucination_risk") or "medium").lower()

    triage = ai_enrichment.get("missing_skill_triage", []) if isinstance(ai_enrichment.get("missing_skill_triage"), list) else []
    interview_focus = ai_enrichment.get("interview_focus", []) if isinstance(ai_enrichment.get("interview_focus"), list) else []
    mappings = ai_enrichment.get("normalization", {}).get("mappings", []) if isinstance(ai_enrichment.get("normalization"), dict) else []

    fallback_triage = _fallback_triage(missing_skills)
    if not triage:
        triage = fallback_triage
    fallback_focus = _fallback_interview_focus(triage if triage else fallback_triage)
    if not interview_focus:
        interview_focus = fallback_focus
    fallback_map = _fallback_mappings(partition)
    if not mappings:
        mappings = fallback_map

    fit = _fit_label(alignment_score, missing_count)
    overall_mode = _source_mode(ai_status)

    decision_confidence = int(max(0, min(100, round((alignment_score * 0.5) + ((exact_count + semantic_count) * 2.2) - (missing_count * 1.8) + (ai_coverage * 15)))))
    risk_pressure = int(max(0, min(100, round((missing_count / max(1, exact_count + missing_count)) * 100))))
    interview_readiness = int(max(0, min(100, round((exact_count * 3.0) + (semantic_count * 2.0) - (missing_count * 1.6) + (len(interview_focus) * 4.0)))))
    upskill_feasibility = int(max(0, min(100, round(100 - (risk_pressure * 0.55) + (len([x for x in triage if str(x.get('trainability') or '').lower() in {'trainable_short_term', 'trainable_mid_term'}]) * 5)))))

    role_strengths = _dedupe((partition.get("exact_match", []) if isinstance(partition.get("exact_match"), list) else [])[:4])
    role_gaps = _dedupe([item.get("skill") for item in triage[:4] if isinstance(item, dict)])

    evidence_layer = {
        "schema_version": "2.0.0",
        "generated_at": _now_iso(),
        "session_id": session_id,
        "domain": domain,
        "persona": persona,
        "source_health": {
            "overall_mode": overall_mode,
            "ai_status": ai_status,
            "deterministic_status": "success",
            "ai_coverage_score": ai_coverage,
            "hallucination_risk": ai_risk,
            "warnings": [_clean_text(w) for w in ai_warnings if _clean_text(w)],
        },
        "page_header": {
            "fit_label": fit["label"],
            "fit_tier": fit["tier"],
            "fit_confidence": decision_confidence,
            "one_line_summary": "Candidate fit is based on traceable skills evidence, prioritized role gaps, and interview probes.",
            "data_freshness": {
                "last_updated": _now_iso(),
                "staleness_minutes": 0,
            },
        },
        "decision_snapshot": {
            "cards": [
                {
                    "id": "match_strength",
                    "label": "Match Strength",
                    "score": alignment_score,
                    "explanation": "Overall role alignment from exact and semantic evidence.",
                    "drivers": [f"{exact_count} exact", f"{semantic_count} semantic", f"{missing_count} missing"],
                    "source_mode": "deterministic",
                },
                {
                    "id": "risk_pressure",
                    "label": "Risk Pressure",
                    "score": risk_pressure,
                    "explanation": "Higher risk indicates stronger must-have gaps.",
                    "drivers": [f"{len([x for x in triage if str(x.get('priority') or '').lower() == 'role_critical'])} critical gaps"],
                    "source_mode": overall_mode,
                },
                {
                    "id": "interview_readiness",
                    "label": "Interview Readiness",
                    "score": interview_readiness,
                    "explanation": "How interview-ready the profile is with structured probes.",
                    "drivers": [f"{len(interview_focus)} interview probes"],
                    "source_mode": overall_mode,
                },
                {
                    "id": "upskill_feasibility",
                    "label": "Upskill Feasibility",
                    "score": upskill_feasibility,
                    "explanation": "Likelihood that key gaps can be closed within practical timelines.",
                    "drivers": [f"{len([x for x in triage if str(x.get('trainability') or '').lower() in {'trainable_short_term', 'trainable_mid_term'}])} trainable gaps"],
                    "source_mode": overall_mode,
                },
            ]
        },
        "gap_prioritization": {
            "title": "Must-Have Gap Prioritization",
            "items": [
                {
                    "skill": _clean_text(item.get("skill")),
                    "priority": _clean_text(item.get("priority") or "important"),
                    "impact": _clean_text(item.get("impact") or "medium"),
                    "trainability": _clean_text(item.get("trainability") or "trainable_mid_term"),
                    "confidence": round(max(0.0, min(1.0, _to_float(item.get("confidence"), 0.0))), 2),
                    "reason": _clean_text(item.get("reason")) or "Role-relevant missing skill requiring validation.",
                    "evidence": {
                        "jd_snippet": _clean_text((item.get("evidence") or {}).get("jd_snippet")) if isinstance(item.get("evidence"), dict) else _clean_text(item.get("skill")),
                        "resume_signal": _clean_text((item.get("evidence") or {}).get("resume_signal")) if isinstance(item.get("evidence"), dict) else "not_found",
                    },
                    "recommended_action": "Validate in interview and map to upskilling timeline.",
                    "source_mode": "ai" if ai_status == "success" else "deterministic",
                }
                for item in triage[:8]
                if isinstance(item, dict)
            ],
            "fallback_policy": {
                "min_items": 4,
                "if_ai_sparse": "fill_from_missing_skills_with_jd_snippets",
            },
        },
        "evidence_trace": {
            "title": "Evidence Trace",
            "tabs": _build_trace_tabs(match_evidence),
        },
        "term_intelligence": {
            "title": "Term Intelligence",
            "mappings": [
                {
                    "source_term": _clean_text(item.get("source_term")),
                    "normalized_term": _clean_text(item.get("normalized_term")),
                    "relation": _clean_text(item.get("relation") or "related"),
                    "confidence": round(max(0.0, min(1.0, _to_float(item.get("confidence"), 0.0))), 2),
                    "evidence": _clean_text((item.get("evidence") or {}).get("snippet")) if isinstance(item.get("evidence"), dict) else _clean_text(item.get("evidence")),
                    "source_mode": "ai" if ai_status == "success" else "deterministic",
                }
                for item in mappings[:12]
                if isinstance(item, dict)
            ],
            "unmapped_terms": _dedupe(ai_enrichment.get("normalization", {}).get("unmapped_terms", []) if isinstance(ai_enrichment.get("normalization"), dict) else []),
            "fallback_policy": {
                "min_items": 3,
                "if_ai_sparse": "populate_from_strong_and_moderate_semantic_pairs",
            },
        },
        "role_fit_narrative": {
            "title": "Role-Fit Narrative",
            "strengths": role_strengths if role_strengths else ["No clear strengths detected from current extraction."],
            "blocking_gaps": role_gaps if role_gaps else ["No critical blocking gaps detected."],
            "trainable_in_30_60_days": _dedupe([
                item.get("skill") for item in triage if isinstance(item, dict) and str(item.get("trainability") or "").lower() in {"trainable_short_term", "trainable_mid_term"}
            ])[:4],
            "final_recommendation": {
                "decision": "proceed" if alignment_score >= 75 else ("hold_for_interview" if alignment_score >= 55 else "high_risk"),
                "rationale": "Recommendation generated from evidence confidence, prioritized gaps, and interview readiness.",
            },
            "source_mode": overall_mode,
        },
        "candidate_improvement_plan": {
            "enabled": True,
            "items": [
                {
                    "skill": _clean_text(item.get("skill")),
                    "priority_order": idx + 1,
                    "what_to_build": f"Complete one end-to-end project showcasing { _clean_text(item.get('skill')) } in role-like conditions.",
                    "proof_artifacts": ["Project summary", "Architecture notes", "Outcome metrics"],
                    "expected_match_lift": max(3, 10 - idx),
                }
                for idx, item in enumerate(triage[:4])
                if isinstance(item, dict)
            ],
            "source_mode": overall_mode,
        },
        "quality_reliability": {
            "section_source_breakdown": [
                {"section": "decision_snapshot", "mode": "deterministic", "confidence": 0.86},
                {"section": "gap_prioritization", "mode": "ai" if ai_status == "success" else "deterministic", "confidence": 0.8},
                {"section": "evidence_trace", "mode": "deterministic", "confidence": 0.92},
                {"section": "term_intelligence", "mode": "hybrid" if ai_status == "success" else "deterministic", "confidence": 0.8},
                {"section": "role_fit_narrative", "mode": overall_mode, "confidence": 0.76},
            ],
            "global_notes": [_clean_text(w) for w in ai_warnings if _clean_text(w)],
            "safe_display_flags": {
                "show_ai_badges": True,
                "show_fallback_badges": True,
                "show_warning_banner_if_ai_failed": True,
            },
        },
        "render_hints": {
            "section_order": [
                "page_header",
                "decision_snapshot",
                "gap_prioritization",
                "evidence_trace",
                "term_intelligence",
                "role_fit_narrative",
                "candidate_improvement_plan",
                "quality_reliability",
            ],
            "persona_variants": {
                "hr": {
                    "emphasize": ["decision_snapshot", "gap_prioritization"],
                },
                "candidate": {
                    "emphasize": ["role_fit_narrative", "candidate_improvement_plan", "evidence_trace"],
                },
            },
        },
        "context": {
            "jd_chars": len(_clean_text(jd_text)),
            "resume_chars": len(_clean_text(resume_text)),
        },
    }

    return evidence_layer
