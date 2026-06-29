import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Plus, CheckCircle2 } from 'lucide-react';
import { Review, User } from '../types';

interface ReviewSectionProps {
  productId: string;
  currentUser: User | null;
}

export default function ReviewSection({
  productId,
  currentUser
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('aurastyle_token');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          rating,
          comment
        })
      });

      if (response.ok) {
        setComment('');
        setRating(5);
        setSuccessMsg('Review shared successfully! Updated rating scores.');
        await fetchReviews();
      }
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="product-reviews-block">
      <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
        <MessageSquare className="h-4.5 w-4.5 text-emerald-400" />
        <h3 className="text-xs uppercase tracking-widest text-white font-sans">Customer Reviews ({reviews.length})</h3>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-950/20 border border-emerald-500/20 p-3.5 text-[11px] uppercase tracking-wider text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Listing */}
      {isLoading ? (
        <div className="text-[10px] text-white/40 font-mono py-4 uppercase tracking-widest animate-pulse">Loading testimonials...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.01] border border-white/5 p-6 text-center text-xs text-white/40 font-light tracking-wide">
          No reviews found for this premium item. Be the first to draft a style review!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div 
              key={r.id}
              className="rounded-2xl border border-white/5 bg-white/[0.01] p-4.5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-white/90 block">{r.userName}</span>
                  <span className="text-[9px] text-white/40 font-mono tracking-wider">
                    {new Date(r.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                
                {/* Stars */}
                <div className="flex items-center space-x-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`h-3 w-3 ${idx < r.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed font-light font-sans">{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Write a review form */}
      {currentUser ? (
        <form onSubmit={handleSubmitReview} className="rounded-2xl border border-white/5 bg-[#0a0a0a]/60 p-5 space-y-4">
          <h4 className="text-[10px] font-light text-white uppercase tracking-widest">Leave a Styling Review</h4>
          
          {/* Star selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Score:</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setRating(val)}
                  className="text-neutral-500 transition-transform hover:scale-110"
                >
                  <Star className={`h-4.5 w-4.5 ${val <= rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <textarea
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did this product fit? Share your thoughts on quality, drape, color matching..."
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs font-light text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none h-24"
              id="new-review-comment"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="rounded-xl bg-white text-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center space-x-1.5"
              id="new-review-submit-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Sharing...' : 'Share Review'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-neutral-950/40 p-5 text-center text-xs text-white/40 font-light tracking-wide">
          Please login to share your personal product testimonials and styling ratings.
        </div>
      )}
    </div>
  );
}
