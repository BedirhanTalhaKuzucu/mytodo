import type { Note, Task } from "@/types";
import { addDaysISO, getTodayISO, getTomorrowISO } from "@/lib/utils";

export function createSeedData(): { tasks: Task[]; notes: Note[] } {
  const now = new Date().toISOString();
  const today = getTodayISO();
  const tomorrow = getTomorrowISO();
  const inThreeDays = addDaysISO(today, 3);

  const workNoteId = "note-seed-work-1";
  const personalNoteId = "note-seed-personal-1";
  const workTask1Id = "task-seed-work-1";
  const workTask2Id = "task-seed-work-2";
  const personalTask1Id = "task-seed-personal-1";
  const personalTask2Id = "task-seed-personal-2";
  const inboxTaskId = "task-seed-inbox-1";

  const tasks: Task[] = [
    {
      id: workTask1Id,
      title: "Q4 Ürün Yol Haritası sunumunu tamamla",
      notes:
        "Özellikle mobil PWA performansı ve Supabase geçiş takvimini netleştirelim. Pazarlama ekibinden gelen son metrikleri slayt 4'e ekle.",
      space: "work",
      status: "todo",
      priority: "high",
      dueDate: today,
      recurrence: "none",
      subtasks: [
        { id: "sub-1", title: "Kullanıcı geri bildirimlerini özetle", done: true },
        { id: "sub-2", title: "Gelir & büyüme grafiklerini güncelle", done: true },
        { id: "sub-3", title: "Tasarım ekibinden son ekran görüntülerini al", done: false },
        { id: "sub-4", title: "Yönetim kurulu için 10 dk prova yap", done: false },
      ],
      linkedNoteIds: [workNoteId],
      tags: ["sunum", "strateji"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: workTask2Id,
      title: "Haftalık ekip senkronizasyonu & PR incelemeleri",
      notes: "Açık pull request'leri toplantı öncesi gözden geçir.",
      space: "work",
      status: "todo",
      priority: "medium",
      dueDate: tomorrow,
      recurrence: "weekly",
      subtasks: [
        { id: "sub-5", title: "Auth modülü PR #142 kontrolü", done: false },
        { id: "sub-6", title: "Toplantı gündemini Slack'te paylaş", done: false },
      ],
      linkedNoteIds: [],
      tags: ["ekip", "kod-inceleme"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: personalTask1Id,
      title: "Akşam koşusu (5 km) ve esneme",
      notes: "Sahil parkurunda hafif tempo. Koşu sonrası bol su içmeyi unutma.",
      space: "personal",
      status: "todo",
      priority: "medium",
      dueDate: today,
      recurrence: "daily",
      subtasks: [
        { id: "sub-7", title: "10 dk ısınma", done: true },
        { id: "sub-8", title: "5 km koşu", done: false },
      ],
      linkedNoteIds: [personalNoteId],
      tags: ["sağlık", "spor"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: personalTask2Id,
      title: "Hafta sonu kahvaltı & market alışverişi",
      notes: "Taze kahve çekirdeği, avokado, ekşi maya ekmek ve yulaf sütü.",
      space: "personal",
      status: "todo",
      priority: "low",
      dueDate: inThreeDays,
      recurrence: "none",
      subtasks: [],
      linkedNoteIds: [],
      tags: ["ev", "alışveriş"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: inboxTaskId,
      title: "Yeni okuma lambası modellerini karşılaştır",
      notes: "Masa başı çalışma için sıcak ışık (3000K) ayarlı modellere bak.",
      space: null,
      status: "todo",
      priority: "low",
      dueDate: null,
      recurrence: "none",
      subtasks: [],
      linkedNoteIds: [],
      tags: ["fikir"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const notes: Note[] = [
    {
      id: workNoteId,
      title: "Q4 Ürün Stratejisi & Mimari Notları",
      content: `# Q4 Odak Noktaları\n\n- **Hız & Tepkisellik:** Tüm görev ve not etkileşimlerinde 0ms gecikme (Optimistic UI).\n- **Veri Katmanı:** İlk aşamada tarayıcıda anında çalışan yapı, ikinci fazda tek noktadan Supabase senkronizasyonu.\n- **Mobil Deneyim:** Tek elle başparmakla hızlı yakalama (+ FAB) ve PWA kurulumu.\n\n## Sunum İçin Kritik Sorular\n1. Kullanıcıların İş ve Özel alanlarını ayırma oranı nedir?\n2. Pomodoro entegrasyonu günlük tamamlama oranını nasıl etkiliyor?`,
      space: "work",
      isPinned: true,
      linkedTaskIds: [workTask1Id],
      tags: ["strateji", "ürün"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: personalNoteId,
      title: "Haftalık Rutin & Kitap Listesi",
      content: `# Bu Ay Okunacaklar\n\n- *Atomik Alışkanlıklar* — James Clear\n- *Derin Çalışma (Deep Work)* — Cal Newport\n\n## Koşu & Sağlık Notları\n- Haftada en az 3 gün açık hava koşusu\n- Uyku saati hedefi: **23:00**`,
      space: "personal",
      isPinned: true,
      linkedTaskIds: [personalTask1Id],
      tags: ["kişisel", "kitaplar"],
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { tasks, notes };
}
