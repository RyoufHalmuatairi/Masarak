export type ProfessionalCertification = {
  id: string;
  careerId: string;
  title: string;
  provider: string;
  url: string;
  level: string;
  cost: string;
  note: string;
};

export const professionalCertifications: ProfessionalCertification[] = [
  {
    id: 'github-foundations', careerId: 'C01', title: 'GitHub Foundations', provider: 'GitHub',
    url: 'https://learn.github.com/certifications', level: 'تأسيسي',
    cost: 'اختبار مهني مدفوع؛ تحقّق من السعر الحالي قبل التسجيل',
    note: 'مساندة لهندسة البرمجيات وإدارة المصدر، وليست شرطًا عامًا لكل وظيفة برمجية.',
  },
  {
    id: 'microsoft-pl-300', careerId: 'C02', title: 'Power BI Data Analyst Associate (PL-300)', provider: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/', level: 'متوسط',
    cost: 'الاختبار مدفوع ويختلف سعره حسب البلد',
    note: 'مرتبطة بتحضير البيانات ونمذجتها وتصويرها وتحليلها باستخدام Power BI.',
  },
  {
    id: 'google-professional-data-engineer', careerId: 'C03', title: 'Professional Data Engineer', provider: 'Google Cloud',
    url: 'https://cloud.google.com/learn/certification/data-engineer', level: 'احترافي متقدم',
    cost: '200 دولار أمريكي إضافة إلى الضرائب بحسب صفحة المزود',
    note: 'متقدمة؛ Google توصي بخبرة 3 سنوات أو أكثر، لذلك لا نعاملها كمتطلب بداية للمسار.',
  },
  {
    id: 'google-professional-ml-engineer', careerId: 'C04', title: 'Professional Machine Learning Engineer', provider: 'Google Cloud',
    url: 'https://cloud.google.com/learn/certification/machine-learning-engineer', level: 'احترافي متقدم',
    cost: '200 دولار أمريكي إضافة إلى الضرائب بحسب صفحة المزود',
    note: 'متقدمة؛ Google توصي بخبرة عملية سابقة في حلول Google Cloud.',
  },
  {
    id: 'microsoft-sc-200', careerId: 'C05', title: 'Security Operations Analyst Associate (SC-200)', provider: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/', level: 'متوسط',
    cost: 'الاختبار مدفوع ويختلف سعره حسب البلد',
    note: 'تركز على التحقيق في التهديدات والاستجابة للحوادث باستخدام أدوات Microsoft الأمنية.',
  },
  {
    id: 'cisco-ccna', careerId: 'C06', title: 'Cisco Certified Network Associate (CCNA)', provider: 'Cisco',
    url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html', level: 'مشارك',
    cost: '300 دولار أمريكي بحسب صفحة Cisco، وقد تختلف الضرائب',
    note: 'تغطي أساسيات الشبكات والوصول وIP والأمن والأتمتة، ولا توجد متطلبات سابقة للاختبار.',
  },
];

export const professionalCertificationIds = new Set(professionalCertifications.map(item => item.id));
export function certificationsForCareer(careerId: string) {
  return professionalCertifications.filter(item => item.careerId === careerId);
}
