import { Archive, Banknote, CloudCog, ShieldCheck, type LucideIcon } from "lucide-react";
import type { Initiative, Roadmap, RoadmapStore } from "./types";

export const STORAGE_KEY = "technology-roadmap-poc-v1";
export const TIMELINE_START = new Date(2026, 0, 1);
export const TOTAL_MONTHS = 18;
export const MONTH_WIDTH = 128;
export const uid = () => crypto.randomUUID();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const iconMap: Record<string, LucideIcon> = {
  Banknote,
  CloudCog,
  ShieldCheck,
  Archive
};

export function monthLabel(index: number) {
  const d = new Date(TIMELINE_START.getFullYear(), TIMELINE_START.getMonth() + index, 1);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function fyLabel(index: number) {
  const d = new Date(TIMELINE_START.getFullYear(), TIMELINE_START.getMonth() + index, 1);
  const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `FY ${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`;
}

export function quarterLabel(index: number) {
  const d = new Date(TIMELINE_START.getFullYear(), TIMELINE_START.getMonth() + index, 1);
  const m = d.getMonth();
  if (m >= 3 && m <= 5) return "Q1";
  if (m >= 6 && m <= 8) return "Q2";
  if (m >= 9 && m <= 11) return "Q3";
  return "Q4";
}

export const clampMonth = (n: number) => Math.max(0, Math.min(TOTAL_MONTHS - 1, n));

const init = (title: string, start: number, end: number, themeId: string, swimlaneId: string): Initiative => ({
  id: uid(),
  title,
  startMonthIndex: start,
  endMonthIndex: end,
  themeId,
  swimlaneId
});

export function demoStore(): RoadmapStore {
  const t1 = uid();
  const t2 = uid();
  const t3 = uid();
  const s11 = uid();
  const s12 = uid();
  const s21 = uid();
  const s31 = uid();

  const roadmap: Roadmap = {
    id: uid(),
    name: "Executive North Star",
    themes: [
      {
        id: t1,
        name: "Growth & Value",
        color: "#DA202A",
        icon: "Banknote",
        swimlanes: [
          {
            id: s11,
            swimlaneName: "Payments Platform",
            teamName: "Core Platforms",
            supplierName: "Capgemini",
            initiatives: [
              init("Unified Checkout", 0, 4, t1, s11),
              init("Instant Refund Rails", 5, 10, t1, s11)
            ]
          },
          {
            id: s12,
            swimlaneName: "Customer Engagement",
            teamName: "Digital Experience",
            supplierName: "Thoughtworks",
            initiatives: [init("Personalised Journeys", 3, 8, t1, s12)]
          }
        ]
      },
      {
        id: t2,
        name: "Platform Modernisation",
        color: "#1E5AA5",
        icon: "CloudCog",
        swimlanes: [
          {
            id: s21,
            swimlaneName: "Core APIs",
            teamName: "Architecture",
            supplierName: "Accenture",
            initiatives: [init("Domain API Mesh", 1, 9, t2, s21), init("Observability 2.0", 9, 14, t2, s21)]
          }
        ]
      },
      {
        id: t3,
        name: "Trust & Resilience",
        color: "#3E8054",
        icon: "ShieldCheck",
        swimlanes: [
          {
            id: s31,
            swimlaneName: "Cyber & Compliance",
            teamName: "Security",
            supplierName: "NCC",
            initiatives: [init("Zero Trust Expansion", 2, 11, t3, s31)]
          }
        ]
      }
    ],
    globalMilestones: [
      { id: uid(), label: "Board Sign-off", monthIndex: 2 },
      { id: uid(), label: "Peak Readiness", monthIndex: 10, themeId: t1 }
    ],
    attachedMilestones: [],
    freezeWindows: [
      { id: uid(), label: "Peak Change Freeze", startMonthIndex: 9, endMonthIndex: 11, scopeThemeIds: [] },
      { id: uid(), label: "DST Migration Window", startMonthIndex: 6, endMonthIndex: 7, scopeThemeIds: [t2] }
    ]
  };

  const firstInitiative = roadmap.themes[0].swimlanes[0].initiatives[0];
  roadmap.attachedMilestones.push({ id: uid(), label: "Pilot Live", offsetMonthsFromStart: 2, initiativeId: firstInitiative.id });
  roadmap.attachedMilestones.push({ id: uid(), label: "Scale Wave", offsetMonthsFromStart: 4, initiativeId: firstInitiative.id });

  const roadmap2: Roadmap = {
    ...roadmap,
    id: uid(),
    name: "Ops Reinvention",
    themes: roadmap.themes.map((t) => ({ ...t, id: uid(), swimlanes: t.swimlanes.map((s) => ({ ...s, id: uid(), initiatives: [] })) })),
    globalMilestones: [],
    attachedMilestones: [],
    freezeWindows: []
  };

  return {
    activeRoadmapId: roadmap.id,
    roadmaps: [roadmap, roadmap2]
  };
}
