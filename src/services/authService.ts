import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';
import { securityManager } from '../utils/security';

const USER_STORAGE_KEY = 'crypto_wallet_user';
const SESSION_STORAGE_KEY = 'crypto_wallet_session';

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private isAuthenticated: boolean = false;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Check for existing session
      const sessionData = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.expiresAt > Date.now()) {
          const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
          if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isAuthenticated = true;
          }
        } else {
          // Session expired, clear storage
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      await this.clearSession();
    }
  }

  async register(email: string, username: string, password: string): Promise<User> {
    try {
      // Check if user already exists
      const existingUsers = await this.getStoredUsers();
      const existingUser = existingUsers.find(
        user => user.email === email || user.username === username
      );

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await securityManager.hashPassword(password);

      // Create new user
      const user: User = {
        id: `user_${Date.now()}`,
        email,
        username,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store user with hashed password
      const userWithPassword = { ...user, password: hashedPassword };
      existingUsers.push(userWithPassword);
      await AsyncStorage.setItem('users', JSON.stringify(existingUsers));

      // Create session
      await this.createSession(user);

      this.currentUser = user;
      this.isAuthenticated = true;

      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const users = await this.getStoredUsers();
      const userWithPassword = users.find(user => user.email === email);

      if (!userWithPassword) {
        throw new Error('Invalid email or password');
      }

      const isValidPassword = await securityManager.verifyPassword(
        password,
        userWithPassword.password
      );

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      const user: User = {
        id: userWithPassword.id,
        email: userWithPassword.email,
        username: userWithPassword.username,
        createdAt: userWithPassword.createdAt,
        updatedAt: userWithPassword.updatedAt,
      };

      // Create session
      await this.createSession(user);

      this.currentUser = user;
      this.isAuthenticated = true;

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.clearSession();
      this.currentUser = null;
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const users = await this.getStoredUsers();
      const userIndex = users.findIndex(user => user.id === this.currentUser!.id);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const user = users[userIndex];
      const isValidPassword = await securityManager.verifyPassword(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await securityManager.hashPassword(newPassword);
      users[userIndex].password = hashedNewPassword;
      users[userIndex].updatedAt = new Date();

      await AsyncStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const users = await this.getStoredUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new password
      const newPassword = await securityManager.generateSecurePassword();
      const hashedPassword = await securityManager.hashPassword(newPassword);

      const userIndex = users.findIndex(u => u.id === user.id);
      users[userIndex].password = hashedPassword;
      users[userIndex].updatedAt = new Date();

      await AsyncStorage.setItem('users', JSON.stringify(users));

      // In production, send email with new password
      console.log('New password generated:', newPassword);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  getAuthState(): AuthState {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
      isLoading: false,
      error: null,
    };
  }

  private async createSession(user: User): Promise<void> {
    const session = {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }

  private async getStoredUsers(): Promise<any[]> {
    try {
      const usersData = await AsyncStorage.getItem('users');
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Failed to get stored users:', error);
      return [];
    }
  }
}

export const authService = AuthService.getInstance(); 