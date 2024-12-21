import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import SearchDataGrid from './dashboard/components/SearchDataGrid';
import FloatingChatButton from './AIDialog';


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

export default function Database(props) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [triggerSearch, setTriggerSearch] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);

  const handleSearch = () => {
    setTriggerSearch(true);
    setShowSearchResults(true);
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    setTriggerSearch(false);
    setShowSearchResults(false);
  };

  const textContent = document.body.innerText;

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Side Menu and Navbar */}
        <SideMenu />
        <AppNavbar />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
            paddingTop: 0, // Remove top margin/padding
          })}
        >
          {/* Header */}
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 3, md: 0 },  // Adjust margin-top for mobile view
            }}
          >
            <Header />
          </Stack>

          {/* 检索输入 */}
          <Card
            sx={{
              alignSelf: 'center',
              mx: 'auto',
              width: '90%',
              maxWidth: '90%',
              boxShadow: 3,
              p: 2,
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="检索词"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchTermChange}
                sx={{ flexGrow: 1, marginRight: 2 }}
              />
              <Button variant="contained" onClick={handleSearch}>
                检索
              </Button>
            </Box>
          </Card>

          {/* Search Results */}
          {showSearchResults && (
            <Card
              sx={{
                alignSelf: 'center',
                mx: 'auto',
                width: '90%',
                maxWidth: '90%',
                boxShadow: 3,
                mt: 2,
                mb: 5
              }}
            >
              <CardContent>
                <Box sx={{ width: '100%' }}>
                  <SearchDataGrid searchTerm={searchTerm} triggerSearch={triggerSearch} setTriggerSearch={setTriggerSearch} />
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
        <FloatingChatButton assistant_message={textContent}/>
      </Box>
    </AppTheme>
  );
}
