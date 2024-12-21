import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Divider, Pagination, Stack } from '@mui/material';
import { dotSpinner } from 'ldrs';

export default function SearchDataGrid({ searchTerm, triggerSearch, setTriggerSearch }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const paginatedRows = rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    // 只有当触发搜索且搜索词不为空时才执行搜索
    if (triggerSearch && searchTerm.trim()) {
      const fetchSearchResults = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.post(
            'http://114.212.97.42:8000/data/Searchdata/',
            { search_string: searchTerm },
            { headers: { 'Content-Type': 'application/json' } }
          );
          setRows(response.data);
        } catch (err) {
          setError(err.message || '检索过程中发生错误。');
        } finally {
          setLoading(false);
          setTriggerSearch(false); // 完成搜索后重置 triggerSearch
        }
      };

      fetchSearchResults();
    }
  }, [triggerSearch, searchTerm, setTriggerSearch]);

  // 处理页码变化
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handlePreviewFullText = (uuid) => {
    if (!uuid) {
      console.error('无效的 UUID，无法预览全文。');
      return;
    }
    const url = `/preview/${uuid}`;
    window.open(url, '_blank');
  };

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{
            backgroundColor: '#ffeb3b',
            borderRadius: '4px',
            padding: '2px 4px',
            color: '#000',
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  dotSpinner.register();
  if (loading) return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}
    >
      <l-dot-spinner size="40" speed="0.9" color="coral"></l-dot-spinner>
      <Typography variant="h6" sx={{ mt: 2 }}>查询中...</Typography>
    </Box>
  );
  if (error) return <Typography color="error">检索失败: {error}</Typography>;

  return (
    <>
      <Box>
        {paginatedRows.length > 0 ? (
          paginatedRows.map((row, index) => (
            <Box key={row.uuid || index} sx={{ py: 2 }}>
              <Typography 
                variant="h6" 
                component="a" 
                href="#" 
                onClick={() => handlePreviewFullText(row.uuid)}
                sx={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                {row.title || row.series_name}
              </Typography>
              <Typography variant="body1">拥有者：{row.user_name || '未知'}</Typography>
              <Typography variant="body2">系列名：{row.series_name || '未知'}</Typography>
              <Typography variant="body2">文件名：{row.file_name || '未知'}</Typography>
              <Typography variant="body2">
                页码：{row.start_page} - {row.end_page}
              </Typography>
              <Typography variant="body2" sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {highlightText(row.full_text || '无内容', searchTerm)}
              </Typography>

              <Divider sx={{ mt: 2 }} />
            </Box>
          ))
        ) : (
          <Typography>未搜索到结果。</Typography>
        )}

        {/* 分页控件 */}
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={Math.max(1, Math.ceil(rows.length / rowsPerPage))}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Stack>
      </Box>
    </>
  );
}
