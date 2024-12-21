import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';

export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]); // 保存表格数据
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误状态

  // 定义列
  const columns = [
    { field: 'user_name', headerName: '拥有者', flex: 0.4 },
    { field: 'series_name', headerName: '系列名', flex: 0.6 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://114.212.97.42:8000/data/GetLatest/');
        setRows(response.data); // 更新表格数据
        setLoading(false); // 结束加载状态
      } catch (err) {
        setError(err.message); // 记录错误信息
        setLoading(false); // 结束加载状态
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading...</p>; // 显示加载状态
  }

  if (error) {
    return <p>Error: {error}</p>; // 显示错误信息
  }

  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
  checkboxSelection
  rows={rows}
  columns={columns}
  getRowId={(row) => row.uuid}
  getRowClassName={(params) =>
    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
  }
  initialState={{
    pagination: { paginationModel: { pageSize: 20 } },
  }}
  pageSizeOptions={[10, 20, 50]}
  disableColumnResize
  density="compact"
  slotProps={{
    filterPanel: {
      filterFormProps: {
        logicOperatorInputProps: {
          variant: 'outlined',
          size: 'small',
        },
        columnInputProps: {
          variant: 'outlined',
          size: 'small',
          sx: { mt: 'auto' },
        },
        operatorInputProps: {
          variant: 'outlined',
          size: 'small',
          sx: { mt: 'auto' },
        },
        valueInputProps: {
          InputComponentProps: {
            variant: 'outlined',
            size: 'small',
          },
        },
      },
    },
  }}
/>
    </div>
  );
}
