import React, { useState, useCallback, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import { useUser } from './UserProvider.jsx';
import { CloudUpload } from '@mui/icons-material';
import { Accordion, AccordionSummary, AccordionDetails, Grid2 } from '@mui/material';
import { ExpandMore, PictureAsPdf } from '@mui/icons-material';


export default function PdfUploaderViewer({ onUploadSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // 用于跟踪拖拽状态
  const { userInfo } = useUser();
  const email = userInfo?.email;
  const [uploadedFiles, setUploadedFiles] = useState([]); // 用于存储上传的文件列表

  // 获取已上传文件列表
  const fetchUploadedFiles = useCallback(async () => {
    if (!email) {
      console.error('用户邮箱为空，无法获取文件列表');
      return;
    }

    try {
      const response = await axios.get(`http://114.212.97.42:8000/file/GetFileList/`, {
        params: { email },
      });

      if (response.data.files && Array.isArray(response.data.files)) {
        // 过滤掉非 PDF 文件
        const pdfFiles = response.data.files.filter(file => file.toLowerCase().endsWith('.pdf'));
        setUploadedFiles(pdfFiles);
      } else {
        console.error('获取文件列表失败，返回数据格式不正确');
      }
    } catch (error) {
      console.error('获取文件列表失败:', error);
    }
  }, [email]);

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

  const handleFileUpload = async (event) => {
    event.preventDefault(); // 阻止默认行为
    const file = event.target.files?.[0] || event.dataTransfer.files[0]; // 从文件选择或拖拽事件中获取文件
    if (file && file.type === 'application/pdf') {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);

      try {
        const response = await axios.post('http://114.212.97.42:8000/file/UpLoad/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.file_path) {
          const fileUrl = `http://114.212.97.42:8000${response.data.file_path}`;
          setPdfFile(fileUrl);

          try {
            onUploadSuccess(response.data.file_path, 1);
          } catch (error) {
            console.error("Error loading PDF:", error);
            onUploadSuccess(null, null);
          }
        } else {
          alert('文件上传失败');
          onUploadSuccess(null, null);
        }
      } catch (error) {
        alert('文件上传失败', error);
        onUploadSuccess(null, null);
      }
    } else {
      alert('请选择一个 PDF 文件');
    }
  };

  // 处理拖拽
  const handleDragEnter = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // 处理拖拽离开
  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // 处理拖拽悬停
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // 处理文件拖拽释放
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event);
  };

  // 处理文件点击事件
  const handleFileClick = async (file) => {
    const fileUrl = `http://114.212.97.42:8000/cached/${email}/${file}`;
    setPdfFile(fileUrl);

    try {
      onUploadSuccess(`/cached/${email}/${file}`, 1);
    } catch (error) {
      console.error("Error loading PDF:", error);
      onUploadSuccess(null, null);
    }
  };

  return (
    <Box sx={{
      width: '100%',
      maxWidth: '100%',
      mx: 'auto',
      mt: 4,
      p: 2,
    }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          mt: 4,
          p: 2,
          textAlign: 'center',
          border: isDragging ? '2px dashed #007bff' : '2px dashed #ccc', // 拖拽时改变边框颜色
          borderRadius: '8px',
          backgroundColor: isDragging ? '#ffffff' : 'transparent', // 拖拽时改变背景颜色
          transition: 'border-color 1s, background-color 1s',
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!pdfFile ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              点击上传文件或拖拽文件到此处
            </Typography>
            <Button variant="contained" component="label">
              <CloudUpload sx={{ mr: 1 }} />
              上传文件
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              支持 PDF 文件格式
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              文件上传成功！
            </Typography>
            <Typography variant="body2" color="text.secondary">
              文件路径: {pdfFile}
            </Typography>
          </Box>
        )}
      </Box>

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="uploaded-files-content"
              id="uploaded-files-header"
            >
              <Typography>已上传文献</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid2 container spacing={2}>
                {uploadedFiles.map((file, index) => (
                  <Grid2
                    key={index}
                    sx={{
                      flex: '1 1 15%', // 每个文件占15%的宽度
                      maxWidth: '15%',  // 最大宽度为15%
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box
                      component="a"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileClick(file);
                      }}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '8px',
                        height: '100%',
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s, border-color 0.3s',
                        '&:hover': {
                          backgroundColor: '#f0f0f0',
                          borderColor: '#007bff',
                        },
                      }}
                    >
                      <PictureAsPdf sx={{ fontSize: '36px' }} />
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {file}
                      </Typography>
                    </Box>
                  </Grid2>
                ))}
              </Grid2>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
}