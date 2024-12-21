import React, { useState } from 'react';
import { Button, Box, CircularProgress, Typography, Alert, Collapse, Card, CardContent, Divider } from '@mui/material';
import axios from 'axios';
import { useUser } from './UserProvider';
import * as mammoth from 'mammoth';

function TextFileUploader({ onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);
  const [fileContent, setFileContent] = useState(''); // 存储文件内容
  const { userInfo } = useUser();
  const email = userInfo?.email;

  // 处理文件选择和上传
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage(false);
    setFileContent(''); // 清空之前的文件内容

    // 判断文件类型
    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('email', email);

      const response = await axios.post('http://114.212.97.42:8000/api/UpLoad/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.file_path) {
        const fileUrl = response.data.file_path;
        onUploadSuccess(fileUrl, 1); // Directly pass fileUrl without storing it in state
        setSuccessMessage(true);
      }

      // 处理文件内容预览
      if (fileType === 'txt') {
        const textContent = await file.text(); // 读取文本文件
        setFileContent(textContent);
      } else if (fileType === 'docx') {
        const arrayBuffer = await file.arrayBuffer(); // 读取docx文件
        mammoth.extractRawText({ arrayBuffer }).then((result) => {
          setFileContent(result.value); // 设置文件内容
        }).catch((err) => {
          console.error('解析 .docx 文件失败：', err);
          setErrorMessage('无法解析 .docx 文件');
        });
      } else {
        setErrorMessage('不支持的文件格式，请上传 .txt 或 .docx 文件');
      }
    } catch (error) {
      console.error('上传文件失败：', error.message);
      setErrorMessage('上传失败，请重试！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: '100%',
          maxWidth: '1000px',
          mx: 'auto',
          mt: 4,
          p: 2,
          textAlign: 'center',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          overflowY: 'auto',  // 启用垂直滚动条
          maxHeight: '500px', // 限制最大高度，启用滚动条
        }}
      >
        <Typography variant="h6" gutterBottom>
          点击上传文件
        </Typography>
  
        {/* 上传按钮和文件选择合并 */}
        <Button
          variant="contained"
          component="label"
          disabled={loading} // 禁用按钮，在文件上传时禁用
        >
          {loading ? <CircularProgress size={24} /> : '上传文件'}
          <input
            type="file"
            hidden
            accept=".docx"  // 限制文件类型为 .txt, .docx
            onChange={handleFileChange}
          />
        </Button>
  
        {/* 错误信息显示 */}
        {errorMessage && (
          <Typography sx={{ color: 'red', mt: 2 }}>
            {errorMessage}
          </Typography>
        )}
  
        {/* 提示信息 */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          支持 DOCX 文件格式
        </Typography>
        {/* 成功提示的 Alert */}
        <Collapse in={successMessage}>
          <Alert severity="success" sx={{ mt: 2 }}>
            文件上传成功！
          </Alert>
        </Collapse>
      </Box>
      
      {fileContent && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ width: '100%', maxWidth: '975px', mt: 3, overflowY: 'auto', maxHeight: '500px' }}>
              <Typography variant="h5" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>文件内容预览</strong>
              </Typography>
              <Divider sx={{ mt: 2 }}></Divider>
              <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                <div>{fileContent}</div>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default TextFileUploader;
