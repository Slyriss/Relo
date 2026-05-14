import { slugify } from "@/lib/utils";
import type { Attendee } from "@/types";

export type CsvImportResult = {
  attendees: Attendee[];
  errors: string[];
};

const requiredColumns = ["name", "email", "company", "title", "linkedin_url", "bio"];

export function parseAttendeeCsv(csv: string, eventId: string): CsvImportResult {
  const rows = parseCsvRows(csv.trim());
  if (rows.length === 0) return { attendees: [], errors: ["CSV is empty."] };

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const missing = requiredColumns.filter((column) => !headers.includes(column));
  if (missing.length) return { attendees: [], errors: [`Missing columns: ${missing.join(", ")}`] };

  const errors: string[] = [];
  const attendees = rows.slice(1).flatMap((row, index) => {
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, row[headerIndex]?.trim() ?? ""]));
    const rowNumber = index + 2;

    if (!record.name || !record.email) {
      errors.push(`Row ${rowNumber}: name and email are required.`);
      return [];
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push(`Row ${rowNumber}: invalid email.`);
      return [];
    }

    return [
      {
        id: `att-${slugify(record.email)}-${rowNumber}`,
        eventId,
        name: record.name,
        email: record.email,
        company: record.company,
        title: record.title,
        linkedinUrl: record.linkedin_url,
        photoUrl: record.photo_url || record.photourl || undefined,
        bio: record.bio,
        headline: record.bio,
        goals: inferGoals(record.bio, record.title),
        industry: inferIndustry(record.company, record.bio),
        seniority: inferSeniority(record.title),
        profileComplete: Boolean(record.bio && record.company && record.title)
      } satisfies Attendee
    ];
  });

  return { attendees, errors };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  rows.push(row);
  return rows.filter((items) => items.some(Boolean));
}

export function inferGoals(text: string, title: string): Attendee["goals"] {
  const source = `${text} ${title}`.toLowerCase();
  const goals: Attendee["goals"] = [];
  if (/\b(rais|raising|fundrais|fund\b|invest(?:or|ing|ment)\b|capital|series [abcd]|\bvc\b)/.test(source)) goals.push("fundraising");
  if (/\b(hir(e|ing)|talent|recruit|people ops|workforce)/.test(source)) goals.push("hiring");
  if (/\b(partner(?:ship)?|ecosystem|channel|integrat)/.test(source)) goals.push("partnerships");
  if (/\b(sales|customer|buyer|grow(?:th)?|revenue|gtm|go.to.market)/.test(source)) goals.push("customers");
  if (!goals.length) goals.push("learning");
  return goals;
}

export function inferSeniority(title: string) {
  const value = title.toLowerCase();
  if (/founder|ceo|cfo|coo|partner/.test(value)) return 5;
  if (/vp|head|principal/.test(value)) return 4;
  if (/lead|manager/.test(value)) return 3;
  return 2;
}

export function inferIndustry(company: string, bio: string) {
  const source = `${company} ${bio}`.toLowerCase();
  if (/\b(ai\b|artificial intelligence|machine learning|\bml\b|llm|deep learning)/.test(source)) return "AI";
  if (/\b(fintech|financi|payment|payroll|ledger|banking|wealth)/.test(source)) return "Fintech";
  if (/\b(health|clinical|medical|patient|pharma|biotech)/.test(source)) return "Healthtech";
  if (/\b(security|cyber|infosec|compliance|soc\b|pentest)/.test(source)) return "Security";
  if (/\b(devtool|developer tool|open.?source|sdk\b|api\b|platform engineer|infra)/.test(source)) return "Developer Tools";
  if (/\b(sales|growth|gtm|go.to.market|marketing|revenue)/.test(source)) return "GTM";
  if (/\b(climate|sustainability|clean.?tech|energy|carbon)/.test(source)) return "Climate";
  if (/\b(marketplace|network effect|supply|demand)/.test(source)) return "Marketplace";
  if (/\b(saas|b2b|software|cloud|subscription)/.test(source)) return "SaaS";
  return "Other";
}
