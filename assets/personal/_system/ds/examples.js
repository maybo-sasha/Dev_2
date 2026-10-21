/* Realistic application screens for the Form design language. */
import { createButton } from '../../button/button.js';
import { createCheckbox } from '../../selection/selection.js';

const el = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};
const esc = (value) => String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

function sideNav(active, icon) {
  const items = [
    ['overview', 'Overview', 'overview'],
    ['project', 'Projects', 'folder'],
    ['mobile', 'Today', 'calendar'],
  ];
  return `<aside class="ex-app__side">
    <div class="ex-app__identity"><span>FIELDWORK</span><small>STUDIO WORKSPACE / 01</small></div>
    <p class="ex-app__side-label">WORKSPACE</p>
    <nav aria-label="Example workspace">
      ${items.map(([target, label, glyph]) => `<button type="button" class="ex-app__nav-item${active === target ? ' is-active' : ''}" data-example-jump="${target}"${active === target ? ' aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span></button>`).join('')}
    </nav>
    <div class="ex-app__side-end"><span class="ex-avatar">SM</span><span><strong>Sasha Mayboroda</strong><small>Studio North</small></span></div>
  </aside>`;
}

function topBar(section, icon) {
  return `<div class="ex-app__top"><span>WORKSPACE <b>/</b> ${section.toUpperCase()}</span><div><span>FRIDAY, 02 OCTOBER</span><span class="ex-app__top-icon" aria-hidden="true">${icon('bell')}</span></div></div>`;
}

function overviewScreen(icon) {
  const bars = [38, 56, 47, 74, 66, 91, 61];
  return `<div class="ex-app ex-app--overview" aria-label="Example overview dashboard">
    ${sideNav('overview', icon)}
    <div class="ex-app__main">
      ${topBar('Overview', icon)}
      <div class="ex-app__content">
        <div class="ex-app__lead"><div><p class="ex-eyebrow">THE WEEK AT A GLANCE / 40</p><h3>Good morning,<br><em>Sasha.</em></h3><p>Four projects are moving. Two need your attention today.</p></div><div class="ex-app__primary" data-new-project></div></div>
        <div class="ex-metrics" aria-label="Workspace summary">
          <div><span>ACTIVE PROJECTS</span><strong data-project-count>04</strong><small>Across two teams</small></div>
          <div><span>TASKS DUE</span><strong>08</strong><small>Three due today</small></div>
          <div><span>THIS WEEK</span><strong>76<sup>%</sup></strong><small>+12% from last week</small></div>
        </div>
        <div class="ex-dashboard">
          <section class="ex-panel ex-chart" aria-labelledby="ex-chart-title">
            <div class="ex-panel__heading"><div><p class="ex-eyebrow">OUTPUT / WEEK 40</p><h4 id="ex-chart-title">Weekly rhythm</h4></div><div class="ex-range" role="group" aria-label="Chart period"><button type="button" class="is-active" aria-pressed="true" data-range="week">Week</button><button type="button" aria-pressed="false" data-range="month">Month</button></div></div>
            <p class="ex-chart__caption" data-chart-caption>27 tasks moved forward this week.</p>
            <div class="ex-chart__plot" role="img" aria-label="Activity chart for Monday through Sunday">
              ${bars.map((height, index) => `<div class="ex-chart__column${index === 5 ? ' is-highlighted' : ''}" style="--height:${height}%"><span class="ex-chart__bar"></span><small>${['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</small></div>`).join('')}
            </div>
          </section>
          <section class="ex-panel ex-agenda" aria-labelledby="ex-agenda-title">
            <div class="ex-panel__heading"><div><p class="ex-eyebrow">FRIDAY / 02 OCT</p><h4 id="ex-agenda-title">Up next</h4></div>${icon('clock')}</div>
            <div class="ex-agenda__item"><time>09:30</time><div><strong>Visual direction review</strong><span>Northline / 45 min</span></div></div>
            <div class="ex-agenda__item"><time>11:00</time><div><strong>Prototype handoff</strong><span>Orbit / 30 min</span></div></div>
            <div class="ex-agenda__item"><time>14:15</time><div><strong>Team check-in</strong><span>Studio / 20 min</span></div></div>
          </section>
        </div>
        <section class="ex-panel ex-projects" aria-labelledby="ex-projects-title">
          <div class="ex-panel__heading"><div><p class="ex-eyebrow">MOVING NOW</p><h4 id="ex-projects-title">Projects</h4></div><label class="ex-search">${icon('search')}<input type="search" aria-label="Search projects" placeholder="Find a project" data-project-search></label></div>
          <div class="ex-projects__labels"><span>PROJECT</span><span>PHASE</span><span>PROGRESS</span><span></span></div>
          <div class="ex-projects__rows">
            ${[
              ['Kinetic identities', 'Design system', 60],
              ['Northline', 'Visual direction', 84],
              ['Orbit mobile', 'Prototype', 42],
              ['Studio journal', 'Editorial', 68],
            ].map(([name, phase, progress], index) => {
              const tag = index === 0 ? 'button' : 'div';
              return `<${tag}${index === 0 ? ' type="button" data-example-jump="project"' : ''} class="ex-projects__row" data-project-name="${esc(name.toLowerCase())}"><span class="ex-projects__name"><i></i>${esc(name)}</span><span>${esc(phase)}</span><span class="ex-projects__meter"><i style="width:${progress}%"></i><b>${progress}%</b></span>${index === 0 ? icon('arrow') : '<span aria-hidden="true"></span>'}</${tag}>`;
            }).join('')}
          </div>
          <p class="ex-projects__empty" hidden>No projects match that search.</p>
        </section>
      </div>
    </div>
  </div>`;
}

function projectScreen(icon) {
  return `<div class="ex-app ex-app--project" aria-label="Example project detail screen">
    ${sideNav('project', icon)}
    <div class="ex-app__main">
      ${topBar('Projects / Kinetic identities', icon)}
      <div class="ex-app__content">
        <p class="ex-eyebrow">PROJECT / 001 &nbsp;—&nbsp; IN PROGRESS</p>
        <div class="ex-project-lead"><div><h3>Kinetic<br><em>identities.</em></h3><p>A flexible visual system for the next generation of movement.</p></div><div class="ex-project-lead__aside"><span>DELIVERY</span><strong>23 Oct</strong><small>21 days remaining</small></div></div>
        <div class="ex-project-progress"><div><span>PROJECT PROGRESS</span><strong data-milestone-count>3 of 5 milestones complete</strong></div><div class="ex-project-progress__track" role="progressbar" aria-label="Project progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60"><i style="width:60%"></i></div><b data-progress-value>60%</b></div>
        <div class="ex-project-body">
          <section class="ex-panel ex-milestones" aria-labelledby="ex-milestones-title"><div class="ex-panel__heading"><div><p class="ex-eyebrow">THE WORK</p><h4 id="ex-milestones-title">Milestones</h4></div><span>01 / 05</span></div>
            <div class="ex-milestones__rows">
              <div class="ex-milestone" data-milestone><div class="ex-milestone__control"></div><span>Research &amp; references<small>Completed / 24 Sep</small></span><b>01</b></div>
              <div class="ex-milestone" data-milestone><div class="ex-milestone__control"></div><span>System direction<small>Completed / 27 Sep</small></span><b>02</b></div>
              <div class="ex-milestone" data-milestone><div class="ex-milestone__control"></div><span>Core components<small>Completed / 01 Oct</small></span><b>03</b></div>
              <div class="ex-milestone" data-milestone><div class="ex-milestone__control"></div><span>Motion studies<small>Due / 09 Oct</small></span><b>04</b></div>
              <div class="ex-milestone" data-milestone><div class="ex-milestone__control"></div><span>Final handoff<small>Due / 23 Oct</small></span><b>05</b></div>
            </div>
          </section>
          <aside class="ex-project-aside">
            <section class="ex-panel ex-project-note"><p class="ex-eyebrow">PROJECT NOTE / 02</p><h4>Build the system.<br>Keep the spark.</h4><p>Every piece should feel like part of one language, from the first button to the last transition.</p><span>UPDATED BY SASHA / 01 OCT</span></section>
            <section class="ex-panel ex-project-team"><p class="ex-eyebrow">COLLABORATORS</p><div><span class="ex-avatar">SM</span><span class="ex-avatar">AL</span><span class="ex-avatar">RK</span><small>3 people on this project</small></div></section>
          </aside>
        </div>
      </div>
    </div>
  </div>`;
}

function mobileScreen(icon) {
  return `<div class="ex-phone" aria-label="Example mobile today screen">
    <div class="ex-phone__top"><span>FRI / 02 OCT</span><span aria-hidden="true">${icon('bell')}</span></div>
    <div class="ex-phone__body">
      <p class="ex-eyebrow">YOUR WORKSPACE / TODAY</p>
      <h3>Make room<br>for what <em>matters.</em></h3>
      <div class="ex-phone__date"><strong>Friday, 02 October</strong><span>Week 40 / Day 05</span></div>
      <div class="ex-phone__focus"><div><span>FOCUS SCORE</span><strong>04<small>/06</small></strong></div><p>You're on track. Two moments still need your attention.</p></div>
      <div class="ex-phone__section-head"><h4>Today's focus</h4><span data-mobile-count>2 / 4 DONE</span></div>
      <div class="ex-phone__tasks">
        <div class="ex-phone__task" data-mobile-task><div class="ex-phone__task-control"></div><span>Review visual direction<small>09:30 / Northline</small></span></div>
        <div class="ex-phone__task" data-mobile-task><div class="ex-phone__task-control"></div><span>Send prototype notes<small>11:00 / Orbit</small></span></div>
        <div class="ex-phone__task" data-mobile-task><div class="ex-phone__task-control"></div><span>Share motion studies<small>14:15 / Kinetic identities</small></span></div>
        <div class="ex-phone__task" data-mobile-task><div class="ex-phone__task-control"></div><span>Wrap the weekly review<small>16:00 / Studio</small></span></div>
      </div>
      <button type="button" class="ex-phone__project" data-example-jump="project"><span>UP NEXT / PROJECT 001</span><strong>Kinetic identities</strong><span class="ex-phone__project-progress"><i></i><small>60% COMPLETE</small>${icon('arrow')}</span></button>
    </div>
    <nav class="ex-phone__nav" aria-label="Mobile example navigation"><button type="button" data-example-jump="overview">${icon('overview')}<span>Overview</span></button><button type="button" data-example-jump="project">${icon('folder')}<span>Projects</span></button><button type="button" class="is-active" aria-current="page">${icon('calendar')}<span>Today</span></button></nav>
  </div>`;
}

export function pageExamples(icon) {
  const view = el(`<article class="m3-view form-examples">
    <header class="form-index-hero"><div><p class="form-kicker"><span class="form-kicker__line"></span> 03 / IN CONTEXT</p><h1>Examples<span class="form-heading-period">.</span></h1></div><p>One language, three working screens. A studio workspace shows how the foundations hold up when the interface has real content and real decisions.</p></header>
    <nav class="ex-index" aria-label="Example screens"><button type="button" data-example-jump="overview"><span>01</span> Overview</button><button type="button" data-example-jump="project"><span>02</span> Project detail</button><button type="button" data-example-jump="mobile"><span>03</span> Mobile focus</button></nav>
    <section class="ex-section" id="example-overview" aria-labelledby="example-overview-title"><div class="ex-section__intro"><span>01 / DESKTOP</span><div><h2 id="example-overview-title">The whole picture.</h2><p>A calm command center for the work, the week, and what needs attention next.</p></div></div>${overviewScreen(icon)}<p class="ex-section__foot">Overview / data, navigation, search and emphasis in one working screen.</p></section>
    <section class="ex-section" id="example-project" aria-labelledby="example-project-title"><div class="ex-section__intro"><span>02 / DESKTOP</span><div><h2 id="example-project-title">A closer view.</h2><p>Progress, tasks and context stay in one clear hierarchy. Check a milestone to see the state change.</p></div></div>${projectScreen(icon)}<p class="ex-section__foot">Project detail / live milestones and progress.</p></section>
    <section class="ex-section ex-section--mobile" id="example-mobile" aria-labelledby="example-mobile-title"><div class="ex-section__intro"><span>03 / MOBILE</span><div><h2 id="example-mobile-title">In your hand.</h2><p>The same rules, condensed for a focused day. The navigation stays simple and every action remains easy to reach.</p><ul><li>One accent for the next action</li><li>Clear states with fill and type</li><li>Touch-sized controls throughout</li></ul></div></div>${mobileScreen(icon)}</section>
  </article>`);

  view.addEventListener('click', (event) => {
    const jump = event.target.closest('[data-example-jump]');
    if (jump) view.querySelector(`#example-${jump.dataset.exampleJump}`)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  const newProject = createButton({ label: 'New project', icon: 'plus', variant: 'filled' });
  const projectDialog = el(`<dialog class="ex-dialog" aria-labelledby="ex-dialog-title"><form method="dialog"><div class="ex-dialog__head"><p class="ex-eyebrow">WORKSPACE / NEW PROJECT</p><h3 id="ex-dialog-title">Start something.</h3></div><label>Project name<input name="project" required maxlength="40" placeholder="e.g. Autumn campaign"></label><div class="ex-dialog__actions"><button type="button" data-close>Cancel</button><button type="submit" value="create">Create project</button></div></form></dialog>`);
  view.appendChild(projectDialog);
  view.querySelector('[data-new-project]').appendChild(newProject);
  newProject.addEventListener('click', () => { projectDialog.returnValue = ''; projectDialog.showModal(); });
  projectDialog.querySelector('[data-close]').addEventListener('click', () => projectDialog.close('cancel'));
  projectDialog.addEventListener('close', () => {
    if (projectDialog.returnValue !== 'create') return;
    const name = projectDialog.querySelector('[name="project"]').value.trim();
    if (!name) return;
    const row = el(`<div class="ex-projects__row" data-project-name="${esc(name.toLowerCase())}"><span class="ex-projects__name"><i></i>${esc(name)}</span><span>Draft</span><span class="ex-projects__meter"><i style="width:0%"></i><b>0%</b></span><span aria-hidden="true"></span></div>`);
    view.querySelector('.ex-projects__rows').prepend(row);
    view.querySelector('[data-project-count]').textContent = String(view.querySelectorAll('.ex-projects__row').length).padStart(2, '0');
    view.querySelector('[data-project-search]').dispatchEvent(new Event('input'));
    projectDialog.querySelector('form').reset();
  });

  const search = view.querySelector('[data-project-search]');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    view.querySelectorAll('.ex-projects__row').forEach((row) => {
      row.hidden = !row.dataset.projectName.includes(query);
      if (!row.hidden) visible++;
    });
    view.querySelector('.ex-projects__empty').hidden = visible !== 0;
  });

  const week = [38, 56, 47, 74, 66, 91, 61];
  const month = [52, 78, 69, 84, 58, 74, 94];
  view.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => {
    const isMonth = button.dataset.range === 'month';
    view.querySelectorAll('[data-range]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    view.querySelectorAll('.ex-chart__column').forEach((column, index) => column.style.setProperty('--height', `${(isMonth ? month : week)[index]}%`));
    view.querySelector('[data-chart-caption]').textContent = isMonth ? '118 tasks moved forward this month.' : '27 tasks moved forward this week.';
  }));

  const milestones = [...view.querySelectorAll('[data-milestone]')];
  milestones.forEach((row, index) => row.querySelector('.ex-milestone__control').appendChild(createCheckbox({ label: row.querySelector('span').firstChild.textContent.trim(), checked: index < 3 })));
  const updateProgress = () => {
    const done = milestones.filter((row) => row.querySelector('input').checked).length;
    const percent = Math.round(done / milestones.length * 100);
    view.querySelector('[data-milestone-count]').textContent = `${done} of ${milestones.length} milestones complete`;
    view.querySelector('[data-progress-value]').textContent = `${percent}%`;
    const bar = view.querySelector('.ex-project-progress__track');
    bar.setAttribute('aria-valuenow', String(percent));
    bar.querySelector('i').style.width = `${percent}%`;
    const tableProgress = view.querySelector('.ex-projects__row[data-example-jump="project"] .ex-projects__meter');
    tableProgress.querySelector('i').style.width = `${percent}%`;
    tableProgress.querySelector('b').textContent = `${percent}%`;
    const mobileProgress = view.querySelector('.ex-phone__project');
    mobileProgress.style.setProperty('--project-progress', `${percent}%`);
    mobileProgress.querySelector('small').textContent = `${percent}% COMPLETE`;
    milestones.forEach((row) => row.classList.toggle('is-done', row.querySelector('input').checked));
  };
  milestones.forEach((row) => row.querySelector('input').addEventListener('change', updateProgress));
  updateProgress();

  const mobileTasks = [...view.querySelectorAll('[data-mobile-task]')];
  mobileTasks.forEach((row, index) => row.querySelector('.ex-phone__task-control').appendChild(createCheckbox({ label: row.querySelector('span').firstChild.textContent.trim(), checked: index >= 2 })));
  const updateMobile = () => {
    const done = mobileTasks.filter((row) => row.querySelector('input').checked).length;
    view.querySelector('[data-mobile-count]').textContent = `${done} / ${mobileTasks.length} DONE`;
    mobileTasks.forEach((row) => row.classList.toggle('is-done', row.querySelector('input').checked));
  };
  mobileTasks.forEach((row) => row.querySelector('input').addEventListener('change', updateMobile));
  updateMobile();

  return { el: view, title: 'Examples' };
}
