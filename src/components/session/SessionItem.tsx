import type { Session } from '@/lib/types';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SessionItem({ session, isActive, onSelect, onDelete }: SessionItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect from firing
    onDelete();
  };

  return (
    <div className="relative group">
      <SidebarMenuButton
        onClick={onSelect}
        isActive={isActive}
        className="w-full justify-start text-left pr-10" // Make space for delete button
        tooltip={{
          children: (
            <>
              <p className="font-medium">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(session.lastModified), { addSuffix: true })}
              </p>
            </>
          ),
          side: "right",
          align: "center",
        }}
      >
        <div className="flex flex-col overflow-hidden">
          <span className="truncate font-medium">{session.title}</span>
          <span className="text-xs text-muted-foreground truncate">
            {formatDistanceToNow(new Date(session.lastModified), { addSuffix: true })}
          </span>
        </div>
         {session.isGeneratingTitle && <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />}
      </SidebarMenuButton>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={handleDelete}
        aria-label="Delete session"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
