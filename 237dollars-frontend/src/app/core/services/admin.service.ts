import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Admin {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  telegramUsername?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  emailVerified?: boolean;
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  studentManagers: number;
  contentManagers: number;
  recentActivities: ActivityLog[];
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  admin: {
    id: number;
    email: string;
  };
}

export interface CreateAdminDto {
  email: string;
  password: string;
  role: string;
  telegramUsername?: string;
}

export interface UpdateAdminDto {
  email?: string;
  password?: string;
  role?: string;
  telegramUsername?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private api: ApiService) {}

  /**
   * Get all admins
   */
  getAllAdmins(): Observable<Admin[]> {
    return this.api.get<Admin[]>('admin/admins');
  }

  /**
   * Get specific admin
   */
  getAdminById(id: number): Observable<Admin> {
    return this.api.get<Admin>(`admin/admins/${id}`);
  }

  /**
   * Create new admin
   */
  createAdmin(data: CreateAdminDto): Observable<Admin> {
    return this.api.post<Admin>('admin/create-admin', data);
  }

  /**
   * Update admin details
   */
  updateAdmin(id: number, data: UpdateAdminDto): Observable<Admin> {
    return this.api.put<Admin>(`admin/admins/${id}`, data);
  }

  /**
   * Update admin role
   */
  updateAdminRole(id: number, role: string): Observable<Admin> {
    return this.api.put<Admin>(`admin/admins/${id}/role`, { role });
  }

  /**
   * Delete/Deactivate admin
   */
  deleteAdmin(id: number): Observable<void> {
    return this.api.delete<void>(`admin/admins/${id}`);
  }

  /**
   * Reactivate admin
   */
  reactivateAdmin(id: number): Observable<Admin> {
    return this.api.put<Admin>(`admin/admins/${id}/reactivate`, {});
  }

  /**
   * Get admin statistics
   */
  getAdminStats(): Observable<AdminStats> {
    return this.api.get<AdminStats>('admin/stats');
  }

  /**
   * Get activity logs
   */
  getActivityLogs(page: number = 1, limit: number = 20): Observable<{ logs: ActivityLog[]; total: number }> {
    return this.api.get<{ logs: ActivityLog[]; total: number }>(`admin/activity-logs?page=${page}&limit=${limit}`);
  }
}
