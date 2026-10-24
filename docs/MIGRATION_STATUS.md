# Migration Status

Source project: `TtroFX/3D-Chess` (no longer accessible through the GitHub API)
Target project: `totoro0419/3dchess`

## Reconstructed and migrated

- React + TypeScript + Vite
- React Three Fiber 3D chess board
- Staunton-inspired readable 3D pieces
- Drag and click movement
- Legal move highlighting
- Smooth move / capture / castling animation profiles
- Promotion chooser
- Local autosave
- Local Undo / Redo
- chess.js rules
- Lichess OAuth PKCE
- Lichess account loading
- Event stream
- Game stream
- Server-authoritative UCI reconstruction
- Online move POST
- Draw / Takeback / Resign API controls
- NDJSON regression tests
- UCI synchronization tests
- GitHub Actions CI
- GitHub Pages workflow
- Vite base path updated to `/3dchess/`

## Verification

Latest migrated code passes:

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Not yet fully reconstructed from the inaccessible old repository

The inaccessible source repository prevents a byte-for-byte/history-preserving migration. These previously implemented features still need to be re-added for full parity:

- Quick Match / seek UI
- Direct user challenge UI
- Incoming challenge accept / decline
- Lichess AI challenge UI
- Premove
- Interpolated Lichess clocks
- Stream reconnect/backoff polish
- Full online matchmaking state UI
- Remaining production E2E/mobile QA

## GitHub Pages

The workflow is ready for `https://totoro0419.github.io/3dchess/`, but the repository's Pages site must first be enabled with **Settings → Pages → Source: GitHub Actions**. The Actions token cannot create the Pages site for this repository because GitHub returns `Resource not accessible by integration`.
