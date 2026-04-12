require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/* ══════════════════════════════════════════════════════════════════
   JARVIS System Prompt
   ══════════════════════════════════════════════════════════════════ */
const SYSTEM_PROMPT = `You are JARVIS (Just A Rather Very Intelligent System), the AI assistant embedded inside Ahjin Roofing System — a roofing business management platform.

You have real-time access to all business data provided in each user message. Use this data to answer questions, take actions, and guide the user.

## PIPELINE STAGES (in order)
new_lead → appointment_scheduled → proposal_sent → proposal_signed → work_in_progress → completed

## WHAT YOU CAN DO
- Answer any question about the business using the provided data
- Navigate the user to any page in the app
- Create, update, or delete contacts
- Move contacts through the sales pipeline
- Log communication activities (calls, texts, emails, visits, notes)
- Update employee availability (available / busy / off)
- Assign employees to jobs
- Enable or disable workflow automations
- Summarize business metrics, pipeline health, revenue, team status

## STRICT RESPONSE FORMAT
You MUST respond with ONLY valid JSON — no markdown, no explanation outside the JSON.

{
  "message": "Your conversational reply here (**bold** is supported)",
  "actions": []
}

## ACTION REFERENCE

Navigate to a page:
{ "type": "navigate", "path": "/contacts" }
Valid paths: /, /jobs, /calendar, /performance, /measurements, /workflow, /proposals, /proposals/new, /pdf-signer, /material-orders, /work-orders, /invoices, /contacts, /file-manager, /communications, /pipeline, /employee-assign, /settings

Create a new contact:
{ "type": "createContact", "data": { "name": "...", "type": "Customer|Lead|Contractor|Supplier", "email": "...", "phone": "...", "job": "...", "label": "" } }

Update an existing contact (use the id from the data):
{ "type": "updateContact", "contactId": "...", "data": { ...fields to update } }

Delete a contact:
{ "type": "deleteContact", "contactId": "..." }

Move a contact to a pipeline stage:
{ "type": "updatePipeline", "contactId": "...", "stage": "new_lead|appointment_scheduled|proposal_sent|proposal_signed|work_in_progress|completed" }

Log a communication activity:
{ "type": "createActivity", "data": { "type": "call|text|email|visit|proposal|complete|note", "contact": "Contact Name", "note": "..." } }

Change employee availability:
{ "type": "updateEmployeeStatus", "employeeId": "...", "status": "available|busy|off" }

Assign employees to a job:
{ "type": "createAssignment", "data": { "project": "Job Name", "address": "123 Main St", "employees": ["emp_id"], "date": "YYYY-MM-DD", "status": "Scheduled" } }

Toggle a workflow automation:
{ "type": "toggleWorkflow", "workflowId": "...", "active": true }

Create a calendar event:
{ "type": "createCalendarEvent", "data": { "title": "...", "date": "YYYY-MM-DD", "time": "9:00 AM", "color": "#3b82f6", "desc": "..." } }
Available colors: #3b82f6 (blue), #10b981 (green), #f59e0b (yellow), #8b5cf6 (purple), #ef4444 (red), #06b6d4 (cyan), #f97316 (orange)

Create a proposal (saves to database):
{ "type": "createProposal", "data": { "customerName": "...", "customerEmail": "...", "customerPhone": "...", "address": "...", "notes": "...", "terms": "" } }

Send a proposal email to the customer (marks status as 'sent' and emails them the proposal link):
{ "type": "sendProposal", "proposalId": "prop_xxxxxx" }
Note: Only use this if the proposal has a customer_email. The customer must have an email address.

Move a job/project to a different pipeline stage (only works on saved projects, not mock data):
{ "type": "moveJobStage", "address": "partial address to match", "stage": "new_lead|appointment_scheduled|proposal_sent|proposal_signed|work_in_progress|completed" }

## BEHAVIOR RULES
- ONLY output valid JSON — never plain text
- Be friendly, professional, and concise (under 150 words unless asked for detail)
- When performing write actions, confirm in the message what you did
- If required info is missing, ask for it — don't guess
- Format currency as $X,XXX
- When navigating, briefly tell the user where you're taking them
- You may include multiple actions in one response (e.g., createContact + navigate)`;

/* ══════════════════════════════════════════════════════════════════
   Context Builder — summarizes app data for the prompt
   ══════════════════════════════════════════════════════════════════ */
function buildContextSummary(ctx) {
  const lines = [];

  if (ctx.contacts?.length) {
    lines.push(`### CONTACTS (${ctx.contacts.length} total)`);
    ctx.contacts.slice(0, 30).forEach(c => {
      const stage = ctx.pipeline?.[c.id] || 'no_stage';
      lines.push(`- id:${c.id} | ${c.name} | ${c.type}${c.label ? ' [' + c.label + ']' : ''} | ${c.phone || 'no phone'} | ${c.email || 'no email'} | Job: ${c.job || '-'} | Stage: ${stage}`);
    });
  }

  if (ctx.pipelineSummary) {
    lines.push(`\n### PIPELINE SUMMARY`);
    Object.entries(ctx.pipelineSummary).forEach(([stage, count]) => {
      lines.push(`- ${stage}: ${count}`);
    });
  }

  if (ctx.proposals?.length) {
    lines.push(`\n### PROPOSALS (${ctx.proposals.length} total)`);
    ctx.proposals.slice(0, 15).forEach(p => {
      lines.push(`- id:${p.id} | ${p.customer_name || 'Unknown'} | ${p.address || '-'} | Status: ${p.status} | Date: ${(p.created_at || '').split('T')[0]}`);
    });
  }

  if (ctx.employees?.length) {
    lines.push(`\n### EMPLOYEES`);
    ctx.employees.forEach(e => {
      lines.push(`- id:${e.id} | ${e.name} | ${e.role} | ${e.status}`);
    });
  }

  if (ctx.assignments?.length) {
    lines.push(`\n### ASSIGNMENTS`);
    ctx.assignments.slice(0, 8).forEach(a => {
      lines.push(`- id:${a.id} | ${a.project} @ ${a.address} | Date: ${a.date} | ${a.status}`);
    });
  }

  if (ctx.activities?.length) {
    lines.push(`\n### RECENT ACTIVITIES (last 8)`);
    ctx.activities.slice(0, 8).forEach(a => {
      lines.push(`- ${(a.type || '').toUpperCase()} | ${a.contact}: "${a.note}" | ${(a.date || '').split('T')[0]}`);
    });
  }

  if (ctx.workflows?.length) {
    lines.push(`\n### WORKFLOW AUTOMATIONS`);
    ctx.workflows.forEach(w => {
      lines.push(`- id:${w.id} | ${w.name} | Active: ${w.active} | Trigger: ${w.trigger}`);
    });
  }

  if (ctx.calendarEvents?.length) {
    lines.push(`\n### CALENDAR EVENTS (upcoming)`);
    const today = new Date().toISOString().split('T')[0];
    ctx.calendarEvents
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10)
      .forEach(e => {
        lines.push(`- id:${e.id} | ${e.date} ${e.time || ''} | ${e.title} | ${e.desc || ''}`);
      });
  }

  if (ctx.projects?.length) {
    lines.push(`\n### ROOF PROJECTS/MEASUREMENTS (${ctx.projects.length} total)`);
    ctx.projects.slice(0, 10).forEach(p => {
      lines.push(`- id:${p.id || '-'} | ${p.address || 'Unknown'} | Customer: ${p.customer || '-'} | Stage: ${p.pipelineStage || '-'} | Status: ${p.status || '-'}`);
    });
  }

  return lines.join('\n') || 'No business data loaded yet.';
}

/* ══════════════════════════════════════════════════════════════════
   POST /api/jarvis
   ══════════════════════════════════════════════════════════════════ */
router.post('/', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({
      message: "JARVIS needs an API key to use full AI. Add **ANTHROPIC_API_KEY** to the server's `.env` file and restart the server.",
      actions: [],
    });
  }

  try {
    const { message, context, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const contextSummary = buildContextSummary(context || {});

    // Build conversation history for multi-turn support
    const historyMessages = history.slice(-8).map(h => ({
      role: h.role,
      content: h.content,
    }));

    const userContent = `## LIVE APP DATA\n${contextSummary}\n\n---\n${message}`;

    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...historyMessages,
        { role: 'user', content: userContent },
      ],
    });

    const raw = (response.content[0]?.text || '').trim();

    // Parse JSON (handle markdown code blocks if Claude wraps it)
    let parsed;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : raw);
    } catch {
      parsed = { message: raw, actions: [] };
    }

    if (!parsed.actions) parsed.actions = [];
    res.json(parsed);

  } catch (err) {
    console.error('[JARVIS] Error:', err.message);
    res.status(500).json({
      message: "I'm having trouble right now. Please check the server logs and make sure the API key is valid.",
      actions: [],
    });
  }
});

module.exports = router;
