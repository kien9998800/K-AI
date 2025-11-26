import { User, ChatSession, Message } from '../types';

const USERS_KEY = 'hajime_users';
const CURRENT_USER_KEY = 'hajime_current_user';
const CHAT_HISTORY_KEY = 'hajime_chat_history';

// --- AUTH SERVICE ---

export const registerUser = (username: string, password: string): { success: boolean; message: string; user?: User } => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];

  if (users.find(u => u.username === username)) {
    return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
  }

  const newUser: User = { username, password, createdAt: Date.now() };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // Auto login
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return { success: true, message: 'Đăng ký thành công!', user: newUser };
};

export const loginUser = (username: string, password: string): { success: boolean; message: string; user?: User } => {
  const usersStr = localStorage.getItem(USERS_KEY);
  const users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { success: true, message: 'Đăng nhập thành công!', user };
  }
  
  return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// --- HISTORY SERVICE ---

export const saveSession = (userId: string, sessionId: string, messages: Message[]) => {
  if (messages.length === 0) return;

  const historyStr = localStorage.getItem(CHAT_HISTORY_KEY);
  let history: ChatSession[] = historyStr ? JSON.parse(historyStr) : [];

  // Generate title from first user message
  const firstUserMsg = messages.find(m => m.role === 'user');
  const title = firstUserMsg ? (firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '')) : 'Cuộc trò chuyện mới';

  const existingIndex = history.findIndex(h => h.id === sessionId);
  
  const sessionData: ChatSession = {
    id: sessionId,
    userId,
    title,
    messages,
    lastModified: Date.now()
  };

  if (existingIndex >= 0) {
    history[existingIndex] = sessionData;
  } else {
    history.push(sessionData);
  }

  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

export const getUserSessions = (userId: string): ChatSession[] => {
  const historyStr = localStorage.getItem(CHAT_HISTORY_KEY);
  const history: ChatSession[] = historyStr ? JSON.parse(historyStr) : [];
  return history
    .filter(h => h.userId === userId)
    .sort((a, b) => b.lastModified - a.lastModified);
};

export const deleteSession = (sessionId: string) => {
  const historyStr = localStorage.getItem(CHAT_HISTORY_KEY);
  let history: ChatSession[] = historyStr ? JSON.parse(historyStr) : [];
  history = history.filter(h => h.id !== sessionId);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};