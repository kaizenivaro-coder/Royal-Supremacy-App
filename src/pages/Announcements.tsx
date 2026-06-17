import React, { useMemo, useState } from "react";
import {
  Bookmark,
  Calendar,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useAppStore } from "../data/store";
import { Badge, Input, PageHeader } from "../components/ui";
import type { Announcement, AnnouncementComment } from "../types";
import { publicAsset } from "../lib/publicAssets";
import { cn } from "../lib/utils";
import { SquadLogoPlaceholder } from "../components/SquadLogoPlaceholder";
import {
  deleteAnnouncementComment,
  getVisibleAnnouncements,
  removeAnnouncementSave,
  updateAnnouncementComment,
} from "../lib/mvpApp";

const fallbackAnnouncementImages = [
  publicAsset("banners/chou-stun.jpg"),
  publicAsset("banners/tigreal-lightborn.webp"),
  publicAsset("banners/tigreal-golden-baron.webp"),
  publicAsset("banners/tigreal-warrior-dawn.webp"),
];

function getAnnouncementImage(announcement: Announcement, index: number) {
  return announcement.imageSrc ?? fallbackAnnouncementImages[index % fallbackAnnouncementImages.length];
}

function normalizeEngagementList(values: string[] | undefined) {
  return Array.isArray(values) ? values : [];
}

function priorityVariant(
  priority: string,
): "default" | "gold" | "danger" {
  if (priority === "Urgent") return "danger";
  if (priority === "Important") return "gold";
  return "default";
}

function priorityRing(priority: string) {
  if (priority === "Urgent") return "border-danger/35 shadow-[0_0_32px_rgba(255,77,94,0.12)]";
  if (priority === "Important") return "border-gold/35 shadow-gold";
  return "border-blue-200/10";
}

export default function Announcements() {
  const {
    announcements,
    authUser,
    setAnnouncements,
    squadLogoSrc,
  } = useAppStore();
  const viewerId = authUser?.username ?? "guest";
  const viewerName = authUser?.username ?? "guest";
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const visibleAnnouncements = useMemo(
    () => getVisibleAnnouncements(announcements, viewerId),
    [announcements, viewerId],
  );

  const updateAnnouncement = (
    announcementId: string,
    updater: (announcement: Announcement) => Announcement,
  ) => {
    setAnnouncements(
      announcements.map((announcement) =>
        announcement.id === announcementId ? updater(announcement) : announcement,
      ),
    );
  };

  const toggleViewerInList = (
    announcementId: string,
    field: "likedBy" | "savedBy",
  ) => {
    if (field === "savedBy") {
      const announcement = announcements.find((item) => item.id === announcementId);
      if (announcement?.savedBy?.includes(viewerId)) {
        setAnnouncements(
          removeAnnouncementSave(announcements, announcementId, viewerId).announcements,
        );
        return;
      }
    }

    updateAnnouncement(announcementId, (announcement) => {
      const currentValues = normalizeEngagementList(announcement[field]);
      const nextValues = currentValues.includes(viewerId)
        ? currentValues.filter((value) => value !== viewerId)
        : [...currentValues, viewerId];

      return { ...announcement, [field]: nextValues };
    });
  };

  const handleComment = (
    event: React.FormEvent<HTMLFormElement>,
    announcementId: string,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get("comment") ?? "").trim();
    if (!message) return;

    updateAnnouncement(announcementId, (announcement) => ({
      ...announcement,
      comments: [
        ...(announcement.comments ?? []),
        {
          id: `comment_${announcementId}_${Date.now()}`,
          author: viewerName,
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    form.reset();
  };

  const startCommentEdit = (comment: AnnouncementComment) => {
    setEditingCommentId(comment.id);
    setActiveCommentMenuId(null);
  };

  const handleEditComment = (
    event: React.FormEvent<HTMLFormElement>,
    announcementId: string,
    commentId: string,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const message = String(formData.get("editComment") ?? "").trim();
    const result = updateAnnouncementComment(
      announcements,
      announcementId,
      commentId,
      viewerName,
      message,
    );

    if (result.ok) {
      setAnnouncements(result.announcements);
      setEditingCommentId(null);
    }
  };

  const handleDeleteComment = (announcementId: string, commentId: string) => {
    const result = deleteAnnouncementComment(
      announcements,
      announcementId,
      commentId,
      viewerName,
    );

    if (result.ok) {
      setAnnouncements(result.announcements);
      setActiveCommentMenuId(null);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
      }
    }
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader title="Royal Decrees" />

      <section className="mx-auto max-w-2xl space-y-6" aria-label="Active announcements">
        {visibleAnnouncements.length > 0 ? (
          visibleAnnouncements.map((announcement, index) => {
            const likedBy = normalizeEngagementList(announcement.likedBy);
            const savedBy = normalizeEngagementList(announcement.savedBy);
            const comments = announcement.comments ?? [];
            const isLiked = likedBy.includes(viewerId);
            const isSaved = savedBy.includes(viewerId);
            const imageSrc = getAnnouncementImage(announcement, index);

            return (
              <article
                key={announcement.id}
                className={cn(
                  "overflow-hidden rounded-lg border bg-surface/92 shadow-[0_20px_70px_rgba(0,0,0,0.34)]",
                  priorityRing(announcement.priority),
                )}
              >
                <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 md:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <SquadLogoPlaceholder
                      src={squadLogoSrc}
                      className="h-11 w-11 shrink-0 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase text-white">
                        Royal Supremacy
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-gold" />
                          {announcement.date}
                        </span>
                        <Badge variant={priorityVariant(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full text-text-muted transition hover:bg-white/5 hover:text-white"
                      aria-label="More announcement options"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </header>

                <div className="relative bg-black">
                  <img
                    src={imageSrc}
                    alt={announcement.imageName || announcement.title}
                    className="aspect-[16/11] w-full object-cover sm:aspect-video"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 to-transparent" />
                </div>

                <div className="space-y-4 px-4 py-4 md:px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleViewerInList(announcement.id, "likedBy")}
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-full border border-blue-200/10 bg-background/55 transition hover:border-gold/40",
                          isLiked ? "text-danger" : "text-white",
                        )}
                        aria-pressed={isLiked}
                        aria-label={isLiked ? "Unlike announcement" : "Like announcement"}
                      >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                      <a
                        href={`#comment-${announcement.id}`}
                        className="grid h-10 w-10 place-items-center rounded-full border border-blue-200/10 bg-background/55 text-white transition hover:border-gold/40"
                        aria-label="Comment on announcement"
                      >
                        <MessageCircle size={20} />
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleViewerInList(announcement.id, "savedBy")}
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-full border border-blue-200/10 bg-background/55 transition hover:border-gold/40",
                        isSaved ? "text-gold" : "text-white",
                      )}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? "Unsave announcement image" : "Save announcement image"}
                    >
                      <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div>
                    <p className="text-sm font-black text-white">
                      {likedBy.length} {likedBy.length === 1 ? "like" : "likes"}
                    </p>
                    <h2 className="mt-3 font-display text-2xl font-black uppercase leading-tight text-white md:text-3xl">
                      {announcement.title}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] font-medium leading-7 text-white/90">
                      {announcement.message}
                    </p>
                  </div>

                  {comments.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-blue-200/10 bg-background/45 p-3">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="relative flex items-start justify-between gap-3 rounded-lg border border-transparent p-2 transition hover:border-blue-200/10 hover:bg-surface/45"
                        >
                          {editingCommentId === comment.id ? (
                            <form
                              className="flex flex-1 items-center gap-2"
                              onSubmit={(event) =>
                                handleEditComment(event, announcement.id, comment.id)
                              }
                            >
                              <Input
                                name="editComment"
                                defaultValue={comment.message}
                                aria-label={`Edit comment by ${comment.author}`}
                                className="h-10 flex-1"
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-gold px-3 py-2 text-[10px] font-black uppercase tracking-widest text-background"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="rounded-lg border border-blue-200/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-text-muted"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <p className="min-w-0 flex-1 text-sm leading-6 text-white/85">
                              <span className="font-black text-gold">@{comment.author}</span>{" "}
                              {comment.message}
                              {comment.editedAt && (
                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                                  Edited
                                </span>
                              )}
                            </p>
                          )}
                          {comment.author === viewerName && editingCommentId !== comment.id && (
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCommentMenuId((current) =>
                                    current === comment.id ? null : comment.id,
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-full text-text-muted transition hover:bg-white/5 hover:text-white"
                                aria-label={`Open options for comment by ${comment.author}`}
                              >
                                <MoreHorizontal size={18} />
                              </button>
                              {activeCommentMenuId === comment.id && (
                                <div className="absolute right-0 top-9 z-10 w-32 overflow-hidden rounded-lg border border-blue-200/15 bg-surface shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => startCommentEdit(comment)}
                                    className="block w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/5"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(announcement.id, comment.id)
                                    }
                                    className="block w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-danger transition hover:bg-danger/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    id={`comment-${announcement.id}`}
                    className="flex items-center gap-3 border-t border-white/10 pt-4"
                    onSubmit={(event) => handleComment(event, announcement.id)}
                  >
                    <Input
                      name="comment"
                      aria-label={`Comment on ${announcement.title}`}
                      className="h-10 flex-1 rounded-full"
                    />
                    <button
                      type="submit"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-background transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gold/60"
                      aria-label="Post comment"
                    >
                      <Send size={17} />
                    </button>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-blue-200/15 bg-surface/70 px-6 py-24 text-center">
            <SquadLogoPlaceholder className="mb-6 h-16 w-16 opacity-60" />
            <h3 className="font-display text-2xl font-black uppercase text-white">
              No Active Announcements
            </h3>
            <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-text-muted">
              Standby for incoming squad communications.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
