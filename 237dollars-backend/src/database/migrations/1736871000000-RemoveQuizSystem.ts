import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveQuizSystem1736871000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop quiz_attempts table (has foreign keys to users and quizzes)
    await queryRunner.query(`
      DROP TABLE IF EXISTS quiz_attempts CASCADE
    `);

    // Drop quiz_questions table (has foreign key to quizzes)
    await queryRunner.query(`
      DROP TABLE IF EXISTS quiz_questions CASCADE
    `);

    // Drop quizzes table (has foreign key to references)
    await queryRunner.query(`
      DROP TABLE IF EXISTS quizzes CASCADE
    `);

    // Drop quiz_answer enum type if it exists
    await queryRunner.query(`
      DROP TYPE IF EXISTS quiz_answer_enum CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create quiz_answer enum
    await queryRunner.query(`
      CREATE TYPE quiz_answer_enum AS ENUM ('A', 'B', 'C', 'D')
    `);

    // Recreate quizzes table
    await queryRunner.query(`
      CREATE TABLE quizzes (
        id SERIAL PRIMARY KEY,
        reference_id INTEGER NOT NULL,
        total_questions INTEGER DEFAULT 10,
        time_limit_minutes INTEGER DEFAULT 10,
        pass_score_percentage INTEGER DEFAULT 70,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_quizzes_reference
          FOREIGN KEY (reference_id)
          REFERENCES references(id)
          ON DELETE CASCADE
      )
    `);

    // Recreate quiz_questions table
    await queryRunner.query(`
      CREATE TABLE quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_answer quiz_answer_enum NOT NULL,
        question_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_quiz_questions_quiz
          FOREIGN KEY (quiz_id)
          REFERENCES quizzes(id)
          ON DELETE CASCADE
      )
    `);

    // Recreate quiz_attempts table
    await queryRunner.query(`
      CREATE TABLE quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        quiz_id INTEGER NOT NULL,
        score_percentage DECIMAL(5,2) NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        answers JSON NOT NULL,
        is_passed BOOLEAN NOT NULL,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_quiz_attempts_user
          FOREIGN KEY (user_id)
          REFERENCES users(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_quiz_attempts_quiz
          FOREIGN KEY (quiz_id)
          REFERENCES quizzes(id)
          ON DELETE CASCADE
      )
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX idx_quizzes_reference_id ON quizzes(reference_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id)
    `);
  }
}
