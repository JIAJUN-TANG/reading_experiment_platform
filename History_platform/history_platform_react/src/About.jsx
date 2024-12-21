import * as React from 'react';
import { AuthProvider } from './context/AuthContext';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './dashboard/components/AppNavbar.jsx';
import Header from './dashboard/components/Header.jsx';
import SideMenu from './dashboard/components/SideMenu.jsx';
import AppTheme from './shared-theme/AppTheme.jsx';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './dashboard/theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

// 成员数据
const directors = [
  { name: '金伯文', role: '主任', avatar: 'https://via.placeholder.com/150' },
  { name: '李庆', role: '主任', avatar: 'https://via.placeholder.com/150' },
  { name: '姚念达', role: '主任', avatar: 'https://via.placeholder.com/150' },
];

const academicCommittee = [
  { name: '孙扬', role: '学术委员会委员', avatar: 'https://via.placeholder.com/150' },
];

const consult = [{ name: '张斌', role: '首席专家顾问', avatar: 'https://via.placeholder.com/150' }]

import jiajuntangAvatar from './assets/jiajuntang.png';

const manager = [
  { name: '唐嘉骏', role: '技术部主任', avatar: jiajuntangAvatar },
];

const member = [{ name: '小布', role: '首席神兽', avatar: 'https://via.placeholder.com/150' }]

const shareHolder = [{ name: '金伯文', role: '股东', avatar: 'https://via.placeholder.com/150' },
  { name: '李庆', role: '股东', avatar: 'https://via.placeholder.com/150' },
  { name: '姚念达', role: '股东', avatar: 'https://via.placeholder.com/150' },
  { name: '唐嘉骏', role: '股东', avatar: 'https://via.placeholder.com/150' }]

const decider = [{ name: '金伯文', role: '法人', avatar: 'https://via.placeholder.com/150' },
  { name: '李庆', role: '顾问', avatar: 'https://via.placeholder.com/150' },
  { name: '姚念达', role: '财务负责人', avatar: 'https://via.placeholder.com/150' },
  { name: '唐嘉骏', role: '技术部主任', avatar: jiajuntangAvatar }]

export default function Dashboard(props) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  return (
    <AuthProvider>
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />

            {/* Tabs for Introduction, People, and Contact */}
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="Dashboard tabs"
              sx={{
                '& .MuiTab-root': {
                  minWidth: 0,
                  mx: 3,
                  paddingX: 2,
                  border: 'none',
                },
                '& .MuiTabs-indicator': {
                },
              }}
            >
              <Tab label="介绍" />
              <Tab label="实验室成员" />
              <Tab label="公司成员" />
              <Tab label="联系" />
            </Tabs>
            <TabPanel value={tabIndex} index={0}>
              这是我们的平台介绍。我们专注于提供高质量的服务与支持。
            </TabPanel>
            <TabPanel value={tabIndex} index={1}>
              {/* 主任组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                实验室主任
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {directors.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {/* 学术委员会委员组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                实验室学术委员会
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {academicCommittee.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {/* 顾问组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                专家顾问
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {consult.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {/* 技术部组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                技术部
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {manager.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {/* 成员组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                成员
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {member.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </TabPanel>
            <TabPanel value={tabIndex} index={2}>
              {/* 股东组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                公司股东
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {shareHolder.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              {/* 执行组 */}
              <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
                公司执行局
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)', // 三列布局
                  gap: 4,
                }}
              >
                {decider.map((member, index) => (
                  <Card key={index} sx={{ display: 'flex', alignItems: 'center', p: 2 , width: 250}}>
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      sx={{ width: 64, height: 64, mr: 3 }}
                    />
                    <CardContent>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </TabPanel>
            <TabPanel value={tabIndex} index={3}>
              联系我们：可以通过邮箱或电话与我们取得联系。
            </TabPanel>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
    </AuthProvider>
  );
}
