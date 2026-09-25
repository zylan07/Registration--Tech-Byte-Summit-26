export const EVENTS = [
  {
    id: "paper",
    apiName: "Paper Presentation",
    title: "Paper Presentation",
    subtitle: "Research & Technical Paper",
    description: "Present and defend your research or technical work.",
    tagline: "Demonstrate rigor, novelty, and depth in cutting-edge computing concepts.",
    icon: "FileText",
    color: "from-rose-500/20 via-rose-500/5 to-transparent",
    borderActive: "border-rose-500",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30"
  },
  {
    id: "poster",
    apiName: "Poster Creation",
    title: "Poster Creation",
    subtitle: "Visual & Concept Design",
    description: "Create and present your technical poster.",
    tagline: "Distill complex technical breakthroughs into captivating visual artifacts.",
    icon: "LayoutTemplate",
    color: "from-amber-500/20 via-amber-500/5 to-transparent",
    borderActive: "border-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30"
  },
  {
    id: "project",
    apiName: "Project Presentation",
    title: "Project Presentation",
    subtitle: "Implementation & Demo",
    description: "Present your project, implementation and innovation.",
    tagline: "Showcase working prototypes, architectural blueprints, and engineering excellence.",
    icon: "Presentation",
    color: "from-blue-500/20 via-blue-500/5 to-transparent",
    borderActive: "border-blue-500",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30"
  },
  {
    id: "hackathon",
    apiName: "Hackathon",
    title: "12-Hour Hackathon",
    subtitle: "12-Hour Build Sprint",
    description: "Build, collaborate and compete in the 12-hour hackathon.",
    tagline: "Rapid prototyping marathon tackling high-impact real-world challenge statements.",
    icon: "Code2",
    color: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    borderActive: "border-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
  }
];

export const getEventById = (id) => EVENTS.find((e) => e.id === id);
export const getEventByApiName = (apiName) => EVENTS.find((e) => e.apiName === apiName);
