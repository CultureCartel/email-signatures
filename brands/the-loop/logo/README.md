# The Loop TO logo

Source: the site's own wordmark in `the-loop-to/public/brand/` (stroke-built, so it can draw on). Red is #e3262b, ink #141414. On dark grounds the reversed version (cream and #ff4b50) is used.

| File | Use |
|---|---|
| the-loop-logo.svg | Master, colour, for light grounds. |
| the-loop-logo-black.svg | One colour black. |
| the-loop-logo-white.svg | One colour white, for dark grounds. |
| the-loop-logo-animated.svg | The draw-on: the letters are drawn stroke by stroke, then the red loop is drawn round the double O, then the TO badge pops in. About 2.5 seconds, plays once, respects reduced motion. |
| the-loop-logo-animated-white.svg | Same on a dark ground (reversed colours). |
| ../../../public/the-loop/the-loop-logo-draw-on.gif | The email signature logo, 400x62 shown at 200x31. Frame one is the finished logo (Outlook for Windows shows only that), plays once, rests on the full logo. White background so it survives dark mode. |
| ../../../public/the-loop/the-loop-logo-email.png | Still fallback. |

Re-render after changing an SVG: `npm install && CHROMIUM=<path to Chrome> npm run logo -- the-loop`. If you replace a hosted image, give it a new file name (mail apps and CDNs cache by name).
