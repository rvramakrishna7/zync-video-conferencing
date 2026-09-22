/**
 * components/VideoGrid.jsx 
 */

import { Box, Grid } from "@mui/material";
import VideoTile from "./VideoTile";


const getGridCols = (count) => {
  if (count === 1) return 12;
  if (count === 2) return { xs: 12, sm: 6 };    
  if (count <= 4) return { xs: 12, sm: 6 };     
  return { xs: 12, sm: 6, md: 4 };             
};

const VideoGrid = ({ localStream, peers, isMuted, isCamOff, localUser }) => {
  const totalCount = 1 + peers.size; // local + all remote peers
  const colSize = getGridCols(totalCount);
  const peersArray = Array.from(peers.values()); 

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
              isMuted={false} 
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
