import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Bell, Check, CheckCheck, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'recurring':
      return <RefreshCw className="h-4 w-4 text-primary" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

export function NotificationBell() {
  const { data: notifications, isLoading } = useNotifications();
  const { data: unreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {(unreadCount ?? 0) > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          {(unreadCount ?? 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : !notifications?.length ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Belum ada notifikasi
            </div>
          ) : (
            <div>
              {notifications.map((notif, i) => (
                <div key={notif.id}>
                  <button
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                      !notif.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!notif.is_read) markAsRead.mutate(notif.id);
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line line-clamp-3">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </button>
                  {i < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
