import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha, Stack, Box, Typography, Card, CardContent } from '@mui/material';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import axios from 'axios';
import { dotSpinner } from 'ldrs';
import AppNavbar from './AppNavbar';
import Header from './Header';
import FloatingChatButton from '../../AIDialog';
import AppTheme from '../../shared-theme/AppTheme';

export default function FilePreview(props) {
  const { uuid } = useParams();
  const [pdfFile, setPdfFile] = useState(null);
  const [fullText, setFullText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading state
      setError(null); // Clear previous errors

      try {
        const response = await axios.post(
          'http://114.212.97.42:8000/file/GetFile/',
          { uuid: uuid },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { file_url, full_text, title } = response.data;

        if (file_url) {
          setPdfFile(file_url);
        }

        setFullText(full_text || '无内容');
        setTitle(title || '文档标题');
      } catch (error) {
        console.error('加载文件内容失败:', error);
        setError('文件加载失败');
      }

      setLoading(false);
    };

    fetchData();
  }, [uuid]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <l-dot-spinner size="40" speed="0.9" color="coral"></l-dot-spinner>
        <Typography variant="body1" style={{ marginTop: '16px' }}>
          正在加载预览中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" paddingTop="50px">
        <Typography variant="h5" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  const textContent = document.body.innerText;

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <AppNavbar />
        {/* Main content */}
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
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
          </Stack>
          <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
            {pdfFile ? (
              <Box sx={{ flex: 1, padding: '10px', borderRight: '2px solid #ccc', height: '100%' }}>
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                  <Viewer fileUrl={pdfFile} plugins={[defaultLayoutPluginInstance]} />
                </Worker>
              </Box>
            ) : null}
            <Box sx={{ flex: 1, padding: '10px', height: '100%' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
                  <Typography variant="h6" gutterBottom>
                    {title}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {fullText}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
        <FloatingChatButton assistant_message={textContent} />
      </Box>
    </AppTheme>
  );
}