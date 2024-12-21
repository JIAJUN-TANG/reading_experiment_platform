import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  alpha,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useUser } from './UserProvider';

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
      <Box sx={{ display: 'flex', minheight: '100vh'}}>
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
                  <Typography variant="h5" align="center">
                    上传新文献
                  </Typography>

                  <FormControl fullWidth>
                    <InputLabel>系列</InputLabel>
                    <Select
                      value={formData.series}
                      onChange={handleChange('series')}
                      label="系列"
                    >
                      <MenuItem value="系列1">系列1</MenuItem>
                      <MenuItem value="系列2">系列2</MenuItem>
                      <MenuItem value="系列3">系列3</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>语言</InputLabel>
                    <Select
                      value={formData.language}
                      onChange={handleChange('language')}
                      label="语言"
                    >
                      <MenuItem value="日语">日语</MenuItem>
                      <MenuItem value="英语">英语</MenuItem>
                      <MenuItem value="德语">德语</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <input
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      id="file-upload"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        fullWidth
                      >
                        选择PDF文件
                      </Button>
                    </label>
                    {formData.file && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        已选择: {formData.file.name}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!formData.file || !formData.series}
                  >
                    上传文献
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Update;
