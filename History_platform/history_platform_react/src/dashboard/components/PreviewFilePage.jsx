import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha, Stack, Box, Typography, Card, CardContent, Divider } from '@mui/material';
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
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [fullText, setFullText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [series, setSeries] = useState('');
  const [fileName, setFileName] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const fetchFileAndText = async () => {
      setLoading(true);
      setError(null);

      try {
        // 请求文件
        const fileResponse = await axios.post(
          'http://114.212.97.42:8000/file/GetFile/',
          { uuid: uuid },
          { responseType: 'blob' }
        );

        if (fileResponse.status === 200 && fileResponse.data.size > 0) {
          const blob = new Blob([fileResponse.data], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
        }

        // 请求全文
        const textResponse = await axios.post(
          'http://114.212.97.42:8000/file/GetFullText/',
          { uuid: uuid }
        );

        if (textResponse.status === 200) {
          const { full_text, title, user_name, series_name, file_name, start_page, end_page } = textResponse.data;
          setFullText(full_text || '无内容');
          setTitle(title || '文档标题');
          setOwner(user_name || '未知所有者');
          setSeries(series_name || '未知系列');
          setFileName(file_name || '未知文件名');
          setStartPage(start_page || '未知起始页');
          setEndPage(end_page || '未知结束页');
        }
      } catch (error) {
        console.error('加载文件或全文失败:', error);
        setError('加载失败');
      }

      setLoading(false);
    };

    fetchFileAndText();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [uuid]);

  dotSpinner.register();
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
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              pb: 2,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            {/* 信息卡片 */}
            <Card sx={{ width: '90%', marginTop: 2 }}>
              <CardContent>
                <Typography variant="h4" align="center" gutterBottom>
                  {title}
                </Typography>
                <Divider sx={{ mb: 2 }}/>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>所有者:</strong> {owner}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>系列:</strong> {series}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>文件名:</strong> {fileName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>起始页:</strong> {startPage}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>结束页:</strong> {endPage}
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* 预览区域 */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              flex: 1,
              height: 'calc(100vh - 350px)',
              width: '90%',
              margin: '0 auto',
            }}
          >
            {pdfBlobUrl ? (
              <Box 
                sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  overflow: 'hidden',
                }}
              >
                <Typography variant="h6" align="center" sx={{ py: 1 }}>
                  PDF 预览
                </Typography>
                <Divider />
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                    <Viewer fileUrl={pdfBlobUrl} plugins={[defaultLayoutPluginInstance]} />
                  </Worker>
                </Box>
              </Box>
            ) : null}

            <Box 
              sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                overflow: 'hidden',
              }}
            >
              <Typography variant="h6" align="center" sx={{ py: 1 }}>
                全文预览
              </Typography>
              <Divider />
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {fullText}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <FloatingChatButton assistant_message={textContent} />
      </Box>
    </AppTheme>
  );
}