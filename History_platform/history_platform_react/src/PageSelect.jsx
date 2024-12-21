// 页码选择组件
import React, { useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, MenuItem } from '@mui/material';

export default function PageNavigatorCard({ totalPages, onConfirm, loading }) {
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [language, setLanguage] = useState('');

  const languages = [
    { value: '英文', label: '英文' },
    { value: '中文', label: '中文' },
  ];

  const handleStartPageInput = (event) => {
    setStartPage(event.target.value);
  };

  const handleEndPageInput = (event) => {
    setEndPage(event.target.value);
  };

  const handlePageRangeSubmit = () => {
    if (!startPage || !endPage || !language) {
      alert("请完成信息");
      return;
    }
    onConfirm(startPage, endPage, language); // 调用传递的 onConfirm 函数
  };

  return (
    <Card sx={{ width: '100%', p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          目录页码选择
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          总页数为： {totalPages || 'N/A'}，请选择目录在PDF中的开始和结束页码。
        </Typography>
        
        <TextField
          label="目录开始页码"
          variant="outlined"
          type="number"
          value={startPage}
          onChange={handleStartPageInput}
          size="small"
          fullWidth
          required
          sx={{ mb: 2 }}
          inputProps={{ min: 1, max: totalPages }}
        />
        
        <TextField
          label="目录结束页码"
          variant="outlined"
          type="number"
          value={endPage}
          onChange={handleEndPageInput}
          size="small"
          fullWidth
          required
          sx={{ mb: 2 }}
          inputProps={{ min: startPage, max: totalPages }}
        />
        
        <TextField
          label="目录语言"
          variant="outlined"
          select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          size="small"
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {languages.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handlePageRangeSubmit}
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading} // 根据 loading 状态禁用按钮
        >
          {loading ? "加载中..." : "确定"}
        </Button>
      </CardContent>
    </Card>
  );
}
