// Public-facing team profiles are transcribed from the clinic-supplied 22-page PDF.
// Keep the clinical wording and credential claims subject to the clinic's final review.
export type Language = 'ar' | 'en';
export type Profile = {
  slug: string; nameAr: string; nameEn: string; titleAr: string; titleEn: string;
  department: 'men' | 'women'; category: string; photo: string;
  summaryAr: string; summaryEn: string; qualifications: string[]; services: string[];
};
export const phoneDisplay = '0591009916';
export const whatsappNumber = '966591009916';
export const profiles: Profile[] = [
  {
    slug:'hisham-hendawy',nameAr:'هشام هنداوي',nameEn:'Hisham Hendawy', titleAr:'أخصائي العلاج الطبيعي',titleEn:'Physical Therapy Specialist',department:'men',category:'physical',photo:'/assets/team/hisham-hendawy.webp',
    summaryAr:'متخصص في تأهيل الجنف والعمود الفقري، والعلاج اليدوي والتأهيل الرياضي.',summaryEn:'Specialist in scoliosis, spine rehabilitation, manual therapy and sports rehabilitation.',
    qualifications:['باحث دكتوراه مهنية في العلاج الطبيعي','بكالوريوس العلاج الطبيعي – جامعة القاهرة','متخصص في تأهيل الجنف (Scoliosis) بمفهوم Rigo Concept','اعتماد McKenzie لعلاج العمود الفقري – نيوزلندا','اعتماد العلاج اليدوي وتأهيل الرياضيين – ألفا كير مصر','اعتماد العلاج بالإبر الجافة والحجامة الطبية – مصر','اعتماد تشخيص العمود الفقري – مصر'],
    services:['التقويم اليدوي للعمود الفقري والمفاصل','الطقطقة العلاجية','علاج مشاكل الفك','علاج الصداع العنقي والتشنجات العضلية','علاج آلام العضلات المزمنة','تأهيل متكامل للإصابات الرياضية وما قبل وبعد الجراحة','علاج مشاكل الاحتكاك والديسك والتهاب الأوتار','علاج حالات الجنف','علاج آلام الرقبة والظهر المزمنة']
  },
  {
    slug:'reem-barakat',nameAr:'ريم بركات',nameEn:'Reem Barakat',titleAr:'أخصائية العلاج الطبيعي',titleEn:'Physical Therapy Specialist',department:'women',category:'physical',photo:'/assets/team/reem-barakat.webp',
    summaryAr:'خبرة في التصريف الليمفاوي وإعادة التأهيل بعد العمليات ومشكلات العمود الفقري.',summaryEn:'Focuses on lymphatic drainage, postoperative rehabilitation and spine conditions.',
    qualifications:['بكالوريوس علاج طبيعي بدرجة امتياز مع مرتبة الشرف – جامعة ميديبول إسطنبول','اعتماد ممارسة الإبر الجافة','دبلوم التصريف الليمفاوي والليبيديما','شهادة استخدام الكاسات الجافة واللاصق الطبي','شهادة تقنية IASTM لعلاج الأنسجة والعضلات','دورات في تشخيص وعلاج المفاصل والعمود الفقري'],
    services:['علاج حالات الليمفوديما والليبيديما','تأهيل حالات الأورام وسرطان الثدي','تأهيل ما قبل وبعد عمليات التكميم','علاج حالات الإمساك المزمن','تأهيل حالات بتر الأطراف','تأهيل ما قبل وبعد العمليات الجراحية وتبديل المفاصل','علاج الأبهر ومشاكل الكتف والرقبة','تأهيل حالات الجنف ومشاكل العمود الفقري','علاج مشاكل القدم واللفافة الأخمصية']
  },
  {
    slug:'heba-alhabib',nameAr:'هبه الحبيب',nameEn:'Heba Alhabib',titleAr:'أخصائية أولى في العظام والآلام المزمنة',titleEn:'Senior Orthopedic & Chronic Pain Specialist',department:'women',category:'orthopedic',photo:'/assets/team/heba-alhabib.webp',
    summaryAr:'تأهيل الجهاز العضلي الهيكلي والألم المزمن والإصابات الرياضية.',summaryEn:'Musculoskeletal, chronic pain and sports injury rehabilitation.',
    qualifications:['ماجستير في تخصص العظام والجهاز العضلي الهيكلي – جامعة بيتسبرغ، الولايات المتحدة الأمريكية','بكالوريوس العلاج الطبيعي – جامعة الملك سعود','دورات معتمدة في تخصص الألم المزمن','ماستر كلاس لعلاج الآلام المزمنة','ماستر كلاس في تأهيل الكتف والأطراف العلوية المزمنة','دبلوم اللياقة والصحة البدنية – الأكاديمية البريطانية','دبلوم الفيفا في تأهيل الإصابات الرياضية – أمريكا','دورات تدريبية معتمدة في العلاج السلوكي المعرفي','دبلوم البرمجة اللغوية العصبية','ممارس معتمد لتقويم العمود الفقري والتحريك اليدوي','ممارس معتمد للعلاج بالإبر الجافة والأكواب الجافة واللاصق الطبي وIASTM','عضو مستشار للمشاريع الطبية','محاضرة ومشاركة في المؤتمرات والكورسات التعليمية داخل وخارج المملكة','باحثة وكاتبة للمقالات العلمية الحديثة'],
    services:['علاج حالات الآلام المزمنة المركبة','علاج حالات الفايبروميالجيا ومتلازمة الإرهاق المزمن','تأهيل حالات الروماتويد والروماتيزم وخشونة المفاصل والديسك','علاج متلازمة الظهر والرقبة التوترية','تأهيل حالات الكسور والخلع والعمليات الجراحية المعقدة','علاج التهاب الأوتار والكتف المتجمد ومشاكل العمود الفقري','تأهيل التواءات المفاصل والتشنجات العضلية','تأهيل الإصابات الرياضية']
  },
  {
    slug:'abrar-almozal',nameAr:'أبرار المزعل',nameEn:'Abrar Almozal',titleAr:'أخصائية العلاج الطبيعي',titleEn:'Physical Therapy Specialist',department:'women',category:'sports',photo:'/assets/team/abrar-almozal.webp',
    summaryAr:'التدريب الرياضي العلاجي واللياقة واليوغا وبرامج الحركة الوقائية.',summaryEn:'Therapeutic exercise, fitness, yoga and preventive movement programs.',
    qualifications:['بكالوريوس العلاج الطبيعي – جامعة الإمام عبدالرحمن بن فيصل','مدربة رياضية شخصية معتمدة','مدربة لليوغا والتأمل','مرشدة في مجال تطوير الذات وتمكين المرأة','مهتمة بالتوعية في علم النفس والسلوك','عضوة في منظمة التوستماستر العالمية للخطابة'],
    services:['التأهيل والتدريب الشخصي الرياضي والعلاجي','كلاسات التدريب الرياضي للمتعافين، للياقة البدنية، لإنقاص أو زيادة الوزن','برامج رياضية للحوامل وما بعد الولادة','برنامج التدريب الرياضي العلاجي للأطباء ومساعدين الأسنان','برنامج التدريب الرياضي للمعلمات','برنامج التدريب الرياضي الوقائي لخبراء التجميل والبشرة والشعر','كلاس اليوغا والتأمل','تأهيل حالات الظهر والعمود الفقري والأعصاب الطرفية']
  },
  {
    slug:'rida-alhabib',nameAr:'ريده الحبيب',nameEn:'Rida Alhabib',titleAr:'أخصائية تغذية علاجية ورياضية',titleEn:'Clinical & Sports Nutrition Specialist',department:'women',category:'nutrition',photo:'/assets/team/rida-alhabib.webp',
    summaryAr:'التغذية العلاجية والرياضية لمختلف الأعمار والحالات المزمنة، بخبرة عمل مذكورة تبلغ 23 عاماً.',summaryEn:'Clinical and sports nutrition across age groups and chronic conditions; the provided CV reports 23 years of experience.',
    qualifications:['ماجستير تغذية رياضية – جامعة لافبورو البريطانية','بكالوريوس تغذية سريرية – جامعة الملك سعود بالرياض','دبلومات متقدمة في تغذية الرضع وكبار السن والرياضيين وما بعد عمليات ضبط الوزن','كاتبة مقالات توعوية ومشاركة في لقاءات إذاعية وتلفزيونية وصحفية ومعتمدة من الهيئة العامة للتنظيم والإعلام','خبرة عمل منذ 23 عاماً، وفق السيرة المقدمة'],
    services:['تغذية مراحل العمر من الولادة إلى الشيخوخة','تغذية مرضى الآلام المزمنة والفايبروميالجيا','التكيسات واضطراب الهرمونات وانخفاض الخصوبة','التغذية في الأمراض المزمنة والمناعية والسرطان','أمراض الجهاز الهضمي وهشاشة العظام والحساسية','أمراض الدم الوراثية وفقر الدم الغذائي','تغذية ما بعد عمليات ضبط الوزن وحقن التنحيف ومشاكل الفكين والأسنان','إدارة الوزن (السمنة والنحافة) وتغذية الحوامل والمرضعات','تغذية الرياضيين']
  },
  {
    slug:'zainab-almuzain',nameAr:'زينب المزين',nameEn:'Zainab Al-Muzain',titleAr:'أخصائية أولى في تأهيل الأعصاب',titleEn:'Senior Neurological Rehabilitation Specialist',department:'women',category:'neurology',photo:'/assets/team/zainab-almuzain.webp',
    summaryAr:'تأهيل الأعصاب والجهاز الدهليزي ومشكلات التوازن والدوار.',summaryEn:'Neurological and vestibular rehabilitation, balance and dizziness care.',
    qualifications:['ماجستير تخصص الأعصاب والجهاز الدهليزي – جامعة بيتسبرغ، الولايات المتحدة الأمريكية','بكالوريوس علاج طبيعي – جامعة الملك سعود','محاضرة أكاديمية سابقة في كلية العلوم الطبية','ممارس معتمد لتقنيات العلاج اليدوي وتقويم العمود الفقري','ممارس معتمد للعلاج بالإبر الجافة واللاصق الطبي','ممارس معتمد لتمارين التاي شي لالتهاب المفاصل والحماية من السقوط'],
    services:['تأهيل حالات الشلل والجلطات والشلل الرعاشي','علاج الاعتلالات العصبية وعرق النسا','علاج الدوخة والدوار ومشاكل الجهاز الدهليزي','علاج أنواع الصداع المختلفة والصداع النصفي','إعادة تأهيل إصابات النخاع الشوكي ومرض منيير','إعادة تأهيل الأمراض الذهنية والجينية النادرة مثل مرض التانقو','علاج العصب السابع ومتلازمة النفق الرسغي والقدم الساقطة','علاج ضمور العضلات وتأهيل كبار السن','تأهيل حالات السقوط المتكرر وفقدان التوازن']
  },
  {
    slug:'ahmed-alsaeed',nameAr:'أحمد آل سعيد',nameEn:'Ahmed Al Saeed',titleAr:'الأخصائي النفسي',titleEn:'Psychological Specialist',department:'men',category:'psychology',photo:'/assets/team/ahmed-alsaeed.webp',
    summaryAr:'الإرشاد النفسي والعلاج المعرفي السلوكي ودعم الأطفال والأسر.',summaryEn:'Psychological counseling, cognitive behavioral approaches and family support.',
    qualifications:['بكالوريوس علم النفس – جامعة الملك سعود بالرياض','دبلوم الإرشاد والعلاج النفسي – جامعة الملك سعود بالرياض','دورة العلاقات الإنسانية – معهد الإدارة العامة بالدمام','دورات متقدمة في العلاج النفسي السلوكي المعرفي (CBT) – مجمع إرادة والصحة النفسية بالدمام','عضو ومستشار في مراكز إرشادية وتأهيلية','تقديم محاضرات وورش عمل ودورات في المدارس والمستشفيات والجمعيات بالمنطقة الشرقية','المشاركة في لقاءات تلفزيونية وإذاعية وصحفية عن الصحة النفسية','إعداد كتيبات ومطويات توعوية'],
    services:['علاج وتعديل المشكلات السلوكية الشائعة لدى الأطفال والمراهقين','تقديم الدعم والإرشاد الوقائي والعلاجي للأطفال في الوقاية من التحرش والتعامل مع آثاره','تطبيق بدائل العقاب لتوجيه وتعديل سلوك الأطفال','التعامل مع فرط الحركة وتشتت الانتباه (ADHD) عند الأطفال','جلسات العلاج المعرفي السلوكي (CBT) للاضطرابات النفسية والسلوكية','التعامل مع الضغوط النفسية وإدارتها','تعزيز الثقة بالنفس وتوكيد الذات وتنمية الذكاء العاطفي','الاستشارات لحل المشكلات والخلافات الزوجية','التعامل مع العنف الأسري وحماية الأفراد']
  },
  {
    slug:'deema-bitar',nameAr:'ديمة بيطار',nameEn:'Deema Bitar',titleAr:'أخصائية أولى في العلاج الطبيعي وصحة المرأة',titleEn:'Senior Women’s Health Physical Therapist',department:'women',category:'womens',photo:'/assets/team/deema-bitar.webp',
    summaryAr:'تأهيل قاع الحوض وصحة المرأة، والتأهيل أثناء الحمل وبعد الولادة.',summaryEn:'Pelvic floor and women’s health rehabilitation during and after pregnancy.',
    qualifications:['بكالوريوس علاج طبيعي – جامعة الشارقة','ماجستير العلاج الطبيعي – جامعة الشارقة','شهادة الممارسة المتقدمة في العلاج الطبيعي في صحة النساء والتوليد – الجمعية الأمريكية للعلاج الطبيعي','مدربة يوغا معتمدة من Yoga Vista Institute','خبرة عمل سابقة في مركز كاينيزيا للعلاج الطبيعي بدولة الكويت'],
    services:['تأهيل اضطرابات قاع الحوض','علاج هبوط الرحم والمستقيم والمثانة','علاج مشاكل سلس البول والبراز','حالات الانفصال العضلي','علاج الآلام العضلية والهيكلية للحوامل','تأهيل الحامل والتحضير للولادة','تأهيل ما بعد العمليات القيصرية والولادة الطبيعية','تأهيل مرحلة انقطاع الدورة الشهرية ومشكلات هشاشة ولين العظام وقاع الحوض','تأهيل ما بعد العمليات الجراحية النسائية مثل استئصال الرحم','تأهيل الإصابات الرياضية','تأهيل الحالات العضلية والهيكلية وآلام الحوض المزمنة','علاج الآلام المصاحبة لبطانة الرحم المهاجرة']
  },
  {
    slug:'batool-hakami',nameAr:'بتول حاكمي',nameEn:'Batool Hakami',titleAr:'أخصائية العلاج الطبيعي',titleEn:'Physical Therapy Specialist',department:'women',category:'physical',photo:'/assets/team/batool-hakami.webp',
    summaryAr:'تأهيل الجهاز العضلي الهيكلي وكبار السن واستعادة الحركة والتوازن.',summaryEn:'Musculoskeletal and geriatric rehabilitation, mobility and balance restoration.',
    qualifications:['بكالوريوس العلاج الطبيعي والتأهيل – جامعة كارابوك، تركيا','شهادة معتمدة في تطبيق اللاصق الطبي','شهادة معتمدة في تقنيات المساج العلاجي','دورات لتأهيل الحالات العضلية والآلام الإجهادية','ممارس معتمد للإبر الجافة'],
    services:['تأهيل كبار السن واستعادة التوازن والحركة الوظيفية','تأهيل آلام وإصابات الجهاز العضلي الهيكلي','علاج مشاكل الديسك واحتكاك المفاصل','علاج الشدود والالتواءات والتهاب الأوتار','تدريب استعادة المشي والحركة الوظيفية','العلاج التأهيلي لحالات الأعصاب كالجلطات']
  },
  {
    slug:'ghada-almokhtar',nameAr:'غادة آل مختار',nameEn:'Ghada Al Mokhtar',titleAr:'الأخصائية النفسية',titleEn:'Psychological Specialist',department:'women',category:'psychology',photo:'/assets/team/ghada-almokhtar.webp',
    summaryAr:'الإرشاد النفسي والأسري والدعم السلوكي والعلاج الجدلي السلوكي.',summaryEn:'Psychological and family counseling, behavioral support and dialectical behavior therapy.',
    qualifications:['باحثة ماجستير في الإرشاد النفسي الأسري','بكالوريوس مع مرتبة الشرف في علم النفس العام – مسار عيادي، جامعة الملك عبدالعزيز بجدة','دبلوم العلاج الجدلي السلوكي (DBT)','خبرة عمل سابقة لسنوات في مؤسسات صحية وتربوية','تقييم عام ممتاز في السلوك المهني وجيد جداً في المعرفة المهنية بمجمع الأمل للصحة النفسية','تكريم كمتدربة متميزة في مجمع الأمل للصحة النفسية','دورات وتدريبات في علم النفس العيادي والتربوي والسلوكي'],
    services:['إجراء المقابلات الشخصية وتقييم الحالات وفق المسار العلاجي المناسب','التعامل مع الوسواس القهري والاكتئاب والقلق والهلع والضغوط وتنظيم المشاعر','الإرشاد الأسري في المشكلات السلوكية للأطفال والمراهقين','الدعم النفسي لمرضى السرطان والآلام المزمنة والأمراض المناعية','تعليم استراتيجيات إدارة الضغوط وتنظيم المشاعر','العلاج السلوكي المعرفي في التعامل مع الألم والأرق واضطرابات النوم','اضطرابات ما بعد الصدمة والبعد العاطفي للألم','صعوبات التكيف مع ضغوط الحياة','تطوير الثقة بالنفس وتقدير الذات وتوكيدها','استشارات أسرية وزوجية لتحسين التواصل','الإرشاد الشخصي وتطوير الذات','الإرشاد الأسري للسلوكيات لدى الأطفال والمراهقين','الخطط العلاجية السلوكية للطلبة وتطبيق المقاييس المناسبة']
  }
];
export type Specialty={slug:string;nameAr:string;nameEn:string;introAr:string;introEn:string;icon:'activity'|'heart'|'brain'|'leaf'|'sparkles'|'shield';category:string;image?:string};
export const specialties: Specialty[]=[
 {slug:'physical-therapy',nameAr:'العلاج الطبيعي',nameEn:'Physical Therapy',introAr:'برامج لتحسين الحركة وتقليل الألم واستعادة الوظيفة اليومية.',introEn:'Personalized programs to improve mobility, ease pain and restore daily function.',icon:'activity',category:'physical'},
 {slug:'orthopedic-rehabilitation',nameAr:'تأهيل العظام والآلام المزمنة',nameEn:'Orthopedic & Chronic Pain',introAr:'خطط تأهيل للمفاصل والعمود الفقري وآلام الجهاز العضلي الهيكلي.',introEn:'Rehabilitation for joints, spine and musculoskeletal conditions.',icon:'shield',category:'orthopedic'},
 {slug:'neurological-rehabilitation',nameAr:'التأهيل العصبي والاتزان',nameEn:'Neurological Rehabilitation',introAr:'دعم الحركة والاتزان بعد الإصابات والحالات العصبية.',introEn:'Care supporting movement and balance for neurological conditions.',icon:'brain',category:'neurology'},
 {slug:'sports-rehabilitation',nameAr:'التأهيل الرياضي',nameEn:'Sports Rehabilitation',introAr:'برامج للتعافي من الإصابات والعودة التدريجية للنشاط.',introEn:'Rehabilitation programs for injury recovery and safe return to activity.',icon:'activity',category:'sports'},
 {slug:'womens-health',nameAr:'العلاج الطبيعي لصحة المرأة',nameEn:'Women’s Health',introAr:'رعاية متخصصة للحمل وما بعد الولادة وتأهيل قاع الحوض.',introEn:'Specialized care for pregnancy, postpartum recovery and pelvic health.',icon:'heart',category:'womens'},
 {slug:'nutrition',nameAr:'التغذية العلاجية والرياضية',nameEn:'Clinical & Sports Nutrition',introAr:'تغذية قائمة على الاحتياج الصحي والنشاط الرياضي.',introEn:'Nutrition guidance tailored to health and performance goals.',icon:'leaf',category:'nutrition'},
 {slug:'psychology',nameAr:'الإرشاد والدعم النفسي',nameEn:'Psychological Support',introAr:'خدمات إرشادية ونفسية متخصصة للأفراد والأسر.',introEn:'Psychological counseling and support for individuals and families.',icon:'sparkles',category:'psychology'}
];
export function tr(lang:Language,ar:string,en:string){return lang==='ar'?ar:en;}
export function getProfile(slug:string){return profiles.find(p=>p.slug===slug)}
export function getSpecialty(slug:string){return specialties.find(s=>s.slug===slug)}
