import React, { useState } from 'react';
import { alpha } from '@mui/material/styles';
import { CssBaseline, Box, Stack, Tabs, Tab, Typography, Stepper, Step, StepLabel, Button, Paper } from '@mui/material';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import FileUploaderViewer from './FileUploaderViewer';  // 如果需要在其他标签页使用
import PageNavigatorCard from './PageSelect';
import GuideTable from './GuideTable';
import WriteToDatabaseCard from './SavetoDatabase';
import axios from 'axios'; 
import { chartsCustomizations, dataGridCustomizations, datePickersCustomizations, treeViewCustomizations } from './dashboard/theme/customizations';
import FloatingChatButton from './AIDialog';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import CheckIcon from '@mui/icons-material/Check';  // 导入勾的图标
import NavigateNextIcon from '@mui/icons-material/NavigateNext';


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

// 自定义步骤图标组件
const CustomStepIcon = (props) => {
  const { active, completed, className, icon } = props;
  
  return (
    <Box
      className={className}
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: completed || active ? 'primary.main' : 'background.paper',
        border: (theme) => `2px solid ${completed || active ? theme.palette.primary.main : theme.palette.grey[400]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: completed || active ? 'common.white' : 'text.secondary',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      {completed ? (
        <CheckIcon sx={{ fontSize: 20 }} />
      ) : (
        icon
      )}
    </Box>
  );
};

export default function Process(props) {
  const [filePath, setFilePath] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const [showGuideTable, setShowGuideTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const [activeStep, setActiveStep] = useState(0);
  const [pageSelectData, setPageSelectData] = useState({
    startPage: '',
    endPage: '',
    language: ''
  });
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadSuccess = (path, numPages) => {
    setFilePath(path);
    setPageCount(numPages);
  };

  const handlePageRangeConfirm = async (startPage, endPage, language) => {
    setLoading(true);
    setPageSelectData({
      startPage,
      endPage,
      language
    });
    
    try {
      const response = await axios.post('http://114.212.97.42:8000/file/GetCatelogue/', {
        file_path: filePath,
        start_page: parseInt(startPage, 10),
        end_page: parseInt(endPage, 10),
        language: language,
      });
      setOcrResults(response.data.ocr_results);
      setShowGuideTable(true);
      handleNext();
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
      label: '选择目录页码',
      description: '请选择文献目录所在的PDF页码范围',
      component: (
        <PageNavigatorCard
          filePath={filePath}
          totalPages={pageCount}
          setOcrResults={setOcrResults}
          onConfirm={handlePageRangeConfirm}
          loading={loading}
          savedData={pageSelectData}
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
          pageData={pageSelectData}
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
          <Stack spacing={2} sx={{ alignItems: 'center', mx: 3, pl: 5, pr: 5, pb: 5, mt: { xs: 8, md: 1 } }}>
            <Header />
          </Stack>

          <Box sx={{
            px: 4,
            display: 'flex',
            justifyContent: 'center',  // 居中显示
            width: '100%'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="process tabs"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                  px: 6,  // 增加标签之间的水平间距
                  minWidth: 120,  // 设置最小宽度
                },
                '& .MuiTabs-flexContainer': {
                  gap: 4,  // 增加标签之间的间距
                }
              }}
            >
              <Tab label="目录精读" />
              <Tab label="全文速读" />
              <Tab label="文本入库" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', width: '100%', gap: 2, p: 4 }}>
              {!filePath ? (
                <Stack spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
                  <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
                </Stack>
              ) : (
                <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                  <Box sx={{ width: '45%', p: 2, border: '2px dashed #ccc', borderRadius: '8px', height: '100vh', overflow: 'auto' }}>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                      <div style={{ height: '100%' }}>
                        <Viewer fileUrl={`http://114.212.97.42:8000${filePath}`} plugins={[defaultLayoutPluginInstance]} />
                      </div>
                    </Worker>
                  </Box>

                  <Box sx={{ width: '55%', height: '100vh', overflow: 'auto', pr: 2 }}>
                    <Stepper 
                      activeStep={activeStep} 
                      alternativeLabel
                      sx={{ 
                        mb: 4,
                        '& .MuiStepConnector-line': {
                          marginTop: 0,
                        },
                        '& .MuiStepConnector-root': {
                          top: '16px',
                          left: 'calc(-50% + 20px)',
                          right: 'calc(50% + 20px)',
                        },
                        '& .MuiStepLabel-iconContainer': {
                          paddingRight: 0,
                        },
                        '& .MuiStepLabel-labelContainer': {
                          marginTop: '8px',
                        },
                        '& .MuiStep-root': {
                          padding: '0 16px',
                        }
                      }}
                    >
                      {steps.map((step, index) => (
                        <Step key={step.label}>
                          <StepLabel StepIconComponent={CustomStepIcon}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                color: activeStep === index ? 'primary.main' : 'text.secondary',
                                fontWeight: activeStep === index ? 600 : 400
                              }}
                            >
                              {step.label}
                            </Typography>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>

                    <Box sx={{ mt: 2 }}>
                      {steps.map((step, index) => (
                        activeStep === index && (
                          <Box key={step.label}>
                            <Typography 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2,
                                textAlign: 'center',  // 文字居中
                                width: '100%'  // 确保宽度占满
                              }}
                            >
                              {step.description}
                            </Typography>
                            {step.component}
                            <Box sx={{ mb: 2, mt: 2, display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={index === 0 && !ocrResults}
                              >
                                {index === steps.length - 1 ? (
        '完成'
      ) : (
        <>
          <NavigateNextIcon />
          {' 下一步'}
        </>)}
                              </Button>
                              <Button
                                disabled={index === 0}
                                onClick={handleBack}
                                variant="outlined"
                              >
                                返回
                              </Button>
                            </Box>
                          </Box>
                        )
                      ))}
                      {activeStep === steps.length && (
                        <Paper square elevation={0} sx={{ p: 3, bgcolor: 'success.light', color: 'common.white' }}>
                          <Typography>所有步骤已完成</Typography>
                          <Button 
                            onClick={handleReset} 
                            sx={{ 
                              mt: 1, 
                              bgcolor: 'common.white',
                              color: 'success.main',
                              '&:hover': {
                                bgcolor: 'common.white',
                                opacity: 0.9
                              }
                            }}
                          >
                            重新开始
                          </Button>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 4 }}>
              <Typography>文献标注功能开发中...</Typography>
            </Box>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 4 }}>
              <Typography>文献分析功能开发中...</Typography>
            </Box>
          </TabPanel>
        </Box>
        <FloatingChatButton />
      </Box>
    </AppTheme>
  );
}
