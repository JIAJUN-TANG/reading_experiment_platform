import { React, useState } from 'react';
import { Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, TextField, Box, List, ListItem } from '@mui/material';
import { Try, Close, SmartToy } from '@mui/icons-material';
import axios from 'axios';
import { marked } from 'marked';
import 'github-markdown-css';
import { ripples } from 'ldrs';

const FloatingChatButton = ({ assistant_message }) => {
  const [open, setOpen] = useState(false); // 控制对话框开关
  const [messages, setMessages] = useState([]); // 存储聊天消息
  const [inputValue, setInputValue] = useState(''); // 输入框的值
  const [loading, setLoading] = useState(false); // 是否正在加载中

  // 确保 assistant_message 是字符串，否则设置为空字符串
  const inputText = typeof assistant_message === 'string' ? assistant_message : '';

  // 打开对话框
  const handleClickOpen = () => {
    setOpen(true);
  };

  // 关闭对话框
  const handleClose = () => {
    setOpen(false);
  };

  // 处理输入框的变化
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    // 1. 将用户消息添加到消息列表
    const userMessage = inputValue.trim();
    setMessages((prevMessages) => [...prevMessages, { text: userMessage, sender: 'user' }]);
    
    // 清空输入框
    setInputValue('');
    
    // 2. 启动加载动画
    setLoading(true);

    try {
      // 3. 发送请求到 /Chat/ API
      const response = await axios.post('http://114.212.97.42:8000/chat/Chat/', {
        user_message: userMessage,
        assistant_message: inputText
      });

      // 4. 确保AI回复是字符串
      const aiResponse = String(response.data); // 确保 AI 的回复是字符串
      
      // 5. 将 AI 的回复添加到消息列表
      setMessages((prevMessages) => [...prevMessages, { text: aiResponse, sender: 'ai' }]);
    } catch (error) {
      console.error('API请求失败:', error);
      setMessages((prevMessages) => [...prevMessages, { text: 'AI 发生错误，请稍后重试。', sender: 'ai' }]);
    } finally {
      // 6. 关闭加载动画
      setLoading(false);
    }
  };

  // 处理回车键发送消息
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  ripples.register()

  return (
    <>
      <Fab 
        color="primary" 
        aria-label="chat" 
        onClick={handleClickOpen} 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <Try />
      </Fab>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="dialog-title"
        PaperProps={{
          style: {
            position: 'fixed',
            bottom: '15px',
            right: '15px',
            margin: 0,
            width: '40%',
            height: '80%',
            maxWidth: '100%',
            borderRadius: '15px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <DialogTitle id="dialog-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SmartToy />
          文献Chat
          <IconButton aria-label="close" onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '10px'
          }}
        >
          <List>
            {messages.map((message, index) => (
              <ListItem 
                key={index} 
                style={{
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Box 
                  sx={{ 
                    backgroundColor: message.sender === 'user' ? '#1976d2' : '#e0e0e0', 
                    color: message.sender === 'user' ? 'white' : 'black', 
                    borderRadius: '12px', 
                    padding: '8px 12px', 
                    maxWidth: '70%' 
                  }}
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ 
                    __html: marked(typeof message.text === 'string' ? message.text : JSON.stringify(message.text)) 
                  }}
                >
                </Box>
              </ListItem>
            ))}
            {loading && (
              <ListItem style={{ justifyContent: 'center' }}>
                <l-ripples size='45' speed='2' color='coral'></l-ripples>
              </ListItem>
            )}
          </List>
        </DialogContent>

        <DialogActions 
          style={{ 
            padding: '10px', 
          }}
        >
          <TextField
            variant="outlined"
            placeholder="输入您的消息..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            style={{ marginRight: '10px' }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSendMessage}
            disabled={loading}
          >
            发送
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FloatingChatButton;