import type { Project } from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
  generateId,
  loadBookings,
  loadMessages,
  loadTemplates,
  saveBookings,
  saveMessages,
  saveTemplates,
} from "./teamTalkStorage";
import type {
  BookingMessage,
  BookingPerson,
  BookingStatus,
  BookingTemplate,
} from "./types";

export function useTeamTalk(projects: Project[]) {
  const [bookings, setBookings] = useState<BookingPerson[]>(() =>
    loadBookings(),
  );
  const [messages, setMessages] = useState<BookingMessage[]>(() =>
    loadMessages(),
  );
  const [templates, setTemplates] = useState<BookingTemplate[]>(() =>
    loadTemplates(),
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Auto-sync: merge project team members into bookings
  useEffect(() => {
    const existing = loadBookings();
    const existingIds = new Set(existing.map((b) => b.id));
    const newBookings = [...existing];
    let changed = false;

    for (const project of projects.filter((p) => !p.archived)) {
      for (const member of project.teamMembers || []) {
        const bookingId = `tm-${member.id}`;
        if (!existingIds.has(bookingId)) {
          newBookings.push({
            id: bookingId,
            name: member.name,
            role: member.jobTitle || member.role || "Team Member",
            projectId: project.id,
            source: "resourced",
            avatar: member.initials || member.name.slice(0, 2).toUpperCase(),
            status: "available",
            email: member.email || "",
            rate: 0,
            dates: [],
            jobDesc: "",
            links: [],
            unread: 0,
          });
          existingIds.add(bookingId);
          changed = true;
        }
      }
    }

    if (changed) {
      setBookings(newBookings);
      saveBookings(newBookings);
    }
  }, [projects]);

  const updateBooking = useCallback(
    (id: string, updates: Partial<BookingPerson>) => {
      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === id ? { ...b, ...updates } : b,
        );
        saveBookings(updated);
        return updated;
      });
    },
    [],
  );

  const addBooking = useCallback((person: Omit<BookingPerson, "id">) => {
    const newPerson: BookingPerson = { ...person, id: generateId() };
    setBookings((prev) => {
      const updated = [...prev, newPerson];
      saveBookings(updated);
      return updated;
    });
    return newPerson.id;
  }, []);

  const removeBooking = useCallback((id: string) => {
    setBookings((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveBookings(updated);
      return updated;
    });
  }, []);

  const sendMessage = useCallback(
    (msg: Omit<BookingMessage, "id" | "date">) => {
      const newMsg: BookingMessage = {
        ...msg,
        id: generateId(),
        date: new Date().toISOString(),
      };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        saveMessages(updated);
        return updated;
      });
      // Clear unread for this person if we're the sender
      setBookings((prev) => {
        const updated = prev.map((b) =>
          b.id === msg.personId ? { ...b, unread: 0 } : b,
        );
        saveBookings(updated);
        return updated;
      });
    },
    [],
  );

  const confirmBooking = useCallback(
    (id: string) => {
      updateBooking(id, {
        status: "confirmed" as BookingStatus,
        confirmedAt: new Date().toISOString(),
      });
    },
    [updateBooking],
  );

  const messagesForPerson = useCallback(
    (personId: string) =>
      messages
        .filter((m) => m.personId === personId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [messages],
  );

  const selectedPerson =
    bookings.find((b) => b.id === selectedPersonId) || null;

  return {
    bookings,
    messages,
    templates,
    selectedPersonId,
    selectedPerson,
    setSelectedPersonId,
    updateBooking,
    addBooking,
    removeBooking,
    sendMessage,
    confirmBooking,
    messagesForPerson,
    setTemplates,
    saveTemplates,
  };
}
