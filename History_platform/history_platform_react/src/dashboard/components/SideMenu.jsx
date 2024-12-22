import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MenuContent from './MenuContent';
import CardAlert from './CardAlert';
import OptionsMenu from './OptionsMenu';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useUser } from '../../UserProvider'

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
    position: 'fixed',
    height: '100%',
    left: 0,
  },
});

export default function SideMenu() {
  const [open, setOpen] = React.useState(false);
  const { userInfo } = useUser();

  const toggleDrawer = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  return (
    <Box sx={{ position: 'absolute' }}>
      <IconButton 
        onClick={toggleDrawer}
        sx={{
          left: 16,
          top: 16,
          zIndex: 1200,
          p: 0,
          minWidth: 0,
          backgroundColor: 'transparent',
          border: 'none',
          transition: 'transform 0.5s ease-in-out',
          transform: open ? 'rotate(180deg)' : 'none',
          '&:hover': {
            backgroundColor: 'transparent',
            transform: `${open ? 'rotate(180deg)' : 'none'} scale(1.1)`,
          },
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary"
        open={open}
        onClose={toggleDrawer}
        sx={{
          [`& .${drawerClasses.paper}`]: {
            backgroundColor: 'background.paper',
            transform: open ? 'none' : 'translateX(-100%)',
            transition: theme => theme.transitions.create(['transform'], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
            boxShadow: open ? '4px 0px 8px rgba(0, 0, 0, 0.1)' : 'none',
          },
        }}
        SlideProps={{
          timeout: {
            enter: 400,
            exit: 300,
          },
        }}
      >
        <MenuContent />
        <CardAlert />
        <Stack
          direction="row"
          sx={{
            p: 2,
            gap: 1,
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Avatar
            sizes="small"
            alt={`${userInfo?.user_name || "用户名"}`}
            src="/static/images/avatar/7.jpg"
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ mr: 'auto', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
              {userInfo?.user_name || "用户名"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 150,
              }}
            >
              {userInfo?.email || "用户邮箱"}
            </Typography>
          </Box>
          <OptionsMenu />
        </Stack>
      </Drawer>
    </Box>
  );
}
