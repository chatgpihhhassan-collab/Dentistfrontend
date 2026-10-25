import React from 'react';
import { Lock, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function TreatmentPolicyModal({
    isOpen,
    onClose,
    title = 'Action Locked',
    titleUrdu = 'کارروائی مقفل ہے',
    message = '',
    messageUrdu = '',
    toothNumber = null,
    treatmentName = null,
    errorCode = null
}) {
    if (!isOpen) return null;

    const toothLabel = toothNumber !== null && toothNumber !== undefined && toothNumber !== 0
        ? `#${toothNumber}`
        : null;

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                animation: 'policyFadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div 
                style={{
                    width: '100%',
                    maxWidth: 480,
                    background: '#FFFFFF',
                    borderRadius: 20,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #FECACA',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div 
                    style={{
                        padding: '18px 22px',
                        background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                        borderBottom: '1px solid #FECDD3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div 
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                background: '#FEE2E2',
                                border: '1px solid #FCA5A5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#E11D48',
                                flexShrink: 0
                            }}
                        >
                            <ShieldAlert size={22} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#9F1239', letterSpacing: '-0.01em' }}>
                                {title}
                            </div>
                            {titleUrdu && (
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#BE123C', marginTop: 1, direction: 'rtl' }}>
                                    {titleUrdu}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: '1px solid #FECDD3',
                            background: '#FFFFFF',
                            color: '#9F1239',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Metadata Pill Tags */}
                    {(toothLabel || treatmentName) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {toothLabel && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    background: '#F1F5F9',
                                    border: '1px solid #CBD5E1',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#334155'
                                }}>
                                    <span>🦷</span> Tooth {toothLabel}
                                </span>
                            )}
                            {treatmentName && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 12px',
                                    borderRadius: 8,
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#1D4ED8'
                                }}>
                                    {treatmentName}
                                </span>
                            )}
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 8,
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                fontSize: 11,
                                fontWeight: 800,
                                color: '#DC2626'
                            }}>
                                <Lock size={11} /> LOCKED
                            </span>
                        </div>
                    )}

                    {/* Primary English Message */}
                    <div style={{
                        padding: 14,
                        borderRadius: 12,
                        background: '#FFF5F5',
                        border: '1px solid #FED7D7',
                        color: '#742A2A',
                        fontSize: 13.5,
                        fontWeight: 600,
                        lineHeight: 1.55
                    }}>
                        {message}
                    </div>

                    {/* Urdu Translation Message */}
                    {messageUrdu && (
                        <div style={{
                            padding: 12,
                            borderRadius: 12,
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#334155',
                            fontSize: 13,
                            fontWeight: 600,
                            lineHeight: 1.7,
                            direction: 'rtl',
                            textAlign: 'right'
                        }}>
                            {messageUrdu}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div 
                    style={{
                        padding: '14px 24px',
                        background: '#FAFAFA',
                        borderTop: '1px solid #F1F5F9',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 10
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '9px 24px',
                            borderRadius: 10,
                            background: '#0F172A',
                            color: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                            transition: 'all 0.15s'
                        }}
                    >
                        Understood / سمجھ آ گئی
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes policyFadeIn {
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
