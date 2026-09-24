import React, { useState } from 'react';
import { User } from 'lucide-react';

/**
 * Universal UserAvatar component
 * Displays user's uploaded avatar when logged in;
 * seamlessly falls back to the Pet Maya teal circular user placeholder (#45848D)
 * with a white outline person icon when the user is logged out or has no custom photo.
 */
export default function UserAvatar({
  user = null,
  photoUrl = null,
  size = 36,
  className = '',
  style = {},
  alt = 'Guardian Profile'
}) {
  const [hasError, setHasError] = useState(false);
  const finalPhoto = photoUrl || user?.photoUrl || user?.photoURL;
  const iconSize = Math.max(14, Math.round(size * 0.5));

  if (finalPhoto && !hasError) {
    return (
      <img
        src={finalPhoto}
        alt={alt}
        className={className}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          ...style
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        backgroundColor: '#45848D',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...style
      }}
      aria-label={alt}
    >
      <User size={iconSize} strokeWidth={2.2} color="#FFFFFF" />
    </div>
  );
}
