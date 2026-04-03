import React from 'react';

const imageModules = import.meta.glob('../assets/landing/*.{png,jpg,jpeg,webp,gif,avif,svg}', {
    eager: true,
    import: 'default',
});

const orderedImages = Object.entries(imageModules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }))
    .map(([, src]) => src);

function LandingPage({ onStart }) {
    const sliderImages = orderedImages.length > 1 ? [...orderedImages, ...orderedImages] : orderedImages;
    const durationSeconds = Math.max(16, orderedImages.length * 4);

    return (
        <div className="landing-page fade-in">
            <section className="landing-hero-card">
                <p className="landing-kicker">Resume Analyzer</p>
                <h1 className="landing-title">From resume upload to actionable hiring insights</h1>
                <p className="landing-subtitle">
                    This platform extracts resume and JD intelligence, scores alignment, highlights missing capabilities,
                    and presents clear visual evidence for faster and better screening decisions.
                </p>

                <div className="landing-actions">
                    <button className="landing-start-btn" onClick={onStart}>Start Analysis</button>
                </div>

                <div className="landing-slider-shell" aria-label="Project flow image slider">
                    {orderedImages.length === 0 ? (
                        <div className="landing-slider-empty">
                            Add ordered screenshots to src/assets/landing (for example 01-upload.png, 02-extract.png, 03-match.png)
                            to enable the flow slider.
                        </div>
                    ) : (
                        <div
                            className="landing-slider-track"
                            style={{ animationDuration: `${durationSeconds}s` }}
                        >
                            {sliderImages.map((src, idx) => (
                                <figure className="landing-slide" key={`${src}-${idx}`}>
                                    <img src={src} alt={`Project flow step ${idx + 1}`} loading="lazy" />
                                </figure>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
