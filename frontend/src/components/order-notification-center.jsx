import { BellRing, CheckCheck, ChefHat, CircleX, Clock3, PartyPopper, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useOrderEvents } from "@/hooks/use-order-events";
import { formatOrderStatus } from "@/lib/order-utils";

const MAX_VISIBLE_NOTIFICATIONS = 4;
const AUTO_DISMISS_MS = 6500;
const SOUND_BY_AUDIENCE_KEY = {
  "order.created": { frequency: 720, duration: 0.16 },
  "order.status_updated:confirmed": { frequency: 620, duration: 0.14 },
  "order.status_updated:preparing": { frequency: 540, duration: 0.12 },
  "order.status_updated:ready": { frequency: 880, duration: 0.2 },
  "order.status_updated:served": { frequency: 680, duration: 0.12 },
  "order.status_updated:cancelled": { frequency: 360, duration: 0.2 },
  "order.billed": { frequency: 760, duration: 0.14 },
};

const ROLE_VISIBILITY = {
  "order.created": ["kitchen", "manager", "admin"],
  "order.status_updated:confirmed": ["waiter", "manager", "admin"],
  "order.status_updated:preparing": ["manager", "admin"],
  "order.status_updated:ready": ["waiter", "manager", "admin"],
  "order.status_updated:served": ["manager", "admin"],
  "order.status_updated:cancelled": ["waiter", "kitchen", "manager", "admin"],
  "order.billed": ["manager", "admin"],
};

function getNotificationDescriptor(event) {
  const order = event?.order;

  if (!order) {
    return null;
  }

  if (event.type === "order.created") {
    return {
      audienceKey: "order.created",
      title: "New order placed",
      body: `${order.order_number}${order.table_number ? ` for table ${order.table_number}` : ""} is waiting for kitchen review.`,
      tone: "blue",
      Icon: ChefHat,
    };
  }

  if (event.type === "order.billed") {
    return {
      audienceKey: "order.billed",
      title: "Order billed",
      body: `${order.order_number} has been billed for ${Number(order.final_amount).toFixed(2)}.`,
      tone: "slate",
      Icon: PartyPopper,
    };
  }

  if (event.type !== "order.status_updated") {
    return null;
  }

  if (order.status === "confirmed") {
    return {
      audienceKey: "order.status_updated:confirmed",
      title: "Order confirmed",
      body: `${order.order_number} was confirmed. Service team can track the ticket now.`,
      tone: "amber",
      Icon: CheckCheck,
    };
  }

  if (order.status === "preparing") {
    return {
      audienceKey: "order.status_updated:preparing",
      title: "Order in progress",
      body: `${order.order_number} is now being prepared in the kitchen.`,
      tone: "amber",
      Icon: Clock3,
    };
  }

  if (order.status === "ready") {
    return {
      audienceKey: "order.status_updated:ready",
      title: "Order ready for handoff",
      body: `${order.order_number}${order.table_number ? ` for table ${order.table_number}` : ""} is ready to serve.`,
      tone: "lime",
      Icon: BellRing,
    };
  }

  if (order.status === "served") {
    return {
      audienceKey: "order.status_updated:served",
      title: "Order served",
      body: `${order.order_number} has been marked as served.`,
      tone: "slate",
      Icon: CheckCheck,
    };
  }

  if (order.status === "cancelled") {
    return {
      audienceKey: "order.status_updated:cancelled",
      title: "Order cancelled",
      body: `${order.order_number} was cancelled before completion.`,
      tone: "red",
      Icon: CircleX,
    };
  }

  return {
    audienceKey: `order.status_updated:${order.status}`,
    title: `Order ${formatOrderStatus(order.status)}`,
    body: `${order.order_number} moved to ${formatOrderStatus(order.status)}.`,
    tone: "slate",
    Icon: BellRing,
  };
}

function shouldNotifyUser(event, role) {
  const descriptor = getNotificationDescriptor(event);

  if (!descriptor || !role) {
    return false;
  }

  if (role === "kitchen" && !(event?.order?.items ?? []).some((item) => item.service_station === "kitchen")) {
    return false;
  }

  return (ROLE_VISIBILITY[descriptor.audienceKey] ?? []).includes(role);
}

function isSelfPublishedEvent(event, userId) {
  const actorId = event?.actor?.id;

  if (!userId || actorId === undefined || actorId === null) {
    return false;
  }

  return String(actorId) === String(userId);
}

function getToneClasses(tone) {
  if (tone === "lime") {
    return "border-lime-200 bg-lime-50/95 text-lime-950";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50/95 text-amber-950";
  }
  if (tone === "red") {
    return "border-rose-200 bg-rose-50/95 text-rose-950";
  }
  if (tone === "blue") {
    return "border-sky-200 bg-sky-50/95 text-sky-950";
  }
  return "border-slate-200 bg-white/95 text-slate-900";
}

function playNotificationSound(soundConfig, audioContextRef) {
  if (!soundConfig || typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  try {
    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const startTime = context.currentTime;
    const endTime = startTime + soundConfig.duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(soundConfig.frequency, startTime);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  } catch {
    // Ignore browser audio failures so notifications still render.
  }
}

function shouldPersistNotificationForRole(role, status) {
  if (role === "waiter" || role === "kitchen") {
    return true;
  }

  if (role === "manager" || role === "admin") {
    return status === "served";
  }

  return false;
}

function OrderNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const seenEventsRef = useRef(new Set());
  const audioContextRef = useRef(null);
  const timeoutIdsRef = useRef(new Map());
  const userRole = user?.role;
  const userId = user?.id;

  useOrderEvents((event) => {
    const descriptor = getNotificationDescriptor(event);
    const eventKey = [
      event?.type,
      event?.order?.id,
      event?.order?.status ?? "na",
      event?.order?.updated_at ?? event?.order?.created_at ?? "na",
    ].join(":");

    if (!descriptor || !shouldNotifyUser(event, userRole) || isSelfPublishedEvent(event, userId) || seenEventsRef.current.has(eventKey)) {
      return;
    }

    seenEventsRef.current.add(eventKey);
    playNotificationSound(SOUND_BY_AUDIENCE_KEY[descriptor.audienceKey], audioContextRef);

    const notification = {
      id: `${eventKey}:${Date.now()}`,
      title: descriptor.title,
      body: descriptor.body,
      tone: descriptor.tone,
      isPersistent: shouldPersistNotificationForRole(userRole, event.order.status),
      status: event.order.status,
      orderNumber: event.order.order_number,
      Icon: descriptor.Icon,
    };

    setNotifications((current) => [notification, ...current].slice(0, 12));
  });

  useEffect(() => {
    notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS).forEach((notification) => {
      if (notification.isPersistent || timeoutIdsRef.current.has(notification.id)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        timeoutIdsRef.current.delete(notification.id);
        setNotifications((current) => current.filter((item) => item.id !== notification.id));
      }, AUTO_DISMISS_MS);

      timeoutIdsRef.current.set(notification.id, timeoutId);
    });
  }, [notifications]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current.clear();
      if (audioContextRef.current && typeof audioContextRef.current.close === "function") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
    seenEventsRef.current.clear();
    setNotifications([]);
  }, [userId]);

  function dismissNotification(notificationId) {
    const timeoutId = timeoutIdsRef.current.get(notificationId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(notificationId);
    }

    setNotifications((current) => current.filter((item) => item.id !== notificationId));
  }

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS);

  if (!userRole || !visibleNotifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 lg:right-8 lg:top-8">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast-slide-in pointer-events-auto rounded-[24px] border px-4 py-4 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur ${getToneClasses(notification.tone)}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-black/5">
              <notification.Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{notification.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] opacity-65">
                    {notification.orderNumber} · {formatOrderStatus(notification.status)}
                  </p>
                </div>
                <button
                  aria-label="Close notification"
                  className="rounded-full p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                  onClick={() => dismissNotification(notification.id)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-6 opacity-80">{notification.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { OrderNotificationCenter };
