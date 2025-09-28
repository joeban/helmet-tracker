import { Helmet } from '@/types/helmet';

interface SocialProofBadgeProps {
  helmet: Helmet;
  index: number;
  totalResults: number;
}

export default function SocialProofBadge({ helmet, index, totalResults }: SocialProofBadgeProps) {
  const badges = [];

  // Most Popular - Top 3 helmets with high ratings and good safety scores
  if (index < 3 && helmet.star_rating >= 4 && helmet.safety_score <= 12) {
    badges.push({
      text: '🔥 Most Popular',
      className: 'bg-red-500 text-white',
      description: 'Top choice among cyclists'
    });
  }

  // Best Value - Good safety score with reasonable price
  const valueRatio = helmet.safety_score / helmet.min_price;
  if (valueRatio < 0.15 && helmet.star_rating >= 4) {
    badges.push({
      text: '💎 Best Value',
      className: 'bg-green-500 text-white',
      description: 'Excellent safety for the price'
    });
  }

  // Staff Pick - 5-star helmets with excellent safety scores
  if (helmet.star_rating === 5 && helmet.safety_score <= 10) {
    badges.push({
      text: '⭐ Staff Pick',
      className: 'bg-purple-500 text-white',
      description: 'Recommended by our experts'
    });
  }

  // Trending - Popular categories
  if (helmet.category === 'Road' && helmet.name.toLowerCase().includes('mips')) {
    badges.push({
      text: '📈 Trending',
      className: 'bg-blue-500 text-white',
      description: 'Popular this month'
    });
  }

  // New Arrival - Recent additions (simulate with specific helmets)
  if (helmet.brand === 'POC' || helmet.brand === 'Smith') {
    badges.push({
      text: '✨ Featured',
      className: 'bg-orange-500 text-white',
      description: 'Premium brand spotlight'
    });
  }

  // Top Safety - Helmets with exceptional safety scores
  if (helmet.safety_score <= 8) {
    badges.push({
      text: '🛡️ Top Safety',
      className: 'bg-indigo-500 text-white',
      description: 'Exceptional protection'
    });
  }

  // Only show the first badge to avoid clutter
  const primaryBadge = badges[0];

  if (!primaryBadge) return null;

  return (
    <div className="absolute top-3 left-3 z-10">
      <div
        className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg ${primaryBadge.className}`}
        title={primaryBadge.description}
      >
        {primaryBadge.text}
      </div>
    </div>
  );
}

// Helper component for urgency messaging
interface UrgencyMessageProps {
  helmet: Helmet;
}

export function UrgencyMessage({ helmet }: UrgencyMessageProps) {
  const messages = [];

  // Stock urgency
  if (helmet.available_count <= 2) {
    messages.push({
      text: `⚡ Only ${helmet.available_count} left in stock`,
      className: 'text-red-600',
      type: 'stock'
    });
  } else if (helmet.available_count <= 5) {
    messages.push({
      text: `🔥 Low stock - ${helmet.available_count} remaining`,
      className: 'text-orange-600',
      type: 'stock'
    });
  }

  // Price trending (simulate based on safety score and availability)
  if (helmet.safety_score <= 10 && helmet.available_count > 5) {
    messages.push({
      text: '📊 Price trending up - secure now',
      className: 'text-purple-600',
      type: 'price'
    });
  }

  // High demand
  if (helmet.star_rating >= 4 && helmet.available_count <= 3) {
    messages.push({
      text: '🚨 High demand - selling fast',
      className: 'text-red-600',
      type: 'demand'
    });
  }

  const primaryMessage = messages[0];
  if (!primaryMessage) return null;

  return (
    <div className={`text-xs font-medium ${primaryMessage.className} bg-white bg-opacity-90 px-2 py-1 rounded`}>
      {primaryMessage.text}
    </div>
  );
}