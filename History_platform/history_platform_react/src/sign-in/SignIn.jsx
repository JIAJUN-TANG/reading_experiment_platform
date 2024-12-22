import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './ForgotPassword.jsx';
import { SSOIcon, MailIcon } from './CustomIcons';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import axios from 'axios';
import { useUser } from '../UserProvider.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import DHlogo from '../../DH.svg'
import { motion } from "framer-motion";


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow: 'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage: 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { setUserInfo } = useUser();
  const { checkAuth } = useAuth();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function getPublicIP() {
    try {
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("获取公网 IP 失败:", error);
      return null;
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    // 先验证表单输入
    if (!validateInputs()) return;
  
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
  
    try {
      // 获取用户公网 IP
      const ip_address = await getPublicIP() || "";
      const response = await axios.post(
        'http://114.212.97.42:8000/user/SignIn/',
        { email, password, ip_address },
        { withCredentials: true } // 确保发送和接收 Cookies
      );
  
      if (response.data.user_info) {
        // 存储 access_token
        localStorage.setItem('access_token', response.data.access_token);
    
        // 更新用户信息并导航到主页
        setUserInfo(response.data.user_info);
        checkAuth(true);
        navigate('/');
      } else {
        throw new Error('User info not found in response');
      }
    } catch (error) {
      console.error(error);
  
      // 根据错误类型设置错误信息
      if (error.response && error.response.data) {
        const { message } = error.response.data;
        if (message === 'Invalid email') {
          setEmailError(true);
          setEmailErrorMessage('无效的邮箱地址');
        } else if (message === 'Invalid password') {
          setPasswordError(true);
          setPasswordErrorMessage('无效的密码');
        } else {
          setEmailError(true);
          setPasswordError(true);
          setEmailErrorMessage('账户错误');
          setPasswordErrorMessage('密码错误');
        }
      } else {
        setEmailError(true);
        setPasswordError(true);
        setEmailErrorMessage('账户错误');
        setPasswordErrorMessage('密码错误');
      }
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('请输入有效的邮箱账户！');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length === 0) {
      setPasswordError(true);
      setPasswordErrorMessage('请输入密码！');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          gap: 2,
        }}>
          <motion.img 
            src={DHlogo} 
            alt="DH Logo" 
            initial={{ opacity: 0, scale: 0, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
              scale: { type: "spring", damping: 10, stiffness: 100 }
            }}
            style={{ 
              width: '80px',
              height: '80px',
              objectFit: 'contain'
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              scale: { type: "spring", damping: 10, stiffness: 100 }
            }}
          >
            <Typography 
              variant="h2"
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4A148C 10%, #9C27B0 50%, #E1BEE7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(156, 39, 176, 0.1)',
                letterSpacing: '0.02em',
              }}
            >
              数智文献平台
            </Typography>
          </motion.div>
        </Box>
        <Card variant="outlined">
          <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}>
            登录页面
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">邮箱</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
                sx={{ ariaLabel: 'email' }}
              />
            </FormControl>
            <FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <FormLabel htmlFor="password">密码</FormLabel>
                <Link component="button" type="button" onClick={handleClickOpen} variant="body2" sx={{ alignSelf: 'baseline' }}>
                  忘记密码？
                </Link>
              </Box>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button type="submit" fullWidth variant="contained">
              登录
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              还没有账号？{' '}
              <Link component={RouterLink} to="/sign-up" variant="body2" sx={{ alignSelf: 'center' }}>
                前往注册
              </Link>
            </Typography>
          </Box>
          <Divider>或者</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => alert('暂未开通')} startIcon={<SSOIcon />}>
              使用SSO验证登录
            </Button>
            <Button fullWidth variant="outlined" onClick={() => alert('暂未开通')} startIcon={<MailIcon />}>
              使用邮箱验证码登录
            </Button>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
