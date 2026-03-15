import { cn } from '../../utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const onlineSizes: Record<AvatarSize, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-primary text-white',
    'bg-accent text-white',
    'bg-success text-white',
    'bg-info text-white',
    'bg-neutral-600 text-white',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export function Avatar({ src, name, size = 'md', online, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn('rounded-full object-cover', sizeClasses[size])}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold',
            sizeClasses[size],
            getColorFromName(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            onlineSizes[size],
            online ? 'bg-success' : 'bg-neutral-400'
          )}
        />
      )}
    </div>
  );
}
