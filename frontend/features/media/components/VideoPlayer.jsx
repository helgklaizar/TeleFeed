import { useRef, useState, useEffect, useCallback } from 'react';
import { Lightbox } from './Lightbox';
import './video-player.css';

// ── Глобальное хранилище громкости (персистентное) ──
const VOLUME_KEY = 'tg_video_volume';

function getStoredVolume() {
    try {
        const v = parseFloat(localStorage.getItem(VOLUME_KEY));
        return isNaN(v) ? 1 : Math.max(0, Math.min(1, v));
    } catch {
        return 1;
    }
}

function setStoredVolume(v) {
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch { }
}

// Синхронизация громкости между всеми открытыми плеерами
const volumeListeners = new Set();
function subscribeVolume(fn) {
    volumeListeners.add(fn);
    return () => volumeListeners.delete(fn);
}
function broadcastVolume(v) {
    setStoredVolume(v);
    volumeListeners.forEach(fn => fn(v));
}

/**
 * Кастомный видеоплеер:
 * - Play/Pause
 * - Полноэкранный режим
 * - Громкость (глобально синхронизирована)
 * - Автопауза при сворачивании окна (visibilitychange)
 * - Progress bar
 */
export function VideoPlayer({ src, poster, style = {}, className = '', onClick, onLightboxRequest }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const hideTimer = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(getStoredVolume);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [muted, setMuted] = useState(true);
    const [userInteracted, setUserInteracted] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // Синхронизация громкости между плеерами
    useEffect(() => {
        const unsub = subscribeVolume((v) => {
            if (userInteracted) {
                setVolume(v);
                if (videoRef.current) videoRef.current.volume = v;
            }
        });
        return unsub;
    }, [userInteracted]);

    // IntersectionObserver для автоплея если вьюпорт видит видео
    useEffect(() => {
        if (!containerRef.current || !videoRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (videoRef.current && videoRef.current.paused && !userInteracted) {
                            videoRef.current.play().then(() => setPlaying(true)).catch(() => { });
                        }
                    } else {
                        if (videoRef.current && !videoRef.current.paused) {
                            videoRef.current.pause();
                            setPlaying(false);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [userInteracted]);

    // Применение громкости при маунте
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = userInteracted ? volume : 0;
        }
    }, [volume, userInteracted]);

    // Пауза при сворачивании окна / переключении вкладки
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden && videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
                setPlaying(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);


    const markInteracted = useCallback(() => {
        if (!userInteracted) {
            setUserInteracted(true);
            setMuted(volume === 0);
            if (videoRef.current) {
                videoRef.current.volume = volume;
            }
        }
    }, [userInteracted, volume]);

    const togglePlay = useCallback((e) => {
        e?.stopPropagation();
        markInteracted();
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
    }, [markInteracted]);

    const handleVolumeChange = useCallback((e) => {
        e.stopPropagation();
        markInteracted();
        const val = parseFloat(e.target.value);
        if (videoRef.current) videoRef.current.volume = val;
        setMuted(val === 0);
        broadcastVolume(val);
    }, [markInteracted]);

    const toggleMute = useCallback((e) => {
        e.stopPropagation();
        markInteracted();
        const v = videoRef.current;
        if (!v) return;
        if (muted || volume === 0) {
            const restored = getStoredVolume() || 0.5;
            v.volume = restored;
            broadcastVolume(restored);
            setMuted(false);
        } else {
            v.volume = 0;
            setMuted(true);
            broadcastVolume(0);
        }
    }, [markInteracted, muted, volume]);

    const openLightbox = useCallback((e) => {
        e?.stopPropagation();
        markInteracted();
        if (onLightboxRequest) onLightboxRequest();
        else setLightboxOpen(true);
    }, [markInteracted, onLightboxRequest]);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    }, []);

    const handleProgressClick = useCallback((e) => {
        e.stopPropagation();
        markInteracted();
        const v = videoRef.current;
        const bar = progressRef.current;
        if (!v || !bar) return;
        const rect = bar.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        v.currentTime = ratio * v.duration;
    }, [markInteracted]);

    const handleEnded = useCallback(() => setPlaying(false), []);

    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        clearTimeout(hideTimer.current);
        if (playing && userInteracted) {
            hideTimer.current = setTimeout(() => setShowControls(false), 2500);
        }
    }, [playing, userInteracted]);

    useEffect(() => {
        if (!playing) setShowControls(true);
        else if (userInteracted) {
            hideTimer.current = setTimeout(() => setShowControls(false), 2500);
        }
        return () => clearTimeout(hideTimer.current);
    }, [playing, userInteracted]);

    const fmtTime = (s) => {
        if (!isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const effectiveVolume = muted ? 0 : volume;

    return (
        <>
            <div
                ref={containerRef}
                className={`vp-wrap ${className}`}
                style={style}
                onMouseEnter={resetHideTimer}
                onMouseMove={resetHideTimer}
                onTouchStart={resetHideTimer}
                onClick={(e) => {
                    markInteracted();
                    onClick?.(e);
                }}
                onDoubleClick={openLightbox}
            >
                <video
                    ref={videoRef}
                    src={src}
                    className="vp-video"
                    preload="metadata"
                    poster={poster}
                    playsInline
                    muted={muted}
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                />

                {/* Play overlay (центральная кнопка при паузе) */}
                {!playing && userInteracted && (
                    <button className="vp-big-play" onClick={togglePlay} aria-label="Play">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                )}

                {/* Контролы */}
                <div className={`vp-controls ${showControls && userInteracted ? 'vp-controls--visible' : ''}`} style={{ opacity: userInteracted ? undefined : 0, transition: 'opacity 0.2s' }}>
                    {/* Progress bar */}
                    <div
                        ref={progressRef}
                        className="vp-progress"
                        onClick={handleProgressClick}
                    >
                        <div className="vp-progress-fill" style={{ width: `${progress}%` }} />
                        <div className="vp-progress-thumb" style={{ left: `${progress}%` }} />
                    </div>

                    <div className="vp-bottom">
                        {/* Play/Pause */}
                        <button className="vp-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                            {playing ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        {/* Time */}
                        <span className="vp-time">{fmtTime(currentTime)} / {fmtTime(duration)}</span>

                        <div className="vp-spacer" />

                        {/* Volume */}
                        <button className="vp-btn" onClick={toggleMute} aria-label="Mute">
                            {effectiveVolume === 0 ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                </svg>
                            ) : effectiveVolume < 0.5 ? (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            )}
                        </button>
                        <input
                            type="range"
                            className="vp-volume"
                            min="0"
                            max="1"
                            step="0.02"
                            value={effectiveVolume}
                            onChange={handleVolumeChange}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Volume"
                        />

                        {/* Fullscreen / Lightbox */}
                        <button className="vp-btn" onClick={openLightbox} aria-label="Fullscreen">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {lightboxOpen && (
                <Lightbox src={src} type="video" onClose={() => setLightboxOpen(false)} />
            )}
        </>
    );
}
