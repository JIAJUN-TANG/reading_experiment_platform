import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import { CssBaseline, Box, Stack, Tabs, Tab, Typography, CircularProgress } from '@mui/material';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import FileUploaderViewer from './FileUploaderViewer';  // 如果需要在其他标签页使用
import PageNavigatorCard from './PageSelect';
import GuideTable from './GuideTable';
import WriteToDatabaseCard from './SavetoDatabase';
import TextFileUploader from './TextFileUploaderViewer'; // 导入新的组件
import axios from 'axios';
import { chartsCustomizations, dataGridCustomizations, datePickersCustomizations, treeViewCustomizations } from './dashboard/theme/customizations';
import FloatingChatButton from './AIDialog';


const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

// TabPanel组件，用于切换显示内容
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default function Process(props) {
  const [filePath, setFilePath] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [showGuideTable, setShowGuideTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newIndex) => setTabIndex(newIndex);

  const handleUploadSuccess = (path, numPages) => {
    setFilePath(path);
    setPageCount(numPages);
  };

  const handlePageRangeConfirm = async (startPage, endPage, language) => {
    setLoading(true);
    try {
      const response = await axios.post('http://114.212.97.42:8000/api/GetCatelogue/', {
        file_path: filePath,
        start_page: parseInt(startPage, 10),
        end_page: parseInt(endPage, 10),
        language,
      });
      setOcrResults(response.data.ocr_results);
      setShowGuideTable(true);
    } catch (error) {
      console.error('OCR解析失败：', error.response?.data || error.message);
      alert('目录解析失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* 侧边导航 */}
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

        {/* 标签页 */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Process tabs"
          centered
          sx={{
            '& .MuiTab-root': {
              minWidth: 0,
              mx: 3,
              paddingX: 2,
              border: 'none',
            },
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          <Tab label="带目录文献" />
          <Tab label="无目录文献" />
          <Tab label="文本文献" />
        </Tabs>

        {/* 带目录文献 */}
        <TabPanel value={tabIndex} index={0}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: '100%' }}>
              <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
            </Stack>

            {filePath && pageCount && (
              <Box sx={{ width: '100%', height: '800px', pl: 2, position: 'relative' }}>
                <PageNavigatorCard
                  filePath={filePath}
                  totalPages={pageCount}
                  setOcrResults={setOcrResults}
                  onConfirm={handlePageRangeConfirm}
                  loading={loading}
                />
                {loading ? (
                  <Box
                    sx={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <>{showGuideTable && <GuideTable ocrResults={ocrResults} filePath={filePath} />}</>
                )}
              </Box>
            )}
          </Box>

          {/* 写入数据库卡片 */}
          <Box sx={{ width: '100%', display: 'absolute', justifyContent: 'center', py: 10, mx: 'auto' }}>
            {filePath && (
              <WriteToDatabaseCard filePath={filePath} type="With"/>
            )}
          </Box>
        </TabPanel>

        {/* 无目录文献 */}
        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ flexGrow: 1, display: 'absolute', flexDirection: 'row', p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: '100%' }}>
              <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
            </Stack>
          </Box>
          <Box sx={{ width: '100%', display: 'absolute', justifyContent: 'center', py: 10, mx: 'auto' }}>
            {filePath && (
              <WriteToDatabaseCard filePath={filePath} type="Without"/>
            )}
          </Box>
        </TabPanel>

        {/* 文本文献 */}
        <TabPanel value={tabIndex} index={2}>
        <Box sx={{ flexGrow: 1, display: 'absolute', flexDirection: 'row', p: 4 }}>
            <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: '100%' }}>
              <TextFileUploader onUploadSuccess={handleUploadSuccess} />
            </Stack>
          </Box>
          <Box sx={{ width: '100%', display: 'absolute', justifyContent: 'center', py: 10, mx: 'auto' }}>
            {filePath && (
              <WriteToDatabaseCard filePath={filePath} type="text"/>
            )}
          </Box>
        </TabPanel>
        </Box>
        <FloatingChatButton />
      </Box>
    </AppTheme>
  );
}
