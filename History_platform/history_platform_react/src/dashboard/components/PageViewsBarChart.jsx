import * as React from 'react';
import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

export default function PageViewsBarChart() {
  const theme = useTheme();
  const [usageData, setUsageData] = useState({
    months: [],
    counts: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [growthRate, setGrowthRate] = useState(0);
  const [currentMonthCount, setCurrentMonthCount] = useState(0);
  const [lastMonthCount, setLastMonthCount] = useState(0);

  // 计算增长率的函数
  const calculateGrowthRate = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await axios.get('http://114.212.97.42:8000/data/GetUsage');
        
        // 获取最近6个月的月份列表
        const now = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }).reverse();

        // 创建一个月份到使用次数的映射
        const monthCountMap = {};
        response.data.months.forEach((month, index) => {
          monthCountMap[month] = response.data.counts[index];
        });

        // 填充完整的6个月数据，没有记录的月份设为0
        const fullMonths = last6Months;
        const fullCounts = last6Months.map(month => monthCountMap[month] || 0);

        setUsageData({
          months: fullMonths,
          counts: fullCounts,
          total: response.data.total || 0
        });

        // 设置当前月和上月的使用次数
        const currentMonth = fullCounts[fullCounts.length - 1];
        const previousMonth = fullCounts[fullCounts.length - 2];
        setCurrentMonthCount(currentMonth);
        setLastMonthCount(previousMonth);
        setGrowthRate(calculateGrowthRate(currentMonth, previousMonth));

      } catch (error) {
        console.error('获取使用统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();

    // 设置定时器，每分钟更新一次数据
    const intervalId = setInterval(fetchUsageData, 60000);

    // 清理函数
    return () => clearInterval(intervalId);
  }, []);

  const colorPalette = [
    (theme.vars || theme).palette.primary.dark,
    (theme.vars || theme).palette.primary.main,
    (theme.vars || theme).palette.primary.light,
  ];

  if (loading) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography>加载中...</Typography>
        </CardContent>
      </Card>
    );
  }

  // 格式化月份显示
  const formatMonth = (month) => {
    const [year, monthNum] = month.split('-');
    return `${monthNum}月`;
  };

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          使用情况统计
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {usageData.total}次
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                size="small" 
                color={growthRate >= 0 ? "error" : "success"}
                label={`${growthRate}%`} 
              />
            </Stack>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            最近6个月内的使用记录
          </Typography>
        </Stack>
        <BarChart
          borderRadius={8}
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'band',
              categoryGapRatio: 0.5,
              data: usageData.months.map(formatMonth),
            },
          ]}
          series={[
            {
              data: usageData.counts,
              label: '使用次数',
            },
          ]}
          height={250}
          margin={{ left: 50, right: 0, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
