
import React from 'react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    interactive?: boolean;
    size?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, interactive = false, size = 'text-2xl' }) => {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`${size} ${interactive ? 'cursor-pointer' : ''} ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    onClick={(e) => {
                        if (interactive && onRatingChange) {
                            e.preventDefault();
                            e.stopPropagation();
                            onRatingChange(star);
                        }
                    }}
                    style={{ transition: 'color 0.2s' }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};
