import Database, { DbResult } from "./database";
import DbTable from "./table";

export enum AnswerId {
    A,
    B,
    C,
    D
}

export type RawDbQuiz = {
    messageId: string;
    correctAnswerId: AnswerId,
    rewardXp: number
}

export type RawDbQuizAnswer = {
    messageId: string,
    userId: string,
    answerId: number
}

export class QuizManager {
    quizzes: Quizzes;
    answers: QuizAnswers;

    constructor(db: Database) {
        this.quizzes = new Quizzes(db);
        this.answers = new QuizAnswers(db);
    }
}

export class Quizzes extends DbTable {
    constructor(db: Database) {
        super("Quizzes", db);
    }
    
    public setup() {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                messageId VARCHAR(20) NOT NULL,
                correctAnswerId INTEGER NOT NULL,
                rewardXp INTEGER NOT NULLs,

                UNIQUE (messageId)
            )
        `);
    }

    public queryQuiz(messageId: string): DbResult<RawDbQuiz> {
        return this.db.queryAs(
            `SELECT * FROM ${this.name} WHERE messageId = ?`
        , messageId);
    }
}

export class QuizAnswers extends DbTable {
    constructor(db: Database) {
        super("QuizAnswers", db);
    }

    public setup() {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                messageId VARCHAR(20) NOT NULL,
                userId VARCHAR(20) NOT NULL,
                answerId INTEGER NOT NULL,

                UNIQUE (userId)
            )
        `);
    }

    public queryAnswers(messageId: string): DbResult<RawDbQuizAnswer[]> {
        return this.db.queryAllAs(
            `SELECT * FROM ${this.name} WHERE messageId = ?`
        , messageId);
    }

    public queryAnswer(messageId: string, userId: string): DbResult<AnswerId | null> {
        return this.db.queryAs(
            `SELECT answerId FROM ${this.name} WHERE messageId = ? AND userId = ?`
        , messageId, userId);
    }
}