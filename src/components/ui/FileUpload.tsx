import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FileUploadProps {
  onFilesChange: (files: string[]) => void;
  existingFiles?: string[];
  maxFiles?: number;
  label?: string;
  className?: string;
}

export function FileUpload({
  onFilesChange,
  existingFiles = [],
  maxFiles = 10,
  label,
  className,
}: FileUploadProps) {
  const [previews, setPreviews] = useState<string[]>(existingFiles);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync previews when existingFiles prop changes (e.g., after form reset with API data)
  useEffect(() => {
    if (existingFiles.length > 0 && previews.length === 0) {
      setPreviews(existingFiles);
    }
  }, [existingFiles]);

  function processFiles(files: FileList) {
    const remaining = maxFiles - previews.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setPreviews((prev) => {
          const next = [...prev, base64];
          onFilesChange(next);
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
  }

  function removeFile(idx: number) {
    setPreviews((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      onFilesChange(next);
      return next;
    });
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && <p className="text-sm font-medium text-neutral-700">{label}</p>}

      {previews.length < maxFiles && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragging
              ? 'border-primary bg-primary/5'
              : 'border-surface-border hover:border-primary/50 hover:bg-surface-muted'
          )}
        >
          <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-neutral-700">
            Arraste imagens ou <span className="text-primary">clique para selecionar</span>
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            PNG, JPG, WEBP até 5MB • Máximo {maxFiles} fotos
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previews.map((src, idx) => (
            <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden bg-neutral-100">
              {src.startsWith('data:') || src.startsWith('http') ? (
                <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-neutral-300" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-primary text-white px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
