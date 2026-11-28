/**
 * Documents a UK private company limited by shares should be able to produce.
 * Scoped to Simnetiq Ltd today: VAT registered, one director who is the only
 * shareholder, no employees. A working list, not legal advice.
 *
 * A row is "on file" when a stored file carries its tag.
 */

export type ChecklistGroup =
  | "Formation"
  | "Ownership"
  | "Companies House"
  | "HMRC and VAT"
  | "Accounts and tax"
  | "Banking"
  | "Data protection"
  | "Contracts and IP";

export type ChecklistItem = {
  tag: string;
  group: ChecklistGroup;
  level: "required" | "recommended";
  title: string;
  /** What the document is and why it matters. */
  what: string;
  /** Where to get it. */
  where: string;
  /** ISO date before which the document cannot exist yet, so it is not counted as missing. */
  notBefore?: string;
};

export const CHECKLIST_FOLDER = "Company";

export const CHECKLIST: ChecklistItem[] = [
  {
    tag: "req-incorporation-cert",
    group: "Formation",
    level: "required",
    title: "Certificate of incorporation",
    what: "Proof the company exists, with its number and date. Banks, payment providers and app stores ask for it.",
    where: "Companies House → the company's filing history → Incorporation (free PDF).",
  },
  {
    tag: "req-memorandum",
    group: "Formation",
    level: "required",
    title: "Memorandum of association",
    what: "The founding statement signed by the first shareholder.",
    where: "Inside the incorporation filing on Companies House.",
  },
  {
    tag: "req-articles",
    group: "Formation",
    level: "required",
    title: "Articles of association",
    what: "The company's rule book: how decisions are made and shares are handled.",
    where: "Inside the incorporation filing on Companies House, unless amended since.",
  },
  {
    tag: "req-register-of-members",
    group: "Ownership",
    level: "required",
    title: "Register of members",
    what: "The legal record of who owns the shares. Still required by law, and since November 2025 it must be kept by the company itself; the registers of directors and of people with significant control are now held by Companies House instead.",
    where: "Write it yourself: shareholder's full name and service address, number and class of shares, date they became a member. Sign and date it.",
  },
  {
    tag: "req-share-certificate",
    group: "Ownership",
    level: "required",
    title: "Share certificate",
    what: "The certificate for the shares issued at incorporation. It should be issued within two months of the shares being allotted.",
    where: "Your formation agent's documents, or write one: company name and number, shareholder, number and class of shares, signed by the director.",
  },
  {
    tag: "req-director-id-check",
    group: "Ownership",
    level: "required",
    title: "Director identity verification",
    what: "Confirmation that the director has verified their identity with Companies House. Without it the confirmation statement cannot be filed.",
    where: "GOV.UK → Verify your identity for Companies House. Keep the confirmation here and the personal code in your password manager, not in a file.",
  },
  {
    tag: "req-confirmation-statement",
    group: "Companies House",
    level: "required",
    title: "Latest confirmation statement",
    what: "The yearly statement that the details Companies House holds are correct. Filed once a year, within 14 days of the statement date.",
    where: "Companies House → File a confirmation statement. Save the filed copy from the filing history.",
  },
  {
    tag: "req-registered-office",
    group: "Companies House",
    level: "required",
    title: "Registered office agreement",
    what: "Proof the company may use its registered address and that post sent there reaches you.",
    where: "The contract or latest invoice from the address provider for 2 Frederick Street.",
  },
  {
    tag: "req-ct-utr-letter",
    group: "HMRC and VAT",
    level: "required",
    title: "Corporation Tax UTR letter",
    what: "HMRC's letter with the company's 10-digit Unique Taxpayer Reference, needed for every Corporation Tax filing.",
    where: "Posted by HMRC to the registered office after incorporation (form CT41G). If lost, ask HMRC for the UTR online.",
  },
  {
    tag: "req-vat-certificate",
    group: "HMRC and VAT",
    level: "required",
    title: "VAT registration certificate",
    what: "Shows the VAT number, the registration date and the VAT return periods.",
    where: "HMRC business tax account → VAT → View VAT certificate.",
  },
  {
    tag: "req-vat-return",
    group: "HMRC and VAT",
    level: "recommended",
    title: "Latest VAT return",
    what: "A copy of the most recent return submitted and the workings behind it.",
    where: "Your Making Tax Digital software, or the HMRC VAT account's submitted returns.",
  },
  {
    tag: "req-annual-accounts",
    group: "Accounts and tax",
    level: "required",
    title: "Latest filed annual accounts",
    what: "The accounts filed with Companies House each year. The first set covers incorporation to 30 November 2026.",
    where: "Prepared after the year end and filed with Companies House; save the filed copy.",
    notBefore: "2027-08-17",
  },
  {
    tag: "req-ct600",
    group: "Accounts and tax",
    level: "required",
    title: "Latest Company Tax Return",
    what: "The CT600 return with its tax computation, filed with HMRC for each accounting period.",
    where: "Filed through HMRC or accounting software; save the submitted return and HMRC's receipt.",
    notBefore: "2027-11-30",
  },
  {
    tag: "req-dividend-records",
    group: "Accounts and tax",
    level: "recommended",
    title: "Dividend vouchers and minutes",
    what: "A voucher and a short board minute for every dividend paid. HMRC can treat undocumented payments as salary or a loan.",
    where: "Write one each time a dividend is declared.",
  },
  {
    tag: "req-directors-loan",
    group: "Accounts and tax",
    level: "recommended",
    title: "Director's loan account",
    what: "A running record of money you lend the company or take from it outside salary and dividends.",
    where: "A simple ledger, or the director's loan account in your bookkeeping software.",
  },
  {
    tag: "req-bank-confirmation",
    group: "Banking",
    level: "required",
    title: "Business bank account confirmation",
    what: "A letter or statement showing the account is in the company's name, with sort code and account number. Payment providers ask for it.",
    where: "Your bank's app → account confirmation letter, or a recent statement.",
  },
  {
    tag: "req-ico-registration",
    group: "Data protection",
    level: "required",
    title: "ICO registration certificate",
    what: "Companies that process customers' personal data must pay the data protection fee to the Information Commissioner's Office each year.",
    where: "ico.org.uk → Pay the data protection fee. Save the certificate with its registration number.",
  },
  {
    tag: "req-privacy-policy",
    group: "Data protection",
    level: "required",
    title: "Privacy policy",
    what: "The current version of the notice shown to customers, kept with its date so you can show what applied when.",
    where: "Export the live page from each product's site.",
  },
  {
    tag: "req-processor-agreements",
    group: "Data protection",
    level: "recommended",
    title: "Data processing agreements",
    what: "The agreements with suppliers that handle customer data for you, such as hosting, email and payments.",
    where: "Each supplier's legal or account settings page.",
  },
  {
    tag: "req-ip-assignment",
    group: "Contracts and IP",
    level: "recommended",
    title: "IP assignment to the company",
    what: "Confirms that code, brands and designs you created belong to the company. Investors and buyers ask for it.",
    where: "A short signed agreement between you and the company.",
  },
  {
    tag: "req-director-agreement",
    group: "Contracts and IP",
    level: "recommended",
    title: "Director's service agreement",
    what: "Sets out your role and pay as director.",
    where: "A short signed agreement between you and the company.",
  },
  {
    tag: "req-domains-trademarks",
    group: "Contracts and IP",
    level: "recommended",
    title: "Domain and trademark ownership",
    what: "Proof the company, not you personally, owns its domains and any registered marks.",
    where: "Registrar account exports and trademark certificates.",
  },
  {
    tag: "req-insurance",
    group: "Contracts and IP",
    level: "recommended",
    title: "Business insurance policy",
    what: "Professional indemnity or cyber cover if you hold it. Employers' liability is not required while the only worker is the director who owns the company.",
    where: "Your insurer's policy schedule.",
  },
];

export const CHECKLIST_TAGS = CHECKLIST.map((item) => item.tag);

export type ChecklistFile = { id: string; title: string };
export type ChecklistState = "on_file" | "missing" | "not_due" | "optional";
export type ChecklistRow = ChecklistItem & { state: ChecklistState; files: ChecklistFile[] };

/** Join the catalogue with the tagged files. `today` is an ISO date. */
export function checklistRows(filesByTag: Record<string, ChecklistFile[]>, today: string): ChecklistRow[] {
  return CHECKLIST.map((item) => {
    const files = filesByTag[item.tag] ?? [];
    const state: ChecklistState =
      files.length > 0 ? "on_file" : item.notBefore && today < item.notBefore ? "not_due" : item.level === "required" ? "missing" : "optional";
    return { ...item, state, files };
  });
}

/** Required documents on file out of those that can exist today. */
export function checklistProgress(rows: ChecklistRow[]): { onFile: number; required: number; missing: number } {
  const due = rows.filter((row) => row.level === "required" && row.state !== "not_due");
  const onFile = due.filter((row) => row.state === "on_file").length;
  return { onFile, required: due.length, missing: due.length - onFile };
}
