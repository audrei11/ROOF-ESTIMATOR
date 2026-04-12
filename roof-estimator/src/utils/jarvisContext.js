import { getAllProjects } from './storage';

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

export async function gatherContext() {
  const contacts    = load(CONTACTS_KEY)    || [];
  const pipeline    = load(PIPELINE_KEY)    || {};
  const activities  = load(ACTIVITIES_KEY)  || [];
  const workflows   = load(WORKFLOWS_KEY)   || [];
  const employees   = load(EMPLOYEES_KEY)   || [];
  const assignments = load(ASSIGNMENTS_KEY) || [];
  const calendarEvents = load(CALENDAR_KEY) || [];

  // Roof measurement projects (mock + saved)
  let projects = [];
  try { projects = getAllProjects().slice(0, 20); } catch { /* skip */ }

  // Pipeline stage summary
  const STAGES = ['new_lead', 'appointment_scheduled', 'proposal_sent', 'proposal_signed', 'work_in_progress', 'completed'];
  const pipelineSummary = Object.fromEntries(STAGES.map(s => [s, 0]));
  contacts.forEach(c => {
    const stage = pipeline[c.id];
    if (stage && pipelineSummary[stage] !== undefined) pipelineSummary[stage]++;
  });

  // Proposals from API
  let proposals = [];
  try {
    const resp = await fetch('/api/proposals');
    if (resp.ok) proposals = await resp.json();
  } catch { /* skip if server not running */ }

  return { contacts, pipeline, activities, workflows, employees, assignments, calendarEvents, projects, proposals, pipelineSummary };
}
