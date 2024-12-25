import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Card, CardContent, Button, CardActions } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import axios from 'axios';
import { useImmer } from 'use-immer';

export default function GuideTable({ ocrResults, filePath }) {
  const [rows, setRows] = useImmer([]);
  const [updatedOcrResults, setUpdatedOcrResults] = useImmer({});
  const [selectionModel, setSelectionModel] = useState([]); // 用于存储选中的行 ID

  useEffect(() => {
    if (ocrResults && typeof ocrResults === 'object') {
      const formattedRows = Object.entries(ocrResults).map(([pageKey, name], index) => ({
        id: index + 1,
        pageKey: pageKey,
        page: parseInt(pageKey.replace("页码", "")),
        name: name,
      }));
      setRows(formattedRows);
      setUpdatedOcrResults(ocrResults);
    }
  }, [ocrResults, setRows, setUpdatedOcrResults]);

  const columns = [
    { field: 'page', headerName: '页码', editable: true, flex: 1 },
    { field: 'name', headerName: '名称', editable: true, flex: 6 },
  ];

  const processRowUpdate = (updatedRow, originalRow) => {
    setRows((draft) => {
      const rowIndex = draft.findIndex((row) => row.id === updatedRow.id);
      if (rowIndex !== -1) {
        draft[rowIndex] = updatedRow;
      }
    });

    setUpdatedOcrResults((draft) => {
      const newPageKey = `${updatedRow.page}`;
      delete draft[originalRow.pageKey];
      draft[newPageKey] = updatedRow.name;
    });

    return updatedRow;
  };

  const handleAddRow = () => {
    setRows((draft) => {
      const newId = draft.length > 0 ? draft[draft.length - 1].id + 1 : 1;
      draft.push({ id: newId, pageKey: `${newId}`, page: newId, name: "" });
    });
  
    setUpdatedOcrResults((draft) => {
      const newId = rows.length + 1; // rows.length will reflect the previous state length
      draft[`${newId}`] = ""; // Initially empty value for the new row
    });
  };
  

  const handleDeleteRow = () => {
    console.log("Selected IDs for delete:", selectionModel); // 调试选中行 ID
    if (selectionModel.length === 0) {
      alert("请先选择要删除的行");
      return;
    }
  
    // Update rows by filtering out the selected ones
    setRows((draft) => {
      return draft.filter((row) => !selectionModel.includes(row.id));
    });
  
    // Update ocrResults by removing the entries corresponding to the deleted rows
    setUpdatedOcrResults((draft) => {
      selectionModel.forEach((id) => {
        const rowToDelete = rows.find((r) => r.id === id); // Find the row in the `rows` array by id
        if (rowToDelete) {
          delete draft[rowToDelete.pageKey]; // Remove the entry from ocrResults by pageKey
        }
      });
    });
  };
  

  const handleConfirmDirectory = async () => {
    try {
      const response = await axios.post("http://114.212.97.42:8000/file/SaveCatelogue/", {
        ocr_results: updatedOcrResults,
        file_path: filePath,
      });
      if (response.status === 200) {
        alert("保存目录成功！");
      }
    } catch (error) {
      console.error("Error saving OCR results:", error.response?.data || error.message);
      alert("保存目录失败，请重试！");
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            disableSelectionOnClick
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error) => alert("Error updating row: " + error.message)}
            checkboxSelection
            rowSelectionModel={selectionModel} // 设置选中的行 ID
            onRowSelectionModelChange={(newSelection) => {
              setSelectionModel(newSelection); // 更新选中的行 ID
            }}
            density="compact" // 设置紧凑布局
            sx={{ maxHeight: 350, '& .MuiDataGrid-virtualScroller': { overflowY: 'auto',},}}
          />
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', padding: '30px' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddRow}
              sx={{ mt: 1 }}
              size="small"
            >
              添加行
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Delete />}
              onClick={handleDeleteRow} // 使用选中的 ID 删除行
              sx={{ mt: 1 }}
              size="small"
            >
              删除行
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 1 }}
              size="small"
              onClick={handleConfirmDirectory}
            >
              保存目录
            </Button>
          </Box>
        </CardActions>
      </Card>
    </Box>
  );
}
