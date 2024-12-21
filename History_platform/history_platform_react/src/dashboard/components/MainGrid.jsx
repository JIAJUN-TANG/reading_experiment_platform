import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Copyright from '../internals/components/Copyright';
import ChartUserByCountry from './ChartUserByCountry';
import CustomizedTreeView from './CustomizedTreeView';
import CustomizedDataGrid from './CustomizedDataGrid';
import HighlightedCard from './HighlightedCard';
import PageViewsBarChart from './PageViewsBarChart';
import StatCard from './StatCard';
import { useEffect, useState } from 'react';

export default function MainGrid() {
  const [documentCount, setDocumentCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('http://114.212.97.42:8000/data/GetCount/')
      .then(response => response.json())
      .then(data => {
        setDocumentCount(data.count);
      })
      .catch(error => {
        console.error('获取数据库条目失败：', error);
      });
  }, []);

  const data = [
    {
      title: '用户',
      value: `${total}`,
      trend: 'up',
      buttonText: "查看用户"
    },
    {
      title: '图书馆条目',
      value: '3.4万',
      trend: 'down',
      buttonText: "检索数据"
    },
    {
      title: '数据库条目',
      value: `${documentCount}`,
      trend: 'neutral',
      buttonText: "检索数据",
      buttonLink: "/Database"
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        概览
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        {data.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...card} />
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
        </Grid>
        <Grid size={{ xs: 12, md: 12 }}>
          <PageViewsBarChart />
        </Grid>
      </Grid>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        数据库最新条目
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <CustomizedDataGrid />
        </Grid>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
            <CustomizedTreeView />
            <ChartUserByCountry setTotal={setTotal} total={total}/>
          </Stack>
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}