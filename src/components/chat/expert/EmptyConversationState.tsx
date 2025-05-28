import React from "react";
import { Button, Typography, Box } from "@mui/material";

type EmptyConversationStateProps = {
  onStartChat: () => void;
};

const EmptyConversationState: React.FC<EmptyConversationStateProps> = ({
  onStartChat,
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    height="100%"
    p={2}
  >
    <Typography variant="h6" gutterBottom>
      Non hai ancora iniziato una chat con il fitopatologo
    </Typography>
    <Typography variant="body1" color="textSecondary" gutterBottom>
      Premi il pulsante qui sotto per iniziare una nuova conversazione e ricevere assistenza da un esperto.
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={onStartChat}
      sx={{ mt: 2 }}
    >
      Inizia chat con fitopatologo
    </Button>
  </Box>
);

export default EmptyConversationState;
