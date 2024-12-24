// 页码选择组件
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  MenuItem,
  Backdrop,
  Box 
} from '@mui/material';
import { dotSpinner } from 'ldrs'


export default function PageNavigatorCard({ totalPages, onConfirm, loading, savedData }) {
  const [startPage, setStartPage] = useState(savedData?.startPage || '');
  const [endPage, setEndPage] = useState(savedData?.endPage || '');
  const [language, setLanguage] = useState(savedData?.language || '');

  useEffect(() => {
    if (savedData) {
      setStartPage(savedData.startPage);
      setEndPage(savedData.endPage);
      setLanguage(savedData.language);
    }
  }, [savedData]);

  const languages = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: '英文' },
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
    onConfirm(startPage, endPage, language);
  };
  
  dotSpinner.register()

  return (
    <>
      <Card sx={{ width: '100%', p: 2, position: 'relative' }}>
        <CardContent>
          
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
            disabled={loading}
          >
            {loading ? "加载中..." : "确定"}
          </Button>
        </CardContent>

        {/* 加载遮罩 */}
        <Backdrop
          sx={{
            position: 'absolute',
            color: '#fff',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }}
          open={loading}
        >
          <Box sx={{ textAlign: 'center' }}>          
          <l-dot-spinner
          size="40"
          speed="0.9"
          color="coral"
          ></l-dot-spinner>
            <Typography sx={{ mt: 2, color: 'white' }}>
              正在解析目录，请稍候...
            </Typography>
          </Box>
        </Backdrop>
      </Card>
    </>
  );
}
