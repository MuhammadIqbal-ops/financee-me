import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function usePushNotifications() {
  const { user } = useAuth();

  const registerPush = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    const permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      if (result.receive !== 'granted') return;
    } else if (permStatus.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    registerPush();

    // Listen for registration token
    const tokenListener = PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration token:', token.value);
      // Store token in profile for server-side push later
      try {
        await supabase
          .from('profiles')
          .update({ push_token: token.value } as any)
          .eq('user_id', user.id);
      } catch (err) {
        console.warn('Could not save push token:', err);
      }
    });

    const errorListener = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err.error);
    });

    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log('Push notification received:', notification);
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('Push notification action:', action);
      }
    );

    return () => {
      tokenListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      notificationListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [user, registerPush]);

  return { registerPush };
}
