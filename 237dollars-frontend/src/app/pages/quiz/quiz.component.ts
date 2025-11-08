import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { QuizService, Quiz, QuizQuestion } from '../../core/services/quiz.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {
  quiz: Quiz | null = null;
  currentQuestionIndex = 0;
  answers: Record<number, number> = {};
  startTime = 0;
  loading = true;
  error = '';
  submitted = false;
  result: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const referenceId = +params['referenceId'];
      this.loadQuiz(referenceId);
    });
  }

  loadQuiz(referenceId: number): void {
    this.quizService.getQuizByReference(referenceId).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.loading = false;
        this.startTime = Date.now();
      },
      error: (err) => {
        this.error = 'Failed to load quiz';
        this.loading = false;
      }
    });
  }

  get currentQuestion(): QuizQuestion | undefined {
    return this.quiz?.questions?.[this.currentQuestionIndex];
  }

  get progress(): number {
    if (!this.quiz) return 0;
    return ((this.currentQuestionIndex + 1) / this.quiz.totalQuestions) * 100;
  }

  selectAnswer(answer: number): void {
    if (this.currentQuestion) {
      this.answers[this.currentQuestion.id] = answer;
    }
  }

  nextQuestion(): void {
    if (this.quiz && this.currentQuestionIndex < this.quiz.totalQuestions - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitQuiz(): void {
    if (!this.quiz) return;

    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

    this.quizService.submitQuiz(this.quiz.id, this.answers, timeTaken).subscribe({
      next: (result) => {
        this.result = result;
        this.submitted = true;
      },
      error: (err) => {
        this.error = 'Failed to submit quiz';
      }
    });
  }

  retakeQuiz(): void {
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.startTime = Date.now();
    this.submitted = false;
    this.result = null;
  }
}
