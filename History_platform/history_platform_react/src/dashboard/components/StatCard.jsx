import * as React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Button } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';


function StatCard({ title, value, trend, buttonText, buttonLink }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate(); // 获取 navigate 方法
  
  const labelColors = {
    up: 'error',
    down: 'success',
    neutral: 'default',
  };

  const color = labelColors[trend];
  const trendValues = { up: '+25%', down: '-25%', neutral: '+1%' };

  const handleButtonClick = () => {
    if (buttonLink) {
      navigate(buttonLink); // 使用编程式导航
    }
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component="h1" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Stack
          direction="column"
          sx={{ height: '100%', justifyContent: 'center', gap: 1 }}
        >
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="h2" component="p" sx={{ mb: 2 }}>
              {value}
            </Typography>
            <Chip size="medium" color={color} label={trendValues[trend]} />
          </Stack>
        </Stack>
        {buttonLink ? (
            <Button
              variant="contained"
              size="small"
              color="primary"
              endIcon={<ChevronRightRoundedIcon />}
              fullWidth={isSmallScreen}
              onClick={handleButtonClick}
            >
              {buttonText}
            </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            color="primary"
            endIcon={<ChevronRightRoundedIcon />}
            fullWidth={isSmallScreen}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['down', 'neutral', 'up']).isRequired,
  value: PropTypes.string.isRequired,
  buttonText: PropTypes.string, // 添加buttonText的propType
  buttonLink: PropTypes.string, // 添加buttonLink的propType
};

export default StatCard;
