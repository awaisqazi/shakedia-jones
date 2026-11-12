// Single source of truth for campaign facts used in markup (links, dates, contact).
// Copy that changes by language lives in src/i18n/parts/*.json, not here.
// Anything marked TO CONFIRM is a placeholder until the campaign supplies it.

export const CANDIDATE = 'Shakedia Jones';
// Campaign email. Kept empty on purpose: the campaign asked for contact info to stay off the site.
// (Only the footer reads it; the sign-up forms post to Google Forms, see FORMS below.)
export const EMAIL = '';

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

// ---------------------------------------------------------------------------------------------
// Sign-up forms. The site's own forms (/join/#signup and /join/#yard-sign) post straight into the
// campaign's two Google Forms. Every key and option value below was read from each form's public
// viewform page (the FB_PUBLIC_LOAD_DATA_ JSON); see README "Sign-up forms" for how to re-read them.
//   - Option values must match the Google Form EXACTLY (spacing, capitals, "&") and stay in English
//     in both site languages. Only the visible labels are translated (src/i18n/parts/join.*.json).
//   - If the campaign edits a question or an option in Google Forms, update the matching key/value here.
//   - emailAddress: both forms have Settings > Responses > "Collect email addresses: Responder input",
//     so Google requires an `emailAddress` field on every submission and rejects a response without it.
//     A no-cors POST cannot see that rejection, so never drop it while the setting is on.
// ---------------------------------------------------------------------------------------------
const formResponseUrl = (id) => `https://docs.google.com/forms/d/e/${id}/formResponse`;

// Sent with every submission, as Google's own single-page form sends them. The per-load tokens
// (fbzx, partialResponse, submissionTimestamp) are left out: Google does not need them on a POST.
export const FORM_STATIC_FIELDS = { fvv: '1', pageHistory: '0' };

const VOLUNTEER_ID = '1FAIpQLSeDb6wBaKjPD7U1Vl8tQgJyjvqDByd1hpnRc9bXLZ-jF72syA';
const YARD_SIGN_ID = '1FAIpQLSfpWdRvWhsY0F9VcgKkH1UI4TdqNgFxyJOalNc7qUFitoQ7eA';

export const FORMS = {
  // Google Form "Volunteer Sign-Up"
  volunteer: {
    id: VOLUNTEER_ID,
    action: formResponseUrl(VOLUNTEER_ID),
    email: 'emailAddress', // built-in "Collect email addresses" field (required)
    entries: {
      name: 'entry.1498135098', // "Name" (required)
      phone: 'entry.143947870', // "Phone Number" (required)
      events: 'entry.698521032', // "What type of events would you like to volunteer for?" (checkboxes, optional)
      availability: 'entry.877086558', // "Days & Times of Availability" (checkboxes, required)
      others: 'entry.2606285', // "Names of additional volunteers joining you" (optional)
      heard: 'entry.1424661284', // "How did you hear about volunteering with us?" (single choice, optional)
    },
    // k = i18n key suffix (join.volunteer.ev_<k>), value = the Google option string
    events: [
      { k: 'canvassing', value: 'Canvassing' },
      { k: 'fundraising', value: 'Fundraising' },
      { k: 'admin', value: 'Administrative' },
      { k: 'phone', value: 'Phone Banking' },
      { k: 'meet', value: 'Meet & Greets' },
    ],
    // The "Other" choice: send events=__other_option__ plus events.other_option_response=<text>.
    otherValue: '__other_option__',
    otherSuffix: '.other_option_response',
    availability: {
      weekday: [
        { k: 'mon', value: 'Monday: 5pm - 8pm' },
        { k: 'tue', value: 'Tuesday: 5pm - 8pm' },
        { k: 'wed', value: 'Wednesday: 5pm - 8pm' },
        { k: 'thu', value: 'Thursday: 5pm - 8pm' },
        { k: 'fri', value: 'Friday: 5pm - 8pm' },
      ],
      saturday: [
        { k: 'morning', value: 'Saturday: 10am - 1pm' },
        { k: 'afternoon', value: 'Saturday: 3pm - 7pm' },
      ],
      sunday: [
        { k: 'morning', value: 'Sunday: 10am - 1pm' },
        { k: 'afternoon', value: 'Sunday: 3pm - 7pm' },
      ],
    },
    heard: [
      { k: 'website', value: 'Website' },
      { k: 'friend', value: 'Friend' },
      { k: 'newsletter', value: 'Newsletter' },
      { k: 'ad', value: 'Advertisement' },
    ],
  },
  // Google Form "Host a Yard Sign"
  yardSign: {
    id: YARD_SIGN_ID,
    action: formResponseUrl(YARD_SIGN_ID),
    email: 'emailAddress', // built-in "Collect email addresses" field (required)
    entries: {
      name: 'entry.2005620554', // "Name" (required)
      email: 'entry.1045781291', // "Email" (required). The site sends the one email answer under both keys.
      address: 'entry.1065046570', // "Address" (paragraph, required)
      phone: 'entry.1166974658', // "Phone number" (optional)
    },
  },
};
