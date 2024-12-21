import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import UpdateIcon from '@mui/icons-material/Update';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import TranslateIcon from '@mui/icons-material/Translate';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import DatasetIcon from '@mui/icons-material/Dataset';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import Typography from '@mui/material/Typography';

const mainListItems = [
  { text: '概览', icon: <HomeRoundedIcon />, link: '/' },
  { text: '文献翻译', icon: <TranslateIcon />, link: '/Translate' },
  { text: '文献数字化', icon: <SettingsSuggestIcon />, link: '/Process' },
  { text: '文献数据库', icon: <DatasetIcon />, link: '/Database' },
  { text: '文献图谱', icon: <AutoGraphIcon />, link: '/KnowledgeGraph' },
];

const secondaryListItems = [
  { text: '设置', icon: <SettingsRoundedIcon /> },
  { text: '更新信息', icon: <UpdateIcon />, link: '/Update' },
  { text: '关于我们', icon: <PeopleRoundedIcon />, link: '/About' },
];

export default function MenuContent() {
  const location = useLocation();
  const [selectedItem, setSelectedItem] = React.useState(location.pathname);

  React.useEffect(() => {
    setSelectedItem(location.pathname);
  }, [location]);

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                component={Link}
                to={item.link || '#'}
                selected={selectedItem === item.link}
                onClick={() => setSelectedItem(item.link)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '1rem', fontWeight: 100 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
            {item.text === '概览' && <Divider />}
          </React.Fragment>
        ))}
      </List>

      <List>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={item.link ? Link : 'button'} // Use Link if there's a link
              to={item.link || '#'} // Default to '#' if no link is specified
              selected={selectedItem === item.link}
              onClick={() => setSelectedItem(item.link)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography sx={{ fontSize: '1rem', fontWeight: 100 }}>
                    {item.text}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
