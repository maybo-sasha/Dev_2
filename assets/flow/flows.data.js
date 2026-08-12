/* ============================================================
   The four flows behind AI Decisioning Studio.

   These are distilled, not traced. The working diagrams run to
   thirty-odd nodes each because they were built to be argued over
   in review; a page has to carry the spine and the findings and
   drop the rest. What is kept in every case: the path a marketer
   actually walks, and every point where the path runs out of
   screen.

   Mounts anything carrying data-flow="<id>".
   ============================================================ */

import { createFlow } from './flow.js';

/* ── A · Activation ──────────────────────────────────────────
   How an agent gets switched on. Four agents share one hub and
   almost none of them share a way in. */
const activation = {
  title: 'Activation: getting an agent switched on',
  note: 'One hub, four agents, and four different answers to the same question. Only one of them has a way in that was actually designed.',
  nodes: [
    { id: 'camp', x: 0, y: 1.5, kind: 'start', tag: 'Entry', label: 'A live campaign', sub: 'Already built and running' },
    { id: 'hub', x: 1, y: 1.5, tag: 'Hub', label: 'Campaign Optimization', sub: 'One card per agent' },

    { id: 'journey', x: 2, y: 0, label: 'AI Journey Decisioning' },
    { id: 'offer', x: 2, y: 1, label: 'AI Offer Decisioning' },
    { id: 'sto', x: 2, y: 2, label: 'Send Time Optimization' },
    { id: 'content', x: 2, y: 3, label: 'AI Content Decisioning' },

    { id: 'g-journey', x: 3, y: 0, kind: 'gap', tag: 'No screen', label: 'Setup was never designed' },
    { id: 'g-offer', x: 3, y: 1, kind: 'gap', tag: 'No screen', label: 'Setup was never designed' },
    { id: 'g-sto', x: 3, y: 2, kind: 'gap', tag: 'Not wired', label: 'Setup lives elsewhere', sub: 'On its own page, not connected to this hub' },
    { id: 'wizard', x: 3, y: 3, tag: 'Designed', label: 'Setup wizard', sub: 'Four questions and a review' },

    { id: 'active', x: 4, y: 3, kind: 'done', tag: 'Done', label: 'Card flips to Active' },
    { id: 'score', x: 5, y: 2, label: 'Optimization Score climbs', sub: 'Coverage across the Strategy' },
    { id: 'g-states', x: 5, y: 3.6, kind: 'gap', tag: 'Missing', label: 'Every other card state', sub: 'Ineligible, Learning, Paused after a failure' },
  ],
  edges: [
    ['camp', 'hub'], ['hub', 'journey'], ['hub', 'offer'], ['hub', 'sto'], ['hub', 'content'],
    ['journey', 'g-journey'], ['offer', 'g-offer'], ['sto', 'g-sto'], ['content', 'wizard'],
    ['wizard', 'active'], ['active', 'score'],
    { from: 'active', to: 'g-states', soft: true },
  ],
};

/* ── B · Creation ────────────────────────────────────────────
   The one wizard that exists. The happy path is four questions.
   Everything hanging off it is validation and failure, and most
   of that was never drawn. */
const creation = {
  title: 'Creation: the one setup wizard that exists',
  note: 'Four questions and a review. The path forks once, on how many templates the campaign has. Almost everything below the happy path is validation and failure.',
  nodes: [
    { id: 'start', x: 1, y: 0, kind: 'start', tag: 'Start', label: 'Content Decisioning card', sub: 'Setup' },
    { id: 'elig', x: 1, y: 1, kind: 'decision', label: 'Eligible templates?' },
    { id: 'g-elig', x: 2, y: 1, kind: 'gap', tag: 'Missing', label: 'Ineligible empty state', sub: 'No email templates, or an unsupported channel' },

    { id: 'count', x: 1, y: 2, kind: 'decision', label: 'How many templates?' },
    { id: 'pick', x: 0, y: 3, tag: 'Multi-template', label: 'Select templates', sub: 'AI pre-selects all, the user unselects' },

    { id: 'what', x: 1, y: 4, label: 'Choose what to create', sub: 'Subject line, body text' },
    { id: 'vars', x: 1, y: 5, label: 'Number of variations', sub: 'One to four per template, three by default' },
    { id: 'g-one', x: 2, y: 5, kind: 'gap', tag: 'Design bug', label: 'Picking 1 is not a test', sub: 'The option should not be there at all' },

    { id: 'tone', x: 1, y: 6, label: 'Tone of voice', sub: 'Five presets, or free text' },
    { id: 'g-gen', x: 1, y: 7, kind: 'gap', tag: 'No screen', label: 'Generating variations', sub: 'No progress, no cancel' },
    { id: 'result', x: 1, y: 8, kind: 'decision', label: 'Generation result' },
    { id: 'g-fail', x: 2, y: 8, kind: 'gap', tag: 'Missing', label: 'Partial and total failure', sub: 'No per-template retry' },

    { id: 'review', x: 1, y: 9, label: 'Review variations', sub: 'Regenerate, edit or delete each card' },
    { id: 'apply', x: 1, y: 10, label: 'Apply Content Decisioning' },
    { id: 'g-conf', x: 2, y: 10, kind: 'gap', tag: 'Missing', label: 'Confirm before applying' },
    { id: 'done', x: 1, y: 11, kind: 'done', tag: 'Done', label: 'Content Decisioning Active' },
  ],
  edges: [
    ['start', 'elig'],
    { from: 'elig', to: 'g-elig', label: 'none' },
    { from: 'elig', to: 'count', label: 'yes' },
    { from: 'count', to: 'pick', label: 'several' },
    { from: 'count', to: 'what', label: 'just one' },
    ['pick', 'what'], ['what', 'vars'],
    { from: 'vars', to: 'g-one', soft: true },
    ['vars', 'tone'], ['tone', 'g-gen'], ['g-gen', 'result'],
    ['result', 'g-fail'],
    { from: 'result', to: 'review', label: 'ok' },
    ['review', 'apply'], ['apply', 'g-conf'], ['apply', 'done'],
  ],
};

/* ── C · Optimization ────────────────────────────────────────
   What the agent does once it is live, and why the number it
   reports is hard to trust. */
const optimization = {
  title: 'Optimization: what happens once it is live',
  note: 'The agent splits the audience, watches, and promotes a winner. Three other agents move the same metric at the same time, which is the part nobody had drawn.',
  nodes: [
    { id: 'live', x: 0, y: 1.4, kind: 'start', tag: 'From setup', label: 'Agent is Active' },
    { id: 'g-split', x: 1, y: 1.4, kind: 'gap', tag: 'Undefined', label: 'How the audience splits', sub: 'The rule was never specified' },
    { id: 'send', x: 2, y: 1.4, label: 'Variations go out', sub: 'One arm per variation' },
    { id: 'g-learn', x: 2, y: 0.2, kind: 'gap', tag: 'Missing', label: 'Learning state on the card' },
    { id: 'enough', x: 3, y: 1.4, kind: 'decision', label: 'Enough signal?' },
    { id: 'win', x: 4, y: 0.4, kind: 'done', tag: 'Goal', label: 'Winner promoted', sub: 'The rest are retired' },
    { id: 'g-even', x: 4, y: 2.4, kind: 'gap', tag: 'Missing', label: 'Stays on an even split', sub: 'No state describes this' },

    /* One node, not three. Three boxes side by side had to reach the
       decision across each other, and they were all making the same
       single point anyway. */
    { id: 'confound', x: 3, y: 3, kind: 'confound', tag: 'Confound', label: 'Three other agents are moving the same metric', sub: 'Send Time, Offer Decisioning, Journey Decisioning' },
  ],
  edges: [
    ['live', 'g-split'], ['g-split', 'send'],
    { from: 'send', to: 'g-learn', soft: true },
    ['send', 'enough'],
    { from: 'enough', to: 'win', label: 'clear winner' },
    { from: 'enough', to: 'g-even', label: 'no winner' },
    { from: 'confound', to: 'enough', soft: true },
  ],
};

/* ── D · Live management ─────────────────────────────────────
   The shortest flow and the loudest finding: one built state,
   and every branch off it is a control that does not exist. */
const management = {
  title: 'Live management: everything after activation',
  note: 'The Active card is a read-only tile with two numbers on it. Every branch here is a control it needs and does not have.',
  legend: false,
  nodes: [
    { id: 'card', x: 0, y: 2.5, kind: 'done', tag: 'The only built state', label: 'Active card', sub: 'Two benefit figures, no controls' },

    { id: 'm-results', x: 1, y: 0, kind: 'gap', tag: 'Missing', label: 'See per-variation results', sub: 'Which subject line actually won' },
    { id: 'm-edit', x: 1, y: 1, kind: 'gap', tag: 'Missing', label: 'Reopen and edit the setup' },
    { id: 'm-add', x: 1, y: 2, kind: 'gap', tag: 'Missing', label: 'Add or remove variations mid-flight' },
    { id: 'm-pause', x: 1, y: 3, kind: 'gap', tag: 'Missing', label: 'Pause the agent' },
    { id: 'm-off', x: 1, y: 4, kind: 'gap', tag: 'Missing', label: 'Turn off and revert to the original' },
    { id: 'm-audit', x: 1, y: 5, kind: 'gap', tag: 'Missing', label: 'Audit trail', sub: 'Who applied what copy, and when' },

    { id: 'd-run', x: 2, y: 1, kind: 'decision', label: 'Test already running?' },
    { id: 'd-sent', x: 2, y: 4, kind: 'decision', label: 'Sends already went out?' },

    { id: 'q-learn', x: 3, y: 1, kind: 'gap', tag: 'Unanswered', label: 'Restart learning, or keep the history?' },
    { id: 'q-cust', x: 3, y: 4, kind: 'gap', tag: 'Unanswered', label: 'What about customers who already got a variation?' },
  ],
  edges: [
    ['card', 'm-results'], ['card', 'm-edit'], ['card', 'm-add'],
    ['card', 'm-pause'], ['card', 'm-off'], ['card', 'm-audit'],
    ['m-edit', 'd-run'], ['m-off', 'd-sent'],
    { from: 'd-run', to: 'q-learn', label: 'yes' },
    { from: 'd-sent', to: 'q-cust', label: 'yes' },
  ],
};

/* ── One flow per agent ──────────────────────────────────────
   Each of these says the same two things in the agent's own terms:
   the decision the agent is actually making, and the point where
   the interface stops keeping up with it. Kept to a single line of
   travel so four of them can sit on one page without the reader
   having to re-learn a layout each time. */
const agentJourney = {
  title: 'Journey Decisioning: which campaign wins',
  note: 'The agent ranks campaigns competing for the same customer. It never got a way in, and it never got a way to show its reasoning.',
  legend: false,
  nodes: [
    { id: 'card', x: 0, y: 0.6, kind: 'start', tag: 'On the hub', label: 'Journey Decisioning card' },
    { id: 'gap', x: 1, y: 0.6, kind: 'gap', tag: 'No screen', label: 'Setup was never designed' },
    { id: 'many', x: 2, y: 0.6, label: 'One customer qualifies for several campaigns', sub: 'On the same day' },
    { id: 'rank', x: 3, y: 0.6, kind: 'decision', label: 'Which is worth most?' },
    { id: 'win', x: 4, y: 0, kind: 'done', tag: 'Goal', label: 'Highest predicted value is sent' },
    { id: 'sup', x: 4, y: 1.3, kind: 'gap', tag: 'Missing', label: 'The rest are held back', sub: 'Nothing shows which, or why' },
  ],
  edges: [['card', 'gap'], ['gap', 'many'], ['many', 'rank'],
    { from: 'rank', to: 'win', label: 'ranked first' },
    { from: 'rank', to: 'sup', label: 'ranked lower' }],
};

const agentOffer = {
  title: 'Offer Decisioning: which incentive per customer',
  note: 'Static tests give everyone the winning discount. This agent gives each customer the cheapest offer that still converts, which is a margin argument with no screen to make it.',
  legend: false,
  nodes: [
    { id: 'card', x: 0, y: 0.6, kind: 'start', tag: 'On the hub', label: 'Offer Decisioning card' },
    { id: 'gap', x: 1, y: 0.6, kind: 'gap', tag: 'No screen', label: 'Setup was never designed' },
    { id: 'offers', x: 2, y: 0.6, label: 'Several incentives on one campaign', sub: 'Each with a different cost' },
    { id: 'pick', x: 3, y: 0.6, kind: 'decision', label: 'Which one per customer?' },
    { id: 'win', x: 4, y: 0, kind: 'done', tag: 'Goal', label: 'Cheapest offer that still converts' },
    { id: 'margin', x: 4, y: 1.3, kind: 'gap', tag: 'Missing', label: 'Margin saved is never shown', sub: 'The number a marketer has to defend internally' },
  ],
  edges: [['card', 'gap'], ['gap', 'offers'], ['offers', 'pick'], ['pick', 'win'],
    { from: 'pick', to: 'margin', soft: true }],
};

const agentSendTime = {
  title: 'Send Time Optimization: when to send',
  note: 'The only agent with a working setup screen, and the only one whose setup was built somewhere else and never connected back to the hub that advertises it.',
  legend: false,
  nodes: [
    { id: 'card', x: 0, y: 0.6, kind: 'start', tag: 'On the hub', label: 'Send Time Optimization card' },
    { id: 'gap', x: 1, y: 0.6, kind: 'gap', tag: 'Not wired', label: 'Setup lives on its own page', sub: 'The card points at a route that does not connect' },
    { id: 'hist', x: 2, y: 0.6, label: 'Engagement history per customer' },
    { id: 'when', x: 3, y: 0.6, kind: 'decision', label: 'When are they active?' },
    { id: 'send', x: 4, y: 0, kind: 'done', tag: 'Goal', label: 'Sent inside that window' },
    { id: 'back', x: 4, y: 1.3, kind: 'gap', tag: 'Missing', label: 'No way back to the hub', sub: 'The two screens never reference each other' },
  ],
  edges: [['card', 'gap'], ['gap', 'hist'], ['hist', 'when'], ['when', 'send'],
    { from: 'gap', to: 'back', soft: true }],
};

const agentContent = {
  title: 'Content Decisioning: which words',
  note: 'The one agent designed end to end. It is also the only one that changes something a marketer wrote, which is why the setup ends in a review and not an Apply button.',
  legend: false,
  nodes: [
    { id: 'card', x: 0, y: 0.6, kind: 'start', tag: 'On the hub', label: 'Content Decisioning card' },
    { id: 'wiz', x: 1, y: 0.6, tag: 'Designed', label: 'Setup wizard', sub: 'Four questions and a review' },
    { id: 'live', x: 2, y: 0.6, label: 'Variations go out', sub: 'One arm per variation' },
    { id: 'test', x: 3, y: 0.6, kind: 'decision', label: 'A clear winner?' },
    { id: 'win', x: 4, y: 0, kind: 'done', tag: 'Goal', label: 'Winner promoted' },
    { id: 'after', x: 4, y: 1.3, kind: 'gap', tag: 'Missing', label: 'No controls after activation', sub: 'Six of them, drawn out below' },
  ],
  edges: [['card', 'wiz'], ['wiz', 'live'], ['live', 'test'], ['test', 'win'],
    { from: 'test', to: 'after', soft: true }],
};

export const FLOWS = {
  activation, creation, optimization, management,
  'agent-journey': agentJourney,
  'agent-offer': agentOffer,
  'agent-send-time': agentSendTime,
  'agent-content': agentContent,
};

document.querySelectorAll('[data-flow]').forEach((host) => {
  if (host.firstElementChild) return;
  const spec = FLOWS[host.dataset.flow];
  if (!spec) return;
  host.appendChild(createFlow(spec).el);
});
