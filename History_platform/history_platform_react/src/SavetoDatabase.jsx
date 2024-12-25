import React, { useState } from 'react';
import { Box, Card, CardContent, CardActions, TextField, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useUser } from './UserProvider.jsx';

export default function WriteToDatabaseCard({ filePath }) {
  const { userInfo } = useUser();
  const [seriesName, setSeriesName] = useState('');
  const [contentPage, setContentPage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleWriteToDatabase = async () => {
    if (!contentPage || !seriesName) {
      alert("正文开始页码和系列名为必填项！");
      return;
    }
  
    if (!filePath) {
      alert("文件路径不能为空！");
      return;
    }
  
    setIsProcessing(true);
    try {
      const response = await axios.post('http://114.212.97.42:8000/file/ProcessPdfPages/', {
        file_path: filePath,
        content_page: contentPage,
        user_name: userInfo.user_name,
        series_name: seriesName,
      });

      alert('处理成功！');
    } catch (error) {
      console.error('Error:', error);
      alert('处理失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {userInfo && <Typography variant="body1">用户名: {userInfo.user_name}</Typography>}
          <TextField
            label="正文开始页码"
            variant="outlined"
            value={contentPage}
            size="small"
            onChange={(e) => setContentPage(e.target.value)}
            required
            disabled={isProcessing}
          />
          <TextField
            label="系列名"
            variant="outlined"
            value={seriesName}
            size="small"
            onChange={(e) => setSeriesName(e.target.value)}
            required
            disabled={isProcessing}
          />
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          sx = {{ mt: 2 }}
          variant="contained"
          color="primary"
          onClick={handleWriteToDatabase}
          disabled={isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isProcessing ? '处理中...' : '写入数据库'}
        </Button>
      </CardActions>
    </Card>
  );
}
