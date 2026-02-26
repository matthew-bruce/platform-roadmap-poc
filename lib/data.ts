import { Activity, Boxes, CloudCog, ShieldCheck, WalletCards } from 'lucide-react';
import type { Store, Initiative, GlobalMilestone, AttachedMilestone } from './types';

export const STORAGE_KEY = 'roadmap-poc-v1';

export const iconMap = {
  Activity,
  WalletCards,
  Boxes,
  CloudCog,
  ShieldCheck
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const makeSeedStore = (): Store => {
  const r1 = {
    id: uid(),
    name: 'Transformation North Star',
    themes: [
      {
        id: uid(),
        name: 'Customer Journeys',
        color: '#DA202A',
        icon: 'WalletCards',
        swimlanes: [
          {
            id: uid(),
            swimlaneName: 'Payments Platform',
            teamName: 'Core Platforms',
            supplierName: 'Capgemini',
            initiatives: [] as Initiative[],
          },
          {
            id: uid(),
            swimlaneName: 'Digital Front Door',
            teamName: 'Channels',
            supplierName: 'Thoughtworks',
            initiatives: [] as Initiative[],
          }
        ]
      },
      {
        id: uid(),
        name: 'Resilience & Risk',
        color: '#6B46C1',
        icon: 'ShieldCheck',
        swimlanes: [
          {
            id: uid(),
            swimlaneName: 'Identity Services',
            teamName: 'Security',
            supplierName: 'Accenture',
            initiatives: [] as Initiative[],
          }
        ]
      },
      {
        id: uid(),
        name: 'Data & Automation',
        color: '#0F766E',
        icon: 'CloudCog',
        swimlanes: [
          {
            id: uid(),
            swimlaneName: 'Data Foundation',
            teamName: 'Data Office',
            supplierName: 'BJSS',
            initiatives: [] as Initiative[],
          }
        ]
      }
    ],
    freezeWindows: [
      { id: uid(), label: 'Peak Change Freeze', startMonthIndex: 10, endMonthIndex: 11, scopeThemeIds: [] },
      { id: uid(), label: 'DST Migration Window', startMonthIndex: 4, endMonthIndex: 5, scopeThemeIds: [] }
    ],
    globalMilestones: [] as GlobalMilestone[],
    attachedMilestones: [] as AttachedMilestone[]
  };

  const lanes = r1.themes.flatMap((t) => t.swimlanes.map((s) => ({ t, s })));
  const addInit = (title: string, start: number, end: number, lane = lanes[0]) => {
    const i = { id: uid(), title, startMonthIndex: start, endMonthIndex: end, themeId: lane.t.id, swimlaneId: lane.s.id };
    lane.s.initiatives.push(i);
    return i;
  };

  const p1 = addInit('Unified Checkout Experience', 1, 6, lanes[0]);
  const p2 = addInit('Merchant Settlement Modernisation', 5, 12, lanes[0]);
  const p3 = addInit('Onboarding UX Revamp', 0, 4, lanes[1]);
  const p4 = addInit('Continuous Access Assurance', 3, 8, lanes[2]);
  const p5 = addInit('Streaming Data Plane', 7, 15, lanes[3]);

  r1.attachedMilestones.push(
    { id: uid(), label: 'Pilot Live', offsetMonthsFromStart: 2, initiativeId: p1.id },
    { id: uid(), label: 'Reg Signoff', offsetMonthsFromStart: 4, initiativeId: p2.id },
    { id: uid(), label: 'MVP Cutover', offsetMonthsFromStart: 5, initiativeId: p5.id }
  );

  r1.globalMilestones.push(
    { id: uid(), label: 'Board Gate', monthIndex: 2 },
    { id: uid(), label: 'Funding Replan', monthIndex: 9, themeId: r1.themes[1].id },
    { id: uid(), label: 'Value Proof', monthIndex: 15 }
  );

  const r2 = JSON.parse(JSON.stringify(r1));
  r2.id = uid();
  r2.name = 'Core Modernisation Narrative';

  return {
    roadmaps: [r1, r2],
    selectedRoadmapId: r1.id
  };
};
