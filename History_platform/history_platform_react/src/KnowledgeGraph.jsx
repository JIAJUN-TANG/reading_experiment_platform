import { React, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import FileUploaderViewer from './FileUploaderViewer';
import { useUser } from './UserProvider';
import { helix } from 'ldrs';
import FloatingChatButton from './AIDialog';


import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './dashboard/theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const KnowledgeGraph = (props) => {
  const { userInfo } = useUser();
  const [filePath, setFilePath] = useState(null);
  const [pageCount, setPageCount] = useState(null); // Total number of PDF pages
  const [ocrText, setOcrText] = useState(null); // OCR text for the current page
  const [translatedText, setTranslatedText] = useState(null); // Translated text for the current page
  const [loading, setLoading] = useState(false); // Loading state for button feedback
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination

  // Handle successful file upload
  const handleUploadSuccess = (path, numPages) => {
    setFilePath(path);
    setPageCount(numPages);
    setCurrentPage(1); // Reset to page 1 when a new file is uploaded
  };

  // Memoized function to fetch OCR and translation text for a specific page
  const handleGetOcrAndTranslate = useCallback(async (page = 1) => {
    if (!filePath) {
      alert('请先上传文件！');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://114.212.97.42:8000/translate/GetTranslation/', {
        file_path: filePath,
        email: userInfo?.email,
        page: page,
      });

      if (response.data) {
        setOcrText(response.data.ocr_text || '未能获取识别结果。');
        setTranslatedText(response.data.translated_text || '未能获取翻译结果。');
      } else {
        throw new Error('未能获取 OCR 或翻译结果。');
      }
    } catch (error) {
      console.error("后端返回错误：", error.response?.data || error.message);
      alert(`获取失败：${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [filePath, userInfo?.email]);

  // Handle page change in pagination
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    handleGetOcrAndTranslate(value);
  };

  useEffect(() => {
    if (filePath && pageCount > 0) {
      handleGetOcrAndTranslate(1); // Get OCR and translation for the first page
    }
  }, [filePath, pageCount, handleGetOcrAndTranslate]); // Add memoized function to the dependency array

  helix.register()
  
  const textContent = ocrText || translatedText || '';

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
          </Stack>

          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
              <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
            </Stack>
          </Box>
        </Box>
        <FloatingChatButton assistant_message={textContent} />
      </Box>
    </AppTheme>
  );
};

export default KnowledgeGraph;