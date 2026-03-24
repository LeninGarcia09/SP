/**
 * Seed script for Telnub CRM
 * Seeds all modules with realistic demo data via the REST API.
 *
 * Usage:
 *   npx tsx scripts/seed.ts [API_BASE_URL]
 *
 * Default API_BASE_URL: http://localhost:3000/api/v1
 */

const API =
  process.argv[2] ||
  'https://api-bizops-dev.graysand-3ab24a81.eastus.azurecontainerapps.io/api/v1';

let TOKEN = '';
let USER_ID = '';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function post(path: string, body: Record<string, unknown> = {}, allowConflict = false) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (allowConflict && res.status === 409) {
      return null; // already exists
    }
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function get(path: string) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: {
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌱 Seeding Telnub CRM at ${API}\n`);

  // 1. Authenticate via dev-login
  console.log('1️⃣  Authenticating via dev-login…');
  // dev-login is at /auth/dev-login (no /api/v1 prefix — it's under setGlobalPrefix too)
  const authRes = await post('/auth/dev-login');
  TOKEN = authRes.data.access_token;
  USER_ID = authRes.data.user.id;
  console.log(`   ✅ Logged in as ${authRes.data.user.displayName} (${USER_ID})\n`);

  // 2. Skills catalog
  console.log('2️⃣  Creating skills catalog…');
  const skillsData = [
    { name: 'JavaScript', category: 'TECHNICAL', description: 'Frontend & backend JavaScript development' },
    { name: 'Python', category: 'TECHNICAL', description: 'Python programming and scripting' },
    { name: 'Project Management', category: 'MANAGEMENT', description: 'Planning, scheduling, and resource management' },
    { name: 'Azure Cloud', category: 'TECHNICAL', description: 'Microsoft Azure cloud services' },
    { name: 'SQL / Databases', category: 'TECHNICAL', description: 'Database design, queries, optimization' },
    { name: 'React', category: 'TECHNICAL', description: 'React.js framework development' },
    { name: 'DevOps / CI-CD', category: 'TECHNICAL', description: 'Continuous integration and deployment pipelines' },
    { name: 'Business Analysis', category: 'DOMAIN', description: 'Requirements gathering and business process modeling' },
    { name: 'Leadership', category: 'SOFT_SKILL', description: 'Team leadership and mentoring' },
    { name: 'Communication', category: 'SOFT_SKILL', description: 'Verbal and written communication skills' },
  ];
  // Fetch existing skills first
  const existingSkillsRes = await get('/skills?limit=100');
  const existingSkills: Array<{ id: string; name: string }> = (existingSkillsRes.data || []).map(
    (s: { id: string; name: string }) => ({ id: s.id, name: s.name }),
  );
  const skills: Array<{ id: string; name: string }> = [...existingSkills];
  for (const s of skillsData) {
    if (existingSkills.find((es) => es.name === s.name)) {
      console.log(`   ⏭️  Skill: ${s.name} (already exists)`);
      continue;
    }
    const res = await post('/skills', s);
    skills.push({ id: res!.data.id, name: s.name });
    console.log(`   ✅ Skill: ${s.name}`);
  }
  console.log();

  // 3. Programs
  console.log('3️⃣  Creating programs…');
  const programsData = [
    {
      name: 'Digital Transformation Initiative',
      description: 'Enterprise-wide digital transformation program spanning multiple departments and systems.',
      status: 'ACTIVE',
      startDate: '2025-01-15',
      endDate: '2026-06-30',
      budget: 2500000,
      managerId: USER_ID,
    },
    {
      name: 'Infrastructure Modernization',
      description: 'Upgrade legacy infrastructure to cloud-native architecture on Azure.',
      status: 'PLANNING',
      startDate: '2025-04-01',
      endDate: '2025-12-31',
      budget: 800000,
      managerId: USER_ID,
    },
  ];
  const existingProgramsRes = await get('/programs?limit=100');
  const existingPrograms: Array<{ id: string; name: string }> = (existingProgramsRes.data || []).map(
    (p: { id: string; name: string }) => ({ id: p.id, name: p.name }),
  );
  const programs: Array<{ id: string; name: string }> = [];
  for (const p of programsData) {
    const existing = existingPrograms.find((ep) => ep.name === p.name);
    if (existing) {
      programs.push(existing);
      console.log(`   ⏭️  Program: ${p.name} (already exists)`);
      continue;
    }
    const res = await post('/programs', p);
    programs.push({ id: res!.data.id, name: p.name });
    console.log(`   ✅ Program: ${p.name}`);
  }
  console.log();

  // 4. Projects
  console.log('4️⃣  Creating projects…');
  const projectsData = [
    {
      name: 'ERP System Migration',
      description: 'Migrate legacy ERP to cloud-based solution with phased rollout across all business units.',
      status: 'ACTIVE',
      startDate: '2025-02-01',
      endDate: '2025-09-30',
      budget: 750000,
      actualCost: 230000,
      costRate: 185.50,
      projectLeadId: USER_ID,
      metadata: { region: 'LATAM', priority: 'HIGH', programId: programs[0].id },
    },
    {
      name: 'Customer Portal Redesign',
      description: 'Complete redesign of customer-facing portal with modern UX and self-service capabilities.',
      status: 'ACTIVE',
      startDate: '2025-03-01',
      endDate: '2025-08-31',
      budget: 320000,
      actualCost: 95000,
      costRate: 150.00,
      projectLeadId: USER_ID,
    },
    {
      name: 'Data Analytics Platform',
      description: 'Build centralized data analytics platform with real-time dashboards and reporting.',
      status: 'PLANNING',
      startDate: '2025-04-15',
      endDate: '2025-12-31',
      budget: 450000,
      actualCost: 0,
      costRate: 200.00,
      projectLeadId: USER_ID,
    },
    {
      name: 'Mobile App Development',
      description: 'Native mobile application for field teams with offline sync and real-time notifications.',
      status: 'ACTIVE',
      startDate: '2025-01-20',
      endDate: '2025-07-31',
      budget: 280000,
      actualCost: 175000,
      costRate: 175.00,
      projectLeadId: USER_ID,
    },
    {
      name: 'Security Compliance Audit',
      description: 'SOC 2 Type II compliance program including security controls review and remediation.',
      status: 'ON_HOLD',
      startDate: '2025-02-15',
      endDate: '2025-06-30',
      budget: 120000,
      actualCost: 40000,
      costRate: 220.00,
      projectLeadId: USER_ID,
      metadata: { complianceType: 'SOC2', auditor: 'Deloitte' },
    },
  ];
  const existingProjectsRes = await get('/projects?limit=100');
  const existingProjects: Array<{ id: string; name: string }> = (existingProjectsRes.data || []).map(
    (p: { id: string; name: string }) => ({ id: p.id, name: p.name }),
  );
  const projects: Array<{ id: string; name: string }> = [];
  for (const p of projectsData) {
    const existing = existingProjects.find((ep) => ep.name === p.name);
    if (existing) {
      projects.push(existing);
      console.log(`   ⏭️  Project: ${p.name} (already exists)`);
      continue;
    }
    const res = await post('/projects', p);
    projects.push({ id: res!.data.id, name: p.name });
    console.log(`   ✅ Project: ${p.name}`);
  }
  console.log();

  // 5. Tasks (for each project)
  console.log('5️⃣  Creating tasks…');
  const taskSets: Array<{ projectIdx: number; tasks: Array<Record<string, unknown>> }> = [
    {
      projectIdx: 0, // ERP System Migration
      tasks: [
        { title: 'Finalize vendor selection', description: 'Evaluate and select ERP vendor based on RFP responses', status: 'DONE', priority: 'CRITICAL', dueDate: '2025-03-01', estimatedHours: 40 },
        { title: 'Data migration plan', description: 'Create detailed data migration strategy and mapping', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-04-15', estimatedHours: 80 },
        { title: 'Configure staging environment', description: 'Set up staging environment matching production topology', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-04-30', estimatedHours: 24 },
        { title: 'User acceptance testing', description: 'Conduct UAT with key stakeholders from each department', status: 'TODO', priority: 'HIGH', dueDate: '2025-07-15', estimatedHours: 120 },
        { title: 'Cut-over planning', description: 'Plan weekend cut-over with minimal downtime', status: 'TODO', priority: 'CRITICAL', dueDate: '2025-08-30', estimatedHours: 60 },
        { title: 'Staff training sessions', description: 'Train 200+ employees on new ERP system', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-09-15', estimatedHours: 160 },
      ],
    },
    {
      projectIdx: 1, // Customer Portal Redesign
      tasks: [
        { title: 'UX research & interviews', description: 'Conduct 20 customer interviews and usability tests', status: 'DONE', priority: 'HIGH', dueDate: '2025-03-15', estimatedHours: 60 },
        { title: 'Wireframes & prototypes', description: 'Create high-fidelity wireframes in Figma', status: 'DONE', priority: 'HIGH', dueDate: '2025-04-01', estimatedHours: 40 },
        { title: 'Frontend development', description: 'Implement new design system and portal pages', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-06-30', estimatedHours: 200 },
        { title: 'API integration layer', description: 'Build BFF layer connecting portal to backend microservices', status: 'TODO', priority: 'HIGH', dueDate: '2025-07-15', estimatedHours: 80 },
        { title: 'Performance optimization', description: 'Achieve <2s page load with lazy loading and CDN', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-08-15', estimatedHours: 40 },
      ],
    },
    {
      projectIdx: 2, // Data Analytics Platform
      tasks: [
        { title: 'Requirements gathering', description: 'Document analytics requirements from all business units', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-05-01', estimatedHours: 60 },
        { title: 'Data warehouse design', description: 'Design star schema for enterprise data warehouse', status: 'TODO', priority: 'CRITICAL', dueDate: '2025-06-15', estimatedHours: 80 },
        { title: 'ETL pipeline development', description: 'Build data pipelines from 12 source systems', status: 'TODO', priority: 'HIGH', dueDate: '2025-08-31', estimatedHours: 240 },
        { title: 'Dashboard development', description: 'Create executive and operational dashboards', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-10-31', estimatedHours: 120 },
      ],
    },
    {
      projectIdx: 3, // Mobile App Development
      tasks: [
        { title: 'Architecture design', description: 'Define mobile architecture with offline-first approach', status: 'DONE', priority: 'CRITICAL', dueDate: '2025-02-15', estimatedHours: 30 },
        { title: 'Core feature development', description: 'Implement work orders, inspections, and reporting', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2025-05-15', estimatedHours: 300 },
        { title: 'Offline sync engine', description: 'Build conflict-resolution sync engine for field operations', status: 'IN_PROGRESS', priority: 'CRITICAL', dueDate: '2025-05-31', estimatedHours: 120 },
        { title: 'Beta testing', description: 'Deploy to 50 field users for 2-week beta test', status: 'TODO', priority: 'HIGH', dueDate: '2025-06-30', estimatedHours: 40 },
        { title: 'App store submission', description: 'Prepare and submit to iOS App Store and Google Play', status: 'TODO', priority: 'MEDIUM', dueDate: '2025-07-15', estimatedHours: 16 },
      ],
    },
    {
      projectIdx: 4, // Security Compliance Audit
      tasks: [
        { title: 'Gap analysis', description: 'Identify gaps against SOC 2 Trust Service Criteria', status: 'DONE', priority: 'CRITICAL', dueDate: '2025-03-15', estimatedHours: 60 },
        { title: 'Control remediation', description: 'Implement missing or weak security controls', status: 'BLOCKED', priority: 'HIGH', dueDate: '2025-05-01', estimatedHours: 200 },
        { title: 'Evidence collection', description: 'Collect and organize audit evidence for each control', status: 'TODO', priority: 'HIGH', dueDate: '2025-05-31', estimatedHours: 80 },
      ],
    },
  ];

  const allTasks: Array<{ id: string; title: string; projectId: string }> = [];
  for (const set of taskSets) {
    const projectId = projects[set.projectIdx].id;
    // Fetch existing tasks for this project
    const existingTasksRes = await get(`/projects/${projectId}/tasks?limit=100`);
    const existingTaskTitles = new Set(
      ((existingTasksRes.data || []) as Array<{ id: string; title: string }>).map((t) => t.title),
    );
    // Also collect existing task IDs
    for (const et of (existingTasksRes.data || []) as Array<{ id: string; title: string }>) {
      allTasks.push({ id: et.id, title: et.title, projectId });
    }
    for (const t of set.tasks) {
      if (existingTaskTitles.has(t.title as string)) {
        console.log(`   ⏭️  Task: ${t.title} (already exists)`);
        continue;
      }
      const res = await post(`/projects/${projectId}/tasks`, { ...t, assigneeId: USER_ID });
      allTasks.push({ id: res!.data.id, title: t.title as string, projectId });
      console.log(`   ✅ Task: ${t.title} (${projects[set.projectIdx].name})`);
    }
  }
  console.log();

  // 6. Project Notes
  console.log('6️⃣  Creating project notes…');
  const notesData = [
    { projectIdx: 0, content: 'Kick-off meeting with vendor scheduled for Feb 5. Key stakeholders: CFO, CTO, VP Operations. Budget approved by board.', isPinned: true },
    { projectIdx: 0, content: 'Data migration from legacy Oracle DB identified as highest risk. Need dedicated DBA resource for 3 months.' },
    { projectIdx: 1, content: 'Customer interviews revealed top pain points: slow load times, confusing navigation, lack of self-service billing.', isPinned: true },
    { projectIdx: 1, content: 'Design system approved by brand team. Using Tailwind CSS + shadcn/ui for consistency.' },
    { projectIdx: 3, content: 'Field team in Texas approved as beta test group. 50 devices provisioned with MDM.', isPinned: true },
    { projectIdx: 4, content: 'Project on hold pending budget reallocation. Auditor timeline pushed to Q3.', isPinned: true, metadata: { reason: 'BUDGET_HOLD' } },
  ];
  for (const n of notesData) {
    const projectId = projects[n.projectIdx].id;
    try {
      await post(`/projects/${projectId}/notes`, {
        content: n.content,
        isPinned: n.isPinned ?? false,
        metadata: n.metadata ?? {},
      });
      console.log(`   ✅ Note for ${projects[n.projectIdx].name}`);
    } catch {
      console.log(`   ⚠️  Note for ${projects[n.projectIdx].name} (skipped)`);
    }
  }
  console.log();

  // 7. Project Members
  console.log('7️⃣  Adding project members…');
  // Add the dev admin user as LEAD to all projects
  for (const p of projects) {
    try {
      await post(`/projects/${p.id}/members`, { userId: USER_ID, role: 'LEAD' });
      console.log(`   ✅ Added Dev Admin as LEAD to ${p.name}`);
    } catch {
      console.log(`   ⚠️  Member already exists for ${p.name} (skipping)`);
    }
  }
  console.log();

  // 8. Personnel
  console.log('8️⃣  Creating personnel records…');
  // Placeholder department IDs (no Department CRUD exists yet — these are just UUIDs stored as-is)
  const DEPT_ENGINEERING = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  const DEPT_OPERATIONS  = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
  const DEPT_DESIGN      = 'e3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f';
  const DEPT_SECURITY    = 'f4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a';
  const personnelData = [
    { firstName: 'Carlos', lastName: 'Rodriguez', email: 'carlos.rodriguez@telnub.local', employeeId: 'EMP-001', jobTitle: 'Senior Software Engineer', departmentId: DEPT_ENGINEERING, assignmentStatus: 'ON_PROJECT', startDate: '2023-03-15', skills: ['JavaScript', 'React', 'Azure'] },
    { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@telnub.local', employeeId: 'EMP-002', jobTitle: 'Project Manager', departmentId: DEPT_OPERATIONS, assignmentStatus: 'ON_PROJECT', startDate: '2022-07-01', skills: ['Project Management', 'Leadership'] },
    { firstName: 'Ana', lastName: 'Gomez', email: 'ana.gomez@telnub.local', employeeId: 'EMP-003', jobTitle: 'Business Analyst', departmentId: DEPT_OPERATIONS, assignmentStatus: 'ON_PROJECT', startDate: '2024-01-10', skills: ['Business Analysis', 'SQL'] },
    { firstName: 'Diego', lastName: 'Martinez', email: 'diego.martinez@telnub.local', employeeId: 'EMP-004', jobTitle: 'DevOps Engineer', departmentId: DEPT_ENGINEERING, assignmentStatus: 'ON_BENCH', startDate: '2023-11-20', skills: ['DevOps / CI-CD', 'Azure', 'Python'] },
    { firstName: 'Laura', lastName: 'Hernandez', email: 'laura.hernandez@telnub.local', employeeId: 'EMP-005', jobTitle: 'UX Designer', departmentId: DEPT_DESIGN, assignmentStatus: 'ON_PROJECT', startDate: '2024-06-01', skills: ['Communication'] },
    { firstName: 'Ricardo', lastName: 'Vargas', email: 'ricardo.vargas@telnub.local', employeeId: 'EMP-006', jobTitle: 'Data Engineer', departmentId: DEPT_ENGINEERING, assignmentStatus: 'ON_BENCH', startDate: '2024-09-15', skills: ['Python', 'SQL'] },
    { firstName: 'Sofia', lastName: 'Reyes', email: 'sofia.reyes@telnub.local', employeeId: 'EMP-007', jobTitle: 'Security Analyst', departmentId: DEPT_SECURITY, assignmentStatus: 'ON_OPERATIONS', startDate: '2023-05-01', skills: ['Azure'] },
    { firstName: 'Pedro', lastName: 'Castillo', email: 'pedro.castillo@telnub.local', employeeId: 'EMP-008', jobTitle: 'Full Stack Developer', departmentId: DEPT_ENGINEERING, assignmentStatus: 'ON_PROJECT', startDate: '2024-02-20', skills: ['JavaScript', 'React', 'Python'] },
  ];
  const existingPersonnelRes = await get('/personnel?limit=100');
  const existingPersonnel: Array<{ id: string; email: string; firstName: string; lastName: string }> =
    (existingPersonnelRes.data || []).map((p: { id: string; email: string; firstName: string; lastName: string }) => ({
      id: p.id, email: p.email, firstName: p.firstName, lastName: p.lastName,
    }));
  const persons: Array<{ id: string; name: string } | null> = [];
  for (const p of personnelData) {
    const existing = existingPersonnel.find((ep) => ep.email === p.email);
    if (existing) {
      persons.push({ id: existing.id, name: `${existing.firstName} ${existing.lastName}` });
      console.log(`   ⏭️  Person: ${p.firstName} ${p.lastName} (already exists)`);
      continue;
    }
    try {
      const res = await post('/personnel', p);
      persons.push({ id: res!.data.id, name: `${p.firstName} ${p.lastName}` });
      console.log(`   ✅ Person: ${p.firstName} ${p.lastName} — ${p.jobTitle}`);
    } catch {
      // Existing but not found by GET — refetch by email
      const retry = await get(`/personnel?limit=100&search=${encodeURIComponent(p.email)}`);
      const found = (retry.data || []).find((r: { email: string }) => r.email === p.email);
      if (found) {
        persons.push({ id: found.id, name: `${p.firstName} ${p.lastName}` });
        console.log(`   ⏭️  Person: ${p.firstName} ${p.lastName} (found via search)`);
      } else {
        persons.push(null);
        console.log(`   ⚠️  Person: ${p.firstName} ${p.lastName} — SKIPPED (not found)`);
      }
    }
  }
  console.log();

  // 9. Person Skills
  console.log('9️⃣  Assigning skills to personnel…');
  const proficiencyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const skillAssignments = [
    { personIdx: 0, skillNames: ['JavaScript', 'React', 'Azure Cloud'], proficiencies: ['EXPERT', 'EXPERT', 'ADVANCED'], years: [8, 5, 4] },
    { personIdx: 1, skillNames: ['Project Management', 'Leadership', 'Communication'], proficiencies: ['EXPERT', 'ADVANCED', 'EXPERT'], years: [12, 10, 12] },
    { personIdx: 2, skillNames: ['Business Analysis', 'SQL / Databases', 'Communication'], proficiencies: ['ADVANCED', 'INTERMEDIATE', 'ADVANCED'], years: [5, 3, 5] },
    { personIdx: 3, skillNames: ['DevOps / CI-CD', 'Azure Cloud', 'Python'], proficiencies: ['EXPERT', 'ADVANCED', 'INTERMEDIATE'], years: [6, 5, 3] },
    { personIdx: 4, skillNames: ['Communication'], proficiencies: ['ADVANCED'], years: [7] },
    { personIdx: 5, skillNames: ['Python', 'SQL / Databases'], proficiencies: ['ADVANCED', 'EXPERT'], years: [5, 8] },
    { personIdx: 6, skillNames: ['Azure Cloud'], proficiencies: ['EXPERT'], years: [6] },
    { personIdx: 7, skillNames: ['JavaScript', 'React', 'Python'], proficiencies: ['ADVANCED', 'INTERMEDIATE', 'ADVANCED'], years: [6, 3, 5] },
  ];
  for (const sa of skillAssignments) {
    const person = persons[sa.personIdx];
    if (!person) { continue; }
    const personId = person.id;
    for (let i = 0; i < sa.skillNames.length; i++) {
      const skill = skills.find((s) => s.name === sa.skillNames[i]);
      if (!skill) {
        console.log(`   ⚠️  Skill "${sa.skillNames[i]}" not found, skipping`);
        continue;
      }
      const res = await post(`/personnel/${personId}/skills`, {
        skillId: skill.id,
        proficiency: sa.proficiencies[i],
        yearsOfExperience: sa.years[i],
      }, true);
      if (res) {
        console.log(`   ✅ ${person.name} → ${sa.skillNames[i]} (${sa.proficiencies[i]})`);
      } else {
        console.log(`   ⏭️  ${person.name} → ${sa.skillNames[i]} (already assigned)`);
      }
    }
  }
  console.log();

  // 10. Project Assignments
  console.log('🔟  Creating project assignments…');
  const assignmentsData = [
    { personIdx: 0, projectIdx: 0, role: 'Lead Developer', allocationPercent: 80, startDate: '2025-02-01' },
    { personIdx: 1, projectIdx: 0, role: 'Project Manager', allocationPercent: 50, startDate: '2025-02-01' },
    { personIdx: 2, projectIdx: 0, role: 'Business Analyst', allocationPercent: 60, startDate: '2025-02-01' },
    { personIdx: 4, projectIdx: 1, role: 'UX Lead', allocationPercent: 100, startDate: '2025-03-01' },
    { personIdx: 7, projectIdx: 1, role: 'Frontend Developer', allocationPercent: 80, startDate: '2025-03-15' },
    { personIdx: 1, projectIdx: 1, role: 'Project Manager', allocationPercent: 30, startDate: '2025-03-01' },
    { personIdx: 5, projectIdx: 2, role: 'Data Engineer', allocationPercent: 50, startDate: '2025-04-15' },
    { personIdx: 7, projectIdx: 3, role: 'Mobile Developer', allocationPercent: 20, startDate: '2025-01-20' },
    { personIdx: 3, projectIdx: 3, role: 'DevOps Engineer', allocationPercent: 30, startDate: '2025-02-01' },
    { personIdx: 6, projectIdx: 4, role: 'Security Lead', allocationPercent: 40, startDate: '2025-02-15' },
  ];
  for (const a of assignmentsData) {
    const person = persons[a.personIdx];
    if (!person) { continue; }
    const res = await post('/assignments', {
      personId: person.id,
      projectId: projects[a.projectIdx].id,
      role: a.role,
      allocationPercent: a.allocationPercent,
      startDate: a.startDate,
    }, true);
    if (res) {
      console.log(`   ✅ ${person.name} → ${projects[a.projectIdx].name} (${a.role}, ${a.allocationPercent}%)`);
    } else {
      console.log(`   ⏭️  ${person.name} → ${projects[a.projectIdx].name} (already assigned)`);
    }
  }
  console.log();

  // 11. Opportunities
  console.log('1️⃣1️⃣  Creating opportunities…');
  const opportunitiesData = [
    {
      name: 'Smart Factory IoT Integration',
      description: 'IoT sensor network deployment for manufacturing floor monitoring and predictive maintenance.',
      clientName: 'Acme Manufacturing Corp',
      clientContact: 'John Williams, VP Manufacturing',
      status: 'PROPOSAL',
      stage: 'GROWTH',
      estimatedValue: 1200000,
      probability: 65,
      expectedCloseDate: '2025-07-31',
    },
    {
      name: 'Healthcare Data Platform',
      description: 'HIPAA-compliant data analytics platform for a regional hospital network.',
      clientName: 'Regional Health Partners',
      clientContact: 'Dr. Sarah Chen, CTO',
      status: 'QUALIFYING',
      stage: 'EXPANSION',
      estimatedValue: 850000,
      probability: 40,
      expectedCloseDate: '2025-09-15',
    },
    {
      name: 'Retail POS Modernization',
      description: 'Replace legacy point-of-sale system across 200 retail locations with cloud-native solution.',
      clientName: 'MegaRetail Inc',
      clientContact: 'Lisa Park, Director of IT',
      status: 'IDENTIFIED',
      stage: 'SEED',
      estimatedValue: 500000,
      probability: 20,
      expectedCloseDate: '2025-12-01',
    },
    {
      name: 'AI Chatbot for Customer Support',
      description: 'Deploy an AI-powered chatbot handling 70% of Tier 1 support tickets automatically.',
      clientName: 'TeleCom Solutions',
      clientContact: 'Mike Torres, Head of Support',
      status: 'WON',
      stage: 'EARLY',
      estimatedValue: 350000,
      probability: 95,
      expectedCloseDate: '2025-04-30',
    },
  ];
  const existingOpportunitiesRes = await get('/opportunities?limit=100');
  const existingOpportunities: Array<{ id: string; name: string }> = (existingOpportunitiesRes.data || []).map(
    (o: { id: string; name: string }) => ({ id: o.id, name: o.name }),
  );
  const opportunities: Array<{ id: string; name: string }> = [];
  for (const o of opportunitiesData) {
    const existing = existingOpportunities.find((eo) => eo.name === o.name);
    if (existing) {
      opportunities.push(existing);
      console.log(`   ⏭️  Opportunity: ${o.name} (already exists)`);
      continue;
    }
    const res = await post('/opportunities', o);
    opportunities.push({ id: res!.data.id, name: o.name });
    console.log(`   ✅ Opportunity: ${o.name} — ${o.clientName} ($${(o.estimatedValue / 1000).toFixed(0)}K)`);
  }
  console.log();

  // 12. Inventory Items
  console.log('1️⃣2️⃣  Creating inventory items…');
  const inventoryData = [
    { sku: 'LPT-001', name: 'Dell Latitude 5540', category: 'TOOL_EQUIPMENT', description: '15" developer laptop, 32GB RAM, 1TB SSD', serialNumber: 'SN-DL5540-001', location: 'Office A - Floor 3', purchaseDate: '2024-08-15', purchaseCost: 1850.00 },
    { sku: 'LPT-002', name: 'Dell Latitude 5540', category: 'TOOL_EQUIPMENT', description: '15" developer laptop, 32GB RAM, 1TB SSD', serialNumber: 'SN-DL5540-002', location: 'Office A - Floor 3', purchaseDate: '2024-08-15', purchaseCost: 1850.00 },
    { sku: 'MON-001', name: 'Dell UltraSharp U2723QE', category: 'TOOL_EQUIPMENT', description: '27" 4K monitor', serialNumber: 'SN-DU27-001', location: 'Office A - Floor 3', purchaseDate: '2024-09-01', purchaseCost: 620.00 },
    { sku: 'MON-002', name: 'Dell UltraSharp U2723QE', category: 'TOOL_EQUIPMENT', description: '27" 4K monitor', serialNumber: 'SN-DU27-002', location: 'Office A - Floor 3', purchaseDate: '2024-09-01', purchaseCost: 620.00 },
    { sku: 'LIC-AZURE-01', name: 'Azure Enterprise License', category: 'SOFTWARE_LICENSE', description: 'Microsoft Azure EA subscription — 12 months', purchaseDate: '2025-01-01', purchaseCost: 48000.00 },
    { sku: 'VEH-001', name: 'Ford Transit Connect', category: 'VEHICLE', description: 'Field operations van — 2024 model', serialNumber: 'VIN-FT2024-001', location: 'Parking Lot B', purchaseDate: '2024-06-01', purchaseCost: 32500.00 },
    { sku: 'CON-CABLES-01', name: 'Ethernet Cat6 Cables (Box of 50)', category: 'CONSUMABLE', description: '10ft Cat6 patch cables', location: 'Supply Room 1', purchaseDate: '2025-01-15', purchaseCost: 125.00 },
    { sku: 'LIC-OFFICE-01', name: 'Microsoft 365 E5 Licenses (50-pack)', category: 'SOFTWARE_LICENSE', description: 'Office 365 E5 licenses — annual renewal', purchaseDate: '2025-02-01', purchaseCost: 21000.00 },
    { sku: 'EQP-PROJ-01', name: 'Epson EB-L255F Projector', category: 'TOOL_EQUIPMENT', description: '4500 lumens laser projector for conference room', serialNumber: 'SN-EPSON-001', location: 'Conference Room A', purchaseDate: '2024-11-10', purchaseCost: 2100.00 },
    { sku: 'LPT-003', name: 'MacBook Pro 16" M3 Pro', category: 'TOOL_EQUIPMENT', description: '16" M3 Pro, 36GB RAM, 1TB SSD — Design team', serialNumber: 'SN-MBP16-001', location: 'Office B - Floor 2', purchaseDate: '2024-12-01', purchaseCost: 2899.00 },
  ];
  const existingInventoryRes = await get('/inventory?limit=100');
  const existingInventory: Array<{ id: string; sku: string }> = (existingInventoryRes.data || []).map(
    (i: { id: string; sku: string }) => ({ id: i.id, sku: i.sku }),
  );
  const inventoryItems: Array<{ id: string; sku: string }> = [];
  for (const item of inventoryData) {
    const existing = existingInventory.find((ei) => ei.sku === item.sku);
    if (existing) {
      inventoryItems.push(existing);
      console.log(`   ⏭️  Item: ${item.sku} — ${item.name} (already exists)`);
      continue;
    }
    const res = await post('/inventory', item);
    inventoryItems.push({ id: res!.data.id, sku: item.sku });
    console.log(`   ✅ Item: ${item.sku} — ${item.name} ($${item.purchaseCost?.toFixed(2) ?? '0.00'})`);
  }
  console.log();

  // 13. Inventory Transactions (audit log)
  console.log('1️⃣3️⃣  Creating inventory transactions…');
  const transactionsData = [
    { itemIdx: 0, transactionType: 'CHECK_OUT', toPersonId: persons[0]?.id, toProjectId: projects[0].id, notes: 'Assigned to Carlos for ERP migration project' },
    { itemIdx: 2, transactionType: 'CHECK_OUT', toPersonId: persons[0]?.id, notes: 'Monitor assigned alongside laptop LPT-001' },
    { itemIdx: 4, transactionType: 'CHECK_OUT', toProjectId: projects[2].id, notes: 'Azure license allocated for Data Analytics Platform' },
    { itemIdx: 7, transactionType: 'CHECK_OUT', notes: 'Office licenses distributed to all active employees' },
    { itemIdx: 8, transactionType: 'MAINTENANCE', notes: 'Projector lamp replacement — sent to service center (ETA 2 weeks)' },
    { itemIdx: 9, transactionType: 'CHECK_OUT', toPersonId: persons[4]?.id, toProjectId: projects[1].id, notes: 'MacBook assigned to Laura for Customer Portal UX work' },
  ];
  for (const t of transactionsData) {
    const itemId = inventoryItems[t.itemIdx].id;
    try {
      await post(`/inventory/${itemId}/transactions`, {
        transactionType: t.transactionType,
        toPersonId: t.toPersonId ?? null,
        toProjectId: t.toProjectId ?? null,
        notes: t.notes,
      });
      console.log(`   ✅ Transaction: ${inventoryItems[t.itemIdx].sku} — ${t.transactionType}`);
    } catch {
      console.log(`   ⚠️  Transaction: ${inventoryItems[t.itemIdx].sku} — ${t.transactionType} (skipped)`);
    }
  }
  console.log();

  // 14. Trigger RAG health calculations
  console.log('1️⃣4️⃣  Triggering RAG health calculations…');
  for (const p of projects) {
    try {
      await post(`/projects/${p.id}/health/trigger`);
      console.log(`   ✅ RAG triggered for ${p.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`   ⚠️  RAG trigger failed for ${p.name}: ${msg}`);
    }
  }
  console.log();

  // 15. Notifications
  console.log('1️⃣5️⃣  Creating notifications…');
  const notificationsData = [
    { type: 'TASK_ASSIGNED', title: 'New task assigned', message: 'You have been assigned "Data migration plan" on ERP System Migration project.', relatedEntityType: 'TASK', relatedEntityId: allTasks[1]?.id },
    { type: 'GENERAL', title: 'System maintenance scheduled', message: 'Planned maintenance window: Saturday 3:00 AM - 5:00 AM UTC. Some services will be unavailable.' },
    { type: 'TASK_STATUS_CHANGED', title: 'Task overdue', message: 'Task "Control remediation" on Security Compliance Audit is past its due date.', relatedEntityType: 'TASK', relatedEntityId: allTasks.find((t) => t.title === 'Control remediation')?.id },
    { type: 'PROJECT_STATUS_CHANGED', title: 'Project status changed', message: 'Security Compliance Audit has been placed ON HOLD pending budget reallocation.', relatedEntityType: 'PROJECT', relatedEntityId: projects[4]?.id },
    { type: 'GENERAL', title: 'Welcome to Telnub CRM!', message: 'Welcome to Telnub CRM. Explore your dashboard to see project health, tasks, and team assignments.' },
  ];
  for (const n of notificationsData) {
    try {
      await post('/notifications', {
        userId: USER_ID,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedEntityType: n.relatedEntityType ?? undefined,
        relatedEntityId: n.relatedEntityId ?? undefined,
      });
      console.log(`   ✅ Notification: ${n.title}`);
    } catch {
      console.log(`   ⚠️  Notification: ${n.title} (skipped)`);
    }
  }
  console.log();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('══════════════════════════════════════════════════════════');
  console.log('🎉 Seeding complete! Summary:');
  console.log(`   • ${skills.length} skills`);
  console.log(`   • ${programs.length} programs`);
  console.log(`   • ${projects.length} projects`);
  console.log(`   • ${allTasks.length} tasks`);
  console.log(`   • ${notesData.length} project notes`);
  console.log(`   • ${projects.length} project member entries`);
  console.log(`   • ${persons.filter(Boolean).length} personnel records`);
  console.log(`   • ${skillAssignments.reduce((n, sa) => n + sa.skillNames.length, 0)} skill assignments`);
  console.log(`   • ${assignmentsData.length} project assignments`);
  console.log(`   • ${opportunities.length} opportunities`);
  console.log(`   • ${inventoryItems.length} inventory items`);
  console.log(`   • ${transactionsData.length} inventory transactions`);
  console.log(`   • ${notificationsData.length} notifications`);
  console.log('══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
