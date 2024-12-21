import * as React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useLocation } from 'react-router-dom';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

// 定义路径与页面名称的映射
const pathNameMap = {
  '/': '概览',
  '/Update': '更新信息',
  '/About': '关于我们',
  '/Translate': '文献翻译',
  '/Process': '文献数字化',
  '/Database': '文献数据库',
  '/KnowledgeGraph': '文献图谱',
};

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const currentPath = location.pathname;

  // 根据当前路径获取对应的页面名称
  const pageName = pathNameMap[currentPath] || '未知页面';

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1">平台</Typography>
      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {pageName}
      </Typography>
    </StyledBreadcrumbs>
  );
}
