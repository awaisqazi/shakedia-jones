// Single source of truth for campaign facts used in markup (links, dates, contact).
// Copy that changes by language lives in src/i18n/parts/*.json, not here.
// Anything marked TO CONFIRM is a placeholder until the campaign supplies it.

export const CANDIDATE = 'Shakedia Jones';
export const EMAIL = ''; // TO CONFIRM: campaign email. While empty, the sign-up form shows an 'opens soon' card.

// TO CONFIRM: donation page (ActBlue or similar). While empty, every Donate button is
// hidden: a campaign must not solicit contributions before its committee (ISBE D-1) exists.
export const DONATE_URL = '';

// FLY is a 501(c)(3) and must stay separate from the campaign: no FLY links on campaign pages.
export const FLY_URL = '';

// Social links. Empty href hides the icon.
export const SOCIALS = [
  { name: 'Instagram', href: '', icon: 'ig' },
  { name: 'Facebook', href: '', icon: 'fb' },
  { name: 'TikTok', href: '', icon: 'tt' },
];

// Election calendar (ISO dates). Countdown chips read these.
export const DATES = {
  primary: '2027-02-23', // primary election: the headline date and the countdown target
  general: '2027-04-06', // consolidated (general) election
  election: '2027-02-23', // alias of primary, kept so older imports keep working
};

export const donateHref = (base) => DONATE_URL || `${base}/join/#donate`;
export const isExternalDonate = () => Boolean(DONATE_URL);
export const canDonate = () => Boolean(DONATE_URL);

// Lake County Clerk's Voter Power registration lookup. Keep in sync with ui.clerk_url in
// src/i18n/parts/shared.en.json (es points at the Clerk's Spanish page). /2365/Elections is dead.
export const COUNTY_CLERK_URL = 'https://www.lakecountyil.gov/351/Voter-Power-for-Registered-Voters';
export const WARD = '1st'; // TO CONFIRM with the campaign (inferred from city ward GIS for her block)
