import React from 'react';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    interactive?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, interactive = false }) => {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`text-2xl ${interactive ? 'cursor-pointer' : ''} ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    onClick={() => interactive && onRatingChange && onRatingChange(star)}
                >
                    ★
                </span>
            ))}
        </div>
    );
};
