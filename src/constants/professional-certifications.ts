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
    id: 'databricks-ml-associate', careerId: 'C03', title: 'Machine Learning Associate', provider: 'Databricks',
    url: 'https://www.databricks.com/learn/certification/machine-learning-associate', level: 'مشارك',
    cost: 'الاختبار مدفوع؛ تحقّق من السعر الحالي قبل التسجيل',
    note: 'تقيس تنفيذ مهام تعلم آلة أساسية، ويُوصى بخبرة عملية قبل الاختبار. ليست شرطًا عامًا لوظائف علم البيانات.',
  },
  {
    id: 'aws-ml-engineer-associate', careerId: 'C04', title: 'Machine Learning Engineer – Associate (MLA-C02)', provider: 'AWS',
    url: 'https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/', level: 'مشارك',
    cost: 'الاختبار مدفوع؛ النسخة MLA-C02 كانت بسعر تجريبي وقت المراجعة، فتحقّق من السعر والحالة الحالية',
    note: 'تقيس تجهيز البيانات وبناء حلول AI/ML ونشرها وتشغيلها ومراقبتها على AWS، ويوصي المزود بخبرة عملية.',
  },
  {
    id: 'google-professional-ml-engineer', careerId: 'C04', title: 'Professional Machine Learning Engineer', provider: 'Google Cloud',
    url: 'https://cloud.google.com/learn/certification/machine-learning-engineer', level: 'احترافي متقدم',
    cost: '200 دولار أمريكي إضافة إلى الضرائب بحسب صفحة المزود؛ تحقّق قبل التسجيل',
    note: 'خيار متقدم لمن يستخدم Google Cloud، ويوصي المزود بخبرة عملية. يكفي للمسار الحصول على إحدى الشهادات المقترحة.',
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
  {
    id: 'microsoft-dp-700', careerId: 'C07', title: 'Fabric Data Engineer Associate (DP-700)', provider: 'Microsoft',
    url: 'https://learn.microsoft.com/en-us/credentials/certifications/fabric-data-engineer-associate/', level: 'متوسط',
    cost: 'الاختبار مدفوع ويختلف سعره حسب البلد؛ صفحة المزود تعرض السعر قبل الحجز',
    note: 'مرتبطة بإدخال البيانات وتحويلها وتأمين حلول التحليلات ومراقبتها باستخدام Microsoft Fabric.',
  },
  {
    id: 'google-professional-data-engineer', careerId: 'C07', title: 'Professional Data Engineer', provider: 'Google Cloud',
    url: 'https://cloud.google.com/learn/certification/data-engineer', level: 'احترافي متقدم',
    cost: '200 دولار أمريكي إضافة إلى الضرائب بحسب صفحة المزود؛ تحقّق قبل التسجيل',
    note: 'خيار متقدم؛ Google توصي بخبرة عملية واسعة. يكفي للمسار الحصول على إحدى الشهادات المقترحة.',
  },
  {
    id: 'aws-cloud-practitioner', careerId: 'C08', title: 'AWS Certified Cloud Practitioner', provider: 'AWS',
    url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', level: 'تأسيسي',
    cost: 'الاختبار مدفوع؛ تحقّق من السعر الحالي قبل التسجيل',
    note: 'شهادة تأسيسية للسحابة. تدعم البداية لكنها لا تثبت وحدها مهارات DevOps العملية أو بناء خطوط CI/CD.',
  },
  {
    id: 'iiba-ecba', careerId: 'C09', title: 'Entry Certificate in Business Analysis (ECBA)', provider: 'IIBA',
    url: 'https://www.iiba.org/ecba/', level: 'تأسيسي',
    cost: 'مدفوعة؛ توجد أسعار وخصومات للطلاب حسب المنطقة، فتحقّق قبل الشراء',
    note: 'تثبت المعرفة التأسيسية في تحليل الأعمال ولا تتطلب خبرة محددة للتقدم وفق صفحة IIBA.',
  },
];

export const professionalCertificationIds = new Set(professionalCertifications.map(item => item.id));
export function certificationsForCareer(careerId: string) {
  return professionalCertifications.filter(item => item.careerId === careerId);
}
