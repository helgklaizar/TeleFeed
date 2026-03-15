import { MediaFile } from '../../../media/components/MediaFile';

export function VoiceBubble({ message }) {
    const voice = message.content.voice_note;
    const duration = voice?.duration || 0;
    const waveform = voice?.waveform;
    const fileId = voice?.voice?.id;
    const initialFile = voice?.voice;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
        <>
            <div className="bubble-voice">
                <div className="bubble-voice-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </div>
                <div className="bubble-voice-bars">
                    {waveform ? <WaveformBars waveform={waveform} /> : <DefaultWaveBars />}
                </div>
                <span className="bubble-voice-duration">{durationStr}</span>
            </div>
            {fileId && (
                <div style={{ display: 'none' }}>
                    <MediaFile fileId={fileId} initialFile={initialFile} type="audio" />
                </div>
            )}
        </>
    );
}

function WaveformBars({ waveform }) {
    try {
        const bytes = atob(waveform);
        const bars = [];
        for (let i = 0; i < Math.min(bytes.length, 40); i++) {
            const h = Math.max(3, (bytes.charCodeAt(i) / 255) * 20);
            bars.push(<span key={i} className="bubble-voice-bar" style={{ height: `${h}px` }} />);
        }
        return <>{bars}</>;
    } catch {
        return <DefaultWaveBars />;
    }
}

function DefaultWaveBars() {
    const heights = [4, 8, 12, 16, 20, 14, 9, 18, 6, 10, 15, 20, 12, 8, 16, 4, 14, 19, 7, 11, 17, 13, 20, 6, 9, 14, 18, 10, 5, 8, 15, 12];
    return (
        <>
            {heights.map((h, i) => (
                <span key={i} className="bubble-voice-bar" style={{ height: `${h}px` }} />
            ))}
        </>
    );
}
