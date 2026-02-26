"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { MONTH_WIDTH, STORAGE_KEY, TOTAL_MONTHS, clampMonth, demoStore, fyLabel, iconMap, monthLabel, quarterLabel } from "@/lib/roadmap";
import type { Initiative, RoadmapStore, Theme, Swimlane } from "@/lib/types";

const headerHeight = 114;
const laneHeight = 84;

function useRoadmapStore() {
  const [store, setStore] = useState<RoadmapStore | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = demoStore();
      setStore(seed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return;
    }
    setStore(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (store) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);
  return [store, setStore] as const;
}

function SortableThemeItem({ theme, onRename }: { theme: Theme; onRename: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `theme:${theme.id}` });
  return <button ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} onDoubleClick={onRename} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left text-sm">{theme.name}</button>;
}

function SortableSwimlaneItem({ lane, themeId, onRename }: { lane: Swimlane; themeId: string; onRename: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `lane:${lane.id}`, data: { themeId } });
  return <button ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} onDoubleClick={onRename} className="w-full rounded-md border border-slate-100 bg-slate-50 p-2 text-xs">{lane.swimlaneName}</button>;
}

function InitiativeCard({ initiative, color }: { initiative: Initiative; color: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `initiative:${initiative.id}` });
  return <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), background: color }} {...attributes} {...listeners} className="h-10 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-soft">{initiative.title}</div>;
}

export default function Page() {
  const [store, setStore] = useRoadmapStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const roadmap = useMemo(() => store?.roadmaps.find((r) => r.id === store.activeRoadmapId), [store]);

  if (!store || !roadmap) return <main className="p-8">Loading…</main>;

  const laneThemeMap = new Map<string, { lane: Swimlane; theme: Theme }>();
  roadmap.themes.forEach((theme) => theme.swimlanes.forEach((lane) => laneThemeMap.set(lane.id, { lane, theme })));

  const updateRoadmap = (updater: (current: typeof roadmap) => typeof roadmap) => {
    setStore((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        roadmaps: prev.roadmaps.map((r) => (r.id === roadmap.id ? updater(r) : r))
      };
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over) return;
    const a = String(active.id);
    const o = String(over.id);

    if (a.startsWith("theme:") && o.startsWith("theme:")) {
      const source = roadmap.themes.findIndex((t) => `theme:${t.id}` === a);
      const target = roadmap.themes.findIndex((t) => `theme:${t.id}` === o);
      if (source < 0 || target < 0 || source === target) return;
      updateRoadmap((r) => ({ ...r, themes: arrayMove(r.themes, source, target) }));
      return;
    }

    if (a.startsWith("lane:") && o.startsWith("lane:") && a !== o) {
      const laneId = a.split(":")[1];
      const overLaneId = o.split(":")[1];
      let sourceThemeIdx = -1;
      let targetThemeIdx = -1;
      let movingLane: Swimlane | null = null;
      let targetIndex = 0;
      roadmap.themes.forEach((theme, ti) => {
        theme.swimlanes.forEach((lane, li) => {
          if (lane.id === laneId) {
            sourceThemeIdx = ti;
            movingLane = lane;
          }
          if (lane.id === overLaneId) {
            targetThemeIdx = ti;
            targetIndex = li;
          }
        });
      });
      if (!movingLane || sourceThemeIdx < 0 || targetThemeIdx < 0) return;
      updateRoadmap((r) => {
        const themes = r.themes.map((t) => ({ ...t, swimlanes: [...t.swimlanes] }));
        themes[sourceThemeIdx].swimlanes = themes[sourceThemeIdx].swimlanes.filter((l) => l.id !== laneId);
        themes[targetThemeIdx].swimlanes.splice(targetIndex, 0, movingLane!);
        themes[targetThemeIdx].swimlanes = themes[targetThemeIdx].swimlanes.map((lane) => ({ ...lane, initiatives: lane.initiatives.map((i) => ({ ...i, themeId: themes[targetThemeIdx].id, swimlaneId: lane.id })) }));
        return { ...r, themes };
      });
      return;
    }

    if (a.startsWith("initiative:") && o.startsWith("lane-drop:")) {
      const initiativeId = a.split(":")[1];
      const laneId = o.split(":")[1];
      const target = laneThemeMap.get(laneId);
      if (!target) return;
      const monthShift = Math.round(delta.x / MONTH_WIDTH);
      updateRoadmap((r) => {
        let found: Initiative | null = null;
        const themes = r.themes.map((t) => ({ ...t, swimlanes: t.swimlanes.map((s) => ({ ...s, initiatives: s.initiatives.filter((i) => {
          if (i.id === initiativeId) {
            found = { ...i };
            return false;
          }
          return true;
        }) })) }));
        if (!found) return r;
        found.startMonthIndex = clampMonth(found.startMonthIndex + monthShift);
        found.endMonthIndex = clampMonth(Math.max(found.startMonthIndex, found.endMonthIndex + monthShift));
        found.themeId = target.theme.id;
        found.swimlaneId = target.lane.id;
        const t = themes.find((x) => x.id === target.theme.id);
        const l = t?.swimlanes.find((x) => x.id === target.lane.id);
        if (l) l.initiatives.push(found);
        return { ...r, themes };
      });
      return;
    }

    if (a.startsWith("gm:") && o === "timeline-drop") {
      const id = a.split(":")[1];
      const monthShift = Math.round(delta.x / MONTH_WIDTH);
      updateRoadmap((r) => ({ ...r, globalMilestones: r.globalMilestones.map((m) => (m.id === id ? { ...m, monthIndex: clampMonth(m.monthIndex + monthShift) } : m)) }));
    }
  };

  const months = [...Array(TOTAL_MONTHS)].map((_, i) => i);

  return (
    <main className="flex h-screen overflow-hidden bg-gradient-to-br from-white to-rm-mist">
      <aside className={`${collapsed ? "w-16" : "w-80"} border-r border-white/70 bg-white/80 p-4 backdrop-blur transition-all`}>
        <button onClick={() => setCollapsed((v) => !v)} className="mb-4 rounded-md border p-2">{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        {!collapsed && <>
          <h1 className="mb-2 text-lg font-semibold">Technology Roadmap</h1>
          <select value={roadmap.id} onChange={(e) => setStore((s) => s && ({ ...s, activeRoadmapId: e.target.value }))} className="mb-3 w-full rounded-lg border p-2 text-sm">
            {store.roadmaps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
            <button onClick={() => { const name = prompt("New roadmap name"); if (!name) return; const n = demoStore().roadmaps[0]; n.id = uuidv4(); n.name = name; setStore((s) => s && ({ ...s, roadmaps: [...s.roadmaps, n], activeRoadmapId: n.id })); }} className="rounded bg-rm-ink px-2 py-1 text-white">Create</button>
            <button onClick={() => { const name = prompt("Rename roadmap", roadmap.name); if (!name) return; updateRoadmap((r) => ({ ...r, name })); }} className="rounded bg-slate-800 px-2 py-1 text-white">Rename</button>
            <button onClick={() => { if (store.roadmaps.length < 2) return; if (!confirm("Delete this roadmap?")) return; setStore((s) => s && ({ ...s, roadmaps: s.roadmaps.filter((r) => r.id !== roadmap.id), activeRoadmapId: s.roadmaps.find((r) => r.id !== roadmap.id)!.id })); }} className="rounded bg-rm-red px-2 py-1 text-white">Delete</button>
          </div>

          <div className="mb-2 flex items-center justify-between text-sm font-medium"><span>Themes & Lanes</span><button className="rounded border p-1" onClick={() => updateRoadmap((r) => ({ ...r, themes: [...r.themes, { id: uuidv4(), name: "New Theme", color: "#6777ef", icon: "Archive", swimlanes: [] }] }))}><Plus size={14} /></button></div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={roadmap.themes.map((t) => `theme:${t.id}`)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {roadmap.themes.map((theme) => (
                  <div key={theme.id} className="rounded-lg border border-slate-200 p-2">
                    <SortableThemeItem theme={theme} onRename={() => { const name = prompt("Theme name", theme.name); if (name) updateRoadmap((r) => ({ ...r, themes: r.themes.map((t) => (t.id === theme.id ? { ...t, name } : t)) })); }} />
                    <div className="mt-2 space-y-2 pl-2">
                      <SortableContext items={theme.swimlanes.map((l) => `lane:${l.id}`)} strategy={verticalListSortingStrategy}>
                        {theme.swimlanes.map((lane) => <SortableSwimlaneItem key={lane.id} lane={lane} themeId={theme.id} onRename={() => { const name = prompt("Swimlane name", lane.swimlaneName); if (name) updateRoadmap((r) => ({ ...r, themes: r.themes.map((t) => ({ ...t, swimlanes: t.swimlanes.map((s) => (s.id === lane.id ? { ...s, swimlaneName: name } : s)) })) })); }} />)}
                      </SortableContext>
                      <button onClick={() => updateRoadmap((r) => ({ ...r, themes: r.themes.map((t) => (t.id !== theme.id ? t : { ...t, swimlanes: [...t.swimlanes, { id: uuidv4(), swimlaneName: "New Swimlane", teamName: "Team", supplierName: "Supplier", initiatives: [] }] })) }))} className="w-full rounded-md border border-dashed p-1 text-xs">+ Swimlane</button>
                    </div>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => updateRoadmap((r) => ({ ...r, globalMilestones: [...r.globalMilestones, { id: uuidv4(), label: "New Milestone", monthIndex: 0 }] }))} className="rounded border p-2">+ Milestone</button>
            <button onClick={() => updateRoadmap((r) => ({ ...r, freezeWindows: [...r.freezeWindows, { id: uuidv4(), label: "Change Freeze", startMonthIndex: 2, endMonthIndex: 4, scopeThemeIds: [] }] }))} className="rounded border p-2">+ Freeze</button>
            <button onClick={() => { const text = prompt('Type RESET to reset current roadmap'); if (text !== 'RESET') return; const reset = demoStore().roadmaps[0]; reset.id = roadmap.id; reset.name = roadmap.name; updateRoadmap(() => reset); }} className="col-span-2 rounded bg-rm-red px-2 py-2 text-white">Reset demo data</button>
          </div>
        </>}
      </aside>

      <section className="relative flex-1 overflow-auto p-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <TimelineDrop>
            <div className="relative min-w-max rounded-2xl border border-white bg-white shadow-glow" style={{ width: TOTAL_MONTHS * MONTH_WIDTH + 260 }}>
              <div className="sticky top-0 z-30 bg-white">
                <div className="sticky top-0 z-40 grid border-b" style={{ gridTemplateColumns: `260px repeat(${TOTAL_MONTHS}, ${MONTH_WIDTH}px)` }}>
                  <div className="border-r p-3 text-xs font-semibold uppercase text-rm-slate">Portfolio</div>
                  {months.map((i) => <div key={i} className="border-r p-2 text-center text-xs font-semibold text-rm-slate">{monthLabel(i)}</div>)}
                </div>
                <div className="grid border-b bg-slate-50" style={{ gridTemplateColumns: `260px repeat(${TOTAL_MONTHS}, ${MONTH_WIDTH}px)` }}>
                  <div className="border-r p-2 text-xs text-rm-slate">Quarter</div>
                  {months.map((i) => <div key={i} className="border-r p-1 text-center text-xs">{quarterLabel(i)}</div>)}
                </div>
                <div className="grid border-b bg-slate-100" style={{ gridTemplateColumns: `260px repeat(${TOTAL_MONTHS}, ${MONTH_WIDTH}px)` }}>
                  <div className="border-r p-2 text-xs text-rm-slate">Financial Year</div>
                  {months.map((i) => <div key={i} className="border-r p-1 text-center text-xs">{fyLabel(i)}</div>)}
                </div>
              </div>

              <div className="relative">
                {roadmap.themes.map((theme) => (
                  <div key={theme.id} className="border-b">
                    <div className="flex items-center gap-2 border-b px-4 py-3" style={{ backgroundColor: `${theme.color}15` }}>
                      {(() => { const Icon = iconMap[theme.icon] ?? iconMap.Archive; return <Icon size={16} color={theme.color} />; })()}
                      <span className="font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                    </div>
                    {theme.swimlanes.map((lane) => <LaneRow key={lane.id} lane={lane} theme={theme} attached={roadmap.attachedMilestones} onEdit={(i) => setEditingInitiative(i)} onResize={(id, side, deltaX) => updateRoadmap((r) => ({ ...r, themes: r.themes.map((t) => ({ ...t, swimlanes: t.swimlanes.map((s) => ({ ...s, initiatives: s.initiatives.map((i) => {
                      if (i.id !== id) return i;
                      const shift = Math.round(deltaX / MONTH_WIDTH);
                      if (side === "left") {
                        const start = clampMonth(i.startMonthIndex + shift);
                        return { ...i, startMonthIndex: Math.min(start, i.endMonthIndex) };
                      }
                      const end = clampMonth(i.endMonthIndex + shift);
                      return { ...i, endMonthIndex: Math.max(i.startMonthIndex, end) };
                    }) })) })) }))} />)}
                  </div>
                ))}

                {roadmap.freezeWindows.map((f) => <FreezeBand key={f.id} freeze={f} roadmap={roadmap} />)}
                <GlobalMilestones milestones={roadmap.globalMilestones} roadmap={roadmap} />
              </div>
            </div>
          </TimelineDrop>
        </DndContext>
      </section>

      {editingInitiative && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
          <div className="w-[440px] rounded-xl bg-white p-5 shadow-soft">
            <h3 className="mb-3 text-lg font-semibold">Edit initiative</h3>
            <input value={editingInitiative.title} onChange={(e) => setEditingInitiative({ ...editingInitiative, title: e.target.value })} className="mb-2 w-full rounded border p-2" />
            <div className="grid grid-cols-2 gap-2"><input type="number" min={0} max={17} value={editingInitiative.startMonthIndex} onChange={(e) => setEditingInitiative({ ...editingInitiative, startMonthIndex: Number(e.target.value) })} className="rounded border p-2" /><input type="number" min={0} max={17} value={editingInitiative.endMonthIndex} onChange={(e) => setEditingInitiative({ ...editingInitiative, endMonthIndex: Number(e.target.value) })} className="rounded border p-2" /></div>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setEditingInitiative(null)} className="rounded border px-3 py-1">Cancel</button><button onClick={() => {
              updateRoadmap((r) => ({ ...r, themes: r.themes.map((t) => ({ ...t, swimlanes: t.swimlanes.map((s) => ({ ...s, initiatives: s.initiatives.map((i) => (i.id === editingInitiative.id ? editingInitiative : i)) })) })) }));
              setEditingInitiative(null);
            }} className="rounded bg-rm-red px-3 py-1 text-white">Save</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

function TimelineDrop({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "timeline-drop" });
  return <div ref={setNodeRef}>{children}</div>;
}

function LaneRow({ lane, theme, attached, onEdit, onResize }: { lane: Swimlane; theme: Theme; attached: { id: string; label: string; offsetMonthsFromStart: number; initiativeId: string }[]; onEdit: (i: Initiative) => void; onResize: (id: string, side: "left" | "right", deltaX: number) => void }) {
  const { setNodeRef } = useDroppable({ id: `lane-drop:${lane.id}` });
  return (
    <div ref={setNodeRef} className="relative grid border-b" style={{ gridTemplateColumns: `260px repeat(${TOTAL_MONTHS}, ${MONTH_WIDTH}px)`, minHeight: laneHeight }}>
      <div className="border-r bg-slate-50/80 p-3">
        <div className="text-sm font-medium">{lane.swimlaneName}</div>
        <div className="text-xs text-rm-slate">{lane.teamName} · {lane.supplierName}</div>
      </div>
      {Array.from({ length: TOTAL_MONTHS }).map((_, i) => <div key={i} className="border-r border-slate-100" />)}
      {lane.initiatives.map((i) => {
        const left = 260 + i.startMonthIndex * MONTH_WIDTH + 4;
        const width = (i.endMonthIndex - i.startMonthIndex + 1) * MONTH_WIDTH - 8;
        return (
          <div key={i.id} className="absolute top-5" style={{ left, width }} onDoubleClick={() => onEdit(i)}>
            <div className="group relative">
              <InitiativeCard initiative={i} color={theme.color} />
              <button onPointerDown={(e) => dragResize(e, (dx) => onResize(i.id, "left", dx))} className="absolute left-0 top-0 h-10 w-1 cursor-ew-resize rounded-l bg-white/30" />
              <button onPointerDown={(e) => dragResize(e, (dx) => onResize(i.id, "right", dx))} className="absolute right-0 top-0 h-10 w-1 cursor-ew-resize rounded-r bg-white/30" />
            </div>
            <div className="mt-1 flex gap-2">
              {attached.filter((m) => m.initiativeId === i.id).map((m) => {
                const milestoneX = m.offsetMonthsFromStart * MONTH_WIDTH;
                return <div key={m.id} className="absolute -top-3" style={{ left: milestoneX }}><div className="h-3 w-3 rounded-full border-2 border-white" style={{ background: theme.color }} /><div className="text-[10px] text-rm-slate">{m.label}</div></div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GlobalMilestones({ milestones, roadmap }: { milestones: { id: string; label: string; monthIndex: number; themeId?: string }[]; roadmap: { themes: Theme[] } }) {
  return (
    <>
      {milestones.map((m) => <GlobalMilestoneNode key={m.id} milestone={m} color={roadmap.themes.find((t) => t.id === m.themeId)?.color ?? "#DA202A"} />)}
    </>
  );
}

function GlobalMilestoneNode({ milestone, color }: { milestone: { id: string; label: string; monthIndex: number }; color: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `gm:${milestone.id}` });
  return <div ref={setNodeRef} {...attributes} {...listeners} className="absolute z-20" style={{ left: 260 + milestone.monthIndex * MONTH_WIDTH + MONTH_WIDTH / 2 - 6 + (transform?.x ?? 0), top: headerHeight + 4 + (transform?.y ?? 0) }}><div className="h-3 w-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} /><div className="-ml-3 text-[10px] font-medium">{milestone.label}</div></div>;
}

function FreezeBand({ freeze, roadmap }: { freeze: { id: string; label: string; startMonthIndex: number; endMonthIndex: number; scopeThemeIds: string[] }; roadmap: { themes: Theme[] } }) {
  const left = 260 + freeze.startMonthIndex * MONTH_WIDTH;
  const width = (freeze.endMonthIndex - freeze.startMonthIndex + 1) * MONTH_WIDTH;
  let top = headerHeight;
  const scopes = freeze.scopeThemeIds.length ? freeze.scopeThemeIds : roadmap.themes.map((t) => t.id);
  return <>
    {roadmap.themes.map((t) => {
      const rows = 1 + t.swimlanes.length;
      const h = rows * laneHeight;
      const render = scopes.includes(t.id);
      const el = render ? <div key={t.id + freeze.id} className="pointer-events-none absolute z-10" style={{ left, top, width, height: h }}><div className="h-full border border-rm-red/20 bg-rm-red/10 p-1 text-xs text-rm-red">{freeze.label}</div></div> : null;
      top += h;
      return el;
    })}
  </>;
}

function dragResize(e: React.PointerEvent<HTMLButtonElement>, onDelta: (dx: number) => void) {
  e.preventDefault();
  const start = e.clientX;
  const move = (ev: PointerEvent) => onDelta(ev.clientX - start);
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}
