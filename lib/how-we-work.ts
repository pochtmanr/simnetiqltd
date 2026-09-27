import type { Locale } from "@/lib/i18n";

export type HowWeWork = {
  slug: string;
  code: string;
  badge: string;
  /** First (primary, full-text) part of the headline. */
  title: string;
  /** Second (dim) fragment of the headline, e.g. "the engineers". */
  titleSecondary: string;
  tagline: string;
  summary: string;
  sections: { heading: string; body: string }[];
  faq: { q: string; a: string }[];
  meta: { label: string; value: string }[];
};

/** Combined human-readable title used in listings, breadcrumbs, schema, and metadata. */
export function getHowWeWorkFullTitle(e: HowWeWork): string {
  return `${e.title} ${e.titleSecondary}`.replace(/\s+/g, " ").trim();
}

const howWeWorkEn: HowWeWork[] = [
  {
    slug: "work-directly-with-engineers",
    code: "W-01",
    badge: "DIRECT CONTACT · CLEAR RESPONSIBILITY",
    title: "Work directly with",
    titleSecondary: "the engineer",
    tagline: "The engineer who scopes your project also builds it.",
    summary: "Work with the people responsible for your project, from the first conversation to launch. Roman handles engineering; David handles contracts, compliance and finance. You know who to ask and who makes each decision.",
    sections: [
      {
        heading: "Who you work with",
        body: "Simnetiq Ltd has two directors. Roman Pochtman leads mobile, web, AI and infrastructure development. David Zitomirsky handles contracts, compliance and finance. Technical questions go to Roman; questions about the agreement go to David. Simnetiq is registered in England and Wales, company number 16861177."
      },
      {
        heading: "How we estimate the work",
        body: "The engineer who will build the project also reviews the requirements and estimates the work. You can discuss technical choices and trade-offs directly, so the agreed scope reflects what needs to be built."
      },
      {
        heading: "Availability and start dates",
        body: "We take on a limited number of projects at a time. Availability depends on the size of each engagement, and we give you a start date when we scope the work. If we are booked, we tell you before you commit."
      },
      {
        heading: "Continuity if we become unavailable",
        body: "A small team has limited cover when someone is unavailable. Your source code, infrastructure access and deployment documentation stay with you so another engineer can continue. We document the setup throughout the project and flag delays as soon as we know about them."
      }
    ],
    faq: [
      {
        q: "Who will write the code?",
        a: "The engineer who scoped your project. We do not hand the work to a junior delivery team after the agreement is signed."
      },
      {
        q: "Can I speak to the engineer before signing?",
        a: "Yes. The scoping conversation is with the engineer who would do the work. We discuss your needs and whether we are a suitable fit before you sign anything."
      },
      {
        q: "How quickly do you respond?",
        a: "Routine questions receive a response within one working day. Questions blocking a release receive a response the same working day. We work UK hours and communicate in English, Hebrew and Russian."
      },
      {
        q: "What happens if you become unavailable?",
        a: "You already have the repository, infrastructure access and deployment documentation. Another engineer can continue from them. We also tell you when availability changes may affect the schedule."
      },
      {
        q: "How many projects do you take on?",
        a: "A limited number, depending on the size of each engagement. We confirm a start date during scoping so you can plan around our availability."
      }
    ],
    meta: [
      {
        label: "Team",
        value: "Two owner-operators"
      },
      {
        label: "Development",
        value: "The engineer who scopes the work"
      },
      {
        label: "Languages",
        value: "English · Hebrew · Russian"
      }
    ]
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "AGREED SCOPE · MILESTONES · FIXED PRICE",
    title: "Agree the scope",
    titleSecondary: "before work starts",
    tagline: "Deliverables, timeline and price agreed in writing.",
    summary: "Every engagement starts with a signed statement of work. It sets out what we will deliver, when we will deliver it and the agreed price. You can review what is included and decide before development begins.",
    sections: [
      {
        heading: "What the statement of work covers",
        body: "The statement of work lists the screens, integrations, platforms and other deliverables, with acceptance criteria for each. It includes milestones, the fixed price in GBP, anything you need to provide and any work excluded from the agreement."
      },
      {
        heading: "How a fixed price works",
        body: "You pay the agreed amount for the agreed scope. If we underestimate that work, the price stays the same. Defining the deliverables before development helps both sides make decisions about priorities and budget."
      },
      {
        heading: "When you want to change the scope",
        body: "We describe a requested change in a written amendment with its price and effect on the timeline. You decide whether to proceed before we add it. If we can absorb a small change at no extra cost, we say so."
      },
      {
        heading: "When discovery comes first",
        body: "For research, an unfamiliar codebase or a system with unclear requirements, we first scope a short paid discovery phase. You receive the findings and can use them with us or another developer. We then quote the build based on that work."
      },
      {
        heading: "Billing and company details",
        body: "We quote in GBP through Simnetiq Ltd, registered in England and Wales under company number 16861177. The registered address is 2 Frederick Street, Kings Cross, London WC1X 0ND. The company is not currently VAT-registered, so our quotes do not include VAT."
      }
    ],
    faq: [
      {
        q: "How is the project price decided?",
        a: "We quote against the agreed deliverables, integrations and platforms. The price is confirmed in writing before you commit."
      },
      {
        q: "How long does a project take?",
        a: "Most engagements run for two to ten weeks. Your statement of work includes the timeline and milestones for your project."
      },
      {
        q: "What if the work takes longer than estimated?",
        a: "The agreed price stays the same for the agreed scope. Requested changes or delays in receiving content, credentials or accounts can affect the timeline; we discuss those with you."
      },
      {
        q: "Can I change a feature during development?",
        a: "Yes. We set out the change, price and timeline in writing for your approval before proceeding."
      },
      {
        q: "Do you offer ongoing work?",
        a: "Yes, against defined deliverables. Ongoing work is scoped with a stated output rather than an open-ended monthly retainer."
      },
      {
        q: "Do you charge VAT?",
        a: "Simnetiq Ltd is not currently VAT-registered and does not add VAT to its quotes."
      }
    ],
    meta: [
      {
        label: "Agreement",
        value: "Signed before development starts"
      },
      {
        label: "Currency",
        value: "GBP · no VAT"
      },
      {
        label: "Typical duration",
        value: "2–10 weeks"
      }
    ]
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "YOUR CODE · YOUR ACCOUNTS · YOUR ACCESS",
    title: "Your project.",
    titleSecondary: "Your ownership.",
    tagline: "Your source code and project accounts are under your control.",
    summary: "The code we write for your product belongs to you. Your repository, accounts and deployment documentation let you continue with our team or another developer. Any hosting we manage and any third-party licences are set out in the agreement.",
    sections: [
      {
        heading: "What you receive",
        body: "Your source code is in your repository from the first commit. Hosting, database, monitoring and app store accounts are set up in your name, with your billing, unless we agree on managed hosting. You also receive credentials, signing certificates, architecture notes and deployment instructions."
      },
      {
        heading: "Access throughout the project",
        body: "You can access the repository and project accounts while development is in progress. Handover is part of the work from the start, so access does not depend on a final transfer at the end."
      },
      {
        heading: "When we manage hosting",
        body: "We can operate a server in your account with collaborator access. If you prefer us to provide hosting, the statement of work identifies what runs there, the cost and how to move it. You receive the configuration, deployment scripts and rebuild instructions needed to recreate the setup elsewhere."
      },
      {
        heading: "Third-party services and licences",
        body: "External services such as Stripe, Supabase and AI providers have their own terms and running costs. We identify those dependencies during scoping, including paid libraries that could affect a future move. Your accounts are billed directly unless the agreement specifies managed hosting."
      },
      {
        heading: "Components used across projects",
        body: "Shared infrastructure components may be open source under permissive licences or supplied under a perpetual, irrevocable licence at no extra cost. You retain the right to use them after our work together ends. The code written for your product belongs to you."
      }
    ],
    faq: [
      {
        q: "Who owns the code?",
        a: "You own the code written for your product. The statement of work assigns those rights to you. Reused components and third-party software retain their stated licences."
      },
      {
        q: "Can another developer take over?",
        a: "Yes. You have the repository, project accounts and deployment documentation. We will answer the next engineer’s questions to help with the transition."
      },
      {
        q: "Is there an ongoing licence fee to Simnetiq?",
        a: "No. You do not need to pay us a licence fee to keep using the software we built. Hosting, third-party services and any agreed support have their own costs."
      },
      {
        q: "What if Simnetiq provides the hosting?",
        a: "The agreement states what we host, its cost and how to move it. You hold the configuration, scripts and rebuild instructions. We can also set up the server in your account."
      },
      {
        q: "Do you reuse components?",
        a: "Yes, for shared infrastructure. Reused components are open source under permissive licences or provided under a perpetual, irrevocable licence at no extra cost. Your product code remains yours."
      },
      {
        q: "What running costs should I expect?",
        a: "Depending on the project: hosting, databases, AI APIs, payment processing and developer accounts. We identify them and estimate running costs during scoping."
      }
    ],
    meta: [
      {
        label: "Source code",
        value: "Your repository from the first commit"
      },
      {
        label: "Accounts",
        value: "Yours, with any hosting exception agreed"
      },
      {
        label: "Simnetiq licence fee",
        value: "None"
      }
    ]
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "MONITORING · MAINTENANCE · UPDATES",
    title: "Support",
    titleSecondary: "after launch",
    tagline: "Plan maintenance and the next steps before the product goes live.",
    summary: "A launched product needs updates, monitoring and someone responsible for incidents. We include monitoring and deployment automation in the build, and agree the scope and duration of support with you before launch.",
    sections: [
      {
        heading: "What is ready at launch",
        body: "Error tracking, uptime monitoring and an automated deployment process are part of the build. They help identify problems and make releases repeatable. These are included in the project scope."
      },
      {
        heading: "What maintenance covers",
        body: "Maintenance covers fixes to what we built, dependency and security updates, changes to operating systems and external APIs, certificate renewals and responses to monitoring alerts. The support agreement sets out the responsibilities and duration."
      },
      {
        heading: "When the support period ends",
        body: "Support has a defined scope, price and end date. We do not disable your software when support ends: you keep the code, accounts and documentation. You then take responsibility for updates and incidents, including any third-party services needed to run the product. New features are scoped separately."
      },
      {
        heading: "App store updates and reviews",
        body: "If we submitted your app, we handle resubmissions during the support period. This includes responding to review feedback and adapting to changes in platform and SDK requirements."
      },
      {
        heading: "Planning the next version",
        body: "Usage data, support requests and feedback help decide what to improve next. We use that evidence to scope a further phase around the needs that emerge after launch."
      }
    ],
    faq: [
      {
        q: "How is support priced?",
        a: "Support is quoted against a defined scope and period in the project agreement or a follow-on agreement. It depends on the product and the systems it uses."
      },
      {
        q: "What counts as maintenance?",
        a: "Fixes, dependency and security updates, platform changes and responses to monitoring alerts. New features, integrations and redesigns are quoted as separate work."
      },
      {
        q: "What happens when I stop support?",
        a: "We do not disable the software or withdraw your access. You become responsible for updates, incidents and running costs. You can return for a specific fix without a standing support agreement."
      },
      {
        q: "Who receives monitoring alerts?",
        a: "During the support period, we receive the alerts needed to maintain the product. When support ends, monitoring remains in your account and alerts go to you."
      },
      {
        q: "Who handles app store reviews and operating system changes?",
        a: "We handle them during the agreed support period if we submitted the app. The support scope includes the relevant platform updates and resubmissions."
      },
      {
        q: "How quickly do you respond to incidents?",
        a: "We respond the same working day when a live system is down, and within one working day for routine issues. Response expectations are written into the support scope."
      }
    ],
    meta: [
      {
        label: "Included in the build",
        value: "Monitoring · Automated deployment"
      },
      {
        label: "Support",
        value: "Defined scope and duration"
      },
      {
        label: "After support",
        value: "Your code, accounts and access remain yours"
      }
    ]
  }
];

const howWeWorkHe: HowWeWork[] = [
  {
    slug: "work-directly-with-engineers",
    code: "W-01",
    badge: "קשר ישיר · אחריות ברורה",
    title: "עובדים ישירות",
    titleSecondary: "עם המפתח",
    tagline: "המהנדס שמגדיר את הפרויקט גם בונה אותו.",
    summary: "עובדים עם האנשים שאחראים לפרויקט מהשיחה הראשונה ועד ההשקה. רומן אחראי לפיתוח; דוד אחראי להסכמים, לעמידה בדרישות ולכספים. ברור למי פונים ומי מקבל כל החלטה.",
    sections: [
      {
        heading: "עם מי עובדים",
        body: "ל-Simnetiq Ltd שני דירקטורים. Roman Pochtman מוביל את פיתוח המובייל, הווב, ה-AI והתשתיות. David Zitomirsky מטפל בהסכמים, בעמידה בדרישות ובכספים. שאלות טכניות מגיעות לרומן ושאלות על ההסכם לדוד. החברה רשומה באנגליה ובוויילס, מספר חברה 16861177."
      },
      {
        heading: "איך מעריכים את העבודה",
        body: "המהנדס שיבנה את הפרויקט גם בוחן את הדרישות ומעריך את העבודה. אפשר לדון ישירות בבחירות הטכניות ובפשרות, כך שההיקף המוסכם משקף את מה שצריך לבנות."
      },
      {
        heading: "זמינות ומועד התחלה",
        body: "אנחנו עובדים על מספר מוגבל של פרויקטים במקביל. הזמינות תלויה בהיקף כל פרויקט, ואת מועד ההתחלה קובעים בשלב הגדרת העבודה. אם אנחנו תפוסים, אומרים זאת לפני ההתחייבות."
      },
      {
        heading: "אם לא נוכל להמשיך",
        body: "לצוות קטן יש יכולת מוגבלת להחליף מי שאינו זמין. הקוד, הגישה לתשתיות והוראות ההפעלה נשארים אצלכם כדי שמפתח אחר יוכל להמשיך. אנחנו מתעדים לאורך הפרויקט ומעדכנים על עיכובים ברגע שנודע לנו עליהם."
      }
    ],
    faq: [
      {
        q: "מי יכתוב את הקוד?",
        a: "המהנדס שהגדיר את הפרויקט. העבודה אינה מועברת לצוות מפתחים מתחילים אחרי חתימת ההסכם."
      },
      {
        q: "אפשר לדבר עם המהנדס לפני שחותמים?",
        a: "כן. שיחת הגדרת העבודה מתקיימת עם המהנדס שיבצע אותה. בוחנים את הצרכים ואת ההתאמה שלנו לפרויקט לפני שחותמים."
      },
      {
        q: "תוך כמה זמן אתם עונים?",
        a: "לשאלות שוטפות עונים בתוך יום עבודה אחד. לשאלות שחוסמות השקה עונים באותו יום עבודה. עובדים לפי שעות העבודה בבריטניה ומתקשרים באנגלית, בעברית וברוסית."
      },
      {
        q: "מה קורה אם אינכם זמינים?",
        a: "מאגר הקוד, הגישה לתשתיות והוראות הפריסה כבר אצלכם. מפתח אחר יכול להמשיך בעזרתם. אנחנו מעדכנים כששינוי בזמינות עלול להשפיע על לוח הזמנים."
      },
      {
        q: "כמה פרויקטים אתם מנהלים במקביל?",
        a: "מספר מוגבל, בהתאם להיקף כל פרויקט. מועד ההתחלה נקבע בשלב הגדרת העבודה כדי שתוכלו לתכנן בהתאם."
      }
    ],
    meta: [
      {
        label: "צוות",
        value: "שני בעלי חברה שעובדים בפרויקטים"
      },
      {
        label: "פיתוח",
        value: "המהנדס שמגדיר את העבודה"
      },
      {
        label: "שפות",
        value: "אנגלית · עברית · רוסית"
      }
    ]
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "היקף מוסכם · אבני דרך · מחיר קבוע",
    title: "מסכימים על ההיקף",
    titleSecondary: "לפני שמתחילים",
    tagline: "התוצרים, לוח הזמנים והמחיר מוסכמים בכתב.",
    summary: "כל פרויקט מתחיל במסמך עבודה חתום. הוא מפרט מה נמסור, מתי ובאיזה מחיר. אפשר לבדוק מה כלול ולקבל החלטה לפני תחילת הפיתוח.",
    sections: [
      {
        heading: "מה כולל מסמך העבודה",
        body: "המסמך מפרט מסכים, חיבורים למערכות, פלטפורמות ותוצרים נוספים, עם תנאי קבלה לכל אחד. הוא כולל אבני דרך, מחיר קבוע בליש״ט, מה נדרש מכם לספק ומה אינו כלול בהסכם."
      },
      {
        heading: "איך עובד מחיר קבוע",
        body: "משלמים את הסכום המוסכם עבור ההיקף המוסכם. אם הערכנו את העבודה בחסר, המחיר אינו משתנה. הגדרת התוצרים מראש עוזרת לשני הצדדים לקבוע סדרי עדיפויות ותקציב."
      },
      {
        heading: "כשמבקשים לשנות את ההיקף",
        body: "מתארים את השינוי בנספח כתוב, כולל המחיר והשפעתו על לוח הזמנים. אתם מחליטים אם להתקדם לפני שמוסיפים אותו לעבודה. אם אפשר לכלול שינוי קטן ללא תוספת תשלום, אומרים זאת."
      },
      {
        heading: "מתי מתחילים בבדיקה",
        body: "למחקר, לקוד שאיננו מכירים או למערכת עם דרישות לא ברורות, מגדירים תחילה שלב בדיקה קצר בתשלום. התוצאות נמסרות לכם ואפשר להשתמש בהן איתנו או עם מפתח אחר. על בסיסן נותנים הצעה לפיתוח."
      },
      {
        heading: "תשלום ופרטי החברה",
        body: "ההצעות ניתנות בליש״ט מטעם Simnetiq Ltd, הרשומה באנגליה ובוויילס במספר 16861177. הכתובת הרשומה היא 2 Frederick Street, Kings Cross, London WC1X 0ND. החברה אינה רשומה כיום לצורכי מע״מ בבריטניה, ולכן אינה מוסיפה מע״מ להצעות."
      }
    ],
    faq: [
      {
        q: "איך נקבע מחיר הפרויקט?",
        a: "לפי התוצרים, החיבורים והפלטפורמות המוסכמים. המחיר מאושר בכתב לפני ההתחייבות."
      },
      {
        q: "כמה זמן נמשך פרויקט?",
        a: "רוב הפרויקטים נמשכים בין שבועיים לעשרה שבועות. מסמך העבודה מפרט את לוח הזמנים ואבני הדרך של הפרויקט שלכם."
      },
      {
        q: "מה קורה אם העבודה נמשכת יותר מההערכה?",
        a: "המחיר נשאר קבוע עבור ההיקף המוסכם. שינויים שביקשתם או עיכובים בקבלת תוכן, גישה וחשבונות יכולים להשפיע על המועד, ואנחנו דנים בכך איתכם."
      },
      {
        q: "אפשר לשנות יכולת בזמן הפיתוח?",
        a: "כן. לפני שמבצעים את השינוי מסכימים בכתב על התוכן שלו, המחיר והשפעתו על לוח הזמנים."
      },
      {
        q: "אפשר לעבוד איתכם באופן שוטף?",
        a: "כן, עבור תוצרים מוגדרים. גם עבודה מתמשכת מתוכננת עם היקף ותוצאה מוסכמים."
      },
      {
        q: "אתם גובים מע״מ?",
        a: "Simnetiq Ltd אינה רשומה כיום לצורכי מע״מ בבריטניה ואינה מוסיפה אותו להצעות."
      }
    ],
    meta: [
      {
        label: "הסכם",
        value: "נחתם לפני תחילת הפיתוח"
      },
      {
        label: "מטבע",
        value: "GBP · ללא מע״מ"
      },
      {
        label: "משך טיפוסי",
        value: "2–10 שבועות"
      }
    ]
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "הקוד שלכם · החשבונות שלכם · הגישה שלכם",
    title: "הפרויקט שלכם.",
    titleSecondary: "הבעלות שלכם.",
    tagline: "קוד המקור וחשבונות הפרויקט בשליטתכם.",
    summary: "הקוד שאנחנו כותבים למוצר שייך לכם. מאגר הקוד, החשבונות והתיעוד מאפשרים להמשיך איתנו או עם מפתח אחר. אחסון שאנחנו מנהלים ורישיונות צד שלישי מפורטים בהסכם.",
    sections: [
      {
        heading: "מה מקבלים",
        body: "קוד המקור נמצא במאגר שלכם מהשינוי הראשון. חשבונות האחסון, מסדי הנתונים, הניטור וחנויות האפליקציות רשומים על שמכם ובחיוב שלכם, אלא אם סוכם על אחסון שלנו. מקבלים גם פרטי גישה, תעודות חתימה, תיעוד ארכיטקטורה והוראות פריסה."
      },
      {
        heading: "גישה לאורך הפרויקט",
        body: "יש לכם גישה למאגר הקוד ולחשבונות בזמן הפיתוח. ההכנה להעברת הפרויקט מתחילה מראש, כך שהגישה אינה תלויה בהעברה בסוף העבודה."
      },
      {
        heading: "כשאנחנו מנהלים את האחסון",
        body: "אפשר להפעיל שרת בחשבון שלכם עם הרשאת גישה לצוות שלנו. אם אנחנו מספקים אחסון, מסמך העבודה מפרט מה פועל בו, מה העלות ואיך להעביר אותו. ההגדרות, הסקריפטים והוראות ההקמה נמסרים לכם כדי שאפשר יהיה לשחזר את המערכת במקום אחר."
      },
      {
        heading: "שירותים ורישיונות של צד שלישי",
        body: "ל-Stripe, ל-Supabase, לספקי AI ולשירותים חיצוניים נוספים יש תנאים ועלויות משלהם. בשלב הגדרת העבודה מציינים את התלויות, כולל ספריות בתשלום שעלולות להשפיע על מעבר עתידי. החיוב נעשה בחשבונות שלכם, למעט אחסון שסוכם בנפרד."
      },
      {
        heading: "רכיבים משותפים",
        body: "רכיבי תשתית משותפים נמסרים בקוד פתוח עם רישיון מתירני, או ברישיון קבוע ובלתי חוזר ללא תשלום נוסף. הזכות להשתמש בהם נשמרת גם אחרי סיום העבודה המשותפת. הקוד שנכתב למוצר שלכם שייך לכם."
      }
    ],
    faq: [
      {
        q: "למי שייך הקוד?",
        a: "הקוד שנכתב למוצר שייך לכם, וההסכם מעביר את הזכויות אליכם. על רכיבים משותפים ותוכנות צד שלישי חלים הרישיונות שלהם."
      },
      {
        q: "מפתח אחר יכול להמשיך את העבודה?",
        a: "כן. מאגר הקוד, החשבונות והוראות הפריסה אצלכם. נענה לשאלות של המפתח הבא כדי לעזור בהעברה."
      },
      {
        q: "צריך לשלם לסימנטיק דמי רישיון שוטפים?",
        a: "לא. אין דמי רישיון לסימנטיק כדי להמשיך להשתמש בתוכנה שבנינו. לאחסון, לשירותים חיצוניים ולתמיכה מוסכמת יש עלויות משלהם."
      },
      {
        q: "מה אם סימנטיק מספקת את האחסון?",
        a: "ההסכם מציין מה אנחנו מארחים, מה העלות ואיך להעביר את המערכת. ההגדרות, הסקריפטים והוראות ההקמה אצלכם. אפשר גם להקים את השרת בחשבון שלכם."
      },
      {
        q: "אתם משתמשים ברכיבים במספר פרויקטים?",
        a: "כן, בתשתיות משותפות. הרכיבים נמסרים ברישיון קוד פתוח מתירני או ברישיון קבוע ובלתי חוזר ללא תוספת תשלום. קוד המוצר שלכם נשאר שלכם."
      },
      {
        q: "אילו הוצאות שוטפות צפויות?",
        a: "בהתאם לפרויקט: אחסון, מסדי נתונים, שירותי AI, סליקת תשלומים וחשבונות מפתחים. מפרטים אותם ומעריכים את העלויות בשלב הגדרת העבודה."
      }
    ],
    meta: [
      {
        label: "קוד מקור",
        value: "במאגר שלכם מהשינוי הראשון"
      },
      {
        label: "חשבונות",
        value: "שלכם; חריגות אחסון בהסכמה"
      },
      {
        label: "דמי רישיון לסימנטיק",
        value: "אין"
      }
    ]
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "ניטור · תחזוקה · עדכונים",
    title: "תמיכה",
    titleSecondary: "אחרי ההשקה",
    tagline: "מתכננים את התחזוקה והצעדים הבאים לפני שהמוצר עולה לאוויר.",
    summary: "מוצר שהושק צריך עדכונים, ניטור ואחריות לטיפול בתקלות. אנחנו כוללים ניטור ואוטומציה של הפריסה בפיתוח, ומסכימים איתכם על היקף התמיכה ומשכה לפני ההשקה.",
    sections: [
      {
        heading: "מה מוכן להשקה",
        body: "מעקב שגיאות, ניטור זמינות ותהליך פריסה אוטומטי הם חלק מהפיתוח. הם עוזרים לזהות בעיות ולבצע עדכונים בתהליך מסודר שאפשר לחזור עליו. הם נכללים בהיקף הפרויקט."
      },
      {
        heading: "מה כוללת התחזוקה",
        body: "תיקון תקלות במה שבנינו, עדכוני ספריות ואבטחה, התאמות לשינויים במערכות הפעלה ובממשקים חיצוניים, חידוש תעודות וטיפול בהתראות ניטור. הסכם התמיכה מגדיר את האחריות ואת התקופה."
      },
      {
        heading: "כשמסתיימת תקופת התמיכה",
        body: "לתמיכה יש היקף, מחיר ומועד סיום מוגדרים. אנחנו לא משביתים את התוכנה כשהתמיכה מסתיימת: הקוד, החשבונות והתיעוד נשארים שלכם. האחריות לעדכונים, לתקלות ולשירותים החיצוניים הנדרשים עוברת אליכם. יכולות חדשות מוגדרות בנפרד."
      },
      {
        heading: "עדכונים ובדיקות בחנויות",
        body: "אם אנחנו הגשנו את האפליקציה, נטפל בהגשות חוזרות בתקופת התמיכה. העבודה כוללת מענה להערות הבדיקה והתאמה לשינויים בדרישות הפלטפורמות וערכות הפיתוח."
      },
      {
        heading: "תכנון הגרסה הבאה",
        body: "נתוני שימוש, פניות תמיכה ומשוב עוזרים להחליט מה לשפר בהמשך. לפיהם מגדירים שלב נוסף שמתאים לצרכים שהתגלו אחרי ההשקה."
      }
    ],
    faq: [
      {
        q: "איך מתמחרים תמיכה?",
        a: "לפי היקף ותקופה מוגדרים, בהסכם הפרויקט או בהסכם המשך. העלות תלויה במוצר ובמערכות שעליהן הוא פועל."
      },
      {
        q: "מה נחשב תחזוקה?",
        a: "תיקונים, עדכוני ספריות ואבטחה, התאמות לפלטפורמות וטיפול בהתראות. יכולות חדשות, חיבורים חדשים ועיצוב מחדש מתומחרים בנפרד."
      },
      {
        q: "מה קורה כשאני מפסיק את התמיכה?",
        a: "אנחנו לא משביתים את התוכנה ולא מבטלים את הגישה. האחריות לעדכונים, לתקלות ולעלויות השוטפות עוברת אליכם. אפשר לפנות לתיקון נקודתי ללא הסכם תמיכה קבוע."
      },
      {
        q: "מי מקבל התראות ניטור?",
        a: "בתקופת התמיכה אנחנו מקבלים את ההתראות הדרושות לתחזוקת המוצר. כשהיא מסתיימת, הניטור נשאר בחשבון שלכם וההתראות מגיעות אליכם."
      },
      {
        q: "מי מטפל בבדיקות החנויות ובעדכוני מערכות הפעלה?",
        a: "אנחנו, במהלך תקופת התמיכה המוסכמת, אם הגשנו את האפליקציה. העדכונים וההגשות החוזרות הרלוונטיים כלולים בהיקף התמיכה."
      },
      {
        q: "תוך כמה זמן אתם מגיבים לתקלה?",
        a: "באותו יום עבודה כשמערכת פעילה מושבתת, ובתוך יום עבודה אחד לבעיות שוטפות. זמני התגובה מוגדרים בהסכם התמיכה."
      }
    ],
    meta: [
      {
        label: "כלול בפיתוח",
        value: "ניטור · פריסה אוטומטית"
      },
      {
        label: "תמיכה",
        value: "היקף ותקופה מוגדרים"
      },
      {
        label: "אחרי התמיכה",
        value: "הקוד, החשבונות והגישה נשארים שלכם"
      }
    ]
  }
];

const howWeWorkRu: HowWeWork[] = [
  {
    slug: "work-directly-with-engineers",
    code: "W-01",
    badge: "ПРЯМОЕ ОБЩЕНИЕ · ПОНЯТНАЯ ОТВЕТСТВЕННОСТЬ",
    title: "Работайте напрямую",
    titleSecondary: "с разработчиком",
    tagline: "Проект оценивает и разрабатывает один и тот же инженер.",
    summary: "Вы общаетесь с ответственными за проект от первой встречи до запуска. Роман занимается разработкой, Давид — договорами, соблюдением требований и финансами. Вы знаете, к кому обратиться и кто принимает решения.",
    sections: [
      {
        heading: "С кем вы работаете",
        body: "У Simnetiq Ltd два директора. Roman Pochtman отвечает за мобильную и веб-разработку, ИИ и инфраструктуру. David Zitomirsky занимается договорами, соблюдением требований и финансами. Технические вопросы вы обсуждаете с Романом, условия договора — с Давидом. Компания зарегистрирована в Англии и Уэльсе под номером 16861177."
      },
      {
        heading: "Как оцениваем работу",
        body: "Требования изучает и работу оценивает тот инженер, который будет создавать продукт. Вы напрямую обсуждаете технические решения и ограничения, чтобы согласованный объём отражал реальные задачи проекта."
      },
      {
        heading: "Загрузка и дата начала",
        body: "Мы ведём ограниченное число проектов одновременно. Загрузка зависит от объёма каждой работы. Дату начала согласуем при оценке и сообщаем о занятости до того, как вы подпишете договор."
      },
      {
        heading: "Если мы не сможем продолжить",
        body: "У небольшой команды ограничены возможности подменить отсутствующего участника. Код, доступы и инструкции по развёртыванию остаются у вас, чтобы другой инженер мог продолжить работу. Документацию ведём по ходу проекта и сообщаем о задержках, как только узнаём о них."
      }
    ],
    faq: [
      {
        q: "Кто будет писать код?",
        a: "Инженер, который оценивал ваш проект. После подписания договора работа не передаётся команде начинающих разработчиков."
      },
      {
        q: "Можно поговорить с инженером до подписания договора?",
        a: "Да. Вы обсуждаете задачу с инженером, который будет её выполнять. До подписания договора выясняем, подходим ли мы вашему проекту."
      },
      {
        q: "Как быстро вы отвечаете?",
        a: "На обычные вопросы — в течение одного рабочего дня. На вопросы, блокирующие выпуск, — в тот же рабочий день. Работаем по британскому графику и общаемся на английском, иврите и русском."
      },
      {
        q: "Что будет, если вы станете недоступны?",
        a: "У вас уже есть репозиторий, доступ к инфраструктуре и инструкции по развёртыванию. Другой инженер сможет продолжить работу. Об изменениях нашей доступности, которые влияют на сроки, мы сообщаем заранее."
      },
      {
        q: "Сколько проектов вы ведёте одновременно?",
        a: "Ограниченное число, в зависимости от объёма каждой работы. При оценке согласуем дату начала, чтобы вы могли планировать запуск."
      }
    ],
    meta: [
      {
        label: "Команда",
        value: "Два владельца, участвующих в работе"
      },
      {
        label: "Разработка",
        value: "Инженер, который оценивает проект"
      },
      {
        label: "Языки",
        value: "Английский · Иврит · Русский"
      }
    ]
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "ОБЪЁМ РАБОТ · ЭТАПЫ · ФИКСИРОВАННАЯ ЦЕНА",
    title: "Согласуем объём",
    titleSecondary: "до начала работ",
    tagline: "Результат, сроки и цена закреплены в письменном соглашении.",
    summary: "Каждый проект начинается с подписанного описания работ. В нём указано, что мы создадим, в какие сроки и по какой цене. Вы можете изучить условия и принять решение до начала разработки.",
    sections: [
      {
        heading: "Что входит в описание работ",
        body: "Документ перечисляет экраны, интеграции, платформы и другие результаты с критериями готовности. В нём указаны этапы, фиксированная цена в фунтах стерлингов, материалы и доступы с вашей стороны, а также работы, не входящие в договор."
      },
      {
        heading: "Как действует фиксированная цена",
        body: "За согласованный объём вы платите согласованную сумму. Если мы недооценили эту работу, цена не меняется. Подробное описание до разработки помогает обеим сторонам определить приоритеты и бюджет."
      },
      {
        heading: "Если нужно изменить объём",
        body: "Описываем изменение, его стоимость и влияние на сроки в письменном дополнении. Вы решаете, включать ли его в работу. Если небольшое изменение можем выполнить без доплаты, сообщаем об этом."
      },
      {
        heading: "Когда сначала нужно исследование",
        body: "Для исследований, незнакомой кодовой базы или системы с неясными требованиями сначала согласуем короткий оплачиваемый этап изучения. Вы получаете результаты и можете использовать их с нами или другим разработчиком. Затем оцениваем разработку на их основе."
      },
      {
        heading: "Оплата и реквизиты",
        body: "Выставляем предложения в фунтах стерлингов от Simnetiq Ltd, зарегистрированной в Англии и Уэльсе под номером 16861177. Юридический адрес: 2 Frederick Street, Kings Cross, London WC1X 0ND. Компания сейчас не зарегистрирована плательщиком НДС, поэтому не добавляет НДС к предложениям."
      }
    ],
    faq: [
      {
        q: "Как определяется стоимость проекта?",
        a: "По согласованным результатам, интеграциям и платформам. Цена подтверждается письменно до заключения договора."
      },
      {
        q: "Сколько времени занимает проект?",
        a: "Большинство проектов занимает от двух до десяти недель. Сроки и этапы вашего проекта указаны в описании работ."
      },
      {
        q: "Что если работа займёт больше времени?",
        a: "Для согласованного объёма цена остаётся прежней. Запрошенные изменения или задержки с контентом, доступами и аккаунтами могут повлиять на сроки — мы обсуждаем это с вами."
      },
      {
        q: "Можно изменить функцию во время разработки?",
        a: "Да. До начала изменений письменно согласуем их содержание, цену и влияние на сроки."
      },
      {
        q: "Можно договориться о постоянной работе?",
        a: "Да, с определёнными результатами. Для последующей работы тоже согласуем объём и ожидаемый результат."
      },
      {
        q: "Вы начисляете НДС?",
        a: "Simnetiq Ltd сейчас не зарегистрирована плательщиком НДС и не добавляет его к своим предложениям."
      }
    ],
    meta: [
      {
        label: "Соглашение",
        value: "Подписывается до начала разработки"
      },
      {
        label: "Валюта",
        value: "GBP · без НДС"
      },
      {
        label: "Обычный срок",
        value: "2–10 недель"
      }
    ]
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "ВАШ КОД · ВАШИ АККАУНТЫ · ВАШ ДОСТУП",
    title: "Ваш проект.",
    titleSecondary: "Ваши права.",
    tagline: "Исходный код и аккаунты проекта под вашим контролем.",
    summary: "Код, который мы пишем для вашего продукта, принадлежит вам. Репозиторий, аккаунты и документация позволяют продолжить работу с нами или другим разработчиком. Наш хостинг и сторонние лицензии оговариваются отдельно.",
    sections: [
      {
        heading: "Что вы получаете",
        body: "Исходный код находится в вашем репозитории с первого коммита. Аккаунты хостинга, баз данных, мониторинга и магазинов приложений оформляются на вас и оплачиваются вами, если не согласован наш хостинг. Вы также получаете доступы, сертификаты подписи, описание архитектуры и инструкции по развёртыванию."
      },
      {
        heading: "Доступ в ходе проекта",
        body: "Вы имеете доступ к репозиторию и аккаунтам во время разработки. Передачу проекта готовим с самого начала, поэтому доступ не зависит от финального этапа."
      },
      {
        heading: "Если хостинг ведём мы",
        body: "Мы можем обслуживать сервер в вашем аккаунте с предоставленным доступом. Если хостинг предоставляем мы, в договоре указаны его состав, стоимость и порядок переноса. У вас остаются конфигурация, скрипты и инструкции для восстановления системы на другом сервере."
      },
      {
        heading: "Сторонние сервисы и лицензии",
        body: "У Stripe, Supabase, поставщиков ИИ и других внешних сервисов свои условия и расходы. При оценке называем эти зависимости, включая платные библиотеки, которые могут повлиять на будущий перенос. Оплата идёт с ваших аккаунтов, кроме отдельно согласованного хостинга."
      },
      {
        heading: "Общие компоненты",
        body: "Общие инфраструктурные компоненты передаются под разрешительными открытыми лицензиями или по бессрочной, безотзывной лицензии без доплаты. Вы сохраняете право использовать их после завершения сотрудничества. Код вашего продукта принадлежит вам."
      }
    ],
    faq: [
      {
        q: "Кому принадлежит код?",
        a: "Вам принадлежит код, написанный для вашего продукта. Эти права передаются по договору. Для общих компонентов и стороннего ПО действуют их лицензии."
      },
      {
        q: "Может ли другой разработчик продолжить работу?",
        a: "Да. У вас есть репозиторий, аккаунты и инструкции по развёртыванию. Мы ответим на вопросы следующего инженера, чтобы помочь с передачей."
      },
      {
        q: "Нужно ли платить Simnetiq за право пользоваться продуктом?",
        a: "Нет. Лицензионной платы за использование созданного нами ПО нет. Хостинг, сторонние сервисы и согласованная поддержка оплачиваются отдельно."
      },
      {
        q: "Что если хостинг предоставляет Simnetiq?",
        a: "В договоре указано, что мы размещаем, сколько это стоит и как перенести систему. Конфигурация, скрипты и инструкции остаются у вас. Также можем настроить сервер в вашем аккаунте."
      },
      {
        q: "Вы используете компоненты повторно?",
        a: "Да, в общей инфраструктуре. Они предоставляются под разрешительными открытыми лицензиями или по бессрочной, безотзывной лицензии без доплаты. Код вашего продукта остаётся вашим."
      },
      {
        q: "Какие расходы будут после запуска?",
        a: "В зависимости от проекта: хостинг, базы данных, API моделей ИИ, обработка платежей и аккаунты разработчиков. При оценке перечисляем их и рассчитываем примерные текущие расходы."
      }
    ],
    meta: [
      {
        label: "Исходный код",
        value: "Ваш репозиторий с первого коммита"
      },
      {
        label: "Аккаунты",
        value: "Ваши; условия хостинга согласуются"
      },
      {
        label: "Лицензионная плата Simnetiq",
        value: "Отсутствует"
      }
    ]
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "МОНИТОРИНГ · ОБСЛУЖИВАНИЕ · ОБНОВЛЕНИЯ",
    title: "Поддержка",
    titleSecondary: "после запуска",
    tagline: "Планируем обслуживание и дальнейшие шаги до выхода продукта.",
    summary: "После запуска продукту нужны обновления, мониторинг и ответственный за сбои. Мы включаем мониторинг и автоматизацию развёртывания в разработку, а объём и срок поддержки согласуем с вами до запуска.",
    sections: [
      {
        heading: "Что готово к запуску",
        body: "Отслеживание ошибок, проверка доступности и автоматизированное развёртывание входят в разработку. Они помогают замечать проблемы и выпускать обновления по повторяемому процессу. Это часть объёма проекта."
      },
      {
        heading: "Что покрывает обслуживание",
        body: "Исправление ошибок в нашей работе, обновления зависимостей и безопасности, адаптация к изменениям ОС и внешних API, продление сертификатов и реакция на уведомления мониторинга. Обязанности и сроки определены в соглашении о поддержке."
      },
      {
        heading: "Когда поддержка заканчивается",
        body: "У поддержки есть объём, цена и дата окончания. Мы не отключаем ПО после её завершения: код, аккаунты и документация остаются у вас. Вы принимаете ответственность за обновления, сбои и необходимые внешние сервисы. Новые функции оцениваются отдельно."
      },
      {
        heading: "Обновления и проверки в магазинах",
        body: "Если приложение публиковали мы, повторные подачи в течение срока поддержки ведём тоже мы. Работа включает ответы на замечания проверяющих и адаптацию к требованиям платформ и SDK."
      },
      {
        heading: "Планирование следующей версии",
        body: "Данные об использовании, обращения и обратная связь помогают определить, что улучшать дальше. На их основе согласуем следующий этап с учётом потребностей, проявившихся после запуска."
      }
    ],
    faq: [
      {
        q: "Как определяется стоимость поддержки?",
        a: "По согласованному объёму и сроку в основном или последующем договоре. Стоимость зависит от продукта и систем, на которых он работает."
      },
      {
        q: "Что считается обслуживанием?",
        a: "Исправления, обновления зависимостей и безопасности, адаптация к платформам и реакция на уведомления мониторинга. Новые функции, интеграции и редизайн оцениваются отдельно."
      },
      {
        q: "Что будет, когда я прекращу поддержку?",
        a: "Мы не отключаем ПО и не закрываем ваш доступ. Обновления, сбои и текущие расходы становятся вашей ответственностью. Можно обратиться за конкретным исправлением без постоянного договора."
      },
      {
        q: "Кто получает уведомления мониторинга?",
        a: "Во время поддержки мы получаем уведомления, необходимые для обслуживания продукта. После её окончания мониторинг остаётся в вашем аккаунте, а уведомления приходят вам."
      },
      {
        q: "Кто занимается проверками магазинов и обновлениями ОС?",
        a: "Мы, в согласованный срок поддержки, если публиковали приложение. Соответствующие обновления и повторные подачи входят в объём поддержки."
      },
      {
        q: "Как быстро вы отвечаете при сбоях?",
        a: "В тот же рабочий день, если действующая система недоступна, и в течение одного рабочего дня по обычным вопросам. Время реакции закрепляется в соглашении о поддержке."
      }
    ],
    meta: [
      {
        label: "Входит в разработку",
        value: "Мониторинг · Автоматизация развёртывания"
      },
      {
        label: "Поддержка",
        value: "Согласованный объём и срок"
      },
      {
        label: "После поддержки",
        value: "Код, аккаунты и доступ остаются у вас"
      }
    ]
  }
];

const HOW_WE_WORK_BY_LOCALE: Record<Locale, HowWeWork[]> = {
  en: howWeWorkEn,
  he: howWeWorkHe,
  ru: howWeWorkRu,
};

export function getHowWeWork(locale: Locale): HowWeWork[] {
  return HOW_WE_WORK_BY_LOCALE[locale] ?? howWeWorkEn;
}

export function getHowWeWorkEntry(
  slug: string,
  locale: Locale = "en"
): HowWeWork | undefined {
  return getHowWeWork(locale).find((e) => e.slug === slug);
}

/** Slugs are locale-invariant — derived from EN so sitemap, params and agent routes agree. */
export function getAllHowWeWorkSlugs(): string[] {
  return howWeWorkEn.map((e) => e.slug);
}
