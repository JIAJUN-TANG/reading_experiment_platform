import React, { useState } from 'react';
import { Box, Card, CardContent, CardActions, TextField, Button, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useUser } from './UserProvider';  // Import the useUser hook to get the user info

export default function WriteToDatabaseCard({ filePath, type }) {
  const { userInfo } = useUser();
  const [seriesName, setSeriesName] = useState('');
  const [contentPage, setContentPage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWriteToDatabase = async () => {
    if (!contentPage || !seriesName) {
      alert("正文开始页码和系列名为必填项！");
      return;
    }
  
    if (!filePath) {
      alert("文件路径不能为空！");
      return;
    }
  
    setLoading(true);
    try {
      let response;
    
      if (type === "With") {
        response = await axios.post('http://114.212.97.42:8000/ProcessPdfPages/', {
          file_path: filePath,
          content_page: contentPage,
          user_name: userInfo.name,
          series_name: seriesName,
        });
        if (response.status === 200) {
          alert("数据写入数据库成功！");
        }
      } else if (type === "Without") {
        // 处理 "Without" 类型的请求
        response = await axios.post('http://114.212.97.42:8000/ProcessAllPdfPages/', {
          file_path: filePath,
          content_page: contentPage,
          user_name: userInfo.name,
          series_name: seriesName,
        });
        if (response.status === 200) {
          alert("数据写入数据库成功！");
        }
      } else {
        // 处理其他类型的请求
        console.log("未知的类型:", type);
        alert(`未知的类型：${type}`);
      }
    } catch (error) {
      if (error.response) {
        console.error("后端返回错误：", error.response.data);
        alert(`写入数据库失败：${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error("未收到后端响应：", error.request);
        alert("写入数据库失败：服务器无响应，请检查网络！");
      } else {
        console.error("请求错误：", error.message);
        alert(`写入数据库失败：${error.message}`);
      }
    } finally {
      setLoading(false); // 无论请求成功或失败，都需要停止加载状态
    }
  };

  return (
    <Card sx={{ maxWidth: '100%', margin: 'auto', mt: 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          写入数据库
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Display username from context */}
          {userInfo && <Typography variant="body1">用户名: {userInfo.name}</Typography>}
          <TextField
            label="正文开始页码"
            variant="outlined"
            value={contentPage}
            size="small"
            onChange={(e) => setContentPage(e.target.value)}
            required
            disabled={loading} // 禁用输入框在加载中
          />
          <TextField
            label="系列名"
            variant="outlined"
            value={seriesName}
            size="small"
            onChange={(e) => setSeriesName(e.target.value)}
            required
            disabled={loading} // 禁用输入框在加载中
          />
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', position: 'relative' }}>
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-12px',
              marginLeft: '-12px',
            }}
          />
        )}
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 1 }}
          size="large"
          onClick={handleWriteToDatabase}
          disabled={loading} // 按钮在加载中禁用
        >
          {loading ? '写入中...' : '写入数据库'}
        </Button>
      </CardActions>
    </Card>
  );
}
