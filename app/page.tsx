'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronLeft, GripVertical, Plus } from 'lucide-react';
import { clampMonth, getFyLabel, getRmgQuarter, MONTH_COUNT, MONTH_WIDTH, months } from '@/lib/date';
import { iconMap, makeSeedStore, STORAGE_KEY } from '@/lib/data';
import { Initiative, Roadmap, Store, Theme } from '@/lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);

type ActiveDrag = { type: string; id: string; title?: string } | null;

export default function Home() {
  const [store, setStore] = useState<Store | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);
  const [editing, setEditing] = useState<Initiative | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setStore(raw ? JSON.parse(raw) : makeSeedStore());
  }, []);

  useEffect(() => {
    if (store) localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  if (!store) return null;

  const roadmap = store.roadmaps.find((r) => r.id === store.selectedRoadmapId) ?? store.roadmaps[0];

  const mutateRoadmap = (mutator: (r: Roadmap) => Roadmap) => {
    setStore((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        roadmaps: prev.roadmaps.map((r) => (r.id === roadmap.id ? mutator(structuredClone(r)) : r))
      };
    });
  };

  const findInit = (id: string) => {
    for (const t of roadmap.themes) for (const s of t.swimlanes) for (const i of s.initiatives) if (i.id === id) return { t, s, i };
    return null;
  };

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith('init-')) setActiveDrag({ type: 'initiative', id: id.slice(5), title: findInit(id.slice(5))?.i.title });
    if (id.startsWith('theme-')) setActiveDrag({ type: 'theme', id: id.slice(6) });
    if (id.startsWith('swim-')) setActiveDrag({ type: 'swimlane', id: id.slice(5) });
    if (id.startsWith('gm-')) setActiveDrag({ type: 'global', id: id.slice(3) });
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over) return;

    if (active.startsWith('theme-') && over.startsWith('theme-') && active !== over) {
      const a = roadmap.themes.findIndex((t) => t.id === active.slice(6));
      const b = roadmap.themes.findIndex((t) => t.id === over.slice(6));
      mutateRoadmap((r) => ({ ...r, themes: arrayMove(r.themes, a, b) }));
      return;
    }

    if (active.startsWith('swim-') && over.startsWith('swim-')) {
      const sid = active.slice(5);
      const oid = over.slice(5);
      mutateRoadmap((r) => {
        const all = r.themes.flatMap((t) => t.swimlanes.map((s) => ({ t, s })));
        const src = all.find((x) => x.s.id === sid);
        const dst = all.find((x) => x.s.id === oid);
        if (!src || !dst) return r;
        src.t.swimlanes = src.t.swimlanes.filter((s) => s.id !== sid);
        const idx = dst.t.swimlanes.findIndex((s) => s.id === oid);
        dst.t.swimlanes.splice(idx + 1, 0, src.s);
        src.s.initiatives.forEach((i) => (i.themeId = dst.t.id));
        return r;
      });
      return;
    }

    if (active.startsWith('init-')) {
      const iid = active.slice(5);
      const monthShift = Math.round((e.delta.x || 0) / MONTH_WIDTH);
      mutateRoadmap((r) => {
        let current: Initiative | undefined;
        let sourceLane;
        for (const t of r.themes) for (const s of t.swimlanes) {
          const idx = s.initiatives.findIndex((x) => x.id === iid);
          if (idx >= 0) {
            current = s.initiatives[idx];
            sourceLane = s;
            s.initiatives.splice(idx, 1);
          }
        }
        if (!current || !sourceLane) return r;
        const dur = current.endMonthIndex - current.startMonthIndex;
        const ns = clampMonth(current.startMonthIndex + monthShift);
        current.startMonthIndex = ns;
        current.endMonthIndex = clampMonth(ns + dur);

        const laneId = over.startsWith('lane-') ? over.slice(5) : current.swimlaneId;
        const target = r.themes.flatMap((t) => t.swimlanes.map((s) => ({ t, s }))).find((x) => x.s.id === laneId);
        if (target) {
          current.swimlaneId = target.s.id;
          current.themeId = target.t.id;
          target.s.initiatives.push(current);
        } else {
          sourceLane.initiatives.push(current);
        }
        return r;
      });
      return;
    }

    if (active.startsWith('gm-')) {
      const gid = active.slice(3);
      const monthShift = Math.round((e.delta.x || 0) / MONTH_WIDTH);
      mutateRoadmap((r) => {
        const g = r.globalMilestones.find((x) => x.id === gid);
        if (g) g.monthIndex = clampMonth(g.monthIndex + monthShift);
        return r;
      });
    }
  };

  const addTheme = () => mutateRoadmap((r) => ({ ...r, themes: [...r.themes, { id: uid(), name: 'New Theme', color: '#DA202A', icon: 'Activity', swimlanes: [] }] }));
  const addLane = () => mutateRoadmap((r) => {
    if (!r.themes[0]) return r;
    r.themes[0].swimlanes.push({ id: uid(), swimlaneName: 'New Swimlane', teamName: 'Team', supplierName: 'Supplier', initiatives: [] });
    return r;
  });
  const addInit = () => mutateRoadmap((r) => {
    const t = r.themes[0]; const s = t?.swimlanes[0]; if (!t || !s) return r;
    s.initiatives.push({ id: uid(), title: 'New Initiative', startMonthIndex: 0, endMonthIndex: 2, themeId: t.id, swimlaneId: s.id });
    return r;
  });
  const addGlobalMilestone = () => mutateRoadmap((r) => { r.globalMilestones.push({ id: uid(), label: 'New Gate', monthIndex: 0 }); return r; });
  const addFreeze = () => mutateRoadmap((r) => { r.freezeWindows.push({ id: uid(), label: 'New Freeze', startMonthIndex: 8, endMonthIndex: 9, scopeThemeIds: [] }); return r; });

  const createRoadmap = () => {
    const name = prompt('Roadmap name');
    if (!name) return;
    const fresh = makeSeedStore().roadmaps[0];
    fresh.id = uid();
    fresh.name = name;
    setStore((p) => p ? { ...p, roadmaps: [...p.roadmaps, fresh], selectedRoadmapId: fresh.id } : p);
  };

  const renameRoadmap = () => {
    const name = prompt('Rename roadmap', roadmap.name);
    if (!name) return;
    mutateRoadmap((r) => ({ ...r, name }));
  };

  const deleteRoadmap = () => {
    if (!confirm(`Delete ${roadmap.name}?`)) return;
    setStore((p) => {
      if (!p || p.roadmaps.length === 1) return p;
      const roadmaps = p.roadmaps.filter((r) => r.id !== roadmap.id);
      return { roadmaps, selectedRoadmapId: roadmaps[0].id };
    });
  };

  const resetRoadmap = () => {
    const ack = prompt('Type RESET to restore demo data for current roadmap only');
    if (ack !== 'RESET') return;
    const seeded = makeSeedStore().roadmaps[0];
    mutateRoadmap((r) => ({ ...seeded, id: r.id, name: r.name }));
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <main className="h-screen w-screen flex overflow-hidden">
        <aside className={`${sidebarOpen ? 'w-80' : 'w-14'} border-r border-slate-200 bg-white/90 backdrop-blur transition-all`}>
          <button className="m-3 rounded-lg border p-2" onClick={() => setSidebarOpen((s) => !s)}><ChevronLeft className={`${sidebarOpen ? '' : 'rotate-180'} transition-transform`} size={16} /></button>
          {sidebarOpen && <div className="px-4 pb-5 space-y-3 text-sm">
            <h1 className="text-lg font-semibold">Technology Roadmap</h1>
            <select value={roadmap.id} onChange={(e) => setStore((p) => p ? { ...p, selectedRoadmapId: e.target.value } : p)} className="w-full rounded-lg border p-2">
              {store.roadmaps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={createRoadmap} className="rounded bg-rm-charcoal text-white p-2">Create</button>
              <button onClick={renameRoadmap} className="rounded border p-2">Rename</button>
              <button onClick={deleteRoadmap} className="rounded border border-red-300 text-red-600 p-2">Delete</button>
              <button onClick={resetRoadmap} className="rounded border border-amber-400 text-amber-700 p-2">Reset demo</button>
            </div>
            <div className="border-t pt-3 space-y-2">
              {(
  [
    { label: "Theme", onClick: addTheme },
    { label: "Swimlane", onClick: addLane },
    { label: "Initiative", onClick: addInit },
    { label: "Milestone", onClick: addGlobalMilestone },
    { label: "Freeze", onClick: addFreeze },
  ] as const
).map(({ label, onClick }) => (
  <button
    key={label}
    onClick={onClick}
    className="w-full rounded-lg border p-2 flex items-center gap-2"
  >
    <Plus size={14} /> Add {label}
  </button>
))}
            </div>
          </div>}
        </aside>

        <section className="flex-1 overflow-auto bg-gradient-to-b from-white to-rm-mist/50">
          <div className="min-w-max" style={{ width: MONTH_COUNT * MONTH_WIDTH + 420 }}>
            <Header />
            <div className="relative px-4 pb-10">
              {roadmap.freezeWindows.map((f) => <Freeze key={f.id} freeze={f} roadmap={roadmap} />)}
              <div className="sticky top-[108px] z-20 h-12 bg-white/85 backdrop-blur border-b flex items-center">
                {roadmap.globalMilestones.map((m) => <GlobalMilestoneDot key={m.id} m={m} themeColor={m.themeId ? roadmap.themes.find((t) => t.id === m.themeId)?.color : '#1F2430'} />)}
              </div>
              <SortableContext items={roadmap.themes.map((t) => `theme-${t.id}`)} strategy={verticalListSortingStrategy}>
                {roadmap.themes.map((theme) => <ThemeBlock key={theme.id} theme={theme} roadmap={roadmap} setEditing={setEditing} mutateRoadmap={mutateRoadmap} />)}
              </SortableContext>
            </div>
          </div>
        </section>
      </main>

      <DragOverlay>{activeDrag ? <div className="rounded-lg bg-rm-charcoal text-white px-3 py-2 text-sm shadow-soft">{activeDrag.title ?? activeDrag.type}</div> : null}</DragOverlay>
      {editing && <EditModal initiative={editing} onClose={() => setEditing(null)} onSave={(s, e, title) => {
        mutateRoadmap((r) => {
          for (const t of r.themes) for (const l of t.swimlanes) {
            const i = l.initiatives.find((x) => x.id === editing.id);
            if (i) {
              i.startMonthIndex = clampMonth(Math.min(s, e));
              i.endMonthIndex = clampMonth(Math.max(s, e));
              i.title = title;
            }
          }
          return r;
        });
        setEditing(null);
      }} />}
    </DndContext>
  );
}

function Header() {
  const spans = useMemo(() => {
    const build = (fn: (i: number) => string) => {
      const arr: { label: string; start: number; end: number }[] = [];
      months.forEach((_, idx) => {
        const label = fn(idx);
        const prev = arr[arr.length - 1];
        if (prev?.label === label) prev.end = idx;
        else arr.push({ label, start: idx, end: idx });
      });
      return arr;
    };
    return { fy: build(getFyLabel), q: build((i) => `${getFyLabel(i)} ${getRmgQuarter(i)}`) };
  }, []);

  return <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
    {[spans.fy, spans.q].map((line, idx) => <div key={idx} className="flex h-9 border-b">
      <div className="w-[360px] sticky left-0 bg-white z-10 border-r px-4 flex items-center text-xs uppercase tracking-wide text-slate-500">{idx === 0 ? 'Financial year' : 'Quarter (RMG)'}</div>
      {line.map((s) => <div key={s.label + s.start} className="border-r flex items-center justify-center text-xs font-medium" style={{ width: (s.end - s.start + 1) * MONTH_WIDTH }}>{s.label}</div>)}
    </div>)}
    <div className="flex h-10">
      <div className="w-[360px] sticky left-0 bg-white z-10 border-r px-4 flex items-center text-xs uppercase tracking-wide text-slate-500">Month</div>
      {months.map((m, i) => <div key={i} className="border-r flex items-center justify-center text-sm" style={{ width: MONTH_WIDTH }}>{m.label}</div>)}
    </div>
  </div>;
}

function ThemeBlock({ theme, roadmap, mutateRoadmap, setEditing }: { theme: Theme; roadmap: Roadmap; mutateRoadmap: (m: (r: Roadmap) => Roadmap) => void; setEditing: (i: Initiative) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `theme-${theme.id}` });
  const Icon = (iconMap as Record<string, any>)[theme.icon] || iconMap.Activity;

  return <section ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="mt-4 rounded-2xl border bg-white shadow-soft overflow-hidden">
    <div className="h-14 border-b flex items-center px-4 gap-3" style={{ borderLeft: `5px solid ${theme.color}` }}>
      <button {...attributes} {...listeners}><GripVertical size={14} /></button>
      <Icon size={16} style={{ color: theme.color }} />
      <input value={theme.name} onChange={(e) => mutateRoadmap((r) => { const t = r.themes.find((x) => x.id === theme.id); if (t) t.name = e.target.value; return r; })} className="font-semibold bg-transparent outline-none" />
      <input type="color" value={theme.color} onChange={(e) => mutateRoadmap((r) => { const t = r.themes.find((x) => x.id === theme.id); if (t) t.color = e.target.value; return r; })} className="ml-auto" />
      <select value={theme.icon} onChange={(e) => mutateRoadmap((r) => { const t = r.themes.find((x) => x.id === theme.id); if (t) t.icon = e.target.value; return r; })} className="rounded border p-1 text-xs">
        {Object.keys(iconMap).map((k) => <option key={k}>{k}</option>)}
      </select>
    </div>
    <SortableContext items={theme.swimlanes.map((s) => `swim-${s.id}`)} strategy={verticalListSortingStrategy}>
      {theme.swimlanes.map((lane) => <SwimlaneRow key={lane.id} lane={lane} theme={theme} roadmap={roadmap} mutateRoadmap={mutateRoadmap} setEditing={setEditing} />)}
    </SortableContext>
  </section>;
}

function SwimlaneRow({ lane, theme, roadmap, mutateRoadmap, setEditing }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `swim-${lane.id}` });
  const { setNodeRef: dropRef } = useDroppable({ id: `lane-${lane.id}` });

  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="border-b last:border-b-0">
    <div ref={dropRef} className="flex min-h-[84px]">
      <div className="w-[360px] sticky left-0 bg-white z-10 border-r p-3 text-xs flex gap-2 items-start">
        <button {...attributes} {...listeners}><GripVertical size={14} /></button>
        <div>
          <p className="font-semibold">{lane.swimlaneName}</p>
          <p className="text-slate-500">{lane.teamName} · {lane.supplierName}</p>
        </div>
      </div>
      <div className="relative" style={{ width: MONTH_WIDTH * MONTH_COUNT }}>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MONTH_COUNT}, ${MONTH_WIDTH}px)` }}>{months.map((_, i) => <div key={i} className="border-r border-slate-100" />)}</div>
        {lane.initiatives.map((initiative: Initiative) => <InitiativeBar key={initiative.id} initiative={initiative} theme={theme} roadmap={roadmap} mutateRoadmap={mutateRoadmap} setEditing={setEditing} />)}
      </div>
    </div>
  </div>;
}

function InitiativeBar({ initiative, theme, roadmap, mutateRoadmap, setEditing }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `init-${initiative.id}` });
  const left = initiative.startMonthIndex * MONTH_WIDTH;
  const width = (initiative.endMonthIndex - initiative.startMonthIndex + 1) * MONTH_WIDTH - 8;
  const attached = roadmap.attachedMilestones.filter((m: any) => m.initiativeId === initiative.id);

  const resize = (edge: 'left' | 'right', ev: any) => {
    ev.stopPropagation();
    const startX = ev.clientX;
    const originS = initiative.startMonthIndex;
    const originE = initiative.endMonthIndex;
    const onMove = (me: MouseEvent) => {
      const delta = Math.round((me.clientX - startX) / MONTH_WIDTH);
      mutateRoadmap((r) => {
        for (const t of r.themes) for (const s of t.swimlanes) {
          const i = s.initiatives.find((x) => x.id === initiative.id);
          if (i) {
            if (edge === 'left') i.startMonthIndex = clampMonth(Math.min(originE, originS + delta));
            else i.endMonthIndex = clampMonth(Math.max(originS, originE + delta));
          }
        }
        return r;
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return <div ref={setNodeRef} {...attributes} {...listeners} onDoubleClick={() => setEditing(initiative)} style={{ transform: CSS.Translate.toString(transform), left, width, background: theme.color }} className="absolute top-5 h-10 rounded-lg px-3 text-white text-sm font-medium flex items-center cursor-grab shadow-soft">
    <button onMouseDown={(e) => resize('left', e)} className="absolute -left-1 top-0 h-full w-2 rounded bg-white/70" />
    <span className="truncate">{initiative.title}</span>
    <button onMouseDown={(e) => resize('right', e)} className="absolute -right-1 top-0 h-full w-2 rounded bg-white/70" />
    {attached.map((m: any) => <div key={m.id} className="absolute -top-3" style={{ left: m.offsetMonthsFromStart * MONTH_WIDTH + 8 }}>
      <div className="h-3 w-3 rounded-full border-2 border-white" style={{ background: theme.color }} />
      <div className="text-[10px] text-slate-700 mt-0.5 whitespace-nowrap">{m.label}</div>
    </div>)}
  </div>;
}

function GlobalMilestoneDot({ m, themeColor }: any) {
  const { setNodeRef, attributes, listeners, transform } = useDraggable({ id: `gm-${m.id}` });
  return <div ref={setNodeRef} {...attributes} {...listeners} style={{ left: m.monthIndex * MONTH_WIDTH + 356, transform: CSS.Translate.toString(transform) }} className="absolute top-4 cursor-grab">
    <div className="h-4 w-4 rounded-full" style={{ background: themeColor || '#1F2430' }} />
    <div className="text-[11px] mt-1 whitespace-nowrap">{m.label}</div>
  </div>;
}

function Freeze({ freeze, roadmap }: any) {
  const top = 160;
  const hPerTheme = 140;
  if (!freeze.scopeThemeIds.length) {
    return <div className="absolute z-[1] rounded-lg border border-amber-300/50 bg-amber-100/35 pointer-events-none" style={{ left: freeze.startMonthIndex * MONTH_WIDTH + 360, width: (freeze.endMonthIndex - freeze.startMonthIndex + 1) * MONTH_WIDTH, top, height: roadmap.themes.length * hPerTheme }}><div className="text-[10px] p-1 text-amber-800">{freeze.label}</div></div>;
  }
  return <>
    {roadmap.themes.map((t: any, idx: number) => freeze.scopeThemeIds.includes(t.id) ? <div key={t.id} className="absolute z-[1] rounded-lg border border-amber-300/50 bg-amber-100/35 pointer-events-none" style={{ left: freeze.startMonthIndex * MONTH_WIDTH + 360, width: (freeze.endMonthIndex - freeze.startMonthIndex + 1) * MONTH_WIDTH, top: top + idx * hPerTheme, height: hPerTheme - 8 }}><div className="text-[10px] p-1 text-amber-800">{freeze.label}</div></div> : null)}
  </>;
}

function EditModal({ initiative, onClose, onSave }: { initiative: Initiative; onClose: () => void; onSave: (s: number, e: number, t: string) => void }) {
  const [title, setTitle] = useState(initiative.title);
  const [start, setStart] = useState(initiative.startMonthIndex);
  const [end, setEnd] = useState(initiative.endMonthIndex);
  return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-5 w-[420px] space-y-3">
      <h2 className="font-semibold">Edit initiative</h2>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border p-2" />
      <div className="grid grid-cols-2 gap-2">
        <select value={start} onChange={(e) => setStart(Number(e.target.value))} className="rounded border p-2">{months.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
        <select value={end} onChange={(e) => setEnd(Number(e.target.value))} className="rounded border p-2">{months.map((m, i) => <option key={i} value={i}>{m.label}</option>)}</select>
      </div>
      <div className="flex justify-end gap-2"><button className="px-3 py-2" onClick={onClose}>Cancel</button><button className="rounded bg-rm-red text-white px-3 py-2" onClick={() => onSave(start, end, title)}>Save</button></div>
    </div>
  </div>;
}
