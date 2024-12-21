import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Pagination,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  OutlinedInput,
  Box,
  Breadcrumbs, // 引入 Breadcrumbs 组件
  Link, // 引入 Link 组件
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ExpandMore, RestartAlt, Translate as TranslateIcon, FontDownload, FontDownloadOff } from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import AppNavbar from './dashboard/components/AppNavbar.jsx';
import Header from './dashboard/components/Header.jsx';
import SideMenu from './dashboard/components/SideMenu.jsx';
import AppTheme from './shared-theme/AppTheme.jsx';
import FileUploaderViewer from './FileUploaderViewer.jsx';
import { useUser } from './UserProvider.jsx';
import { helix } from 'ldrs';
import FloatingChatButton from './AIDialog.jsx';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import { split } from 'sentence-splitter';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './dashboard/theme/customizations';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const Translate = (props) => {
  const { userInfo } = useUser();
  const [filePath, setFilePath] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [ocrText, setOcrText] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [response, setResponse] = useState(null);
  const [language, setLanguage] = useState('自动检测语言'); // 默认选中“自动检测语言”
  const [service, setService] = useState('ChatGPT'); // 默认选中“ChatGPT”
  const [autoTranslate, setAutoTranslate] = useState(true); // 自动���译开关
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [version, setVersion] = useState('full'); // 新增版本状态，默认全文对照模式
  const [highlightedIndex, setHighlightedIndex] = useState(null); // 高亮索引
  const [highlightEnabled, setHighlightEnabled] = useState(true); // 高亮功能的状态
  const [jumpToPage, setJumpToPage] = useState(currentPage);
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    onPageChange: (e) => {
      const newPage = e.currentPage + 1;
      setCurrentPage(newPage);
      if (autoTranslate) {
        handleGetOcrAndTranslate(newPage);
      }
    },
  });
  const pdfViewerRef = useRef(null); // 新增：PDF Viewer的引用

  const handleUploadSuccess = (path, numPages) => {
    setFilePath(path);
    setPageCount(numPages);
    setCurrentPage(1);
  };

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
        language: language,
        service: service,
      });

      if (response.data) {
        if (response.data.ocr_text === undefined || response.data.translated_text === undefined) {
          console.error('后端返回数据格式不正确:', response.data);
          throw new Error('后端返回数据格式不正确');
        }
        setOcrText(response.data.ocr_text || '未能获取识别结果');
        setTranslatedText(response.data.translated_text || '未能获取翻译结果');
      } else {
        throw new Error('后端返回数据为空');
      }
    } catch (error) {
      console.error('获取失败:', error);
      if (error.response) {
        alert(`获取失败：${error.response.data?.detail || error.response.statusText}`);
      } else if (error.request) {
        alert('服务器无响应，请检查网络连接');
      } else {
        alert(`请求错误：${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filePath, userInfo?.email, language, service]);

  const handlePageChange = (event, value) => {
    const pageIndex = value - 1;
    defaultLayoutPluginInstance.pageNavigationPluginInstance?.jumpToPage(pageIndex);
    setCurrentPage(value);
    if (autoTranslate) {
      handleGetOcrAndTranslate(value);
    }
  };

  const handleManualTranslate = () => {
    if (!filePath) {
      alert('请先上传文件！');
      return;
    }
    handleGetOcrAndTranslate(currentPage);
  };

  useEffect(() => {
    if (filePath && pageCount > 0 && autoTranslate) {
      handleGetOcrAndTranslate(1);
    }
  }, [filePath, pageCount, handleGetOcrAndTranslate, autoTranslate]);

  helix.register();

  const textContent = translatedText || ocrText || '';

  // 重置文件路径和相关状态
  const handleResetFile = () => {
    setFilePath(null);
    setPageCount(null);
    setOcrText(null);
    setTranslatedText(null);
    setCurrentPage(1);
  };

  // 处理语言选择
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  // 处理服务选择
  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // 关闭菜单
  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleHighlight = () => {
    setHighlightEnabled(!highlightEnabled); // 切换高亮功能的状态
    if (highlightEnabled) {
      setHighlightedIndex(null); // 如果关闭高亮功能，清除高亮索引
    }
  };

  const handleGetPDF = async (event) => {
    event.preventDefault();
    if (!filePath) {
      alert('请先上传文件！');
      return;
    }

    try {
      const response = await axios.post('http://114.212.97.42:8000/translate/GetPDFTranslation/', {
        file_path: filePath,
        language: language,
        service: service,
      });
      setResponse(response.data);
    } catch (err) {
      setResponse(null);
    }
  };

  // 修改文本处理函数
  const processTextWithSentences = (text) => {
    const sentences = split(text);
    let currentPosition = 0;
    const segments = [];

    sentences.forEach((item) => {
      // 处理句子前的空白字符
      const preWhitespace = text.slice(currentPosition, item.range[0]);
      if (preWhitespace) {
        segments.push({
          type: 'whitespace',
          content: preWhitespace,
          position: segments.length
        });
      }

      if (item.type === 'Sentence') {
        segments.push({
          type: 'sentence',
          content: item.raw + ' ',  // 在句子后面添加一个空格
          position: segments.length
        });
      }

      currentPosition = item.range[1];
    });

    // 处理最后剩余的空白字符
    const remainingWhitespace = text.slice(currentPosition);
    if (remainingWhitespace) {
      segments.push({
        type: 'whitespace',
        content: remainingWhitespace,
        position: segments.length
      });
    }

    return segments;
  };

  // 处理句子点击事件
  const handleSentenceClick = (index) => {
    setHighlightedIndex(index);
  };

  const handleDocumentLoad = (e) => {
    setPageCount(e.doc.numPages); // 获取并设置 PDF 的总页数
  };

  // 添加 PDF 页码变化监听
  const handlePdfPageChange = (e) => {
    const newPage = e.currentPage + 1;
    setCurrentPage(newPage);
    if (autoTranslate) {
      handleGetOcrAndTranslate(newPage);
    }
  };

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
            paddingTop: 0,
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

          {!filePath ? (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
              <FileUploaderViewer onUploadSuccess={handleUploadSuccess} />
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 4, mr: 6 }}>
              {/* 文件信息卡片放置于页面上方 */}
              <Box sx={{ width: '100%', mb: 2, borderRadius: '8px' }}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="translation-options-content"
                    id="translation-options-header"
                  >
                    <Typography variant="h6">翻译选项</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormControlLabel
                      control={<Switch checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} />}
                      label="启用自动翻译"
                    />
                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                      <InputLabel id="language-select-label">选择语言</InputLabel>
                      <Select
                        labelId="language-select-label"
                        id="language-select"
                        value={language}
                        onChange={handleLanguageChange}
                        input={<OutlinedInput label="选择语言" />}
                        size="small"
                      >
                        <MenuItem value="自动检测语言">自动检测语言</MenuItem>
                        <MenuItem value="en">英语</MenuItem>
                        <MenuItem value="es">西班牙语</MenuItem>
                        <MenuItem value="fr">法语</MenuItem>
                        <MenuItem value="de">德语</MenuItem>
                      </Select>
                    </FormControl>

                    {/* 新增服务选择框 */}
                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                      <InputLabel id="service-select-label">选择服务</InputLabel>
                      <Select
                        labelId="service-select-label"
                        id="service-select"
                        value={service}
                        onChange={handleServiceChange}
                        input={<OutlinedInput label="选择服务" />}
                        size="small"
                      >
                        <MenuItem value="ChatGPT">ChatGPT</MenuItem>
                        <MenuItem value="Llama">Llama</MenuItem>
                        <MenuItem value="Qweb">Qwen</MenuItem>
                      </Select>
                    </FormControl>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 80, // 按钮之间的间距
                        mt: 2, // 与上方内容的间距
                      }}
                    >
                      <Button variant="contained" color="primary" onClick={handleResetFile}>
                        <RestartAlt sx={{ mr: 1 }} />
                        更换文献
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleManualTranslate}
                        disabled={loading}
                      >
                        <TranslateIcon sx={{ mr: 1 }} />
                        开始翻译
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>

              {/* 下方分为两列：PDF 预览和 OCR 结果 */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row' }}>
                {/* 第二列：PDF 预览 */}
                <Box
                  sx={{
                    width: '45%',
                    maxWidth: '100%',
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
                        onPageChange={handlePdfPageChange}
                        onDocumentLoad={handleDocumentLoad}
                      />
                    </div>
                  </Worker>
                </Box>

                {/* 第三列：OCR 和翻译结果 */}
                <Box sx={{ width: '55%', maxWidth: '100%', height: '100vh', position: 'relative' }}>
                  <Card sx={{ alignSelf: 'center', mx: 'auto', width: '100%', maxWidth: '100%', boxShadow: 3, p: 2, mb: 1 }}>
                    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                      <Link
                        color={version === 'full' ? 'primary' : 'inherit'}
                        onClick={() => setVersion('full')}
                        underline={version === 'full' ? 'always' : 'hover'}
                        sx={{ cursor: 'pointer' }}
                      >
                        全文对照模式
                      </Link>
                      <Link
                        color={version === 'line' ? 'primary' : 'inherit'}
                        onClick={() => setVersion('line')}
                        underline={version === 'line' ? 'always' : 'hover'}
                        sx={{ cursor: 'pointer' }}
                      >
                        句对照模式
                      </Link>
                    </Breadcrumbs>
                    <Tooltip title={highlightEnabled ? '关闭高亮' : '开启高亮'}>
                      <IconButton onClick={toggleHighlight} sx={{ position: 'absolute', top: 8, right: 8 }} color="primary">
                        {highlightEnabled ? <FontDownload /> : <FontDownloadOff />}
                      </IconButton>
                    </Tooltip>

                    {loading ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <l-helix size="40" speed="0.9" color="coral" />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          翻译中...
                        </Typography>
                      </Box>
                    ) : ocrText && translatedText ? (
                      <CardContent sx={{ mr: 1 }}>
                        {version === 'full' ? (
                          <>
                            {/* 全文对照模式 */}
                            <Box sx={{ mb: 2 }}>
                              <Stack direction="row" spacing={2}>
                                {/* OCR文本显示 */}
                                <Box sx={{ flex: '0 0 50%' }}>
                                  <Divider variant="middle" sx={{ mb: 2 }}>
                                    <Chip label={`OCR原文 - 第 ${currentPage} 页`} size="big" />
                                  </Divider>
                                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                    {processTextWithSentences(ocrText).map((segment, index) => {
                                      if (segment.type === 'whitespace') {
                                        return <React.Fragment key={index}>{segment.content}</React.Fragment>;
                                      } else {
                                        return (
                                          <span
                                            key={index}
                                            onClick={() => {
                                              if (highlightEnabled) {
                                                handleSentenceClick(segment.position);
                                              }
                                            }}
                                            style={{
                                              backgroundColor: highlightedIndex === segment.position ? 'rgba(173, 216, 230, 0.5)' : 'transparent',
                                              cursor: highlightEnabled ? 'pointer' : 'default',
                                            }}
                                          >
                                            {segment.content}
                                          </span>
                                        );
                                      }
                                    })}
                                  </Typography>
                                </Box>
                                {/* 翻译文本显示 */}
                                <Box sx={{ flex: '0 0 50%' }}>
                                  <Divider variant="middle" sx={{ mb: 2 }}>
                                    <Chip label={`AI翻译 - 第 ${currentPage} 页`} size="big" />
                                  </Divider>
                                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                                    {processTextWithSentences(translatedText).map((segment, index) => {
                                      if (segment.type === 'whitespace') {
                                        return <React.Fragment key={index}>{segment.content}</React.Fragment>;
                                      } else {
                                        return (
                                          <span
                                            key={index}
                                            onClick={() => {
                                              if (highlightEnabled) {
                                                handleSentenceClick(segment.position);
                                              }
                                            }}
                                            style={{
                                              backgroundColor: highlightedIndex === segment.position ? 'rgba(173, 216, 230, 0.5)' : 'transparent',
                                              cursor: highlightEnabled ? 'pointer' : 'default',
                                            }}
                                          >
                                            {segment.content}
                                          </span>
                                        );
                                      }
                                    })}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </>
                        ) : (
                          <>
                            {/* 行对照模式 */}
                            {processTextWithSentences(ocrText).map((segment, index) => {
                              if (segment.type === 'sentence') {
                                return (
                                  <Box key={index} sx={{ mb: 2 }}>
                                    <Divider variant="middle" sx={{ mb: 2 }}>
                                      <Chip label={`第 ${index + 1} 句`} size="big" />
                                    </Divider>
                                    <Stack direction="row" spacing={2}>
                                      {/* OCR文本显示在左侧，占50%宽度，超出内容换行 */}
                                      <Box sx={{ flex: '0 0 50%' }}>
                                        <Typography sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', width: '100%' }}>
                                          <strong>OCR原文：</strong>
                                          {segment.content}
                                        </Typography>
                                      </Box>
                                      {/* 翻译文本显示在右侧，占50%宽度，超出内容换行 */}
                                      <Box sx={{ flex: '0 0 50%' }}>
                                        <Typography sx={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', width: '100%' }}>
                                          <strong>AI翻译：</strong>
                                          {processTextWithSentences(translatedText)[index]?.content || '无翻译结果'}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Box>
                                );
                              }
                              return null;
                            })}
                          </>
                        )}
                      </CardContent>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        尚未有翻译结果
                      </Typography>
                    )}

                    {pageCount > 1 && (
                      <Stack alignItems="center" spacing={2}>
                        {/* Pagination 组件 */}
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Pagination
                            count={pageCount}
                            page={currentPage}
                            onChange={handlePageChange}
                            color="primary"
                            sx={{ mt: 2 }}
                            showFirstButton
                            showLastButton
                          />

                          {/* 快速跳转输入框和按钮 */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                              label="跳转到页码"
                              variant="outlined"
                              size="small"
                              type="number"
                              inputProps={{ min: 1, max: pageCount }} // 限制输入范围
                              value={jumpToPage}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                if (value >= 1 && value <= pageCount) {
                                  setJumpToPage(value); // 更新输入框的值
                                }
                              }}
                              sx={{ width: 150 }}
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => {
                                if (jumpToPage >= 1 && jumpToPage <= pageCount) {
                                  handlePageChange(null, jumpToPage); // 跳转到指定页码
                                }
                              }}
                            >
                              跳转
                            </Button>
                          </Stack>
                        </Stack>
                      </Stack>
                    )}
                  </Card>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{ height: '10vh' }}></Box>
        <FloatingChatButton assistant_message={textContent} />
      </Box>
    </AppTheme>
  );
};

export default Translate;