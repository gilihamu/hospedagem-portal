import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import type { PropertyImage } from '../../types';
import { cn } from '../../utils/cn';

interface ImageGalleryProps {
  images: PropertyImage[];
  propertyName: string;
}

export function ImageGallery({ images, propertyName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const primary = images[0];
  const secondary = images.slice(1, 5);

  const openLightbox = (idx: number) => {
    setActiveIdx(idx);
    setLightboxOpen(true);
  };

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-64 sm:h-96 overflow-hidden rounded-2xl relative">
        {/* Primary large image */}
        <div
          className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer"
          onClick={() => openLightbox(0)}
        >
          {primary && (
            <img
              src={primary.url}
              alt={primary.alt || propertyName}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        {/* Secondary images */}
        {secondary.map((img, idx) => (
          <div
            key={img.id}
            className={cn(
              'relative overflow-hidden cursor-pointer',
              idx >= 2 && 'hidden sm:block'
            )}
            onClick={() => openLightbox(idx + 1)}
          >
            <img
              src={img.url}
              alt={img.alt || `Foto ${idx + 2}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}

        {/* See all button */}
        {images.length > 5 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm text-neutral-800 text-sm font-medium px-4 py-2 rounded-xl shadow-card hover:bg-white transition-colors"
          >
            <Grid className="w-4 h-4" />
            Ver todas ({images.length})
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prev}
            className="absolute left-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-screen w-full px-16">
            <img
              src={images[activeIdx]?.url}
              alt={images[activeIdx]?.alt || propertyName}
              className="w-full max-h-[80vh] object-contain"
            />
            <p className="text-white/60 text-sm text-center mt-4">
              {activeIdx + 1} / {images.length}
            </p>
          </div>

          <button
            onClick={next}
            className="absolute right-4 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
