// Fine-grained trip progress for the driver:
//
//   Driver Assigned -> On the Way -> Arrived at Pickup -> Ride Started -> Completed
//
// The backend Trip only knows scheduled / ongoing / completed / cancelled, so
// the middle stages can't be stored server-side yet. The rules are:
//
//   * The backend status is the source of truth. `syncProgress` reconciles the
//     local copy with it every time a trip loads, so a second device, a cleared
//     browser or a stale tab can never show something the backend contradicts.
//   * Stages that map to a backend status (`BACKEND_STATUS_FOR_STAGE`) are only
//     recorded locally AFTER the API call succeeds.
//   * The intermediate stages (arrived / ride started) are remembered locally and
//     broadcast over Socket.IO. Persisting them for other devices needs a backend
//     field (e.g. trip.progress_stage).
import { getSocket, DRIVER_STATUS_EVENT } from "./socket";

export const STAGES = ["assigned", "on_the_way", "arrived", "trip_started", "completed"];

export const STAGE_LABELS = {
  assigned: "Driver Assigned",
  on_the_way: "On the Way",
  arrived: "Arrived at Pickup",
  trip_started: "Ride Started",
  completed: "Completed",
};

// Every button label is unique so the driver always knows which step is next.
export const NEXT_ACTION_LABEL = {
  assigned: "Head to Pickup", // -> on_the_way (backend: ongoing)
  on_the_way: "I've Arrived", // -> arrived
  arrived: "Start Ride", // -> trip_started
  trip_started: "Complete Trip", // -> completed (backend: completed)
};

// Stages that must also be written to the backend when entered.
export const BACKEND_STATUS_FOR_STAGE = {
  on_the_way: "ongoing",
  completed: "completed",
};

// While the trip is under way (backend "ongoing") the driver's position is shared.
export const IN_PROGRESS_STAGES = ["on_the_way", "arrived", "trip_started"];

const KEY = "st_trip_progress";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage full / unavailable: progress simply won't survive a reload
  }
}

function freshEntry() {
  return { stage: "assigned", updated_at: new Date().toISOString(), history: [] };
}

export function getProgress(tripId) {
  return readAll()[tripId] || freshEntry();
}

// Reconcile local progress with the trip as the backend reports it.
export function syncProgress(tripId, trip) {
  const all = readAll();
  const local = all[tripId] || freshEntry();
  let stage = local.stage;

  switch (trip?.status) {
    case "completed":
      stage = "completed";
      break;
    case "cancelled":
      stage = "cancelled";
      break;
    case "scheduled":
      // Backend hasn't started this trip, so any local progress is stale.
      stage = "assigned";
      break;
    case "ongoing":
      if (!IN_PROGRESS_STAGES.includes(stage)) stage = "on_the_way";
      break;
    default:
      break;
  }

  if (stage === local.stage && !(stage === "cancelled" && trip?.cancel_reason && !local.cancel_reason)) {
    return local;
  }

  const updated = {
    ...local,
    stage,
    updated_at: new Date().toISOString(),
    history: [...(local.history || []), { stage, updated_at: new Date().toISOString(), source: "backend" }],
  };
  if (stage === "cancelled") updated.cancel_reason = trip?.cancel_reason || local.cancel_reason || "";
  all[tripId] = updated;
  writeAll(all);
  return updated;
}

export function advanceStage(tripId) {
  const all = readAll();
  const current = all[tripId] || freshEntry();
  const idx = STAGES.indexOf(current.stage);
  const nextStage = STAGES[Math.min(idx + 1, STAGES.length - 1)];
  const entry = { stage: nextStage, updated_at: new Date().toISOString() };
  const updated = { ...current, stage: nextStage, updated_at: entry.updated_at, history: [...(current.history || []), entry] };
  all[tripId] = updated;
  writeAll(all);

  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit(DRIVER_STATUS_EVENT, { trip_id: tripId, stage: nextStage });

  return updated;
}

export function cancelTrip(tripId, reason) {
  const all = readAll();
  const current = all[tripId] || { history: [] };
  const updated = {
    ...current,
    stage: "cancelled",
    cancel_reason: reason,
    updated_at: new Date().toISOString(),
    history: [...(current.history || []), { stage: "cancelled", reason, updated_at: new Date().toISOString() }],
  };
  all[tripId] = updated;
  writeAll(all);
  return updated;
}
