import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = params ? new HttpParams({ fromObject: params }) : undefined;
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders()
    });
  }
}
