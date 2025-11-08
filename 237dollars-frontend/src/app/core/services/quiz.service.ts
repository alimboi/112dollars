import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Quiz {
  id: number;
  referenceId: number;
  title: string;
  description: string;
  totalQuestions: number;
  passScorePercentage: number;
  pointsReward: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  questionText: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  explanation: string;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: number;
  scorePercentage: number;
  isPassed: boolean;
  timeTakenSeconds: number;
  answers: Record<number, number>;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  constructor(private api: ApiService) {}

  getQuizByReference(referenceId: number): Observable<Quiz> {
    return this.api.get<Quiz>(`quizzes/${referenceId}`);
  }

  submitQuiz(quizId: number, answers: Record<number, number>, timeTaken: number): Observable<QuizAttempt> {
    return this.api.post<QuizAttempt>(`quizzes/${quizId}/submit`, { answers, timeTaken });
  }

  getAttempts(quizId: number): Observable<QuizAttempt[]> {
    return this.api.get<QuizAttempt[]>(`quizzes/${quizId}/attempts`);
  }
}
