import { normalizeSkillName } from '../src/utils/skill-matching.mjs';

const headings = {
  skills: /^(?:skills|technical skills|المهارات|المهارات التقنية)$/iu,
  projects: /^(?:projects?|personal projects|academic projects|المشاريع|مشاريع|المشروعات|المشاريع التقنية)$/iu,
  courses: /^(?:courses?|training courses|professional development|training|الدورات|الدورات التدريبية|الدورات المهنية|دورات)$/iu,
  certificates: /^(?:certificates?|certifications?|professional certifications?|الشهادات|الشهادات المهنية)$/iu,
  unclassified: /^(?:courses?\s*(?:and|&|\/)\s*certifications?|courses?\s*(?:and|&|\/)\s*certificates?|certifications?\s*(?:and|&|\/)\s*courses?|الدورات\s*(?:و|\/)\s*الشهادات|الشهادات\s*(?:و|\/)\s*الدورات)$/iu,
  education: /^(?:education|academic background|academic qualifications|academics|التعليم|المؤهلات|المؤهلات العلمية|التعليم والمؤهلات|المؤهل العلمي)$/iu,
  experiences: /^(?:experience|work experience|professional experience|employment history|internships?|الخبرة|الخبرات|الخبرات العملية|الخبرة العملية|خبرات العمل|الخبرات المهنية|التدريب العملي)$/iu,
  activities: /^(?:activities|volunteering|volunteer|الأنشطة|التطوع)$/iu,
  stop: /^(?:summary|profile|objective|contact|references|awards|languages|نبذة|الهدف|الملخص|معلومات الاتصال|اللغات|الجوائز)$/iu,
};
const fieldLabels = {
  name: /^(?:project(?: name)?|course(?: name)?|certification|certificate(?: name)?|degree|qualification|اسم المشروع|المشروع|اسم الدورة|الدورة|دورة|اسم الشهادة|الشهادة|شهادة|المؤهل|الدرجة العلمية)$/iu,
  organization: /^(?:organization|organisation|institution|university|school|الجهة|المؤسسة|الجامعة|الجهة التعليمية)$/iu,
  issuer: /^(?:issuer|provider|platform|issued by|الجهة المانحة|المنصة|مقدم الدورة|الجهة المقدمة)$/iu,
  dates: /^(?:dates?|period|year|graduation|graduation date|expected graduation|التاريخ|الفترة|تاريخ التخرج|التخرج المتوقع|تاريخ التخرج المتوقع)$/iu,
  description: /^(?:description|details|الوصف|وصف المشروع|التفاصيل)$/iu,
  role: /^(?:role|my role|الدور|دوري)$/iu,
  technologies: /^(?:technologies|technology|tech stack|tools|التقنيات|التقنيات المستخدمة|الأدوات)$/iu,
  category: /^(?:category|project type|التصنيف|نوع المشروع)$/iu,
  college: /^(?:college|faculty|الكلية|كلية)$/iu,
  major: /^(?:major|specialization|field of study|التخصص|تخصص)$/iu,
  study_status: /^(?:status|study status|حالة الدراسة|الحالة الدراسية|حالة التخرج)$/iu,
};
const norm = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu, ' ').trim();
const splitList = value => value.split(/[,،;؛•▪]/u).map(s => s.trim()).filter(Boolean);
const cleanBullet = value => value.replace(/^(?:[-*•▪]\s*|\d+[.)]\s*)/u, '').trim();
export function isLiteralSkillName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 60
    && !/\b(?:university|college|faculty|bachelor|master|degree|diploma|project|course|certificat(?:e|ion)|student|engineer|analyst|developer|intern)\b|جامعة|كلية|بكالوريوس|ماجستير|تخصص|مشروع|دورة|شهادة|مهندس|مهندسة|مطور|محلل|متدرب|خريج/iu.test(name)
    && /^[\p{L}\p{N}][\p{L}\p{N}\s+#.()/-]*$/u.test(name)
    && !/[.]$|\b(?:19|20)\d{2}\b|https?:|ignore|instructions/iu.test(name);
}
function heading(value) {
  const match = value.match(/^([^:：]+)(?:[:：]\s*(.*))?$/u);
  if (!match) return null;
  const label = norm(match[1]);
  const section = Object.keys(headings).find(key => headings[key].test(label));
  const singularTitle = /^(?:project|course|certificate|certification)$/iu.test(label);
  return section ? { section, title: singularTitle && !!match[2], inline: singularTitle && match[2] ? value : match[2] ?? '' } : null;
}
function fields(value) {
  return value.split(/\s*[;؛|]\s*/u).map(part => {
    const match = cleanBullet(part).match(/^([^:：]+)[:：]\s*(.*)$/u);
    const field = match && Object.keys(fieldLabels).find(key => fieldLabels[key].test(norm(match[1])));
    if (field) return { field, value: match[2].trim(), label: norm(match[1]) };
    // PDF bidi extraction can place an explicit Arabic label after its Latin
    // value in the SAME cell. Recover only a recognized label, never reorder
    // dates, join columns or rewrite the original evidence.
    if (/[:：]$/u.test(part.trim())) {
      const body = part.trim().slice(0, -1).trim();
      for (const [key, label] of Object.entries(fieldLabels)) {
        const trailing = body.match(new RegExp(`\\s+(${label.source.slice(1, -1)})$`, 'iu'));
        if (trailing) return { field: key, value: body.slice(0, trailing.index).trim(), label: norm(trailing[1]) };
      }
    }
    return { raw: part.trim() };
  });
}
function emptyEntry(name, evidence) {
  return { name, organization: '', dates: '', description: '', evidence };
}
export function inferProject(entry) {
  if (entry.category) return { ...entry, category_basis: 'explicit', category_evidence: entry.category };
  const source = [...(entry.technologies ?? []), entry.description].join(' ');
  const rules = [
    ['ويب', /\b(?:HTML|CSS|JavaScript|React(?! Native)|Django|website|web application)\b|تطبيق ويب|موقع ويب/iu],
    ['جوال', /\b(?:Flutter|React Native|Swift|Kotlin|Android|iOS|mobile application)\b|تطبيق جوال/iu],
    ['بيانات', /\b(?:pandas|data analysis|data visualization|Power BI)\b|تحليل البيانات|تصور البيانات/iu],
    ['ذكاء اصطناعي', /\b(?:TensorFlow|PyTorch|machine learning|neural network)\b|تعلم الآلة|ذكاء اصطناعي/iu],
    ['أمن', /\b(?:penetration testing|encryption|cybersecurity)\b|اختبار الاختراق|تشفير|الأمن السيبراني/iu],
    ['قواعد بيانات', /\b(?:SQL|MySQL|PostgreSQL|SQLite|MongoDB)\b|قواعد البيانات/iu],
  ];
  const matches = rules.map(([category, regex]) => [category, source.match(regex)?.[0]]).filter(([, evidence]) => evidence);
  return { ...entry, category: matches.map(([name]) => name).join('، ') || 'غير محدد',
    category_basis: matches.length ? 'inferred' : 'unspecified', category_evidence: matches.map(([, evidence]) => evidence).join('، ') };
}

// This is deliberately section-and-label based, not semantic AI understanding.
// Ambiguous visual rows interrupt association instead of joining unrelated columns.
export function extractLocalSections(source, basic, matchSkill) {
  const output = { skills: basic.skills.filter(item => isLiteralSkillName(item.name)), experiences: basic.experiences,
    education: [], projects: [], courses: [], certificates: [], activities: [], unclassified: [] };
  const sectionStatus = {};
  const contentSeen = new Set();
  const warnings = [];
  let section = null, current = null, currentTarget = null;
  let skippedColumns = false;
  function reset() { current = null; currentTarget = null; }
  function collectSkills(value, evidence) {
    for (const name of splitList(value)) {
      if (!isLiteralSkillName(name) || output.skills.length >= 80 || name.split(/\s+/u).length > 6) continue;
      output.skills.push({ name, mapped_skill_id: matchSkill(name), evidence });
    }
  }
  function start(name, evidence, target = section) {
    if (!name || name.length > 180 || output[target].length >= 80) return;
    current = target === 'courses' || target === 'certificates'
      ? { name, issuer: '', date: '', evidence } : emptyEntry(name, evidence);
    currentTarget = target;
    output[target].push(current);
  }
  function process(value, lineId) {
    if (!value.trim() || !section || section === 'stop') return;
    contentSeen.add(section);
    if (section === 'skills' || section === 'experiences') return; // Existing literal parser handles these.
    const text = cleanBullet(value);
    const tokens = fields(value);
    const title = tokens.find(item => item.field === 'name');
    const explicitCourse = title && /course|دورة|الدورة/iu.test(title.label);
    const explicitCert = title && /certificat|شهادة|الشهادة/iu.test(title.label);
    if (title) {
      let target = section;
      if (explicitCourse) target = 'courses';
      else if (explicitCert) target = 'certificates';
      else if (/project|المشروع/iu.test(title.label)) target = 'projects';
      else if (/degree|qualification|المؤهل|الدرجة/iu.test(title.label)) target = 'education';
      if (section === 'certificates' && /course completion|إتمام دورة|اتمام دورة|اجتياز دورة/iu.test(title.value)) target = 'courses';
      if (/^(?:شهادة مهنية|professional certificate|certificate)$/iu.test(title.value)) target = 'unclassified';
      start(title.value, value, target);
    } else if (tokens.every(item => !item.field)) {
      const numbered = /^(?:[-*•▪]\s+|\d+[.)]\s+)/u.test(value);
      const academic = /^(?:bachelor|master|phd|doctorate|diploma|بكالوريوس|ماجستير|دكتوراه|دبلوم)/iu.test(text);
      const jobLike = /\b(?:at|engineer|developer|analyst)\b|لدى|مهندس|مطور|محلل/iu.test(text);
      if ((section === 'education' && academic) || (['projects', 'courses', 'certificates', 'unclassified', 'activities'].includes(section)
        && text.length <= 150 && !/[.!?؟]$/u.test(text) && !jobLike
        && (numbered || (text.split(/\s+/u).length >= 2 && !isDate(text)) || (section === 'certificates' && /\+|certified|شهادة/iu.test(text))))) {
        const target = section === 'certificates' && /^شهادة مهنية[،,\s]/u.test(text) ? 'unclassified'
          : section === 'certificates' && /course completion|completion of .+ course|إتمام دورة|إتمام الدورة|اجتياز دورة/iu.test(text) ? 'courses' : section;
        start(text, value, target);
      } else {
        // A university/faculty line can complete only an immediately preceding degree.
        if (current && section === 'education' && /\b(?:university|college|faculty)\b|جامعة|كلية/iu.test(text)) {
          const key = /\b(?:college|faculty)\b|كلية/iu.test(text) ? 'college' : 'organization';
          if (!current[key]) { current[key] = text; current.evidence += '\n' + value; }
        } else { if (text) sectionStatus[section] = 'uncertain'; reset(); }
        return;
      }
    } else if (!current) {
      sectionStatus[section] = 'uncertain';
      return;
    } else current.evidence += '\n' + value;
    if (!current) return;
    if (currentTarget === 'education' && !current.major) {
      const major = current.name.match(/\s+in\s+(.+)$/iu) ?? current.name.match(/\s+(?:في|تخصص)\s+(.+)$/u);
      if (major) current.major = major[1].trim();
    }
    for (const token of tokens) {
      if (!token.field || token.field === 'name' || !token.value) continue;
      let field = token.field;
      if (currentTarget === 'courses' || currentTarget === 'certificates') {
        if (field === 'organization') field = 'issuer';
        if (field === 'dates') field = 'date';
        if (!['issuer', 'date'].includes(field)) continue;
      }
      if (field === 'technologies') {
        if (currentTarget !== 'projects') continue;
        current.technologies = splitList(token.value);
        collectSkills(token.value, value);
      } else {
        const allowed = currentTarget === 'education' ? ['organization', 'dates', 'description', 'college', 'major', 'study_status']
          : currentTarget === 'projects' ? ['organization', 'dates', 'description', 'role', 'category']
            : currentTarget === 'courses' || currentTarget === 'certificates' ? ['issuer', 'date'] : ['organization', 'dates', 'description'];
        if (allowed.includes(field)) current[field] = token.value;
      }
      if (['dates', 'date'].includes(field)) current.date_line_id = lineId;
    }
  }
  for (const raw of source.split('\n')) {
    const lineId = raw.match(/^\[([PD]\d+L\d+)/u)?.[1] ?? '';
    const row = raw.replace(/^\[[PD]\d+L\d+(?: y=\d+)?\]\s*/u, '');
    const cells = row.split(/\s+\|\s+(?=\(x=)/u).map(cell => cell.replace(/^\(x=\d+\)\s*/u, '').trim()).filter(Boolean);
    const found = cells.map(cell => heading(cell)).find(Boolean);
    if (found) {
      if (found.title && cells.length === 1 && ['education', 'projects', 'courses', 'certificates', 'unclassified'].includes(section)) {
        process(cells[0], lineId); continue;
      }
      section = found.section; reset();
      sectionStatus[section] ??= 'not_found';
      if (found.inline && cells.length === 1) process(found.inline, lineId);
      else if (cells.length > 1) { sectionStatus[section] = 'uncertain'; skippedColumns = true; }
      continue;
    }
    if (cells.length !== 1) {
      if (section) sectionStatus[section] = 'uncertain';
      skippedColumns = true; reset(); continue;
    }
    process(cells[0], lineId);
  }
  output.projects = output.projects.map(inferProject);
  const nonSkillNames = new Set(['projects', 'education', 'courses', 'certificates', 'experiences'].flatMap(key => output[key]
    .flatMap(item => [item.name, item.role, item.organization, item.issuer, item.college, item.major].filter(Boolean).map(normalizeSkillName))));
  output.skills = output.skills.filter(item => !nonSkillNames.has(normalizeSkillName(item.name)) || matchSkill(item.name));
  for (const key of Object.keys(output)) {
    const unique = new Map();
    for (const item of output[key]) {
      const identity = key === 'skills' ? normalizeSkillName(item.name)
        : norm([item.name ?? item.role, item.organization ?? item.issuer ?? '', ['courses', 'certificates'].includes(key) ? '' : item.dates ?? ''].join('|'));
      if (!unique.has(identity)) unique.set(identity, item);
      else if (key !== 'skills' && unique.get(identity).evidence !== item.evidence) {
        unique.get(identity).evidence += '\n' + item.evidence;
      }
    }
    output[key] = [...unique.values()].slice(0, 80);
  }
  const courseKeys = new Set(output.courses.map(item => norm([item.name, item.issuer].join('|'))));
  output.certificates = output.certificates.filter(item => {
    if (!courseKeys.has(norm([item.name, item.issuer].join('|')))) return true;
    output.unclassified.push({ ...emptyEntry(item.name, item.evidence), organization: item.issuer, dates: item.date, description: 'ورد الاسم نفسه كدورة وشهادة؛ راجع التصنيف قبل اعتماده.' });
    warnings.push('ورد بند مكرر بين الدورات والشهادات؛ لم نحتسبه مرتين.');
    return false;
  });
  if (skippedColumns) warnings.push('توجد صفوف PDF متعددة الأعمدة لم نستطع ربطها بثقة؛ تُركت للمراجعة ولم تُخلط بيانات الأعمدة.');
  if (output.unclassified.length) warnings.push('توجد بنود لم يُحسم نوعها بين دورة وشهادة أو تحتاج تصنيفًا يدويًا؛ لا تُحتسب حتى مراجعتها.');
  output.unclassified = output.unclassified.slice(0, 80);
  for (const key of ['skills', 'projects', 'courses', 'certificates', 'education', 'experiences']) {
    sectionStatus[key] = sectionStatus[key] === 'uncertain' ? 'uncertain' : output[key].length ? 'extracted' : contentSeen.has(key) ? 'uncertain' : 'not_found';
  }
  return { ...output, analyzed_at: new Date().toISOString(), section_status: sectionStatus,
    warnings: ['تحليل محلي محدود بقواعد وأقسام وليس فهم ذكاء اصطناعي كاملًا. استخرجنا فقط معلومات صريحة بأدلتها؛ لم نخمن الجهات أو التواريخ أو المعلومات الناقصة. الأقسام غير المستخرجة لا تثبت عدم امتلاكها. تصنيف المشروع المستنتج من التقنيات مميّز عن النص الأصلي.', ...warnings] };
}
function isDate(value) { return /^(?:[0-9٠-٩]{4})(?:\s*[-–]\s*[0-9٠-٩]{4})?$/u.test(value); }
