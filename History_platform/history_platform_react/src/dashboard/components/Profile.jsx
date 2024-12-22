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
      <Box sx={{ display: 'flex'}}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pl: 5,
              pr: 5,
              pb: 5,
              mt: { xs: 8, md: 1 },
              width: '100%',
            }}
          >
            <Header />
          </Stack>
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              padding: 2,
              margin: '0 auto',
            }}
          >
            <Card>
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
                    {/* 将表单分为两列 */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {/* 左列 */}
                      <Stack spacing={3}>
                        {/* 邮箱 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            邮箱
                          </Typography>
                          <Typography variant="body1">
                            {formData.email}
                          </Typography>
                        </Box>

                        {/* 用户名 */}
                        {isEditing ? (
                          <TextField
                            label="用户名"
                            value={formData.userName}
                            onChange={handleChange('userName')}
                            fullWidth
                          />
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              用户名
                            </Typography>
                            <Typography variant="body1">
                              {formData.userName}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {/* 右列 */}
                      <Stack spacing={3}>
                        {/* 所属机构 */}
                        {isEditing ? (
                          <TextField
                            label="所属机构"
                            value={formData.affiliation}
                            onChange={handleChange('affiliation')}
                            fullWidth
                          />
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              所属机构
                            </Typography>
                            <Typography variant="body1">
                              {formData.affiliation}
                            </Typography>
                          </Box>
                        )}

                        {/* 注册日期 */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            注册日期
                          </Typography>
                          <Typography variant="body1">
                            {formData.registerDate}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

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
