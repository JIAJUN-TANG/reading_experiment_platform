// 本地存储服务
import { UserRole } from '../types';

// 初始化本地存储
const initLocalStorage = () => {
  // 检查是否已经初始化
  if (!localStorage.getItem('users')) {
    // 初始化用户数据
    const initialUsers = [
      { id: 'u1', name: 'Alice Researcher', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/id/1/200/200', password: 'password1' },
      { id: 'u2', name: 'Bob Subject', role: UserRole.PARTICIPANT, avatarUrl: 'https://picsum.photos/id/2/200/200', password: 'password2' },
      { id: 'admin1', name: 'admin', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/id/3/200/200', password: 'adminpassword' },
    ];
    localStorage.setItem('users', JSON.stringify(initialUsers));
  }
};

// 初始化
initLocalStorage();

// 查找用户
export const findUserById = async (id) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    return user;
  } catch (error) {
    console.error('查找用户失败:', error);
    return null;
  }
};

// 创建用户
export const createUser = async (userData) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    return userData;
  } catch (error) {
    console.error('创建用户失败:', error);
    return null;
  }
};

// 更新用户
export const updateUser = async (id, userData) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...userData };
      localStorage.setItem('users', JSON.stringify(users));
      return users[index];
    }
    return null;
  } catch (error) {
    console.error('更新用户失败:', error);
    return null;
  }
};

// 删除用户
export const deleteUser = async (id) => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUsers = users.filter(u => u.id !== id);
    if (newUsers.length < users.length) {
      localStorage.setItem('users', JSON.stringify(newUsers));
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
};

// 查找所有用户
export const findAllUsers = async () => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users;
  } catch (error) {
    console.error('查找所有用户失败:', error);
    return [];
  }
};