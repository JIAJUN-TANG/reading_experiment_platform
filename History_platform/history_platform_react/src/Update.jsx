import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  alpha,
  Container,
  Tabs,
  Tab,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from './dashboard/components/AppNavbar';
import Header from './dashboard/components/Header';
import SideMenu from './dashboard/components/SideMenu';
import AppTheme from './shared-theme/AppTheme';
import { 
  Language as LanguageIcon,
  FindInPage as FindInPageIcon,
  Translate as TranslateIcon,
  Storage as StorageIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useUser } from './UserProvider';
import DHlogo from '../DH.svg';
import { motion, useAnimationFrame } from 'framer-motion';

const features = [
  {
    icon: <LanguageIcon sx={{ fontSize: 40 }} />,
    title: '多语言支持',
    description: '支持日语、英语、德语等多种语言的文献处理',
  },
  {
    icon: <FindInPageIcon sx={{ fontSize: 40 }} />,
    title: '精准识别',
    description: '先进的深度学习OCR技术，准确识别文献内容',
  },
  {
    icon: <TranslateIcon sx={{ fontSize: 40 }} />,
    title: '智能翻译',
    description: '人工智能协同翻译功能，快速获取译文',
  },
  {
    icon: <StorageIcon sx={{ fontSize: 40 }} />,
    title: '全文索引',
    description: '文献内容分库保存，支持在线检索、共享和协作',
  },
];

const DotBackground = () => {
  const [offset, setOffset] = useState(0);

  useAnimationFrame((t) => {
    // 缓慢移动点阵图案
    setOffset((offset) => (offset + 0.5) % 15);
  });

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#f0f0f0',
        maskImage: 'radial-gradient(black 1px, transparent 1px)',
        maskSize: '15px 15px',
        WebkitMaskImage: 'radial-gradient(black 1px, transparent 1px)',
        WebkitMaskSize: '15px 15px',
        maskPositionX: `${offset}px`,
        maskPositionY: '0px',
        WebkitMaskPositionX: `${offset}px`,
        WebkitMaskPositionY: '0px',
      }}
    />
  );
};

const Update = (props) => {
  const { userInfo } = useUser();
  const [selectedCard, setSelectedCard] = useState(0);

  const cards = [
    {
      title: '基础保障',
      description: '采用先进的OCR技术，确保文字识别的准确性和可靠性。支持多种文件格式，满足不同场景需求。',
    },
    {
      title: '智能处理',
      description: '集成AI智能分析，自动优化识别结果，提供智能纠错和版面分析功能。',
    },
    {
      title: '高效协同',
      description: '支持团队协作处理，实时同步识别结果，提高工作效率。',
    },
  ];

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <DotBackground />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex' }}>
            <SideMenu />
            <AppNavbar />
            <Box
              component="main"
              sx={(theme) => ({
                flexGrow: 1,
                backgroundColor: theme.vars
                  ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                  : alpha(theme.palette.background.default, 1),
                  overflow: 'hidden',
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
              
              <Box
                sx={{
                  width: '100%',
                  position: 'relative',
                  pt: 12,
                  pb: 12,
                  overflow: 'hidden',
                }}
              >
                {/* 渐变背景 */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'linear-gradient(to bottom right, #4A148C 10%, #9C27B0 50%, #E1BEE7 100%)',
                    zIndex: 1,
                  }}
                />
                
                {/* AI 字母点阵 */}
                <Box
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    maskImage: `url("data:image/svg+xml,%3Csvg width='80' height='40' viewBox='0 0 90 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='20' y='25' font-family='Arial' font-size='16' font-weight='bold' fill='black'%3EAI%3C/text%3E%3Ctext x='60' y='25' font-family='Arial' font-size='16' font-weight='bold' fill='black'%3EDH%3C/text%3E%3C/svg%3E")`,
                    maskSize: '80px 40px',
                    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='80' height='40' viewBox='0 0 90 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='20' y='25' font-family='Arial' font-size='16' font-weight='bold' fill='black'%3EAI%3C/text%3E%3Ctext x='60' y='25' font-family='Arial' font-size='16' font-weight='bold' fill='black'%3EDH%3C/text%3E%3C/svg%3E")`,
                    WebkitMaskSize: '80px 40px',
                    maskRepeat: 'repeat',
                    WebkitMaskRepeat: 'repeat',
                    zIndex: 2,
                  }}
                  animate={{
                    maskPositionX: ['0px', '80px'],
                    WebkitMaskPositionX: ['0px', '80px'],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* 密度渐变的点阵背景 */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '70vh',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.08))',
                    maskSize: `100% 100%, 
                              calc(5px + (20px - 5px) * (1 - var(--scroll-percentage, 0))) 
                              calc(5px + (20px - 5px) * (1 - var(--scroll-percentage, 0)))`,
                    WebkitMaskSize: `100% 100%, 
                                   calc(5px + (20px - 5px) * (1 - var(--scroll-percentage, 0))) 
                                   calc(5px + (20px - 5px) * (1 - var(--scroll-percentage, 0)))`,
                    maskRepeat: 'no-repeat, repeat',
                    WebkitMaskRepeat: 'no-repeat, repeat',
                    zIndex: 1,
                  }}
                  component={motion.div}
                  animate={{
                    '--scroll-percentage': [0, 1],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* 内容层 */}
                <Box sx={{ position: 'relative', zIndex: 3 }}>
                  <Container maxWidth="lg">
                    <Stack spacing={4} alignItems="center">
                      <img 
                        src={DHlogo} 
                        alt="DHlogo" 
                        style={{ 
                          width: '100px', 
                          height: '100px',
                        }} 
                      />
                      <Typography
                        component="h1"
                        variant="h1"
                        color="white"
                        sx={{ textAlign: 'center', fontWeight: 'bold' }}
                      >
                        您好，{userInfo.user_name}！欢迎来到数智文献处理平台
                      </Typography>
                      <Typography
                        variant="h4"
                        color="white"
                        sx={{ 
                            textAlign: 'center', 
                            maxWidth: 1000,
                            textShadow: `
                                0 0 7px rgba(255,255,255,.3),
                                0 0 10px rgba(255,255,255,.3),
                                0 0 21px rgba(255,255,255,.3),
                                0 0 42px rgba(255,255,255,.3)
                            `,
                            letterSpacing: '0.05em',
                            opacity: 0.9,
                            animation: 'glow 2s ease-in-out infinite alternate',
                            '@keyframes glow': {
                                from: {
                                    textShadow: `
                                        0 0 7px rgba(255,255,255,.3),
                                        0 0 10px rgba(255,255,255,.3),
                                        0 0 21px rgba(255,255,255,.3),
                                        0 0 42px rgba(255,255,255,.3)
                                    `
                                },
                                to: {
                                    textShadow: `
                                        0 0 10px rgba(255,255,255,.4),
                                        0 0 15px rgba(255,255,255,.4),
                                        0 0 25px rgba(255,255,255,.4),
                                        0 0 45px rgba(255,255,255,.4)
                                    `
                                }
                            }
                        }}
                      >
                        Think Forward And Step Now.
                      </Typography>
                    </Stack>
                  </Container>
                </Box>
              </Box>

              {/* Features Section */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Box sx={{ py: 8, bgcolor: 'background.default', mt: 4 }}>
                    <Typography variant="h2" sx={{ textAlign: 'left', mb: 4, ml: 22 }}>
                      焦点，逐一看 <VisibilityIcon sx={{ fontSize: 30 }} />
                    </Typography>
                    
                    <Container maxWidth="lg">
                      <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.2
                            }
                          }
                        }}
                      >
                        <Grid2 
                          container 
                          spacing={4} 
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'stretch'
                          }}
                        >
                          {features.map((feature, index) => (
                            <Grid2 
                              key={index} 
                              sx={{ 
                                flex: 1,
                                minWidth: 0
                              }}
                            >
                              <motion.div
                                variants={{
                                  hidden: { opacity: 0, y: 20 },
                                  visible: { 
                                    opacity: 1, 
                                    y: 0,
                                    transition: {
                                      duration: 0.5,
                                      ease: "easeOut"
                                    }
                                  }
                                }}
                                whileHover={{ 
                                  scale: 1.05,
                                  y: -5,
                                  transition: { type: "spring", stiffness: 300 }
                                }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Card sx={{ 
                                  height: '100%',
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center', 
                                  p: 3,
                                  '& > *': { flex: 'none' },
                                  transition: 'box-shadow 0.3s ease-in-out',
                                  '&:hover': {
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                  }
                                }}>
                                  <Box sx={{ 
                                    p: 2, 
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    {feature.icon}
                                  </Box>
                                  <Typography 
                                    variant="h6" 
                                    component="h3" 
                                    gutterBottom 
                                    align="center"
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {feature.title}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    align="center"
                                    sx={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 4,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {feature.description}
                                  </Typography>
                                </Card>
                              </motion.div>
                            </Grid2>
                          ))}
                        </Grid2>
                      </motion.div>
                    </Container>
                  </Box>
                </motion.div>
              </motion.div>
              <Box sx={{ position: 'relative', zIndex: 3 }}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      textAlign: 'center', 
                      mb: 1, 
                      mt: 4,
                      position: 'relative',
                      color: 'transparent',
                      '&::before, &::after': {
                        content: '"可靠光学字符识别"',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        background: 'linear-gradient(45deg, #9C27B0, #E1BEE7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'blur(0.02em)',
                        animation: 'glitch 3s infinite linear alternate-reverse',
                      },
                      '&::before': {
                        animation: 'glitch-top 3s infinite linear alternate-reverse',
                        clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)',
                        transform: 'translateX(-0.05em)',
                      },
                      '&::after': {
                        animation: 'glitch-bottom 4s infinite linear alternate-reverse',
                        clipPath: 'polygon(0 67%, 100% 67%, 100% 100%, 0 100%)',
                        transform: 'translateX(0.05em)',
                      },
                      '@keyframes glitch-top': {
                        '0%': {
                          transform: 'translateX(-0.05em)',
                          filter: 'blur(0.02em) brightness(1.5)',
                        },
                        '100%': {
                          transform: 'translateX(0.05em)',
                          filter: 'blur(0.02em) brightness(2)',
                        }
                      },
                      '@keyframes glitch-bottom': {
                        '0%': {
                          transform: 'translateX(0.05em)',
                          filter: 'blur(0.02em) hue-rotate(15deg)',
                        },
                        '100%': {
                          transform: 'translateX(-0.05em)',
                          filter: 'blur(0.02em) hue-rotate(-15deg)',
                        }
                      },
                      '&': {
                        textShadow: `
                          0 0 5px rgba(156,39,176,0.5),
                          0 0 10px rgba(156,39,176,0.3),
                          0 0 15px rgba(156,39,176,0.1)
                        `,
                        background: 'linear-gradient(45deg, #9C27B0, #E1BEE7)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }
                    }}
                  >
                    可靠光学字符识别
                  </Typography>
                  
                  {/* 卡片容器 */}
                  <Box sx={{ 
                    position: 'relative', 
                    height: '400px',
                    overflow: 'hidden',
                    mt: 4 
                  }}>
                    <motion.div
                      style={{
                        display: 'flex',
                        gap: '2rem',
                        padding: '0 20%',
                      }}
                      animate={{
                        x: `${-selectedCard * 100}%`
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                    >
                      {cards.map((card, index) => (
                        <motion.div
                          key={card.title}
                          style={{
                            flex: '0 0 100%',
                            padding: '1rem',
                          }}
                          whileHover={{ scale: 1.02 }}
                          animate={{
                            scale: selectedCard === index ? 1 : 0.9,
                            opacity: selectedCard === index ? 1 : 0.5,
                          }}
                          onClick={() => setSelectedCard(index)}
                        >
                          <Card sx={{ 
                            p: 4,
                            height: '300px',
                            cursor: 'pointer',
                            boxShadow: selectedCard === index ? 6 : 2,
                            transition: 'box-shadow 0.3s',
                            backgroundColor: 'background.paper',
                          }}>
                            <Typography variant="h4" gutterBottom>
                              {card.title}
                            </Typography>
                            <Typography variant="body1">
                              {card.description}
                            </Typography>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* 右侧渐变遮罩 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '20%',
                        height: '100%',
                        background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))',
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />

                    {/* 导航点 */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 2,
                      mt: 3 
                    }}>
                      {cards.map((_, index) => (
                        <motion.div
                          key={index}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: selectedCard === index ? '#9C27B0' : '#E1BEE7',
                            cursor: 'pointer',
                          }}
                          whileHover={{ scale: 1.2 }}
                          onClick={() => setSelectedCard(index)}
                        />
                      ))}
                    </Box>
                  </Box>
                </motion.div>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
};

export default Update;
