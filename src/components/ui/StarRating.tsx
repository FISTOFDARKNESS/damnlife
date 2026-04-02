"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
    rating: number; // 0 to 5
    readOnly?: boolean;
    onChange?: (rating: number) => void;
    size?: number;
}

export function StarRating({ rating, readOnly = false, onChange, size = 16 }: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    // Determines what visual state a specific star index (1-5) is in
    const renderStar = (index: number) => {
        const activeRating = hoverRating !== null && !readOnly ? hoverRating : parseFloat(rating.toFixed(1));
        const isFilled = activeRating >= index;
        const isHalf = activeRating >= index - 0.5 && activeRating < index;

        return (
            <div
                key={index}
                className={`relative ${readOnly ? "" : "cursor-pointer transition-transform hover:scale-110"}`}
                onMouseEnter={() => !readOnly && setHoverRating(index)}
                onMouseLeave={() => !readOnly && setHoverRating(null)}
                onClick={() => !readOnly && onChange && onChange(index)}
            >
                {/* Background Empty Star */}
                <Star size={size} className="text-gray-600/50" />

                {/* Filled / Half Star Overlay */}
                {(isFilled || isHalf) && (
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isHalf ? "50%" : "100%" }}>
                        <Star size={size} className="fill-yellow-400 text-yellow-500 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex items-center gap-1" onMouseLeave={() => !readOnly && setHoverRating(null)}>
            {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
        </div>
    );
}
