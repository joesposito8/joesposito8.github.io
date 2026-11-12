export const SITE = {
  name: 'Joey Esposito',
  // Placeholder until Joey writes the site description.
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
];

export const SUBSTACK_URL = 'https://joesposito8.substack.com';

/** Shown in the footer and declared as rel="me" in every page head. */
export const PROFILES = [
  { label: 'GitHub', href: 'https://github.com/joesposito8' },
  { label: 'X', href: 'https://x.com/joesposito8' },
  { label: 'LessWrong', href: 'https://www.lesswrong.com/users/joey-esposito' },
  { label: 'Substack', href: SUBSTACK_URL },
];

/** rel="me" only: profiles that verify the site without a link in the footer. */
export const EXTRA_REL_ME = ['https://www.linkedin.com/in/joseph-esposito8'];

/**
 * The footer's "Email" link. The address is split here and assembled only in the reader's
 * browser, so it never appears whole in the source or the HTML, where address harvesters
 * look. null hides the link.
 */
export const CONTACT_EMAIL: { user: string; domain: string } | null = { user: 'joesposito8', domain: 'gmail.com' };

/** Shows the email signup at the end of every essay. */
export const SUBSTACK_SIGNUP = true;

/**
 * The view counter's public read endpoint: a JSON object mapping each page path
 * ("/posts/<slug>/") to its view count. When set, the list offers "Most popular", which
 * fetches it in the reader's browser; while null, Sort offers only "Newest".
 */
export const VIEWS_URL: string | null = null;
