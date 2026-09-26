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
    badge: "ACCESS · CONTINUITY · BANDWIDTH",
    title: "Work directly with",
    titleSecondary: "Developers",
    tagline: "The person who scopes your project is the person who writes it.",
    summary:
      "Simnetiq is two owner-operators. There is no account manager between you and the code, no sales engineer who disappears after the pitch, and no junior team the work is quietly handed to once the contract is signed. You brief the person who builds it, and you keep briefing that person until the project ships.",
    sections: [
      {
        heading: "Who you actually talk to",
        body: "Simnetiq Ltd is registered in England and Wales (Companies House 16861177) and run by two directors. Roman Pochtman handles engineering — mobile, web, AI and infrastructure. David Zitomirsky handles contracts, compliance and finance. On a technical call you are talking to Roman. On a contract question you are talking to David. Nobody is relaying messages between you and a delivery team, because there is no delivery team to relay them to.",
      },
      {
        heading: "Why this changes the estimate",
        body: "When the person estimating the work is the person who has to do it, the estimate stops being a sales number. There is no incentive to quote optimistically to win the deal and absorb the overrun later, because the overrun lands on the same desk. It also removes an entire category of defect: the requirement that gets lost between the person who heard it on the call and the person who implements it three weeks later.",
      },
      {
        heading: "What this costs you",
        body: "Bandwidth. Two people cannot run six engagements at once, so we take fewer projects and start dates are a real constraint rather than a formality. If we are booked until a given month, we say so and give you the date. We would rather lose the work than start it and stall.",
      },
      {
        heading: "The bus factor, stated plainly",
        body: "A two-person studio carries a continuity risk that a fifty-person agency does not, and pretending otherwise would be dishonest. The mitigation is not a promise that nothing will happen. It is that nothing we hold is unrecoverable if it does: source sits in your repository, infrastructure sits in your accounts, and deployment is documented well enough for an engineer who has never met us to take it over. That is a deliberate design constraint on every engagement, not a courtesy at the end of one.",
      },
    ],
    faq: [
      {
        q: "Will the work be handed to a junior developer after I sign?",
        a: "No. There is no junior team to hand it to. Simnetiq has two directors and the engineering is done by the director who scoped your project.",
      },
      {
        q: "Can I speak to the engineer before there is a contract?",
        a: "Yes. Scoping calls are with the engineer, not a salesperson, and they happen before there is anything to sign. That call is also where you find out if we are the wrong fit — we would rather say so early.",
      },
      {
        q: "How quickly do you respond during a project?",
        a: "Within one working day for anything routine, and the same day for anything blocking a release. We work UK hours from London and correspond in English, Hebrew or Russian.",
      },
      {
        q: "What happens if you become unavailable mid-project?",
        a: "Your repository, your infrastructure accounts and your deployment documentation are already in your hands, so another engineer can continue without our involvement. We would also tell you early rather than let a deadline pass quietly.",
      },
      {
        q: "How many projects do you run at the same time?",
        a: "Deliberately few. The exact number depends on the size of each engagement, but the constraint is real and it is why we quote start dates rather than starting immediately.",
      },
    ],
    meta: [
      { label: "Team", value: "Two owner-operators" },
      { label: "Who writes the code", value: "The engineer who scoped it" },
      { label: "Languages", value: "English · Hebrew · Russian" },
    ],
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "SOW · DELIVERABLES · GBP",
    title: "Scoped",
    titleSecondary: "before it starts",
    tagline: "A signed statement of work, with the price agreed before any code is written.",
    summary:
      "Every engagement runs against a signed SOW that names the deliverables, the timeline and the price in GBP. You know what you are buying before you commit to it, and the number you agreed is the number you pay unless you ask for something that was not in the document.",
    sections: [
      {
        heading: "What the SOW actually contains",
        body: "A deliverable list specific enough to argue with — screens, endpoints, integrations, platforms, and what 'done' means for each. A timeline with the milestones we will be measured against. A fixed price in GBP. What you are responsible for providing, such as App Store accounts, API credentials, brand assets or content. And an explicit list of what is out of scope, which is usually the more useful half of the document.",
      },
      {
        heading: "Why not time and materials",
        body: "Hourly billing puts the risk of a bad estimate entirely on you and gives the supplier no reason to be efficient. Fixed price moves that risk to us, which is the correct place for it: we are the ones who can control it. It also forces the scoping conversation to happen properly at the start, when changing your mind is free, rather than in week seven when it is expensive.",
      },
      {
        heading: "What happens when the scope changes",
        body: "Scope changes on most projects, and that is not a problem as long as it is visible. When you ask for something outside the SOW we quote it as a variation — a short written amendment with its own price and its own effect on the timeline — and you decide whether to take it. Nothing gets added silently and then invoiced. If a change is small enough that quoting it would cost more than doing it, we absorb it and say so.",
      },
      {
        heading: "Where a fixed price does not fit",
        body: "Some work genuinely cannot be scoped up front: open-ended research, a system whose behaviour nobody can describe yet, or a rescue job on a codebase we have not read. For those we scope a short paid discovery phase first, deliver the findings as something you own and can take elsewhere, and only then quote the build. We would rather sell you a small piece of honest work than a large piece of guesswork.",
      },
      {
        heading: "Payment and company details",
        body: "Prices are quoted in GBP. Simnetiq Ltd is registered in England and Wales, company number 16861177, at 2 Frederick Street, Kings Cross, London WC1X 0ND. The company is not currently VAT-registered, so quotes do not carry VAT.",
      },
    ],
    faq: [
      {
        q: "What does a typical project cost?",
        a: "It depends on the scope, which is the point of the SOW. As a starting reference, web platform work begins around £800, mobile and desktop work around £1,000, and AI or automation pilots around £1,500. Larger builds are quoted individually. Every figure is confirmed in writing before you commit.",
      },
      {
        q: "How long does a project take?",
        a: "Most engagements run between two and ten weeks. The SOW names the milestones, so you are not tracking progress by asking how it is going.",
      },
      {
        q: "What if the project takes longer than you estimated?",
        a: "The price does not change. A fixed price means the estimating risk is ours. What can move the timeline is a change you requested, or a dependency on your side — credentials, content, an App Store account — that arrives late.",
      },
      {
        q: "Can I change my mind about a feature partway through?",
        a: "Yes. We quote it as a written variation with its own price and timeline effect, and you decide. Changes are never added silently and invoiced later.",
      },
      {
        q: "Do you work on a retainer?",
        a: "Only against a defined deliverable. We do not sell open-ended monthly retainers with no stated output — ongoing work is scoped the same way project work is.",
      },
      {
        q: "Do you charge VAT?",
        a: "No. Simnetiq Ltd is under the VAT threshold and is not currently VAT-registered, so quotes are the amount you pay.",
      },
    ],
    meta: [
      { label: "Contract", value: "Signed SOW before work starts" },
      { label: "Currency", value: "GBP · no VAT" },
      { label: "Typical engagement", value: "2–10 weeks" },
    ],
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "SOURCE · INFRASTRUCTURE · KEYS",
    title: "You own",
    titleSecondary: "all of it",
    tagline: "Source, infrastructure, accounts and deployment keys are yours from day one.",
    summary:
      "There is no licence you have to keep paying for, no proprietary framework you cannot leave, and no account in our name that holds your production system hostage. If you decided tomorrow to move the project to another engineer, you would already have everything needed to do it.",
    sections: [
      {
        heading: "What ownership means concretely",
        body: "The source lives in your repository under your organisation, and it is there from the first commit rather than transferred at the end. Cloud, hosting, database, error tracking, analytics and App Store or Play Console accounts are registered to you and billed to your card. Deployment credentials, signing certificates and environment secrets are yours. The written deliverables — architecture notes, runbooks, deployment steps — are part of what you paid for, not an extra.",
      },
      {
        heading: "Why day one rather than handover",
        body: "Ownership transferred at the end of a project is a promise. Ownership from the first commit is a fact you can verify at any point during it. It also means there is never a moment where a payment dispute, a scheduling problem or a disagreement gives anyone leverage over your production system. Nobody has to trust anyone.",
      },
      {
        heading: "When we host on your behalf",
        body: "Some projects — VPN infrastructure in particular, and self-hosted pipelines — run on a VPS that we operate day to day. This is the honest edge of the claim, so it is worth being precise. Where you want the server in your own name, it is provisioned in your account on your card and we hold access as a collaborator. Where you would rather not run a Hetzner account, we host it and the SOW names it explicitly: what runs there, what it costs, and the migration path. In that case you still hold the configuration, the deployment scripts and a documented rebuild procedure, so the server is replaceable rather than irreplaceable. What we will not do is host something critical without you knowing that is the arrangement.",
      },
      {
        heading: "Third-party licences are a separate question",
        body: "You own what we write. You do not own Stripe, Supabase, Anthropic, OpenAI or the App Store, and no supplier can give you those. Those are your accounts with your billing, and we tell you during scoping which ones a design implies and roughly what they cost to run, so the ongoing bill is not a surprise after launch. Where a paid library would create a dependency you cannot exit, we say so before choosing it.",
      },
      {
        heading: "Reused components",
        body: "Some infrastructure — CI configuration, deployment scaffolding, internal utilities — is not written from scratch for each client, and paying us to rewrite it would be a waste of your money. Anything reused is either open source under a permissive licence or supplied to you under a perpetual, irrevocable licence with no fee attached. Nothing you receive stops working if you stop working with us.",
      },
    ],
    faq: [
      {
        q: "Who owns the intellectual property in the code?",
        a: "You do. The SOW assigns it to you, and the source is in your repository from the first commit rather than transferred at the end of the project.",
      },
      {
        q: "Can I take the project to another developer?",
        a: "Yes, at any point and without asking us. You already hold the repository, the infrastructure accounts and the deployment documentation. We will answer a successor engineer's questions rather than obstruct the move.",
      },
      {
        q: "Do I have to keep paying you a licence fee to keep using what you built?",
        a: "No. There is no licence fee and no proprietary runtime. If you never speak to us again, everything we built keeps running.",
      },
      {
        q: "What if Simnetiq hosts the server for my project?",
        a: "Then the SOW says so explicitly, along with what runs there and what it costs. You still hold the configuration, deployment scripts and a documented rebuild procedure, so the server can be recreated elsewhere. Where you prefer, we provision it in your own account instead and hold access as a collaborator.",
      },
      {
        q: "Do you reuse code between clients?",
        a: "Some infrastructure scaffolding, yes — rewriting it per client would waste your budget. Anything reused is open source under a permissive licence or licensed to you perpetually and irrevocably at no cost. Your product code is yours alone.",
      },
      {
        q: "What ongoing third-party costs should I expect?",
        a: "Whatever your architecture implies: hosting, database, model APIs, payment processing, developer program fees. We name them during scoping with rough running costs so the bill after launch is not a surprise. They are billed to your accounts, not resold through us.",
      },
    ],
    meta: [
      { label: "Source", value: "Your repository, first commit" },
      { label: "Infrastructure", value: "Your accounts, your billing" },
      { label: "Licence fee to keep it", value: "None" },
    ],
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "MONITORING · MAINTENANCE · ITERATION",
    title: "We stay",
    titleSecondary: "past launch",
    tagline: "Monitoring, maintenance and the next iteration are planned in, not bolted on.",
    summary:
      "Shipping is the middle of the job. An app that went live and then broke quietly three weeks later was not delivered — it was abandoned on schedule. Observability and deployment automation go in from day one, and what happens after launch is agreed while there is still time to build for it.",
    sections: [
      {
        heading: "What ships on day one",
        body: "Every project goes live with error tracking, uptime monitoring and a CI/CD pipeline already wired in, because retrofitting observability after an incident means finding out what broke by guessing. These are not upsells added at the end of the SOW. They are part of the build, for the same reason tests are.",
      },
      {
        heading: "What maintenance actually covers",
        body: "Defect fixes in what we built. Dependency and security updates. Platform churn — an iOS or Android release that deprecates something you depend on, an API version a vendor retires, a certificate that expires. Reacting to alerts from the monitoring that shipped with the project. This is the unglamorous work that decides whether software is still running in two years.",
      },
      {
        heading: "What ends when an engagement ends",
        body: "Support is scoped and priced like everything else, so it has an end date and you can see it. It is not an automatic monthly charge that continues until someone notices. When a support period ends, the software keeps running — you hold the source, the infrastructure and the documentation, so nothing switches off and nothing needs renewing to stay live. New features are quoted as new work rather than absorbed into a maintenance line.",
      },
      {
        heading: "App Store and Play review",
        body: "Store review is not a one-time event. Apple and Google change requirements, reject builds for reasons that did not exist last year, and periodically remove apps that have not been updated for a current SDK. If we submitted your app, we handle the resubmission cycle during the support period rather than sending you the rejection email to interpret.",
      },
      {
        heading: "The next iteration",
        body: "Most useful software changes after real users touch it. We would rather scope a second phase against what actually happened — the monitoring data, the support tickets, the features nobody used — than build everything anyone imagined in phase one. Launch is the point where you finally have evidence, and it is the cheapest moment to change direction.",
      },
    ],
    faq: [
      {
        q: "What does support cost after launch?",
        a: "It is quoted per engagement against a defined scope, in the same SOW or a short follow-on one, because the honest answer depends on what was built and what it runs on. What it is not is an open-ended retainer with no stated deliverable.",
      },
      {
        q: "What is covered by maintenance and what is a new project?",
        a: "Maintenance covers defects in what we built, dependency and security updates, platform and OS changes, and responding to monitoring alerts. A new feature, a new integration or a redesign is quoted as new work — it gets its own scope and price rather than being absorbed silently.",
      },
      {
        q: "What happens if I stop paying for support?",
        a: "Nothing switches off. You hold the source, the infrastructure accounts and the documentation, so the software keeps running exactly as it did. You would be responsible for updates and incidents from that point, and you can come back for a specific fix without a standing arrangement.",
      },
      {
        q: "Do you monitor the app, or do I have to tell you when it breaks?",
        a: "Error tracking and uptime monitoring ship with the project, so during a support period the alert usually reaches us before you notice. Outside a support period the monitoring still runs and still alerts — it is in your account — it just alerts you.",
      },
      {
        q: "Who handles App Store rejections and OS updates?",
        a: "We do, during the support period, if we submitted the app. Store requirements and SDK minimums change on Apple's and Google's schedule rather than yours, so this is treated as ongoing work rather than a one-off submission.",
      },
      {
        q: "How fast do you respond to a production incident?",
        a: "Same working day for anything taking a live system down. Routine issues are handled within one working day. Response expectations are written into the support scope rather than left as an understanding.",
      },
    ],
    meta: [
      { label: "Ships with every build", value: "Monitoring · CI/CD" },
      { label: "Support scope", value: "Defined and time-boxed" },
      { label: "If support lapses", value: "Nothing switches off" },
    ],
  },
];

const howWeWorkHe: HowWeWork[] = [
  {
    slug: "work-directly-with-engineers",
    code: "W-01",
    badge: "גישה · המשכיות · זמינות",
    title: "עובדים ישירות",
    titleSecondary: "מול המהנדסים",
    tagline: "מי שמאפיין את הפרויקט הוא מי שכותב אותו.",
    summary:
      "סימנטיק היא שני בעלים־מפעילים. אין מנהל לקוח בינך לבין הקוד, אין מהנדס מכירות שנעלם אחרי הפגישה, ואין צוות זוטר שהעבודה עוברת אליו בשקט ברגע שהחוזה נחתם. אתם מתדרכים את מי שבונה, וממשיכים לתדרך את אותו אדם עד שהפרויקט עולה לאוויר.",
    sections: [
      {
        heading: "עם מי אתם באמת מדברים",
        body: "סימנטיק בע\"מ רשומה באנגליה ובוויילס (רשם החברות 16861177) ומנוהלת בידי שני דירקטורים. רומן פוצ'טמן אחראי על ההנדסה — מובייל, ווב, AI ותשתיות. דוד זיטומירסקי אחראי על חוזים, רגולציה וכספים. בשיחה טכנית אתם מדברים עם רומן. בשאלה חוזית אתם מדברים עם דוד. אף אחד לא מעביר הודעות ביניכם לבין צוות פיתוח, כי אין צוות כזה להעביר אליו.",
      },
      {
        heading: "למה זה משנה את ההערכה",
        body: "כשמי שמעריך את העבודה הוא מי שצריך לבצע אותה, ההערכה מפסיקה להיות מספר מכירתי. אין תמריץ לתמחר באופטימיות כדי לזכות בעסקה ולספוג את החריגה אחר כך, כי החריגה נוחתת על אותו שולחן. זה גם מבטל קטגוריה שלמה של תקלות: הדרישה שנעלמת בין מי ששמע אותה בשיחה לבין מי שמממש אותה שלושה שבועות מאוחר יותר.",
      },
      {
        heading: "מה זה עולה לכם",
        body: "זמינות. שני אנשים לא יכולים לנהל שישה פרויקטים במקביל, ולכן אנחנו לוקחים פחות פרויקטים ותאריכי התחלה הם אילוץ אמיתי ולא פורמליות. אם אנחנו תפוסים עד חודש מסוים, אנחנו אומרים זאת ונותנים לכם את התאריך. אנחנו מעדיפים לוותר על העבודה מאשר להתחיל אותה ולהיתקע.",
      },
      {
        heading: "סיכון ההמשכיות, במפורש",
        body: "לסטודיו של שני אנשים יש סיכון המשכיות שאין לסוכנות של חמישים איש, ולהעמיד פנים אחרת יהיה לא כנה. ההגנה אינה הבטחה ששום דבר לא יקרה. היא שדבר ממה שאנחנו מחזיקים אינו בלתי ניתן לשחזור אם כן יקרה: הקוד יושב במאגר שלכם, התשתית יושבת בחשבונות שלכם, ותהליך ההעלאה לאוויר מתועד מספיק טוב כדי שמהנדס שמעולם לא פגש אותנו ייקח אותו לידיו. זה אילוץ תכנוני מכוון בכל התקשרות, לא נימוס בסופה.",
      },
    ],
    faq: [
      {
        q: "האם העבודה תועבר למפתח זוטר אחרי החתימה?",
        a: "לא. אין צוות זוטר להעביר אליו. בסימנטיק שני דירקטורים, וההנדסה נעשית בידי הדירקטור שאפיין את הפרויקט שלכם.",
      },
      {
        q: "אפשר לדבר עם המהנדס לפני שיש חוזה?",
        a: "כן. שיחות האפיון הן מול המהנדס, לא מול איש מכירות, והן מתקיימות לפני שיש מה לחתום. באותה שיחה גם מתברר אם אנחנו לא ההתאמה הנכונה — אנחנו מעדיפים לומר זאת מוקדם.",
      },
      {
        q: "כמה מהר אתם מגיבים במהלך הפרויקט?",
        a: "בתוך יום עבודה אחד לכל דבר שגרתי, ובאותו יום לכל דבר שחוסם שחרור גרסה. אנחנו עובדים בשעות בריטניה מלונדון ומתכתבים באנגלית, עברית או רוסית.",
      },
      {
        q: "מה קורה אם לא תהיו זמינים באמצע הפרויקט?",
        a: "המאגר שלכם, חשבונות התשתית שלכם והתיעוד כבר בידיכם, כך שמהנדס אחר יכול להמשיך בלי מעורבותנו. בנוסף, נאמר לכם מוקדם במקום לתת לדדליין לחלוף בשקט.",
      },
      {
        q: "כמה פרויקטים אתם מריצים במקביל?",
        a: "מעט, במכוון. המספר המדויק תלוי בגודל כל התקשרות, אבל האילוץ אמיתי וזו הסיבה שאנחנו מוסרים תאריך התחלה במקום להתחיל מיד.",
      },
    ],
    meta: [
      { label: "צוות", value: "שני בעלים־מפעילים" },
      { label: "מי כותב את הקוד", value: "המהנדס שאפיין אותו" },
      { label: "שפות", value: "אנגלית · עברית · רוסית" },
    ],
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "SOW · תוצרים · GBP",
    title: "מאופיין ומתומחר",
    titleSecondary: "לפני שמתחילים",
    tagline: "מסמך עבודה חתום, עם מחיר שסוכם לפני שנכתבת שורת קוד.",
    summary:
      "כל התקשרות מתנהלת מול SOW חתום שמפרט את התוצרים, לוח הזמנים והמחיר בליש\"ט. אתם יודעים מה אתם קונים לפני שאתם מתחייבים, והמספר שסוכם הוא המספר שתשלמו — אלא אם ביקשתם משהו שלא היה במסמך.",
    sections: [
      {
        heading: "מה באמת יש במסמך העבודה",
        body: "רשימת תוצרים מפורטת מספיק כדי להתווכח עליה — מסכים, נקודות קצה, אינטגרציות, פלטפורמות, ומה נחשב \"גמור\" בכל אחד מהם. לוח זמנים עם אבני הדרך שלפיהן נימדד. מחיר קבוע בליש\"ט. מה באחריותכם לספק, כגון חשבונות App Store, מפתחות API, נכסי מותג או תוכן. ורשימה מפורשת של מה שמחוץ להיקף — שהיא בדרך כלל החצי השימושי יותר של המסמך.",
      },
      {
        heading: "למה לא תמחור לפי שעה",
        body: "חיוב שעתי מטיל את מלוא הסיכון של הערכה שגויה עליכם, ולא נותן לספק שום סיבה להתייעל. מחיר קבוע מעביר את הסיכון אלינו, וזה המקום הנכון עבורו: אנחנו אלה שיכולים לשלוט בו. הוא גם מאלץ את שיחת האפיון להתרחש כמו שצריך בהתחלה, כשלשנות את דעתכם עדיין חינם, ולא בשבוע השביעי כשזה יקר.",
      },
      {
        heading: "מה קורה כשההיקף משתנה",
        body: "ההיקף משתנה ברוב הפרויקטים, וזו לא בעיה כל עוד השינוי גלוי. כשאתם מבקשים משהו שמחוץ ל־SOW אנחנו מתמחרים אותו כשינוי — תוספת קצרה בכתב עם מחיר משלה והשפעה משלה על לוח הזמנים — ואתם מחליטים אם לקחת אותה. שום דבר לא נוסף בשקט ואז מחויב. אם שינוי קטן מספיק שתמחורו יעלה יותר מביצועו, אנחנו סופגים אותו ואומרים זאת.",
      },
      {
        heading: "איפה מחיר קבוע לא מתאים",
        body: "יש עבודה שבאמת אי אפשר לאפיין מראש: מחקר פתוח, מערכת שאיש עדיין לא יודע לתאר את התנהגותה, או חילוץ של בסיס קוד שלא קראנו. במקרים כאלה אנחנו מאפיינים תחילה שלב גילוי קצר בתשלום, מוסרים את הממצאים כנכס שבבעלותכם ושאפשר לקחת למקום אחר, ורק אז מתמחרים את הבנייה. אנחנו מעדיפים למכור לכם פיסת עבודה קטנה וכנה מאשר פיסה גדולה של ניחושים.",
      },
      {
        heading: "תשלום ופרטי החברה",
        body: "המחירים נקובים בליש\"ט. סימנטיק בע\"מ רשומה באנגליה ובוויילס, מספר חברה 16861177, בכתובת 2 Frederick Street, Kings Cross, London WC1X 0ND. החברה אינה רשומה כיום כעוסק במע\"מ, ולכן הצעות המחיר אינן כוללות מע\"מ.",
      },
    ],
    faq: [
      {
        q: "כמה עולה פרויקט טיפוסי?",
        a: "תלוי בהיקף, וזו בדיוק מטרת ה־SOW. כנקודת ייחוס, עבודת פלטפורמות ווב מתחילה סביב 800 ליש\"ט, מובייל ודסקטופ סביב 1,000 ליש\"ט, ופיילוטים של AI או אוטומציה סביב 1,500 ליש\"ט. בנייה גדולה יותר מתומחרת פרטנית. כל סכום מאושר בכתב לפני שאתם מתחייבים.",
      },
      {
        q: "כמה זמן לוקח פרויקט?",
        a: "רוב ההתקשרויות נמשכות בין שבועיים לעשרה שבועות. ה־SOW מפרט את אבני הדרך, כך שאינכם עוקבים אחר ההתקדמות דרך שאלות מצב.",
      },
      {
        q: "מה אם הפרויקט יימשך יותר ממה שהערכתם?",
        a: "המחיר לא משתנה. מחיר קבוע פירושו שסיכון ההערכה הוא שלנו. מה שכן יכול להזיז את לוח הזמנים הוא שינוי שביקשתם, או תלות מצדכם — הרשאות, תוכן, חשבון App Store — שמגיעה באיחור.",
      },
      {
        q: "אפשר לשנות דעה לגבי פיצ'ר באמצע?",
        a: "כן. אנחנו מתמחרים זאת כשינוי כתוב עם מחיר משלו והשפעה על לוח הזמנים, ואתם מחליטים. שינויים לעולם אינם נוספים בשקט ומחויבים בדיעבד.",
      },
      {
        q: "אתם עובדים ברשיינר חודשי?",
        a: "רק כנגד תוצר מוגדר. אנחנו לא מוכרים ריטיינרים חודשיים פתוחים ללא תפוקה מוגדרת — עבודה מתמשכת מאופיינת בדיוק כמו עבודת פרויקט.",
      },
      {
        q: "אתם גובים מע\"מ?",
        a: "לא. סימנטיק בע\"מ מתחת לסף המע\"מ ואינה רשומה כיום כעוסק במע\"מ, ולכן הצעת המחיר היא הסכום שתשלמו.",
      },
    ],
    meta: [
      { label: "חוזה", value: "SOW חתום לפני תחילת העבודה" },
      { label: "מטבע", value: "GBP · ללא מע\"מ" },
      { label: "התקשרות טיפוסית", value: "2–10 שבועות" },
    ],
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "קוד · תשתית · מפתחות",
    title: "הכול",
    titleSecondary: "בבעלותכם",
    tagline: "הקוד, התשתית, החשבונות ומפתחות ההעלאה לאוויר שלכם מהיום הראשון.",
    summary:
      "אין רישיון שצריך להמשיך לשלם עליו, אין תשתית קניינית שאי אפשר לעזוב, ואין חשבון על שמנו שמחזיק את מערכת הייצור שלכם כבת ערובה. אם הייתם מחליטים מחר להעביר את הפרויקט למהנדס אחר, כבר עכשיו יש בידיכם כל מה שנדרש כדי לעשות זאת.",
    sections: [
      {
        heading: "מה בעלות אומרת בפועל",
        body: "הקוד יושב במאגר שלכם תחת הארגון שלכם, והוא שם מהקומיט הראשון ולא מועבר בסוף. חשבונות ענן, אחסון, בסיס נתונים, מעקב שגיאות, אנליטיקה ו־App Store או Play Console רשומים על שמכם ומחויבים לכרטיס שלכם. הרשאות ההעלאה לאוויר, תעודות החתימה וסודות הסביבה שלכם. התוצרים הכתובים — הערות ארכיטקטורה, נהלי תפעול, שלבי פריסה — הם חלק ממה ששילמתם עליו, לא תוספת.",
      },
      {
        heading: "למה מהיום הראשון ולא בהעברה",
        body: "בעלות שמועברת בסוף הפרויקט היא הבטחה. בעלות מהקומיט הראשון היא עובדה שאפשר לאמת בכל רגע במהלכו. משמעות הדבר גם שאין אף רגע שבו מחלוקת על תשלום, בעיית לוחות זמנים או אי־הסכמה נותנים למישהו מנוף על מערכת הייצור שלכם. אף אחד לא צריך לסמוך על אף אחד.",
      },
      {
        heading: "כשאנחנו מאחסנים עבורכם",
        body: "חלק מהפרויקטים — בעיקר תשתיות VPN וצינורות עיבוד בשרת עצמאי — רצים על VPS שאנחנו מתפעלים ביום־יום. זה הקצה הכן של ההצהרה, ולכן כדאי לדייק בו. כשאתם רוצים את השרת על שמכם, הוא מוקם בחשבון שלכם ובכרטיס שלכם ואנחנו מחזיקים גישה כשותפים. כשאתם מעדיפים לא לנהל חשבון Hetzner, אנחנו מאחסנים וה־SOW מציין זאת במפורש: מה רץ שם, כמה זה עולה, ומה מסלול ההגירה. גם אז אתם מחזיקים את התצורה, את סקריפטי הפריסה ונוהל שחזור מתועד, כך שהשרת ניתן להחלפה ולא בלתי ניתן להחלפה. מה שלא נעשה הוא לאחסן משהו קריטי בלי שתדעו שזה ההסדר.",
      },
      {
        heading: "רישיונות צד שלישי הם שאלה נפרדת",
        body: "אתם בעלים של מה שאנחנו כותבים. אינכם בעלים של Stripe, Supabase, Anthropic, OpenAI או ה־App Store, ואף ספק לא יכול לתת לכם אותם. אלה חשבונות שלכם עם חיוב שלכם, ואנחנו אומרים לכם באפיון אילו מהם הארכיטקטורה מחייבת ובערך כמה הם עולים לתפעול, כדי שהחשבון החודשי אחרי ההשקה לא יהיה הפתעה. כשספרייה בתשלום תיצור תלות שאי אפשר לצאת ממנה, אנחנו אומרים זאת לפני שבוחרים בה.",
      },
      {
        heading: "רכיבים בשימוש חוזר",
        body: "חלק מהתשתית — הגדרות CI, פיגומי פריסה, כלי עזר פנימיים — אינה נכתבת מאפס לכל לקוח, ולשלם לנו כדי לכתוב אותה מחדש יהיה בזבוז של הכסף שלכם. כל דבר בשימוש חוזר הוא או קוד פתוח ברישיון מתירני, או ניתן לכם ברישיון תמידי ובלתי הדיר וללא תשלום. שום דבר שאתם מקבלים לא מפסיק לעבוד אם תפסיקו לעבוד איתנו.",
      },
    ],
    faq: [
      {
        q: "למי שייכת הקניין הרוחני בקוד?",
        a: "לכם. ה־SOW מקצה אותו אליכם, והקוד נמצא במאגר שלכם מהקומיט הראשון ולא מועבר בסוף הפרויקט.",
      },
      {
        q: "אפשר לקחת את הפרויקט למפתח אחר?",
        a: "כן, בכל שלב ובלי לשאול אותנו. כבר עכשיו יש בידיכם המאגר, חשבונות התשתית והתיעוד. נענה לשאלות של המהנדס הממשיך במקום להערים קשיים.",
      },
      {
        q: "האם אצטרך להמשיך לשלם לכם דמי רישיון כדי להשתמש במה שבניתם?",
        a: "לא. אין דמי רישיון ואין סביבת ריצה קניינית. גם אם לא תדברו איתנו שוב לעולם, כל מה שבנינו ימשיך לרוץ.",
      },
      {
        q: "מה אם סימנטיק מאחסנת את השרת של הפרויקט שלי?",
        a: "אז ה־SOW מציין זאת במפורש, יחד עם מה שרץ שם וכמה זה עולה. עדיין בידיכם התצורה, סקריפטי הפריסה ונוהל שחזור מתועד, כך שאפשר להקים את השרת מחדש במקום אחר. אם תעדיפו, נקים אותו בחשבון שלכם ונחזיק גישה כשותפים.",
      },
      {
        q: "אתם עושים שימוש חוזר בקוד בין לקוחות?",
        a: "בפיגומי תשתית מסוימים, כן — כתיבה מחדש לכל לקוח תבזבז את התקציב שלכם. כל דבר בשימוש חוזר הוא קוד פתוח ברישיון מתירני או מורשה לכם לצמיתות וללא תשלום. קוד המוצר שלכם הוא שלכם בלבד.",
      },
      {
        q: "אילו עלויות צד שלישי שוטפות עליי לצפות?",
        a: "מה שהארכיטקטורה מחייבת: אחסון, בסיס נתונים, ממשקי מודלים, סליקה, דמי תוכניות מפתחים. אנחנו מפרטים אותן באפיון עם הערכת עלות שוטפת, כדי שהחשבון אחרי ההשקה לא יהיה הפתעה. הן מחויבות לחשבונות שלכם ולא נמכרות מחדש דרכנו.",
      },
    ],
    meta: [
      { label: "קוד", value: "המאגר שלכם, מהקומיט הראשון" },
      { label: "תשתית", value: "החשבונות שלכם, החיוב שלכם" },
      { label: "דמי רישיון להמשך שימוש", value: "אין" },
    ],
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "ניטור · תחזוקה · איטרציה",
    title: "אנחנו נשארים",
    titleSecondary: "אחרי ההשקה",
    tagline: "ניטור, תחזוקה והאיטרציה הבאה מתוכננים פנימה, לא מוברגים בדיעבד.",
    summary:
      "ההשקה היא אמצע העבודה. אפליקציה שעלתה לאוויר ואז נשברה בשקט שלושה שבועות אחר כך לא נמסרה — היא ננטשה לפי לוח זמנים. ניטור ואוטומציית פריסה נכנסים מהיום הראשון, ומה שקורה אחרי ההשקה מסוכם בזמן שעוד אפשר לבנות עבורו.",
    sections: [
      {
        heading: "מה עולה לאוויר ביום הראשון",
        body: "כל פרויקט עולה עם מעקב שגיאות, ניטור זמינות וצינור CI/CD מחווטים מראש, כי התקנת ניטור אחרי תקלה פירושה לגלות מה נשבר בדרך של ניחוש. אלה אינם שדרוגים שנוספים בסוף ה־SOW. הם חלק מהבנייה, מאותה סיבה שבדיקות הן חלק ממנה.",
      },
      {
        heading: "מה תחזוקה באמת מכסה",
        body: "תיקון תקלות במה שבנינו. עדכוני תלויות ואבטחה. שינויי פלטפורמה — גרסת iOS או אנדרואיד שמוציאה משימוש רכיב שאתם תלויים בו, גרסת API שספק מסיים, תעודה שפגה. תגובה להתראות מהניטור שעלה עם הפרויקט. זו העבודה הלא זוהרת שקובעת אם התוכנה עדיין רצה בעוד שנתיים.",
      },
      {
        heading: "מה מסתיים כשההתקשרות מסתיימת",
        body: "התמיכה מאופיינת ומתומחרת כמו כל דבר אחר, ולכן יש לה תאריך סיום ואתם רואים אותו. היא לא חיוב חודשי אוטומטי שנמשך עד שמישהו שם לב. כשתקופת תמיכה מסתיימת התוכנה ממשיכה לרוץ — הקוד, התשתית והתיעוד בידיכם, כך ששום דבר לא נכבה ושום דבר לא דורש חידוש כדי להישאר באוויר. פיצ'רים חדשים מתומחרים כעבודה חדשה ולא נבלעים בשורת תחזוקה.",
      },
      {
        heading: "ביקורת App Store ו־Play",
        body: "ביקורת החנויות אינה אירוע חד־פעמי. אפל וגוגל משנות דרישות, דוחות בילדים מסיבות שלא היו קיימות בשנה שעברה, ומדי פעם מסירות אפליקציות שלא עודכנו ל־SDK עדכני. אם אנחנו הגשנו את האפליקציה שלכם, אנחנו מטפלים במחזור ההגשה מחדש בתקופת התמיכה במקום לשלוח לכם את מייל הדחייה לפענוח.",
      },
      {
        heading: "האיטרציה הבאה",
        body: "רוב התוכנה השימושית משתנה אחרי שמשתמשים אמיתיים נוגעים בה. אנחנו מעדיפים לאפיין שלב שני מול מה שקרה בפועל — נתוני הניטור, פניות התמיכה, הפיצ'רים שאיש לא השתמש בהם — מאשר לבנות בשלב הראשון את כל מה שמישהו דמיין. ההשקה היא הנקודה שבה סוף־סוף יש לכם ראיות, וזה הרגע הזול ביותר לשנות כיוון.",
      },
    ],
    faq: [
      {
        q: "כמה עולה תמיכה אחרי ההשקה?",
        a: "היא מתומחרת לכל התקשרות מול היקף מוגדר, באותו SOW או בהמשך קצר שלו, כי התשובה הכנה תלויה במה שנבנה ובמה שהוא רץ עליו. מה שהיא לא היא ריטיינר פתוח ללא תוצר מוגדר.",
      },
      {
        q: "מה נכלל בתחזוקה ומה נחשב פרויקט חדש?",
        a: "תחזוקה מכסה תקלות במה שבנינו, עדכוני תלויות ואבטחה, שינויי פלטפורמה ומערכת הפעלה, ותגובה להתראות ניטור. פיצ'ר חדש, אינטגרציה חדשה או עיצוב מחדש מתומחרים כעבודה חדשה — עם היקף ומחיר משלהם, ולא נבלעים בשקט.",
      },
      {
        q: "מה קורה אם אפסיק לשלם על תמיכה?",
        a: "שום דבר לא נכבה. הקוד, חשבונות התשתית והתיעוד בידיכם, כך שהתוכנה ממשיכה לרוץ בדיוק כפי שרצה. מאותה נקודה העדכונים והתקלות באחריותכם, ואפשר לחזור אלינו לתיקון נקודתי בלי הסדר קבוע.",
      },
      {
        q: "אתם מנטרים את האפליקציה, או שעליי לדווח כשהיא נשברת?",
        a: "מעקב שגיאות וניטור זמינות עולים יחד עם הפרויקט, כך שבתקופת תמיכה ההתראה בדרך כלל מגיעה אלינו לפני שאתם שמים לב. מחוץ לתקופת תמיכה הניטור עדיין רץ ועדיין מתריע — הוא בחשבון שלכם — הוא פשוט מתריע לכם.",
      },
      {
        q: "מי מטפל בדחיות App Store ובעדכוני מערכת הפעלה?",
        a: "אנחנו, בתקופת התמיכה, אם אנחנו הגשנו את האפליקציה. דרישות החנויות ומינימום ה־SDK משתנים לפי לוח הזמנים של אפל וגוגל ולא לפי שלכם, ולכן זו עבודה מתמשכת ולא הגשה חד־פעמית.",
      },
      {
        q: "כמה מהר אתם מגיבים לתקלת ייצור?",
        a: "באותו יום עבודה לכל דבר שמפיל מערכת חיה. בעיות שגרתיות מטופלות בתוך יום עבודה אחד. ציפיות התגובה נכתבות בהיקף התמיכה ולא נשארות כהבנה בעל פה.",
      },
    ],
    meta: [
      { label: "עולה עם כל בילד", value: "ניטור · CI/CD" },
      { label: "היקף התמיכה", value: "מוגדר ותחום בזמן" },
      { label: "אם התמיכה פוקעת", value: "שום דבר לא נכבה" },
    ],
  },
];

const howWeWorkRu: HowWeWork[] = [
  {
    slug: "work-directly-with-engineers",
    code: "W-01",
    badge: "ДОСТУП · НЕПРЕРЫВНОСТЬ · ЗАГРУЗКА",
    title: "Вы работаете напрямую",
    titleSecondary: "с инженерами",
    tagline: "Тот, кто оценивает проект, — тот же, кто его пишет.",
    summary:
      "Simnetiq — это два владельца-практика. Между вами и кодом нет аккаунт-менеджера, нет пресейл-инженера, который исчезает после презентации, и нет команды джуниоров, которой работу тихо передают после подписания договора. Вы ставите задачу тому, кто её реализует, и продолжаете работать с этим же человеком до релиза.",
    sections: [
      {
        heading: "С кем вы действительно разговариваете",
        body: "Simnetiq Ltd зарегистрирована в Англии и Уэльсе (регистрационный номер 16861177) и управляется двумя директорами. Роман Почтман отвечает за инженерию — мобильные приложения, веб, AI и инфраструктуру. Давид Зитомирский отвечает за договоры, комплаенс и финансы. На техническом созвоне вы говорите с Романом. По договорному вопросу — с Давидом. Никто не пересказывает ваши слова команде разработки, потому что такой команды нет.",
      },
      {
        heading: "Почему это меняет саму оценку",
        body: "Когда оценку даёт тот, кому потом эту работу делать, оценка перестаёт быть продажным числом. Нет смысла занижать срок ради сделки и потом поглощать перерасход — перерасход придёт на тот же стол. Это также убирает целый класс дефектов: требование, теряющееся между тем, кто услышал его на созвоне, и тем, кто реализует его три недели спустя.",
      },
      {
        heading: "Чего это стоит вам",
        body: "Пропускной способности. Два человека не могут вести шесть проектов одновременно, поэтому мы берём меньше проектов, а даты старта — реальное ограничение, а не формальность. Если мы заняты до определённого месяца, мы так и говорим и называем дату. Мы скорее откажемся от работы, чем начнём её и застрянем.",
      },
      {
        heading: "Риск непрерывности — прямым текстом",
        body: "У студии из двух человек есть риск непрерывности, которого нет у агентства на пятьдесят, и делать вид, что это не так, было бы нечестно. Защита состоит не в обещании, что ничего не случится. Она в том, что ничто из того, что мы держим, не является невосстановимым: исходный код лежит в вашем репозитории, инфраструктура — в ваших аккаунтах, а развёртывание описано достаточно подробно, чтобы его подхватил инженер, который никогда нас не видел. Это осознанное проектное ограничение в каждом проекте, а не любезность в его конце.",
      },
    ],
    faq: [
      {
        q: "Передадут ли работу джуниору после подписания договора?",
        a: "Нет. Передавать некому — в Simnetiq два директора, и инженерную работу делает тот директор, который оценивал ваш проект.",
      },
      {
        q: "Можно поговорить с инженером до того, как появится договор?",
        a: "Да. Созвоны по оценке проходят с инженером, а не с продавцом, и происходят до того, как появляется что-то для подписи. На этом же созвоне выясняется, если мы вам не подходим, — мы предпочитаем сказать об этом сразу.",
      },
      {
        q: "Как быстро вы отвечаете во время проекта?",
        a: "В течение одного рабочего дня по любому штатному вопросу и в тот же день по всему, что блокирует релиз. Мы работаем по британскому времени из Лондона и переписываемся на английском, иврите или русском.",
      },
      {
        q: "Что будет, если вы окажетесь недоступны в середине проекта?",
        a: "Ваш репозиторий, ваши инфраструктурные аккаунты и документация уже у вас, поэтому другой инженер может продолжить без нашего участия. Кроме того, мы предупредим заранее, а не дадим дедлайну тихо пройти.",
      },
      {
        q: "Сколько проектов вы ведёте одновременно?",
        a: "Намеренно мало. Точное число зависит от размера проектов, но ограничение реальное — именно поэтому мы называем дату старта, а не начинаем немедленно.",
      },
    ],
    meta: [
      { label: "Команда", value: "Два владельца-практика" },
      { label: "Кто пишет код", value: "Инженер, который его оценил" },
      { label: "Языки", value: "Английский · Иврит · Русский" },
    ],
  },
  {
    slug: "fixed-price-scope",
    code: "W-02",
    badge: "SOW · РЕЗУЛЬТАТЫ · GBP",
    title: "Объём и цена согласованы",
    titleSecondary: "до старта",
    tagline: "Подписанный SOW, с ценой, согласованной до первой строки кода.",
    summary:
      "Каждый проект идёт по подписанному SOW, где перечислены результаты, сроки и цена в фунтах. Вы знаете, что покупаете, прежде чем на это соглашаетесь, и согласованная сумма — это та сумма, которую вы платите, если только вы сами не попросите то, чего в документе не было.",
    sections: [
      {
        heading: "Что на самом деле входит в SOW",
        body: "Список результатов, достаточно конкретный, чтобы с ним можно было спорить: экраны, эндпоинты, интеграции, платформы и что означает «готово» для каждого пункта. Сроки с контрольными точками, по которым нас будут мерить. Фиксированная цена в фунтах. Что предоставляете вы — аккаунты App Store, ключи API, брендбук или контент. И явный список того, что за рамки вынесено, — обычно это более полезная половина документа.",
      },
      {
        heading: "Почему не почасовая оплата",
        body: "Почасовая оплата полностью перекладывает риск неверной оценки на вас и не даёт подрядчику никакого повода работать эффективно. Фиксированная цена переносит этот риск на нас — туда, где ему и место: управлять им можем именно мы. Она же заставляет разговор об объёме состояться как следует в начале, когда передумать бесплатно, а не на седьмой неделе, когда это дорого.",
      },
      {
        heading: "Что происходит при изменении объёма",
        body: "Объём меняется в большинстве проектов, и это не проблема, пока изменение видимо. Когда вы просите что-то за рамками SOW, мы оцениваем это как отдельное дополнение — короткое письменное изменение со своей ценой и своим влиянием на сроки, — и вы решаете, брать его или нет. Ничто не добавляется молча и не выставляется в счёте задним числом. Если изменение настолько мелкое, что оценить его дороже, чем сделать, мы делаем его за свой счёт и говорим об этом.",
      },
      {
        heading: "Где фиксированная цена не работает",
        body: "Часть работы действительно нельзя оценить заранее: открытое исследование, система, поведение которой пока никто не может описать, или спасение кодовой базы, которую мы ещё не читали. Для таких случаев мы сначала оцениваем короткий платный этап исследования, отдаём результаты как ваш актив, который можно унести куда угодно, и только потом называем цену разработки. Мы предпочтём продать вам маленькую честную работу, а не большую догадку.",
      },
      {
        heading: "Оплата и реквизиты компании",
        body: "Цены указываются в фунтах стерлингов. Simnetiq Ltd зарегистрирована в Англии и Уэльсе, регистрационный номер 16861177, адрес: 2 Frederick Street, Kings Cross, London WC1X 0ND. Компания в настоящее время не зарегистрирована как плательщик НДС, поэтому НДС в расчёты не входит.",
      },
    ],
    faq: [
      {
        q: "Сколько стоит типичный проект?",
        a: "Зависит от объёма — ради этого и существует SOW. Для ориентира: веб-платформы начинаются примерно от £800, мобильная и десктопная разработка — примерно от £1 000, пилоты по AI и автоматизации — примерно от £1 500. Крупные проекты оцениваются индивидуально. Любая сумма подтверждается письменно до того, как вы берёте на себя обязательства.",
      },
      {
        q: "Сколько времени занимает проект?",
        a: "Большинство проектов укладывается в срок от двух до десяти недель. В SOW указаны контрольные точки, поэтому вам не нужно узнавать статус вопросами «как дела».",
      },
      {
        q: "Что если работа займёт больше времени, чем вы оценили?",
        a: "Цена не меняется. Фиксированная цена означает, что риск оценки — наш. Сдвинуть срок может изменение, о котором вы попросили, или зависимость с вашей стороны — доступы, контент, аккаунт App Store, — пришедшая с опозданием.",
      },
      {
        q: "Можно передумать насчёт функции в середине проекта?",
        a: "Да. Мы оценим это как письменное изменение со своей ценой и влиянием на сроки, а вы решите. Изменения никогда не добавляются молча и не выставляются в счёте задним числом.",
      },
      {
        q: "Вы работаете по ретейнеру?",
        a: "Только под конкретный результат. Мы не продаём открытые ежемесячные ретейнеры без заявленной отдачи — постоянная работа оценивается так же, как проектная.",
      },
      {
        q: "Вы начисляете НДС?",
        a: "Нет. Simnetiq Ltd находится ниже порога регистрации по НДС и плательщиком НДС сейчас не является, поэтому в расчёте указана итоговая сумма.",
      },
    ],
    meta: [
      { label: "Договор", value: "Подписанный SOW до старта" },
      { label: "Валюта", value: "GBP · без НДС" },
      { label: "Типичный проект", value: "2–10 недель" },
    ],
  },
  {
    slug: "code-ownership",
    code: "W-03",
    badge: "КОД · ИНФРАСТРУКТУРА · КЛЮЧИ",
    title: "Всё принадлежит",
    titleSecondary: "вам",
    tagline: "Код, инфраструктура, аккаунты и ключи развёртывания — ваши с первого дня.",
    summary:
      "Нет лицензии, за которую нужно продолжать платить, нет проприетарного фреймворка, который нельзя покинуть, и нет аккаунта на наше имя, удерживающего вашу продакшен-систему в заложниках. Если завтра вы решите передать проект другому инженеру, у вас уже есть всё необходимое, чтобы это сделать.",
    sections: [
      {
        heading: "Что означает владение на практике",
        body: "Код лежит в вашем репозитории в вашей организации — с первого коммита, а не передаётся в конце. Облако, хостинг, база данных, трекинг ошибок, аналитика, аккаунты App Store и Play Console зарегистрированы на вас и оплачиваются с вашей карты. Учётные данные развёртывания, сертификаты подписи и секреты окружения — ваши. Письменные материалы — заметки по архитектуре, регламенты, шаги развёртывания — входят в то, за что вы заплатили, а не продаются отдельно.",
      },
      {
        heading: "Почему с первого дня, а не при передаче",
        body: "Владение, передаваемое в конце проекта, — это обещание. Владение с первого коммита — факт, который можно проверить в любой момент. Это также означает, что не существует момента, когда спор об оплате, сбой в графике или разногласие давали бы кому-либо рычаг над вашей продакшен-системой. Никому не нужно никому доверять.",
      },
      {
        heading: "Когда хостинг ведём мы",
        body: "Часть проектов — прежде всего VPN-инфраструктура и самостоятельно размещённые пайплайны — работает на VPS, который эксплуатируем мы. Это честный край утверждения, поэтому здесь стоит быть точным. Если вы хотите, чтобы сервер был оформлен на вас, он разворачивается в вашем аккаунте и на вашей карте, а мы получаем доступ как соисполнители. Если вы предпочитаете не заводить аккаунт Hetzner, хостинг ведём мы, и SOW называет это прямо: что там работает, сколько это стоит и каков путь миграции. Даже в этом случае у вас остаются конфигурация, скрипты развёртывания и описанная процедура пересборки, поэтому сервер заменим, а не незаменим. Чего мы не делаем — так это не размещаем что-то критичное, не поставив вас в известность, что схема именно такая.",
      },
      {
        heading: "Сторонние лицензии — отдельный вопрос",
        body: "Вам принадлежит то, что пишем мы. Вам не принадлежат Stripe, Supabase, Anthropic, OpenAI или App Store, и ни один подрядчик не может вам их отдать. Это ваши аккаунты с вашей оплатой, и на этапе оценки мы называем, какие из них подразумевает архитектура и сколько примерно стоит их эксплуатация, чтобы счёт после запуска не стал сюрпризом. Если платная библиотека создаст зависимость, из которой нельзя выйти, мы скажем об этом до того, как её выберем.",
      },
      {
        heading: "Переиспользуемые компоненты",
        body: "Часть инфраструктуры — конфигурация CI, каркас развёртывания, внутренние утилиты — не пишется с нуля под каждого клиента, и платить нам за их переписывание было бы пустой тратой вашего бюджета. Всё переиспользуемое либо является открытым кодом под разрешительной лицензией, либо передаётся вам по бессрочной и безотзывной лицензии без платы. Ничто из полученного вами не перестаёт работать, если вы перестаёте работать с нами.",
      },
    ],
    faq: [
      {
        q: "Кому принадлежат права на код?",
        a: "Вам. SOW передаёт их вам, а исходный код находится в вашем репозитории с первого коммита, а не передаётся в конце проекта.",
      },
      {
        q: "Могу ли я передать проект другому разработчику?",
        a: "Да, в любой момент и не спрашивая нас. У вас уже есть репозиторий, инфраструктурные аккаунты и документация. Мы ответим на вопросы инженера-преемника, а не будем мешать переходу.",
      },
      {
        q: "Придётся ли платить вам лицензионные отчисления, чтобы продолжать пользоваться результатом?",
        a: "Нет. Ни лицензионной платы, ни проприетарной среды выполнения. Даже если вы больше никогда с нами не заговорите, всё построенное продолжит работать.",
      },
      {
        q: "Что если сервер моего проекта хостит Simnetiq?",
        a: "Тогда SOW называет это прямо, вместе с тем, что там работает и сколько это стоит. У вас всё равно остаются конфигурация, скрипты развёртывания и описанная процедура пересборки, поэтому сервер можно поднять в другом месте. Если вам так удобнее, мы развернём его в вашем собственном аккаунте, а доступ получим как соисполнители.",
      },
      {
        q: "Вы переиспользуете код между клиентами?",
        a: "Часть инфраструктурного каркаса — да, переписывать его под каждого клиента значило бы тратить ваш бюджет впустую. Всё переиспользуемое — либо открытый код под разрешительной лицензией, либо передано вам бессрочно и безвозмездно. Код вашего продукта принадлежит только вам.",
      },
      {
        q: "Каких постоянных расходов на сторонние сервисы ожидать?",
        a: "Тех, что вытекают из архитектуры: хостинг, база данных, API моделей, приём платежей, взносы за программы разработчиков. Мы называем их на этапе оценки с примерной стоимостью эксплуатации, чтобы счёт после запуска не стал сюрпризом. Они оплачиваются с ваших аккаунтов и не перепродаются через нас.",
      },
    ],
    meta: [
      { label: "Исходный код", value: "Ваш репозиторий, первый коммит" },
      { label: "Инфраструктура", value: "Ваши аккаунты, ваша оплата" },
      { label: "Плата за продолжение", value: "Отсутствует" },
    ],
  },
  {
    slug: "support-after-launch",
    code: "W-04",
    badge: "МОНИТОРИНГ · ПОДДЕРЖКА · ИТЕРАЦИИ",
    title: "Мы остаёмся",
    titleSecondary: "после запуска",
    tagline: "Мониторинг, поддержка и следующая итерация заложены в план, а не привинчены сверху.",
    summary:
      "Запуск — это середина работы. Приложение, которое вышло в прод и тихо сломалось через три недели, не было сдано — оно было брошено точно в срок. Наблюдаемость и автоматизация развёртывания закладываются с первого дня, а то, что происходит после запуска, обсуждается, пока ещё есть время под это построить.",
    sections: [
      {
        heading: "Что уходит в прод в первый день",
        body: "Каждый проект выходит с уже подключёнными трекингом ошибок, мониторингом доступности и конвейером CI/CD, потому что достраивать наблюдаемость после инцидента — значит выяснять причину сбоя угадыванием. Это не допродажи в конце SOW. Это часть разработки — по той же причине, по которой ею являются тесты.",
      },
      {
        heading: "Что на самом деле покрывает поддержка",
        body: "Исправление дефектов в том, что мы построили. Обновления зависимостей и безопасности. Изменения платформ — релиз iOS или Android, объявляющий устаревшим то, на что вы опираетесь; версия API, которую поставщик выводит из эксплуатации; истекающий сертификат. Реакция на алерты того мониторинга, что ушёл в прод вместе с проектом. Это негероическая работа, от которой зависит, будет ли софт работать через два года.",
      },
      {
        heading: "Что заканчивается вместе с проектом",
        body: "Поддержка оценивается и стоит так же, как всё остальное, поэтому у неё есть дата окончания и вы её видите. Это не автоматический ежемесячный платёж, идущий, пока кто-нибудь не заметит. Когда период поддержки заканчивается, софт продолжает работать: код, инфраструктура и документация у вас, поэтому ничего не выключается и ничего не нужно продлевать, чтобы остаться в проде. Новые функции оцениваются как новая работа, а не растворяются в строке «поддержка».",
      },
      {
        heading: "Ревью App Store и Play",
        body: "Ревью в сторах — не разовое событие. Apple и Google меняют требования, отклоняют сборки по причинам, которых год назад не существовало, и периодически удаляют приложения, не обновлённые под актуальный SDK. Если приложение подавали мы, цикл повторной подачи в период поддержки ведём мы, а не пересылаем вам письмо об отклонении на расшифровку.",
      },
      {
        heading: "Следующая итерация",
        body: "Большинство полезного софта меняется после того, как его коснулись реальные пользователи. Мы предпочтём оценить второй этап по тому, что произошло на самом деле — данным мониторинга, обращениям в поддержку, функциям, которыми никто не воспользовался, — а не строить на первом этапе всё, что кто-либо вообразил. Запуск — это момент, когда у вас наконец появляются факты, и это самый дешёвый момент, чтобы сменить направление.",
      },
    ],
    faq: [
      {
        q: "Сколько стоит поддержка после запуска?",
        a: "Она оценивается под конкретный проект и конкретный объём — в том же SOW или в коротком продолжении, — потому что честный ответ зависит от того, что построено и на чём оно работает. Чем она точно не является, так это открытым ретейнером без заявленного результата.",
      },
      {
        q: "Что входит в поддержку, а что считается новым проектом?",
        a: "Поддержка покрывает дефекты в том, что мы построили, обновления зависимостей и безопасности, изменения платформ и ОС, а также реакцию на алерты мониторинга. Новая функция, новая интеграция или редизайн оцениваются как новая работа — со своим объёмом и ценой, а не поглощаются молча.",
      },
      {
        q: "Что произойдёт, если я перестану платить за поддержку?",
        a: "Ничего не выключится. Код, инфраструктурные аккаунты и документация у вас, поэтому софт продолжит работать ровно так же. С этого момента обновления и инциденты — ваша зона ответственности, и вы можете вернуться к нам за точечным исправлением без постоянного договора.",
      },
      {
        q: "Вы мониторите приложение, или я должен сообщать о поломках?",
        a: "Трекинг ошибок и мониторинг доступности уходят в прод вместе с проектом, поэтому в период поддержки алерт обычно доходит до нас раньше, чем вы что-то заметите. Вне периода поддержки мониторинг продолжает работать и продолжает слать алерты — он в вашем аккаунте — просто теперь он шлёт их вам.",
      },
      {
        q: "Кто занимается отклонениями в App Store и обновлениями ОС?",
        a: "Мы, в период поддержки, если приложение подавали мы. Требования сторов и минимальные версии SDK меняются по графику Apple и Google, а не по вашему, поэтому это трактуется как постоянная работа, а не как разовая подача.",
      },
      {
        q: "Как быстро вы реагируете на инцидент в проде?",
        a: "В тот же рабочий день по всему, что кладёт живую систему. Штатные вопросы решаются в течение одного рабочего дня. Ожидания по времени реакции прописываются в объёме поддержки, а не остаются устной договорённостью.",
      },
    ],
    meta: [
      { label: "Входит в каждую сборку", value: "Мониторинг · CI/CD" },
      { label: "Объём поддержки", value: "Определён и ограничен по времени" },
      { label: "Если поддержка закончилась", value: "Ничего не выключается" },
    ],
  },
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
