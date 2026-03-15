import type { ChannelSlug } from '../../types';

interface ChannelBadgeProps {
  slug?: ChannelSlug;
  size?: 'sm' | 'md';
}

const channelConfig: Record<ChannelSlug, { label: string; bg: string; text: string }> = {
  booking_com: { label: 'Booking.com', bg: 'bg-[#003580]/10', text: 'text-[#003580]' },
  airbnb: { label: 'Airbnb', bg: 'bg-[#FF5A5F]/10', text: 'text-[#FF5A5F]' },
  vrbo: { label: 'Vrbo', bg: 'bg-[#3F51B5]/10', text: 'text-[#3F51B5]' },
  expedia: { label: 'Expedia', bg: 'bg-[#FFCC00]/15', text: 'text-[#9E7C00]' },
  tripadvisor: { label: 'TripAdvisor', bg: 'bg-[#00AF87]/10', text: 'text-[#00AF87]' },
  decolar: { label: 'Decolar', bg: 'bg-[#FF6600]/10', text: 'text-[#FF6600]' },
};

export function ChannelBadge({ slug, size = 'sm' }: ChannelBadgeProps) {
  if (!slug) return null;
  const config = channelConfig[slug];
  if (!config) return null;

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
}
