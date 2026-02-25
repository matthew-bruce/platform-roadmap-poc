export type Initiative = {
  id: string;
  title: string;
  startMonthIndex: number;
  endMonthIndex: number;
  themeId: string;
  swimlaneId: string;
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

export type MilestoneGlobal = {
  id: string;
  label: string;
  monthIndex: number;
  themeId?: string;
};

export type MilestoneAttached = {
  id: string;
  label: string;
  offsetMonthsFromStart: number;
  initiativeId: string;
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
  globalMilestones: MilestoneGlobal[];
  attachedMilestones: MilestoneAttached[];
};

export type RoadmapStore = {
  activeRoadmapId: string;
  roadmaps: Roadmap[];
};
