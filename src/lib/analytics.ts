/**
 * Google Tag Manager container. PUBLIC_GTM_ID overrides it; production builds fall back to the live
 * container so tracking never depends on an environment variable. Dev and test builds load nothing.
 */
const LIVE_CONTAINER = 'GTM-NSDMRJW6';
export const GTM_ID: string | undefined = (import.meta.env.PUBLIC_GTM_ID as string | undefined) || (import.meta.env.PROD ? LIVE_CONTAINER : undefined);
