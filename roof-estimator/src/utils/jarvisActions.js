import { getAllProjects, saveProject } from './storage';

const CONTACTS_KEY    = 'precision-contacts';
const PIPELINE_KEY    = 'precision-pipeline';
const ACTIVITIES_KEY  = 'precision-activities';
const WORKFLOWS_KEY   = 'precision-workflows';
const EMPLOYEES_KEY   = 'ahjin-employees';
const ASSIGNMENTS_KEY = 'ahjin-assignments';
const CALENDAR_KEY    = 'ahjin-calendar-events';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); }
  catch { return null; }
}
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

/* ══════════════════════════════════════════════════════════════════
   Execute an array of JARVIS actions.
   Async because createProposal calls the backend API.
   ══════════════════════════════════════════════════════════════════ */
export async function executeActions(actions, navigate) {
  if (!actions?.length) return;

  let navigatePath = null;

  for (const action of actions) {
    switch (action.type) {

      /* ─── Navigation ─────────────────────────────────────────── */
      case 'navigate':
        navigatePath = action.path;
        break;

      /* ─── Contacts ───────────────────────────────────────────── */
      case 'createContact': {
        const contacts = load(CONTACTS_KEY) || [];
        contacts.push({ id: Date.now().toString(), ...action.data });
        save(CONTACTS_KEY, contacts);
        if (!navigatePath) navigatePath = '/contacts';
        break;
      }

      case 'updateContact': {
        const contacts = load(CONTACTS_KEY) || [];
        const i = contacts.findIndex(c => c.id === action.contactId);
        if (i !== -1) { contacts[i] = { ...contacts[i], ...action.data }; save(CONTACTS_KEY, contacts); }
        if (!navigatePath) navigatePath = '/contacts';
        break;
      }

      case 'deleteContact': {
        const contacts = load(CONTACTS_KEY) || [];
        save(CONTACTS_KEY, contacts.filter(c => c.id !== action.contactId));
        if (!navigatePath) navigatePath = '/contacts';
        break;
      }

      /* ─── Pipeline (contacts) ────────────────────────────────── */
      case 'updatePipeline': {
        const pipeline = load(PIPELINE_KEY) || {};
        pipeline[action.contactId] = action.stage;
        save(PIPELINE_KEY, pipeline);
        if (!navigatePath) navigatePath = '/pipeline';
        break;
      }

      /* ─── Jobs kanban (project pipeline stage) ───────────────── */
      case 'moveJobStage': {
        const projects = getAllProjects();
        // Match by id, or fall back to address substring match
        const proj = projects.find(p =>
          p.id === action.projectId ||
          (action.address && p.address?.toLowerCase().includes(action.address.toLowerCase()))
        );
        if (proj) {
          saveProject({ ...proj, pipelineStage: action.stage });
        }
        if (!navigatePath) navigatePath = '/jobs';
        break;
      }

      /* ─── Activities ─────────────────────────────────────────── */
      case 'createActivity': {
        const activities = load(ACTIVITIES_KEY) || [];
        activities.unshift({ id: Date.now().toString(), date: new Date().toISOString(), ...action.data });
        save(ACTIVITIES_KEY, activities);
        if (!navigatePath) navigatePath = '/communications';
        break;
      }

      /* ─── Calendar events ────────────────────────────────────── */
      case 'createCalendarEvent': {
        const events = load(CALENDAR_KEY) || [];
        events.push({ id: Date.now(), ...action.data });
        save(CALENDAR_KEY, events);
        if (!navigatePath) navigatePath = '/calendar';
        break;
      }

      /* ─── Proposals (API) ────────────────────────────────────── */
      case 'createProposal': {
        try {
          await fetch('/api/proposals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data),
          });
        } catch (err) {
          console.error('[JARVIS] createProposal failed:', err);
        }
        if (!navigatePath) navigatePath = '/proposals';
        break;
      }

      case 'sendProposal': {
        try {
          await fetch(`/api/proposals/${action.proposalId}/send`, { method: 'POST' });
        } catch (err) {
          console.error('[JARVIS] sendProposal failed:', err);
        }
        if (!navigatePath) navigatePath = '/proposals';
        break;
      }

      /* ─── Employees ──────────────────────────────────────────── */
      case 'updateEmployeeStatus': {
        const employees = load(EMPLOYEES_KEY) || [];
        const i = employees.findIndex(e => e.id === action.employeeId);
        if (i !== -1) { employees[i].status = action.status; save(EMPLOYEES_KEY, employees); }
        if (!navigatePath) navigatePath = '/employee-assign';
        break;
      }

      case 'createAssignment': {
        const assignments = load(ASSIGNMENTS_KEY) || [];
        assignments.push({ id: Date.now().toString(), ...action.data });
        save(ASSIGNMENTS_KEY, assignments);
        if (!navigatePath) navigatePath = '/employee-assign';
        break;
      }

      /* ─── Workflows ──────────────────────────────────────────── */
      case 'toggleWorkflow': {
        const workflows = load(WORKFLOWS_KEY) || [];
        const i = workflows.findIndex(w => w.id === action.workflowId);
        if (i !== -1) { workflows[i].active = action.active; save(WORKFLOWS_KEY, workflows); }
        if (!navigatePath) navigatePath = '/workflow';
        break;
      }

      default:
        console.warn('[JARVIS] Unknown action type:', action.type);
    }
  }

  if (navigatePath) setTimeout(() => navigate(navigatePath), 900);
}
