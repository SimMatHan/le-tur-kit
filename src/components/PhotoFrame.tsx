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

/** Portrætramme (ca. 4.6:6) med runde hjørner – eller en diskret tom ramme. */
export function PhotoFrame({ photo, alt, style, emptyLabel = 'Indsæt billede', children }: Props) {
  const url = usePhotoUrl(photo);
  return (
    <div
      style={{
        position: 'absolute',
        background: 'var(--mist)',
        borderRadius: 28,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        ...style,
      }}
    >
      {url ? (
        <img src={url} alt={alt} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <>
          <CameraIcon size={92} color="var(--muted-dark)" bg="var(--mist)" />
          <span style={{ color: 'var(--muted)', fontSize: 28, fontWeight: 600 }}>{emptyLabel}</span>
        </>
      )}
      {children}
    </div>
  );
}
