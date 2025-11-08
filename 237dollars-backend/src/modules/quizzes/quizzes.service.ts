import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../../database/entities/quiz.entity';
import { QuizQuestion } from '../../database/entities/quiz-question.entity';
import { QuizAttempt } from '../../database/entities/quiz-attempt.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private questionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt)
    private attemptRepository: Repository<QuizAttempt>,
  ) {}

  async create(referenceId: number, quizData: any) {
    const quiz = this.quizRepository.create({ referenceId, ...quizData });
    return await this.quizRepository.save(quiz);
  }

  async addQuestion(quizId: number, questionData: any) {
    const question = this.questionRepository.create({ quizId, ...questionData });
    return await this.questionRepository.save(question);
  }

  async getQuiz(referenceId: number) {
    return await this.quizRepository.findOne({
      where: { referenceId },
      relations: ['questions'],
    });
  }

  async submitQuiz(userId: number, quizId: number, answers: any, timeTaken: number) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['questions'],
    });

    let correctCount = 0;
    for (const question of quiz.questions) {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }

    const scorePercentage = (correctCount / quiz.questions.length) * 100;
    const isPassed = scorePercentage >= quiz.passScorePercentage;

    const attempt = this.attemptRepository.create({
      userId,
      quizId,
      scorePercentage,
      timeTakenSeconds: timeTaken,
      answers,
      isPassed,
    });

    return await this.attemptRepository.save(attempt);
  }
}
