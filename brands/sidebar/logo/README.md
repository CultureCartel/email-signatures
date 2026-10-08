# Sidebar logo

Source: the client-supplied Danforth Sidebar Toronto wordmark (JPG, 2000x674), traced to vector on 2026-10-08. The trace matches the original to within 0.85% of pixels, all on letter edges. Navy is sampled from the original: #052E42.

| File | Use |
|---|---|
| sidebar-logo.svg | Master vector, navy. Each letter is its own path, grouped by line (danforth, sidebar, toronto). |
| sidebar-logo-black.svg / .png | One colour black. PNG is 2000px wide, transparent. |
| sidebar-logo-white.svg / .png | One colour white for dark backgrounds. PNG is 2000px wide, transparent. |
| sidebar-logo.png | Navy, 2000px wide, transparent. |
| sidebar-logo-animated.svg | Web animation, navy. A hairline draws across like a bar top, SIDEBAR rises up through it from the centre out, the line pulls back, then DANFORTH and TORONTO close in from wide tracking. 2.7 seconds, plays once, respects reduced motion. |
| sidebar-logo-animated-white.svg | Same, white, for dark backgrounds. |
| sidebar-logo-animated.mp4 | 1920x1080 on white, for social and screens. |
| ../../../public/sidebar/sidebar-logo-animated.gif | The email signature logo. 360x124 shown at 180x62, 30 frames a second. Frame one is the finished logo, because Outlook for Windows only shows the first frame. Plays once and rests on the full logo. White background so it survives dark mode. |
| ../../../public/sidebar/sidebar-logo-email.png | Still fallback of the same. |

Re-render everything after changing an SVG: `npm install && npm run logo -- sidebar`. If you replace a hosted image, give it a new file name (mail apps and CDNs cache by name).
