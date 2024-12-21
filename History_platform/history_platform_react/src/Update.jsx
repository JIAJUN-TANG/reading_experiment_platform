import React from "react";
import { AppBar, Box, Button, Container, CssBaseline, Grid, Toolbar, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// 创建主题
const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 导航栏 */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ flexWrap: "wrap" }}>
          <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
            Your Company
          </Typography>
          <nav>
            <Button href="#" sx={{ my: 1, mx: 1.5 }}>
              Features
            </Button>
            <Button href="#" sx={{ my: 1, mx: 1.5 }}>
              Enterprise
            </Button>
            <Button href="#" sx={{ my: 1, mx: 1.5 }}>
              Support
            </Button>
          </nav>
          <Button href="#" variant="outlined" sx={{ my: 1, mx: 1.5 }}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* 内容 */}
      <main>
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 8,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="h1"
              variant="h2"
              align="center"
              color="text.primary"
              gutterBottom
            >
              Marketing Page
            </Typography>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              Quickly build an effective marketing homepage with this template.
              It's built with MUI components with minimal customization.
            </Typography>
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button variant="contained" sx={{ mx: 1 }}>
                Get Started
              </Button>
              <Button variant="outlined" sx={{ mx: 1 }}>
                Learn More
              </Button>
            </Box>
          </Container>
        </Box>

        {/* 卡片网格 */}
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Grid container spacing={4}>
            {[1, 2, 3].map((item) => (
              <Grid item key={item} xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Heading {item}
                  </Typography>
                  <Typography>
                    This is a media card. You can use this section to describe
                    the content.
                  </Typography>
                  <Button sx={{ mt: 2 }} variant="outlined">
                    View
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </main>

      {/* Footer */}
      <Box sx={{ bgcolor: "background.paper", p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
        >
          Something here to give the footer a purpose!
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App;
