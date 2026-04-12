import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, SendHorizontal, X } from 'lucide-react';
import { apiUrl } from '../config/api';

const RESUME_FAQ_PILLS = [
    {
        id: 'matched_skills',
        label: 'Matched Skills',
        question: 'How can I strategically revise, structure, and present my matched skills to align with job requirements and maximize my performance in technical interviews?',
    },
    {
        id: 'missing_skills',
        label: 'Missing Skills',
        question: 'What is a practical and structured 1-week plan to learn my missing skills, and the best free resources to efficiently build those skills?',
    },
    {
        id: 'projects',
        label: 'Projects',
        question: 'How can I effectively highlight my strongest skills while explaining my projects in interviews, ensuring I clearly demonstrate impact, problem-solving ability, and technical depth?',
    },
    {
        id: 'interview_tips',
        label: 'Interview Tips',
        question: 'What are the most effective strategies to confidently handle both technical and behavioral interview questions, including communication, problem-solving approach, and answering under pressure?',
    },
    {
        id: 'resume_improvements',
        label: 'Resume Improvements',
        question: 'What specific, high-impact changes can I make to quickly improve my resume\'s ATS score while also making it more compelling for recruiters and hiring managers?',
    },
    {
        id: 'free_resources',
        label: 'Free Resources',
        question: 'What are the best free resources and structured learning paths to strengthen both my existing (matched) skills and develop my missing skills effectively?',
    },
    {
        id: 'project_planning',
        label: 'Project Planning',
        question: 'Can you provide a clear, step-by-step framework for planning, building, testing, and deploying projects end-to-end, including best practices used in real-world development?',
    },
];
const MODE_OPTIONS = [
    { id: 'resume_context', label: 'Resume Context' },
    { id: 'general', label: 'General' },
];

const INTENT_LABELS = {
    matched_skills: 'Matched Skills',
    missing_skills: 'Missing Skills',
    projects: 'Projects',
    interview_tips: 'Interview Tips',
    resume_improvements: 'Resume Improvements',
    free_resources: 'Free Resources',
    project_planning: 'Project Planning',
    general: 'General',
};

const RESPONSE_SECTION_TITLES = [
    'Direct Answer',
    'Quick Revision Plan (7 days)',
    'Quick Revision Plan',
    'Free Resources',
    '30/60/90 Day Plan',
    'Mini Project Plan',
    'Project Story Framework (STAR/PAR)',
    'How To Showcase Your Skills In Each Project',
    'Confidence Building Practice',
    'Sample Answer Frames',
    'ATS Optimization Actions',
    'Before/After Bullet Improvements',
    'Resume Context Reference',
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeAssistantDisplayText = (text) => {
    let cleaned = String(text || '');

    // Unescape common markdown escapes produced by LLMs.
    cleaned = cleaned
        .replace(/\\([*_`#[\]()-])/g, '$1')
        .replace(/\u00A0/g, ' ');

    // Convert markdown links and inline code to plain text for cleaner UI display.
    cleaned = cleaned
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)')
        .replace(/`([^`]+)`/g, '$1');

    // Remove bold/italic markers around words while keeping list markers intact.
    cleaned = cleaned
        .replace(/\*\*/g, '')
        .replace(/__/g, '')
        .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,:;!?]|$)/g, '$1$2')
        .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,:;!?]|$)/g, '$1$2');

    // Remove noisy standalone mode/meta labels often produced in model output.
    cleaned = cleaned
        .replace(/^\s*(general|details?)\s*$/gim, '')
        .replace(/^\s*(response|answer)\s*:\s*$/gim, '');

    // Remove decorative ruler lines like ======== or ----------.
    cleaned = cleaned
        .replace(/^\s*[=]{3,}\s*$/gim, '')
        .replace(/^\s*[-]{4,}\s*$/gim, '')
        .replace(/^\s*[_]{4,}\s*$/gim, '');

    // Remove trailing ruler markers when they appear after heading text.
    cleaned = cleaned
        .replace(/[ \t]*={3,}[ \t]*$/gm, '')
        .replace(/[ \t]*-{4,}[ \t]*$/gm, '')
        .replace(/[ \t]*_{4,}[ \t]*$/gm, '');

    // Normalize excessive blank lines after cleanup.
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
};

const expandInlineListMarkers = (text) => {
    let normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Common LLM pattern: "...: - item - item - item"
    normalized = normalized.replace(/:\s*-\s+/g, ':\n- ');

    // Break inline bullets into separate lines.
    normalized = normalized.replace(/\s-\s(?=[A-Za-z0-9(])/g, '\n- ');
    normalized = normalized.replace(/\s\*\s(?=[A-Za-z0-9(])/g, '\n* ');
    normalized = normalized.replace(/\s•\s(?=[A-Za-z0-9(])/g, '\n- ');

    // Break inline numbering into separate lines.
    normalized = normalized.replace(/\s(?=\d+[.)]\s+)/g, '\n');

    return normalized;
};

const normalizeAssistantContent = (text) => {
    let normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Fix common malformed join: "Interview Tips## Interview Tips".
    normalized = normalized.replace(/^\s*([A-Za-z][A-Za-z\s]{2,48})\s*(?=##\s*\1\b)/gim, '');

    // Ensure markdown headings start on their own line.
    normalized = normalized.replace(/([^\n])(\s*#{1,4}\s+)/g, '$1\n$2');

    // Ensure separators are isolated.
    normalized = normalized.replace(/\s*---\s*/g, '\n---\n');

    // Remove stray markdown marker lines like just '#'.
    normalized = normalized.replace(/^\s*#\s*$/gim, '');

    // Convert known section titles into headings when model emits inline prose.
    RESPONSE_SECTION_TITLES.forEach((title) => {
        const re = new RegExp(`(^|\\n)\\s*${escapeRegex(title)}\\s*:?\\s+`, 'g');
        normalized = normalized.replace(re, `$1## ${title}\n`);
    });

    // Normalize blank lines.
    normalized = normalized.replace(/\n{3,}/g, '\n\n').trim();
    return normalized;
};

const sectionToneClass = (heading = '') => {
    const h = String(heading || '').toLowerCase();
    if (h.includes('direct answer')) return 'tone-answer';
    if (h.includes('quick revision') || h.includes('30/60/90') || h.includes('mini project')) return 'tone-plan';
    if (h.includes('resource')) return 'tone-resources';
    if (h.includes('confidence') || h.includes('sample answer')) return 'tone-coaching';
    if (h.includes('ats') || h.includes('before/after')) return 'tone-ats';
    if (h.includes('resume context reference')) return 'tone-reference';
    if (h.includes('project')) return 'tone-projects';
    return 'tone-default';
};

const structuredLinesFromText = (text) => {
    const lines = expandInlineListMarkers(normalizeAssistantContent(text))
        .split('\n')
        .map((line) => line.trim());

    const segments = [];
    let paragraphBuffer = [];

    const flushParagraph = () => {
        if (!paragraphBuffer.length) return;
        segments.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
        paragraphBuffer = [];
    };

    for (const line of lines) {
        if (!line) {
            flushParagraph();
            continue;
        }

        const isBullet = /^[-*]\s+/.test(line);
        const isNumbered = /^\d+[.)]\s+/.test(line);
        const isHeading = /^#{1,6}\s+/.test(line);
        const isSeparator = /^-{3,}$/.test(line);

        if (isHeading) {
            flushParagraph();
            const headingText = line.replace(/^#{1,6}\s+/, '').trim();
            const levelMatch = line.match(/^(#{1,6})\s+/);
            segments.push({
                type: 'heading',
                level: Math.min((levelMatch?.[1] || '#').length, 4),
                text: headingText,
            });
            continue;
        }

        if (isSeparator) {
            flushParagraph();
            segments.push({ type: 'separator' });
            continue;
        }

        if (isBullet || isNumbered) {
            flushParagraph();
            segments.push({
                type: 'list-item',
                marker: isNumbered ? 'numbered' : 'bullet',
                text: line.replace(/^([-*]|\d+[.)])\s+/, '').trim(),
            });
            continue;
        }

        paragraphBuffer.push(line);
    }

    flushParagraph();
    return segments;
};

const makeInitialAssistantMessage = (hasSession, mode) => {
    if (mode === 'general') {
        return {
            id: `m_${Date.now()}_assistant_general_ready`,
            role: 'assistant',
            content: 'General mode is active. Ask any question and I will respond with clear, structured guidance.',
        };
    }

    if (!hasSession) {
        return {
            id: `m_${Date.now()}_assistant_resume_idle`,
            role: 'assistant',
            content: 'Run an analysis first to use Resume Context mode with matched skills, missing skills, projects, interview tips, and resume improvements.',
        };
    }

    return {
        id: `m_${Date.now()}_assistant_resume_ready`,
        role: 'assistant',
        content: 'Resume Context mode is active. Select one of the FAQ pills to get session-grounded guidance.',
    };
};

const ContextChatbot = ({ extractedData }) => {
    const sessionId = extractedData?.session_id || null;
    const summary = extractedData?.bert_results?.summary || {};
    const hasResumeContextSession = Boolean(
        sessionId && extractedData?.resume_text && extractedData?.job_description_text
    );

    const [isOpen, setIsOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [input, setInput] = useState('');
    const [selectedMode, setSelectedMode] = useState('general');
    const [selectedIntent, setSelectedIntent] = useState('general');
    const [selectedFaqId, setSelectedFaqId] = useState('matched_skills');
    const [messagesByMode, setMessagesByMode] = useState({
        resume_context: [makeInitialAssistantMessage(Boolean(sessionId), 'resume_context')],
        general: [makeInitialAssistantMessage(Boolean(sessionId), 'general')],
    });

    const messagesContainerRef = useRef(null);
    const inFlightRef = useRef(false);
    const selectedIntentRef = useRef('general');
    const selectedModeRef = useRef('general');

    const currentMessages = messagesByMode[selectedMode] || [];

    useEffect(() => {
        // New analysis session should reset only Resume Context thread.
        setMessagesByMode((prev) => ({
            ...prev,
            resume_context: [makeInitialAssistantMessage(Boolean(sessionId), 'resume_context')],
        }));
    }, [sessionId]);

    useEffect(() => {
        // If there is no single-resume session, force chatbot to General mode only.
        if (!hasResumeContextSession) {
            selectedModeRef.current = 'general';
            selectedIntentRef.current = 'general';
            setSelectedMode('general');
            setSelectedIntent('general');
        }
    }, [hasResumeContextSession]);

    useEffect(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [currentMessages, isOpen, isSending]);

    const helperStats = useMemo(() => {
        const score = Number(summary?.overall_alignment_score || 0);
        const missing = Number(summary?.missing_skills_count || 0);
        if (selectedMode === 'general') {
            return 'General mode • No resume context used';
        }
        return `Score ${score}% • Missing ${missing}`;
    }, [summary, selectedMode]);

    const visibleModeOptions = hasResumeContextSession
        ? MODE_OPTIONS
        : MODE_OPTIONS.filter((mode) => mode.id === 'general');

    const switchMode = (modeId) => {
        if (isSending) return;
        if (modeId === 'resume_context' && !hasResumeContextSession) return;
        selectedModeRef.current = modeId;
        setSelectedMode(modeId);

        if (modeId === 'general') {
            selectedIntentRef.current = 'general';
            setSelectedIntent('general');
        } else {
            selectedIntentRef.current = 'matched_skills';
            setSelectedIntent('matched_skills');
            setSelectedFaqId('matched_skills');
        }

        setMessagesByMode((prev) => {
            const existing = prev[modeId] || [];
            if (existing.length > 0) return prev;
            return {
                ...prev,
                [modeId]: [makeInitialAssistantMessage(Boolean(sessionId), modeId)],
            };
        });
    };

    const appendMessage = (role, content, meta = {}, modeTarget = null) => {
        const mode = modeTarget || selectedModeRef.current || selectedMode;
        const msg = {
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            role,
            content,
            intentUsed: meta.intentUsed || null,
        };
        setMessagesByMode((prev) => ({
            ...prev,
            [mode]: [...(prev[mode] || []), msg],
        }));
    };

    const selectFaqPill = (faqId) => {
        if (isSending) return;
        const faq = RESUME_FAQ_PILLS.find((item) => item.id === faqId);
        if (!faq) return;
        setSelectedFaqId(faq.id);
        selectedIntentRef.current = faq.id;
        setSelectedIntent(faq.id);
    };

    const sendMessageForFaq = async (faq) => {
        if (!faq || isSending || inFlightRef.current) return;

        if (!sessionId) {
            appendMessage('assistant', 'This mode needs a session context. Please run Resume vs JD analysis first.', {}, 'resume_context');
            return;
        }

        const modeAtSend = 'resume_context';
        const intentAtSend = faq.id;
        const backendIntent = faq.id === 'free_resources'
            ? 'missing_skills'
            : (faq.id === 'project_planning' ? 'projects' : faq.id);
        const text = faq.question;

        inFlightRef.current = true;
        selectedModeRef.current = modeAtSend;
        selectedIntentRef.current = intentAtSend;
        setSelectedIntent(intentAtSend);
        setSelectedFaqId(intentAtSend);

        appendMessage('user', text, { intentUsed: intentAtSend }, modeAtSend);
        setIsSending(true);

        try {
            const response = await fetch(apiUrl('/chat/message'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: text,
                    history: [],
                    intent: backendIntent,
                    mode: modeAtSend,
                }),
            });

            if (!response.ok) {
                let detail = 'Chat request failed.';
                try {
                    const err = await response.json();
                    detail = err?.detail || detail;
                } catch (_) {
                    // Keep default detail
                }
                throw new Error(detail);
            }

            const payload = await response.json();
            const answer = (payload?.answer || '').trim() || 'I could not generate a response for that question.';
            appendMessage('assistant', answer, { intentUsed: intentAtSend }, modeAtSend);
        } catch (err) {
            appendMessage('assistant', `Unable to answer right now: ${err?.message || 'Unknown error'}`, {}, modeAtSend);
        } finally {
            setIsSending(false);
            inFlightRef.current = false;
        }
    };

    const renderStructuredMessage = (content) => {
        const displayContent = sanitizeAssistantDisplayText(content);
            const segments = structuredLinesFromText(displayContent);
        const hasStructure = segments.some((seg) => seg.type !== 'paragraph') || segments.length > 1;

        if (!hasStructure) {
                return <span>{displayContent}</span>;
        }

        const blocks = [];
        let listBuffer = [];

        const flushList = () => {
            if (!listBuffer.length) return;
            const isOrdered = listBuffer.some((item) => item.marker === 'numbered');
            blocks.push({ type: 'list', items: listBuffer, ordered: isOrdered });
            listBuffer = [];
        };

        segments.forEach((seg) => {
            if (seg.type === 'list-item') {
                listBuffer.push(seg);
            } else {
                flushList();
                blocks.push(seg);
            }
        });
        flushList();

        const renderBlock = (block, idx, keyPrefix = 'b') => {
            if (block.type === 'paragraph') {
                return <p key={`${keyPrefix}_p_${idx}`} className="chatbot-structured-paragraph">{block.text}</p>;
            }
            if (block.type === 'heading') {
                return <h4 key={`${keyPrefix}_h_${idx}`} className={`chatbot-structured-heading level-${block.level}`}>{block.text}</h4>;
            }
            if (block.type === 'separator') {
                return null;
            }
            if (block.type === 'list' && !block.ordered) {
                return (
                    <ul key={`${keyPrefix}_l_${idx}`} className="chatbot-structured-list">
                        {block.items.map((item, itemIdx) => (
                            <li key={`${keyPrefix}_li_${idx}_${itemIdx}`}>{item.text}</li>
                        ))}
                    </ul>
                );
            }
            return (
                <ol key={`${keyPrefix}_l_${idx}`} className="chatbot-structured-list">
                    {block.items.map((item, itemIdx) => (
                        <li key={`${keyPrefix}_li_${idx}_${itemIdx}`}>{item.text}</li>
                    ))}
                </ol>
            );
        };

        const hasHeading = blocks.some((block) => block.type === 'heading');
        if (hasHeading) {
            const sections = [];
            let current = null;

            blocks.forEach((block) => {
                if (block.type === 'separator') {
                    if (current && current.blocks.length) {
                        sections.push(current);
                    }
                    current = null;
                    return;
                }

                if (block.type === 'heading') {
                    if (current && current.blocks.length) {
                        sections.push(current);
                    }
                    current = {
                        title: block.text,
                        tone: sectionToneClass(block.text),
                        blocks: [],
                    };
                    return;
                }

                if (!current) {
                    current = {
                        title: 'Details',
                        tone: 'tone-default',
                        blocks: [],
                    };
                }
                current.blocks.push(block);
            });

            if (current && current.blocks.length) {
                sections.push(current);
            }

            return (
                <div className="chatbot-structured-wrap">
                    {sections.map((section, sectionIdx) => (
                        <section key={`section_${sectionIdx}`} className={`chatbot-section-card ${section.tone}`}>
                            <h4 className="chatbot-section-title">{section.title}</h4>
                            <div className="chatbot-section-body">
                                {section.blocks.map((block, blockIdx) => renderBlock(block, blockIdx, `sec_${sectionIdx}`))}
                            </div>
                        </section>
                    ))}
                </div>
            );
        }

        return (
            <div className="chatbot-structured-wrap">
                {blocks.map((block, idx) => renderBlock(block, idx, 'root'))}
            </div>
        );
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || isSending || inFlightRef.current) return;

        const modeAtSend = selectedModeRef.current || selectedMode;
        if (modeAtSend !== 'general') return;
        const intentAtSend = 'general';

        inFlightRef.current = true;

        setInput('');
        appendMessage('user', text, { intentUsed: intentAtSend }, modeAtSend);

        setIsSending(true);

        try {
            const response = await fetch(apiUrl('/chat/message'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: null,
                    message: text,
                    history: [],
                    intent: 'general',
                    mode: 'general',
                }),
            });

            if (!response.ok) {
                let detail = 'Chat request failed.';
                try {
                    const err = await response.json();
                    detail = err?.detail || detail;
                } catch (_) {
                    // Keep default detail
                }
                throw new Error(detail);
            }

            const payload = await response.json();
            const answer = (payload?.answer || '').trim() || 'I could not generate a response for that question.';
            appendMessage('assistant', answer, { intentUsed: payload?.intent_used || intentAtSend }, modeAtSend);
        } catch (err) {
            appendMessage('assistant', `Unable to answer right now: ${err?.message || 'Unknown error'}`, {}, modeAtSend);
        } finally {
            setIsSending(false);
            inFlightRef.current = false;
        }
    };

    return (
        <div className="chatbot-shell" aria-live="polite">
            {isOpen && (
                <section className={`chatbot-panel mode-${selectedMode}`}>
                    <header className="chatbot-panel-header">
                        <div className="chatbot-title-wrap">
                            <div className="chatbot-avatar">
                                <Bot size={16} />
                            </div>
                            <div>
                                <h3 className="chatbot-title">Session Assistant</h3>
                                <p className="chatbot-subtitle">{selectedMode === 'general' ? helperStats : (sessionId ? helperStats : 'No session loaded')}</p>
                            </div>
                        </div>
                        <button
                            className="chatbot-close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chatbot"
                        >
                            <X size={16} />
                        </button>
                    </header>

                    <div className="chatbot-mode-row">
                        {visibleModeOptions.map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                className={`chatbot-mode-toggle ${selectedMode === mode.id ? 'active' : ''}`}
                                onClick={() => switchMode(mode.id)}
                                disabled={isSending}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className="chatbot-messages" ref={messagesContainerRef}>
                        {currentMessages.map((message) => (
                            <article
                                key={message.id}
                                className={`chatbot-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
                            >
                                {message.role === 'assistant' && message.intentUsed && (
                                    <div className="chatbot-intent-chip-inline">{INTENT_LABELS[message.intentUsed] || 'General'}</div>
                                )}
                                {message.role === 'assistant' ? renderStructuredMessage(message.content) : message.content}
                            </article>
                        ))}
                        {isSending && (
                            <div className="chatbot-typing">
                                <Loader2 size={14} className="spin" />
                                <span>Thinking...</span>
                            </div>
                        )}
                    </div>

                    <div className="chatbot-input-row">
                        {selectedMode === 'resume_context' && (
                            <div className="chatbot-faq-pills">
                                {RESUME_FAQ_PILLS.map((faq) => (
                                    <button
                                        key={faq.id}
                                        type="button"
                                        className={`chatbot-faq-pill ${selectedFaqId === faq.id ? 'active' : ''}`}
                                        onClick={() => {
                                            selectFaqPill(faq.id);
                                            sendMessageForFaq(faq);
                                        }}
                                        disabled={isSending || !sessionId}
                                        title={!sessionId ? 'Run analysis first to enable resume context answers' : faq.question}
                                    >
                                        {faq.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedMode === 'general' && (
                            <>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Ask any question..."
                                    className="chatbot-input"
                                    rows={2}
                                    maxLength={1500}
                                    disabled={isSending}
                                />
                                <button
                                    className="chatbot-send-btn"
                                    onClick={sendMessage}
                                    disabled={isSending || !input.trim()}
                                    aria-label="Send message"
                                >
                                    <SendHorizontal size={16} />
                                </button>
                            </>
                        )}
                    </div>
                </section>
            )}

            {!isOpen && (
                <button
                    className="chatbot-launcher"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label="Open chatbot"
                    title="Open chatbot"
                >
                    <MessageCircle size={20} />
                </button>
            )}
        </div>
    );
};

export default ContextChatbot;
