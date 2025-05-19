
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoveVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string;
  item: MediaItem;
  isActive: boolean;
  onClick: () => void;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, item, isActive, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all",
        isActive ? "ring-2 ring-primary" : "hover:opacity-80"
      )}
      onClick={onClick}
    >
      {item.type === 'image' ? (
        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="bg-muted w-full h-full flex items-center justify-center">
          <video src={item.url} className="max-h-full max-w-full object-contain" />
        </div>
      )}
      <div
        className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <MoveVertical className="text-white drop-shadow-md" />
      </div>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 text-xs bg-primary text-primary-foreground py-1 px-2 text-center">
          Current
        </div>
      )}
    </div>
  );
};
