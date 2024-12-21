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
import AppTheme from '../shared-theme/AppTheme.jsx';
import { SSOIcon, MailIcon } from './CustomIcons.jsx';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import axios from 'axios';

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

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUp(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [affiliationError, setAffiliationError] = React.useState(false);
  const [affiliationErrorMessage, setAffiliationErrorMessage] = React.useState('');
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteCodeError, setInviteCodeError] = React.useState(false);
  const [inviteCodeErrorMessage, setInviteCodeErrorMessage] = React.useState('');

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const name = document.getElementById('name');
    const affiliation = document.getElementById('affiliation');
    const isValidInviteCode = inviteCode === 'DigitalHumanities2025';

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('请输入有效的邮箱地址！');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 8) {
      setPasswordError(true);
      setPasswordErrorMessage('密码长度必须大于8！');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('请输入用户名！');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!affiliation.value || affiliation.value.length < 1) {
      setAffiliationError(true);
      setAffiliationErrorMessage('请输入机构名！');
      isValid = false;
    } else {
      setAffiliationError(false);
      setAffiliationErrorMessage('');
    }

    if (!isValidInviteCode) {
      setInviteCodeError(true);
      setInviteCodeErrorMessage('邀请码不正确或未填写！');
      isValid = false;
    } else {
      setInviteCodeError(false);
      setInviteCodeErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = {
        user_name: event.target.name.value,
        email: event.target.email.value,
        invitation: inviteCode,
        password: event.target.password.value,
        affiliation: event.target.affiliation.value,
    };

    try {
        const response = await axios.post('http://114.212.97.42:8000/user/SignUp/', data, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 200) {
            alert('注册成功！请登录。');
            navigate('/sign-in');
        } else {
            alert('注册失败，请重试。');
        }
    } catch (error) {
        console.error("注册失败:", error);
        if (error.response && error.response.status === 400) {
            alert('该邮箱已注册，请使用其他邮箱。');
        } else {
            alert('网络错误，请稍后重试。');
        }
    }
};

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="space-between">
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            注册页面
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="name">用户名*</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="张三"
                error={nameError}
                helperText={nameErrorMessage}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="affiliation">机构*</FormLabel>
              <TextField
                autoComplete="affiliation"
                name="affiliation"
                required
                fullWidth
                id="affiliation"
                placeholder="北京大学"
                error={affiliationError}
                helperText={affiliationErrorMessage}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="inviteCode">邀请码*</FormLabel>
              <TextField
                required
                fullWidth
                id="inviteCode"
                placeholder="请输入邀请码"
                name="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                error={inviteCodeError}
                helperText={inviteCodeErrorMessage}/>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">邮箱*</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                error={emailError}
                helperText={emailErrorMessage}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">密码*</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="new-password"
                error={passwordError}
                helperText={passwordErrorMessage}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
            >
              注册
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              已有账号?{' '}
              <Link
                component={RouterLink}
                to="/SignIn"
                variant="body2"
              >
                前往登录
              </Link>
            </Typography>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>或者</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('暂未开通')}
              startIcon={<SSOIcon />}
            >
              使用SSO验证登录
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => alert('暂未开通')}
              startIcon={<MailIcon />}
            >
              使用邮箱验证码登录
            </Button>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
