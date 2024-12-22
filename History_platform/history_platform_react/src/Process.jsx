import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import { CssBaseline, Box, Stack, Tabs, Tab, Typography, CircularProgress, Stepper, Step, StepLabel, StepContent, Button, Paper } from '@mui/material';
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
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';


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
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [activeStep, setActiveStep] = useState(0);

  const handleTabChange = (event, newIndex) => {
    setFilePath(null);
    setPageCount(null);
    setOcrResults(null);
    setShowGuideTable(false);
    setLoading(false);
    setTabIndex(newIndex);
  };

  const handleUploadSuccess = (path, numPages) => {
    setFilePath(path);
    setPageCount(numPages);
  };

  const handlePageRangeConfirm = async (startPage, endPage, language) => {
    setLoading(true);
    try {
      const response = await axios.post('http://114.212.97.42:8000/file/GetCatelogue/', {
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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // 定义步骤
  const steps = [
    {
      label: '选择目录页面',
      description: '请选择文献目录所在的页面范围',
      component: (
        <PageNavigatorCard
          filePath={filePath}
          totalPages={pageCount}
          setOcrResults={setOcrResults}
          onConfirm={(startPage, endPage, language) => {
            handlePageRangeConfirm(startPage, endPage, language);
            if (!loading) handleNext();
          }}
          loading={loading}
        />
      ),
    },
    {
      label: '确认目录内容',
      description: '请确认解析出的目录内容是否正确',
      component: (
        <GuideTable 
          ocrResults={ocrResults} 
          filePath={filePath} 
        />
      ),
    },
    {
      label: '保存到数据库',
      description: '将文献信息保存到数据库中',
      component: (
        <WriteToDatabaseCard 
          filePath={filePath} 
          type="With"
        />
      ),
    },
  ];

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
              pl: 5,
              pr: 5,
              pb: 5,
              mt: { xs: 8, md: 1 },
              width: '100%',
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
            {!filePath ? (
              <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: '100%' }}>
                <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                {/* PDF 预览部分 */}
                <Box
                  sx={{
                    width: '45%',
                    p: 2,
                    mr: 1,
                    textAlign: 'center',
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    height: '100vh',
                    overflow: 'auto'
                  }}
                >
                  <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                    <div style={{ height: '100%' }}>
                      <Viewer
                        fileUrl={`http://114.212.97.42:8000${filePath}`}
                        plugins={[defaultLayoutPluginInstance]}
                      />
                    </div>
                  </Worker>
                </Box>

                {/* 右侧操作区域 - 使用 Stepper */}
                <Box sx={{ width: '55%', height: '100vh', position: 'relative', overflow: 'auto' }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel>
                          <Typography variant="subtitle1">{step.label}</Typography>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {step.description}
                          </Typography>
                          {step.component}
                          <Box sx={{ mb: 2, mt: 2 }}>
                            <div>
                              <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{ mt: 1, mr: 1 }}
                                disabled={index === 0 && !ocrResults} // 第一步需要有OCR结果才能继续
                              >
                                {index === steps.length - 1 ? '完成' : '下一步'}
                              </Button>
                              <Button
                                disabled={index === 0}
                                onClick={handleBack}
                                sx={{ mt: 1, mr: 1 }}
                              >
                                返回
                              </Button>
                            </div>
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                  {activeStep === steps.length && (
                    <Paper square elevation={0} sx={{ p: 3 }}>
                      <Typography>所有步骤已完成</Typography>
                      <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                        重新开始
                      </Button>
                    </Paper>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* 无目录文献 */}
        <TabPanel value={tabIndex} index={1}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', p: 4 }}>
            {!filePath ? (
              <Stack spacing={2} sx={{ alignItems: 'center', width: '100%', maxWidth: '100%' }}>
                <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                {/* PDF 预览部分 */}
                <Box
                  sx={{
                    width: '45%',
                    p: 2,
                    mr: 1,
                    textAlign: 'center',
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    height: '100vh',
                    overflow: 'auto'
                  }}
                >
                  <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                    <div style={{ height: '100%' }}>
                      <Viewer
                        fileUrl={`http://114.212.97.42:8000${filePath}`}
                        plugins={[defaultLayoutPluginInstance]}
                      />
                    </div>
                  </Worker>
                </Box>

                {/* 右侧操作区域 */}
                <Box sx={{ width: '55%', height: '100vh', position: 'relative' }}>
                  <WriteToDatabaseCard filePath={filePath} type="Without"/>
                </Box>
              </Box>
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
