import { NPCStatus, PlotStatus, SessionStatus } from "@/generated/prisma/enums";

export const NPC_STATUS_LABELS: Record<NPCStatus, string> = {
  ALIVE: "Vivant",
  DEAD: "Mort",
  MISSING: "Disparu",
  UNKNOWN: "Inconnu",
};

export const PLOT_STATUS_LABELS: Record<PlotStatus, string> = {
  SEEDED: "Amorcée",
  ACTIVE: "Active",
  RESOLVED: "Résolue",
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  PLANNED: "Planifiée",
  PREPPED: "Préparée",
  PLAYED: "Jouée",
};
