// 数据库服务
import User from '../database/models/User.js';

// 查找用户
export const findUserById = async (id) => {
  try {
    const user = await User.findOne({ where: { id } });
    return user;
  } catch (error) {
    console.error('查找用户失败:', error);
    return null;
  }
};

// 创建用户
export const createUser = async (userData) => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    console.error('创建用户失败:', error);
    return null;
  }
};

// 更新用户
export const updateUser = async (id, userData) => {
  try {
    const [rowsUpdated, [updatedUser]] = await User.update(userData, {
      where: { id },
      returning: true,
    });
    return updatedUser;
  } catch (error) {
    console.error('更新用户失败:', error);
    return null;
  }
};

// 删除用户
export const deleteUser = async (id) => {
  try {
    const rowsDeleted = await User.destroy({ where: { id } });
    return rowsDeleted > 0;
  } catch (error) {
    console.error('删除用户失败:', error);
    return false;
  }
};

// 查找所有用户
export const findAllUsers = async () => {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    console.error('查找所有用户失败:', error);
    return [];
  }
};