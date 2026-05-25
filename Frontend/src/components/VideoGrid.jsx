/**
 * components/VideoGrid.jsx — Lays out all video tiles in a responsive grid.
 *
 * The grid layout changes based on participant count — same as Zoom/Meet:
 *   1 person  → full width single tile
 *   2 people  → side by side
 *   3–4       → 2x2 grid
 *   5+        → 3-column grid
 *
 * MUI's Grid2 component handles this via the xs/sm/md breakpoint props.
 */

import { Box, Grid } from "@mui/material";
import VideoTile from "./VideoTile";

/**
 * Returns MUI Grid column sizing based on participant count.
 * MUI Grid uses a 12-column system — xs={6} means "take 6 of 12 columns = 50% width"
 */
const getGridCols = (count) => {
  if (count === 1) return 12;
  if (count === 2) return { xs: 12, sm: 6 };    // mobile: stacked, desktop: side by side
  if (count <= 4) return { xs: 12, sm: 6 };     // mobile: stacked, desktop: 2x2
  return { xs: 12, sm: 6, md: 4 };              // mobile: stacked, desktop: 3 col
};

const VideoGrid = ({ localStream, peers, isMuted, isCamOff, localUser }) => {
  const totalCount = 1 + peers.size; // local + all remote peers
  const colSize = getGridCols(totalCount);
  const peersArray = Array.from(peers.values()); // convert Map to array for .map()

  return (
    <Box sx={{ flex: 1, p: 2, overflow: "auto" }}>
      <Grid container spacing={1.5} sx={{ height: "100%" }}>
        {/* Local user tile — always first */}
        <Grid size ={colSize}>
          <VideoTile
            stream={localStream}
            name={localUser?.name || "You"}
            isMuted={isMuted}
            isCamOff={isCamOff}
            isLocal={true}
          />
        </Grid>

        {/* Remote peers */}
        {peersArray.map((peer) => (
          <Grid size={colSize} key={peer.socketId}>
            <VideoTile
              stream={peer.stream}
              name={peer.name}
              isMuted={false} // we can't know if remote is muted (no API for it yet)
              isCamOff={!peer.stream}
              isLocal={false}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VideoGrid;
