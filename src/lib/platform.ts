// Runtime flag that lets us strip wallet / auth UI from the Capacitor build
// without forking the codebase. Set NEXT_PUBLIC_PLATFORM=mobile when running
// `next build` for the Android export; everything else (Docker, dev) gets the
// full web experience.
export const IS_MOBILE = process.env.NEXT_PUBLIC_PLATFORM === "mobile";
