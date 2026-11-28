/**
 * Official Simnetiq facts already published on simnetiq.com.
 * VAT has no public number; the impressum says it is available on request.
 * Keep this aligned with Doppler admin's company card.
 */

import type { CompanyDates } from "@/lib/business-os/company/deadlines";

const ADDRESS = {
  street: "2 Frederick Street",
  area: "Kings Cross",
  city: "London",
  land: "England and Wales",
  country: "United Kingdom",
  postcode: "WC1X 0ND",
} as const;

export const COMPANY_PROFILE = {
  legalName: "Simnetiq Ltd",
  companyNumber: "16861177",
  vat: "On request",
  address: ADDRESS,
  emails: ["support@simnetiq.com"] as const,
  sites: ["simnetiq.com", "dopplervpn.org"] as const,
} as const;

/**
 * Dates from the public Companies House record (read 28 November 2026).
 * The VAT quarter group is on the VAT certificate; null until it is entered.
 */
export const COMPANY_DATES: CompanyDates = {
  incorporatedOn: "2025-11-17",
  yearEnd: { month: 11, day: 30 },
  vatStagger: null,
  oneOff: [
    {
      id: "director-identity-verification",
      title: "Director identity verification",
      due: "2026-11-30",
      detail: "Verify with GOV.UK One Login. The confirmation statement cannot be filed before this is done.",
    },
  ],
};

export function companyFullAddress(): string {
  const { street, area, city, postcode, land, country } = ADDRESS;
  return `${street}, ${area}, ${city}, ${postcode}, ${land}, ${country}`;
}

/** Flat copy fields for the Files card and MCP. */
export type CompanyCopyField = { id: string; label: string; value: string; group: string };

export function companyCopyFields(): CompanyCopyField[] {
  const { address } = COMPANY_PROFILE;
  return [
    { id: "legalName", label: "Legal name", value: COMPANY_PROFILE.legalName, group: "Business" },
    { id: "companyNumber", label: "Company number", value: COMPANY_PROFILE.companyNumber, group: "Business" },
    { id: "vat", label: "VAT", value: COMPANY_PROFILE.vat, group: "Business" },
    { id: "street", label: "Street and number", value: address.street, group: "Address" },
    { id: "area", label: "Area", value: address.area, group: "Address" },
    { id: "city", label: "City", value: address.city, group: "Address" },
    { id: "land", label: "Land", value: address.land, group: "Address" },
    { id: "country", label: "Country", value: address.country, group: "Address" },
    { id: "postcode", label: "Postcode", value: address.postcode, group: "Address" },
    { id: "fullAddress", label: "Full address", value: companyFullAddress(), group: "Address" },
    ...COMPANY_PROFILE.emails.map((email, index) => ({
      id: `email-${index}`,
      label: "Email",
      value: email,
      group: "Email",
    })),
    ...COMPANY_PROFILE.sites.map((host) => ({
      id: `site-${host}`,
      label: host,
      value: host,
      group: "Sites",
    })),
  ];
}
