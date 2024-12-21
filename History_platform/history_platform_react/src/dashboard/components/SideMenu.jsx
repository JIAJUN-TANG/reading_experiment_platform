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
  boxSizing: 'border-box',
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const [open, setOpen] = React.useState(false); // 控制 Drawer 的显示状态
  const { userInfo } = useUser();

  const toggleDrawer = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  return (
    <Box>
      <IconButton 
        onClick={toggleDrawer}
        sx={{
          mt: 1.25,
          ml: 2,
          p: 0, // 去掉内边距
          minWidth: 0, // 去掉按钮的最小宽度
          backgroundColor: 'transparent', // 设置背景为透明
          border: 'none', // 去掉任何边框
          '&:hover': {
            backgroundColor: 'transparent', // 去掉 hover 背景
          },
          '&:focus': {
            outline: 'none', // 去掉焦点框
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary" // 使用 temporary 模式，可以在点击外部区域时关闭
        open={open} // 根据 open 状态来控制 Drawer 是否显示
        onClose={toggleDrawer} // 添加 onClose 属性来处理关闭事件
        sx={{
          [`& .${drawerClasses.paper}`]: {
            backgroundColor: 'background.paper',
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
