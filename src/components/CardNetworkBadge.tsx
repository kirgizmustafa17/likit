'use client';

import React from 'react';
import { CardNetwork } from '@/lib/types';

interface CardNetworkBadgeProps {
    network?: CardNetwork | null;
    variant?: 'card' | 'pill' | 'icon';
    className?: string;
    showLabel?: boolean;
}

/**
 * Authentic SVG Vector Logos & Badges for payment networks:
 * Troy, Mastercard, Visa, and Generic Card.
 */
export default function CardNetworkBadge({
    network = 'other',
    variant = 'pill',
    className = '',
    showLabel = false,
}: CardNetworkBadgeProps) {
    const net = network || 'other';

    // ─── SVG Mark for Troy ───
    const TroyMark = ({ size = 20 }: { size?: number }) => (
        <svg
            width={size * 1.8}
            height={size}
            viewBox="0 0 72 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="network-svg troy-svg"
            aria-label="Troy"
        >
            <rect width="72" height="36" rx="6" fill="#062234" fillOpacity="0.85" />
            <path
                d="M12 11h14v4.5h-4.6v11h-4.8v-11H12V11z"
                fill="#00A3E0"
            />
            <path
                d="M27.5 11h9.2c3.4 0 5.3 1.8 5.3 4.4 0 2-1.2 3.4-3 4l3.5 7.1h-5.2l-2.9-6.2h-2.1v6.2h-4.8V11zm4.8 4.2v3h4c1 0 1.8-.6 1.8-1.5 0-.9-.8-1.5-1.8-1.5h-4z"
                fill="#ffffff"
            />
            <path
                d="M48.5 11c5.2 0 8.8 3.7 8.8 7.8s-3.6 7.8-8.8 7.8c-5.2 0-8.8-3.7-8.8-7.8s3.6-7.8 8.8-7.8zm0 4.1c-2.4 0-4 1.7-4 3.7s1.6 3.7 4 3.7 4-1.7 4-3.7-1.6-3.7-4-3.7z"
                fill="#ffffff"
            />
            <path
                d="M58.5 11h5.1l3.5 6.6 3.5-6.6h5.1L69.8 22v4.5h-4.8V22l-6.5-11z"
                fill="#00A3E0"
            />
        </svg>
    );

    // ─── SVG Mark for Mastercard ───
    const MastercardMark = ({ size = 20 }: { size?: number }) => (
        <svg
            width={size * 1.55}
            height={size}
            viewBox="0 0 54 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="network-svg mastercard-svg"
            aria-label="Mastercard"
        >
            <rect width="54" height="34" rx="6" fill="#171717" fillOpacity="0.85" />
            <circle cx="21" cy="17" r="11" fill="#EB001B" />
            <circle cx="33" cy="17" r="11" fill="#F79E1B" fillOpacity="0.95" />
            <path
                d="M27 9.4a10.96 10.96 0 0 1 5 7.6 10.96 10.96 0 0 1-5 7.6 10.96 10.96 0 0 1-5-7.6c0-2.9 1.9-5.5 5-7.6z"
                fill="#FF5F00"
            />
        </svg>
    );

    // ─── SVG Mark for Visa ───
    const VisaMark = ({ size = 20 }: { size?: number }) => (
        <svg
            width={size * 1.8}
            height={size}
            viewBox="0 0 68 34"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="network-svg visa-svg"
            aria-label="Visa"
        >
            <rect width="68" height="34" rx="6" fill="#0F172A" fillOpacity="0.85" />
            <text
                x="34"
                y="24"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="900"
                fontStyle="italic"
                fontSize="22"
                letterSpacing="1px"
                fill="#FFFFFF"
            >
                VISA
            </text>
            <path d="M14 26l3.5-16h-3.8l-3.5 16h3.8z" fill="#F59E0B" />
        </svg>
    );

    // ─── SVG Mark for Generic / Other Card ───
    const GenericMark = ({ size = 20 }: { size?: number }) => (
        <svg
            width={size * 1.5}
            height={size}
            viewBox="0 0 48 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="network-svg generic-svg"
            aria-label="Kredi Kartı"
        >
            <rect width="48" height="32" rx="5" fill="#334155" fillOpacity="0.85" />
            <rect x="5" y="8" width="38" height="4" fill="#64748B" />
            <rect x="8" y="18" width="10" height="6" rx="2" fill="#FCD34D" />
        </svg>
    );

    // Render by variant
    if (variant === 'card') {
        return (
            <div className={`vcc-network-badge vcc-network-${net} ${className}`} title={net.toUpperCase()}>
                {net === 'troy' && <TroyMark size={24} />}
                {net === 'mastercard' && <MastercardMark size={24} />}
                {net === 'visa' && <VisaMark size={24} />}
                {net === 'other' && <GenericMark size={24} />}
            </div>
        );
    }

    if (variant === 'icon') {
        return (
            <span className={`inline-network-icon net-${net} ${className}`}>
                {net === 'troy' && <TroyMark size={14} />}
                {net === 'mastercard' && <MastercardMark size={14} />}
                {net === 'visa' && <VisaMark size={14} />}
                {net === 'other' && <GenericMark size={14} />}
            </span>
        );
    }

    // Default 'pill' variant for lists and tabs
    return (
        <span className={`cc-network-pill net-pill-${net} ${className}`}>
            {net === 'troy' && <TroyMark size={13} />}
            {net === 'mastercard' && <MastercardMark size={13} />}
            {net === 'visa' && <VisaMark size={13} />}
            {net === 'other' && <GenericMark size={13} />}
            {showLabel && (
                <span className="cc-network-pill-text">
                    {net === 'troy' ? 'Troy' : net === 'mastercard' ? 'Mastercard' : net === 'visa' ? 'Visa' : 'Kart'}
                </span>
            )}
        </span>
    );
}
