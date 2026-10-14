// Recover literal comma-separated skills without inventing dictionary mappings.
// Only explicitly labelled lists qualify; project/course prose stays with the model.
export function recoverListedSkills(source, skills) {
  const result = [...skills];
  const seen = new Set(skills.map(skill => skill.name.trim().toLocaleLowerCase()));
  const heading = /^(?:[-•▪]\s*)?(?:programming languages?|languages?\s*\(programming\)|technical skills?|skills|tools(?:\s*(?:and|&)\s*technologies)?|technologies|frameworks|databases|لغات البرمجة|المهارات(?: التقنية)?|الأدوات|التقنيات|قواعد البيانات)\s*[:：]\s*(.+)$/iu;
  // Keep cells separate: a degree or contact field in the other PDF column is not a skill.
  for (const row of source.split('\n')) {
    for (const cell of row.replace(/^\[[PD]\d+L\d+(?: y=\d+)?\]\s*/, '').split(/\(x=\d+\)| \| /)) {
      const match = cell.trim().match(heading);
      if (!match) continue;
      const names = match[1].split(/[,،;؛•▪]/u).map(name => name.trim());
      if (names.length < 2 || names.length > 30) continue;
      // Reject sentence fragments, URLs, dates, and instructions rather than guess.
      if (names.some(name => !name || name.length > 60 || name.split(/\s+/u).length > 6 || !/^[\p{L}\p{N}][\p{L}\p{N}\s+#.()\/-]*$/u.test(name) || /https?:|\b(?:19|20)\d{2}\b|\b(?:developed|implemented|obtained|ignore|instructions|certificate|university|bachelor)\b/iu.test(name))) continue;
      for (const name of names) {
        const identity = name.toLocaleLowerCase();
        if (seen.has(identity) || result.length >= 80) continue;
        seen.add(identity);
        result.push({ name, mapped_skill_id: null, evidence: cell.trim() });
      }
    }
  }
  return result;
}
