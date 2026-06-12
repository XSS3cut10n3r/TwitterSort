# Twitter/X Auto Sort by Likes - Fixed (2026)

This is a fixed version of the [original script](https://gist.github.com/samir-dahal/58e015ee91691416d4778dffebc13330) that stopped working due to Twitter UI changes.

## What This Does
Automatically sorts Twitter/X replies by "Likes" when viewing tweets. The setting doesn't persist between tweets, so this script applies it for you every time.

## What Was Fixed
1. **URL Parameter Approach**: Instead of relying on clicking the UI, the script uses X's native `?sort_replies=likes` URL parameter, so replies load already sorted - no flicker
2. **CSP Compatibility**: X's Content-Security-Policy blocks page-context injection in Firefox; this script avoids patching `fetch`/`history` entirely
3. **Back Button Fix**: Detects and skips the duplicate history entries that sort switching creates, so the back button actually takes you back
4. **Dropdown Fallback**: If a tweet still loads sorted by "Relevant" (back/forward navigation, etc.), the script opens the sort dropdown and selects "Likes" automatically

## Installation
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click "Raw" button on `twittersort.user.js` (or [click here](https://raw.githubusercontent.com/YOUR_USERNAME/twittersort/main/twittersort.user.js))
3. Tampermonkey should prompt to install
4. Enable the script

Updates are delivered automatically via Tampermonkey's update checker.

## How It Works
- **Hard page loads**: rewrites the URL via `history.replaceState` before X's app boots, so the app reads `sort_replies=likes` on startup
- **In-app navigation**: a capture-phase click listener appends the parameter to tweet links before X's router reads them
- **Fallback**: if a tweet page still shows "Relevant", clicks the sort dropdown and selects "Likes"
- **Back button**: a `popstate` handler skips past duplicate history entries created by the fallback

## Tested On
- Firefox with Tampermonkey (Chrome should work too)
- Twitter/X UI as of June 2026
- Windows/Mac/Linux

## Troubleshooting
Set `DEBUG = true` at the top of the script, then open browser console (F12) and look for `[TwitterSort]` messages to see what's happening.

If you manually select "Recent" from the dropdown, the script won't fight you - it only acts when the sort is "Relevant" (the default). Note the fallback's text matching assumes the English X interface.

## Credits
- Original concept by [@samir-dahal](https://gist.github.com/samir-dahal)
- Rewritten for 2026 Twitter UI with URL-parameter approach

## License
MIT