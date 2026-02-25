export type Initiative = {
  id: string;
  title: string;
  startMonthIndex: number;
  endMonthIndex: number;
  themeId: string;
  swimlaneId: string;
};

export type AttachedMilestone = {
  id: string;
  label: string;
  offsetMonthsFromStart: number;
  initiativeId: string;
};

export type GlobalMilestone = {
  id: string;
  label: string;
  monthIndex: number;
  themeId?: string;
};

export type Swimlane = {
  id: string;
  swimlaneName: string;
  teamName: string;
  supplierName: string;
  initiatives: Initiative[];
};

export type Theme = {
  id: string;
  name: string;
  color: string;
  icon: string;
  swimlanes: Swimlane[];
};

export type FreezeWindow = {
  id: string;
  label: string;
  startMonthIndex: number;
  endMonthIndex: number;
  scopeThemeIds: string[];
};

export type Roadmap = {
  id: string;
  name: string;
  themes: Theme[];
  freezeWindows: FreezeWindow[];
  globalMilestones: GlobalMilestone[];
  attachedMilestones: AttachedMilestone[];
};

export type Store = {
  roadmaps: Roadmap[];
  selectedRoadmapId: string;
};
