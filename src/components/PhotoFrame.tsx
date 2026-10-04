import type { CSSProperties, ReactNode } from 'react';
import { usePhotoUrl } from '../content/photos';
import { CameraIcon } from './icons';

interface Props {
  photo: string | null;
  alt: string;
  style?: CSSProperties;
  emptyLabel?: string;
  children?: ReactNode;
}

/** Portrætramme (ca. 4.6:6) med hård skygge – eller en pæn tom ramme. */
export function PhotoFrame({ photo, alt, style, emptyLabel = 'Indsæt billede', children }: Props) {
  const url = usePhotoUrl(photo);
  return (
    <div
      style={{
        position: 'absolute',
        background: 'var(--navy2)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        ...style,
      }}
    >
      {url ? (
        <img src={url} alt={alt} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <>
          <CameraIcon size={100} />
          <span style={{ color: 'var(--paper)', fontSize: 30 }}>{emptyLabel}</span>
        </>
      )}
      {children}
    </div>
  );
}
