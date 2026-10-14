export type CareerProfile = {
  education: string;
  experience: string;
  certifications: string;
  sources: { label: string; url: string }[];
};

export const careerProfiles: Record<string, CareerProfile> = {
  C01: {
    education: 'وفق O*NET، أغلب المجيبين ذكروا البكالوريوس للموظف الجديد، لكن بعض الوظائف تقبل مسارات أخرى. التخصص والجهة يغيّران الشرط.',
    experience: 'O*NET يصنف المهنة ضمن إعداد كبير. للخريج: المشاريع القابلة للعرض، التدريب التعاوني، الاختبارات والتوثيق والعمل الجماعي أدلة عملية مهمة، ولا نضع عدد سنوات ثابتًا لكل إعلان.',
    certifications: 'لا توجد شهادة مهنية واحدة إلزامية لكل مهندسي البرمجيات. الشهادات السحابية أو التقنية اختيارية وتُقترح فقط إذا ظهرت في الوظيفة المستهدفة.',
    sources: [
      { label: 'O*NET — Software Developers', url: 'https://www.onetonline.org/link/summary/15-1252.00' },
      { label: 'SFIA 9 — Software engineering competencies', url: 'https://sfia-online.org/en/sfia-9/sfia-views/software-engineering-competencies/core-software-engineering-competencies' },
    ],
  },
  C02: {
    education: 'الخلفية الشائعة تشمل الحاسب أو الإحصاء أو الأعمال. المتطلب الفعلي يختلف حسب القطاع ومستوى الوظيفة.',
    experience: 'ملف أعمال يوضح تنظيف البيانات وتحليلها وتصورها وشرح القرار أقوى من عدد سنوات مفترض للخريج.',
    certifications: 'شهادات Power BI أو أدوات التحليل اختيارية، ولا تدخل في نسبة تغطية المهارات.',
    sources: [{ label: 'Microsoft Learn — Data Analyst', url: 'https://learn.microsoft.com/en-us/training/career-paths/data-analyst' }],
  },
  C03: {
    education: 'الخلفيات الشائعة هي علوم البيانات أو الحاسب أو الإحصاء والرياضيات، وتزداد متطلبات الدراسات العليا في بعض الأدوار البحثية.',
    experience: 'مشاريع موثقة تشمل إعداد البيانات، التحقق من النموذج، المقاييس وشرح النتائج تعد دليلًا مناسبًا للمبتدئ.',
    certifications: 'لا توجد شهادة واحدة لازمة لكل وظائف علم البيانات؛ تُعامل الشهادات كتعلم إضافي.',
    sources: [{ label: 'Google — Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' }],
  },
  C04: {
    education: 'غالبًا تُطلب أساسيات قوية في الحاسب والرياضيات والتعلم الآلي، ويختلف المؤهل حسب عمق الدور.',
    experience: 'يُفضّل إثبات دورة حياة نموذج كاملة: بيانات، تدريب، تقييم، نشر ومراقبة، بدل الاكتفاء بدفتر تجارب.',
    certifications: 'شهادات المنصات السحابية اختيارية وقد تفيد لوظيفة تستخدم المنصة نفسها؛ الاختبارات المهنية قد تكون مدفوعة.',
    sources: [{ label: 'Google Cloud — Professional ML Engineer', url: 'https://cloud.google.com/learn/certification/machine-learning-engineer' }],
  },
  C05: {
    education: 'الخلفية الشائعة هي الأمن السيبراني أو الحاسب أو تقنية المعلومات، لكن المسارات العملية تختلف.',
    experience: 'مختبرات الدفاع والتحليل، توثيق الحوادث وتقييم الثغرات أدلة مناسبة للمبتدئ ضمن بيئة قانونية مصرح بها.',
    certifications: 'الشهادات الأمنية مفيدة لبعض الوظائف وليست شرطًا عامًا؛ نعرض التعلم المجاني منفصلًا عن الاختبارات المدفوعة.',
    sources: [
      { label: 'Cisco — Introduction to Cybersecurity', url: 'https://www.netacad.com/courses/introduction-to-cybersecurity' },
      { label: 'Microsoft Learn — Security Operations Analyst', url: 'https://learn.microsoft.com/en-us/training/career-paths/security-operations-analyst' },
    ],
  },
  C06: {
    education: 'الخلفية الشائعة هي الشبكات أو تقنية المعلومات أو الحاسب، وقد تعتمد بعض الوظائف على تدريب مهني عملي.',
    experience: 'مختبرات إعداد الشبكات، العنونة، الاستكشاف والإصلاح والأمن توضح القدرة العملية للمبتدئ.',
    certifications: 'شهادات الشبكات اختيارية أو مطلوبة حسب صاحب العمل؛ الدورة أو الشارة لا تعادل تلقائيًا شهادة احترافية.',
    sources: [{ label: 'Cisco — Networking Basics', url: 'https://www.netacad.com/courses/networking-basics' }],
  },
};
