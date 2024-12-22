import * as React from 'react';

import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar.jsx';
import Header from './components/Header.jsx';
import MainGrid from './components/MainGrid.jsx';
import SideMenu from './components/SideMenu.jsx';
import AppTheme from '../shared-theme/AppTheme.jsx';
import FloatingChatButton from '../AIDialog.jsx';


import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const textContent = document.body.innerText;

  return (
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
              pl: 5,
              pr: 5,
              pb: 5,
              mt: { xs: 8, md: 1 },
              width: '100%',
            }}
          >
            <Header />
          </Stack>
          <Box sx={{ pl: 2, pr: 2}}><MainGrid/></Box>
        </Box>
        <FloatingChatButton assistant_message={textContent}/>
      </Box>
    </AppTheme>
  );
}
