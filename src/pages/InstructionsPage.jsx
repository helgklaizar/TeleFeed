import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { t } from '../app/i18n';
import '../shared/styles/settings.css';

export function InstructionsPage() {
    const navigate = useNavigate();
    const instructions = useUiStore((s) => s.instructions || { daily: '', onDemand: '' });
    const setInstructions = useUiStore((s) => s.setInstructions);

    const [daily, setDaily] = useState(instructions.daily);
    const [onDemand, setOnDemand] = useState(instructions.onDemand);
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setInstructions({ daily, onDemand });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="page">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-header-left">
                    <button onClick={() => navigate(-1)} className="settings-back-btn">
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                        </svg>
                    </button>
                    <span className="settings-header-title">{t('instructions')}</span>
                </div>
            </div>

            <div className="settings-body">
                {/* Daily */}
                <div>
                    <div className="section-label">
                        <span>📅</span>
                        {t('dailyInstructions')}
                    </div>
                    <div className="section-hint">
                        {t('dailyInstructionsDesc')}
                    </div>
                    <textarea
                        className="form-textarea"
                        placeholder={t('dailyInstructionsPlaceholder')}
                        value={daily}
                        onChange={(e) => setDaily(e.target.value)}
                    />
                </div>

                {/* On demand */}
                <div>
                    <div className="section-label">
                        <span>⚡</span>
                        {t('onDemandInstructions')}
                    </div>
                    <div className="section-hint">
                        {t('onDemandInstructionsDesc')}
                    </div>
                    <textarea
                        className="form-textarea"
                        placeholder={t('onDemandInstructionsPlaceholder')}
                        value={onDemand}
                        onChange={(e) => setOnDemand(e.target.value)}
                    />
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className={`btn-save ${saved ? 'btn-save--saved' : ''}`}
                >
                    {saved ? `✓ ${t('save')}` : t('save')}
                </button>
            </div>
        </div>
    );
}
