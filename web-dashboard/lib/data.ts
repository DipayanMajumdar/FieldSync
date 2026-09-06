export type ProjectStatus = "On Track" | "At Risk" | "Delayed";

export type ActivityStatus =
  | "On Track"
  | "At Risk"
  | "Delayed"
  | "Completed";

export type Activity = {
  id: string;
  name: string;
  discipline: string;
  startDate: string;
  endDate: string;
  planned: number;
  actual: number;
  status: ActivityStatus;
  owner: string;
  location: string;
  description?: string;
};

export type WBSPhase = {
  id: string;
  name: string;
  progress: number;
  activities: Activity[];
};

export type Project = {
  id: string;
  name: string;
  type: string;
  location: string;
  manager: string;
  progress: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  activities: number;
  delayedActivities: number;
};

/* =========================
   PROJECTS
========================= */

export const projects: Project[] = [
  {
    id: "P-001",
    name: "Oil India - EPC Infrastructure Project",
    type: "EPC Infrastructure",
    location: "Assam Project Site",
    manager: "Project Manager",
    progress: 67,
    status: "At Risk",
    startDate: "Jan 15, 2026",
    endDate: "Dec 20, 2026",
    activities: 48,
    delayedActivities: 12,
  },
  {
    id: "P-002",
    name: "Pipeline Expansion Project",
    type: "Pipeline Construction",
    location: "Guwahati, Assam",
    manager: "Rajiv Sharma",
    progress: 82,
    status: "On Track",
    startDate: "Feb 10, 2026",
    endDate: "Nov 30, 2026",
    activities: 36,
    delayedActivities: 3,
  },
  {
    id: "P-003",
    name: "Industrial Facility Development",
    type: "Industrial Construction",
    location: "Dibrugarh, Assam",
    manager: "Amit Das",
    progress: 94,
    status: "On Track",
    startDate: "Mar 05, 2025",
    endDate: "Sep 25, 2026",
    activities: 42,
    delayedActivities: 1,
  },
  {
    id: "P-004",
    name: "Water Treatment Plant",
    type: "Civil Infrastructure",
    location: "Jorhat, Assam",
    manager: "S. Mukherjee",
    progress: 38,
    status: "Delayed",
    startDate: "Apr 20, 2026",
    endDate: "Mar 15, 2027",
    activities: 29,
    delayedActivities: 8,
  },
];

/* =========================
   WBS DATA
========================= */

export const wbsPhases: WBSPhase[] = [
  {
    id: "WBS-01",
    name: "Site Preparation & Earthwork",
    progress: 86,
    activities: [
      {
        id: "A-101",
        name: "Site Clearing",
        discipline: "Civil",
        startDate: "05 Aug 2026",
        endDate: "12 Aug 2026",
        planned: 100,
        actual: 100,
        status: "On Track",
        owner: "A. Das",
        location: "Site Area A",
        description:
          "Clearing and preparation of the designated construction area.",
      },
      {
        id: "A-102",
        name: "Earthwork & Excavation",
        discipline: "Civil",
        startDate: "10 Aug 2026",
        endDate: "25 Aug 2026",
        planned: 92,
        actual: 86,
        status: "At Risk",
        owner: "R. Sharma",
        location: "Foundation Zone",
        description:
          "Earth excavation and removal of unsuitable soil from the foundation zone.",
      },
      {
        id: "A-103",
        name: "Soil Compaction",
        discipline: "Civil",
        startDate: "20 Aug 2026",
        endDate: "30 Aug 2026",
        planned: 70,
        actual: 68,
        status: "On Track",
        owner: "S. Roy",
        location: "Site Area A",
        description:
          "Mechanical compaction of prepared soil layers.",
      },
    ],
  },

  {
    id: "WBS-02",
    name: "Foundation & Structural Works",
    progress: 64,
    activities: [
      {
        id: "A-201",
        name: "Foundation Excavation",
        discipline: "Civil",
        startDate: "15 Aug 2026",
        endDate: "28 Aug 2026",
        planned: 100,
        actual: 94,
        status: "On Track",
        owner: "A. Das",
        location: "Foundation Zone",
        description:
          "Excavation works for the main structural foundation.",
      },
      {
        id: "A-202",
        name: "Reinforcement & Shuttering",
        discipline: "Civil",
        startDate: "24 Aug 2026",
        endDate: "08 Sep 2026",
        planned: 72,
        actual: 58,
        status: "Delayed",
        owner: "R. Sharma",
        location: "Foundation Zone",
        description:
          "Reinforcement steel fixing and shuttering preparation.",
      },
      {
        id: "A-203",
        name: "Concrete Pouring",
        discipline: "Civil",
        startDate: "01 Sep 2026",
        endDate: "15 Sep 2026",
        planned: 45,
        actual: 39,
        status: "At Risk",
        owner: "S. Roy",
        location: "Structural Zone",
        description:
          "Concrete pouring and associated quality control activities.",
      },
    ],
  },

  {
    id: "WBS-03",
    name: "Pipeline Installation",
    progress: 51,
    activities: [
      {
        id: "A-301",
        name: "Pipe Laying - Area A",
        discipline: "Piping",
        startDate: "18 Aug 2026",
        endDate: "10 Sep 2026",
        planned: 78,
        actual: 70,
        status: "At Risk",
        owner: "M. Khan",
        location: "Pipeline Area A",
        description:
          "Pipeline laying and alignment activities in Area A.",
      },
      {
        id: "A-302",
        name: "Pipe Laying - Area B",
        discipline: "Piping",
        startDate: "20 Aug 2026",
        endDate: "18 Sep 2026",
        planned: 65,
        actual: 47,
        status: "Delayed",
        owner: "M. Khan",
        location: "Pipeline Area B",
        description:
          "Pipeline laying and joint preparation activities in Area B.",
      },
    ],
  },

  {
    id: "WBS-04",
    name: "Electrical & Instrumentation",
    progress: 42,
    activities: [
      {
        id: "A-401",
        name: "Cable Tray Installation",
        discipline: "Electrical",
        startDate: "25 Aug 2026",
        endDate: "20 Sep 2026",
        planned: 60,
        actual: 54,
        status: "On Track",
        owner: "S. Roy",
        location: "Electrical Zone",
        description:
          "Installation of cable trays for electrical distribution.",
      },
      {
        id: "A-402",
        name: "Instrumentation Installation",
        discipline: "Instrumentation",
        startDate: "01 Sep 2026",
        endDate: "25 Sep 2026",
        planned: 38,
        actual: 27,
        status: "Delayed",
        owner: "P. Sen",
        location: "Control Zone",
        description:
          "Installation and initial verification of instrumentation systems.",
      },
    ],
  },
];

/* =========================
   HELPERS
========================= */

export const allActivities: Activity[] = wbsPhases.flatMap(
  (phase) => phase.activities
);

export function getActivityById(id: string) {
  return allActivities.find((activity) => activity.id === id);
}

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}

export function getPhaseById(id: string) {
  return wbsPhases.find((phase) => phase.id === id);
}