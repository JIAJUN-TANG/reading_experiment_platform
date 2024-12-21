import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  TextField,
  Button,
  Avatar,
  alpha,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import AppNavbar from './AppNavbar';
import Header from './Header';
import SideMenu from './SideMenu';
import { useUser } from '../../UserProvider';
import AppTheme from '../../shared-theme/AppTheme';


const Profile = (props) => {
  const { userInfo } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: userInfo?.email || '',
    userName: userInfo?.user_name || '',
    affiliation: userInfo?.affiliation || '',
    registerDate: userInfo?.register_date || '未知',
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // 这里添加保存到后端的逻辑
      // const response = await axios.post('your-api-endpoint', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minheight: '100vh' }}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          className="MainContent"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            paddingTop: 0,
          })}
        >
          <Header />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: 2,
            }}
          >
            <Card sx={{ width: '100%', maxWidth: 800 }}>
              <CardContent>
                <Stack spacing={3}>
                  {/* 头像和用户名部分 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                      }}
                    >
                      {formData.userName.charAt(0)}
                    </Avatar>
                    <Typography variant="h4">{formData.userName}</Typography>
                  </Box>

                  <Divider />

                  {/* 个人信息表单 */}
                  <Stack spacing={3}>
                    <TextField
                      label="邮箱"
                      value={formData.email}
                      onChange={handleChange('email')}
                      disabled={!isEditing || true}
                      fullWidth
                    />
                    <TextField
                      label="用户名"
                      value={formData.userName}
                      onChange={handleChange('userName')}
                      disabled={!isEditing}
                      fullWidth
                    />
                    <TextField
                      label="所属机构"
                      value={formData.affiliation}
                      onChange={handleChange('affiliation')}
                      disabled={!isEditing}
                      fullWidth
                    />
                    <TextField
                      label="注册日期"
                      value={formData.registerDate}
                      disabled
                      fullWidth
                    />
                  </Stack>

                  {/* 编辑/保存按钮 */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {isEditing ? (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                      >
                        保存更改
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                      >
                        编辑信息
                      </Button>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Profile;
