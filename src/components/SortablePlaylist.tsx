
import React from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface SortablePlaylistProps {
  items: MediaItem[];
  onSortEnd: (newItems: MediaItem[]) => void;
  currentIndex: number;
  onSelect: (index: number) => void;
}

const SortablePlaylist: React.FC<SortablePlaylistProps> = ({
  items,
  onSortEnd,
  currentIndex,
  onSelect,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      onSortEnd(newItems);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Current Playlist</h3>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-10">
            <p>No media items in this playlist</p>
            <p className="mt-2">Upload some media using the uploader above</p>
          </div>
        ) : (
          <ScrollArea className="h-64 w-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      item={item}
                      isActive={index === currentIndex}
                      onClick={() => onSelect(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SortablePlaylist;
