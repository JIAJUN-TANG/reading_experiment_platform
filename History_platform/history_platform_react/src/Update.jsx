import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  alpha,
  Container,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import { 
  Language as LanguageIcon,
  FindInPage as FindInPageIcon,
  Translate as TranslateIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useUser } from './UserProvider';
import DHlogo from '../DH.svg';

const features = [
  {
    icon: <LanguageIcon sx={{ fontSize: 40 }} />,
    title: '多语言支持',
    description: '支持日语、英语、德语等多种语言的文献处理',
  },
  {
    icon: <FindInPageIcon sx={{ fontSize: 40 }} />,
    title: 'OCR识别',
    description: '先进的OCR技术，准确识别文献内容',
  },
  {
    icon: <TranslateIcon sx={{ fontSize: 40 }} />,
    title: '智能翻译',
    description: '集成AI翻译功能，快速获取中文译文',
  },
  {
    icon: <StorageIcon sx={{ fontSize: 40 }} />,
    title: '自动存储',
    description: '文献内容自动保存，支持在线检索',
  },
];

const Update = (props) => {
  const { userInfo } = useUser();
  const [formData, setFormData] = useState({
    series: '',
    language: '日语',
    file: null,
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    setFormData({
      ...formData,
      file: event.target.files[0],
    });
  };

  const handleSubmit = async () => {
    // 处理提交逻辑
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
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
              backgroundImage: 'linear-gradient(to bottom right, #4A148C 10%, #9C27B0 50%, #E1BEE7 100%)',
              pt: 12,
              pb: 12,
            }}
          >
            <Container maxWidth="lg">
              <Stack spacing={4} alignItems="center">
                <img 
                  src={DHlogo} 
                  alt="DHlogo" 
                  style={{ 
                    width: '100px', 
                    height: '100px',
                  }} 
                />
                <Typography
                  component="h1"
                  variant="h2"
                  color="white"
                  sx={{ textAlign: 'center', fontWeight: 'bold' }}
                >
                  文献上传与处理
                </Typography>
                <Typography
                  variant="h5"
                  color="white"
                  sx={{ textAlign: 'center', maxWidth: 800, opacity: 0.9 }}
                >
                  通过我们的智能处理系统，轻松上传和管理您的历史文献。支持多语言OCR识别和AI辅助翻译。
                </Typography>
              </Stack>
            </Container>
          </Box>

          {/* Features Section */}
          <Box sx={{ py: 8, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
              <Grid2 container spacing={4}>
                {features.map((feature, index) => (
                  <Grid2 xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                      <Box sx={{ p: 2, color: 'primary.main' }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom align="center">
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {feature.description}
                      </Typography>
                    </Card>
                  </Grid2>
                ))}
              </Grid2>
            </Container>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Update;
