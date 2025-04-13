import Database, { DbResult, DbRunResult } from "./database";
import DbTable from "./table";

export enum Answer {
    A = "a",
    B = "b",
    C = "c",
    D = "d"
}

export type RawDbQuiz = {
    messageId: string;
    correctAnswer: Answer,
    rewardXp: number
}

export type RawDbQuizAnswer = {
    messageId: string,
    userId: string,
    answer: number
}

export class QuizManager {
    quizzes: Quizzes;
    answers: QuizAnswers;

    constructor(db: Database) {
        this.quizzes = new Quizzes(db);
        this.answers = new QuizAnswers(db);
    }

    public setup() {
        this.quizzes.setup();
        this.answers.setup();
    }

    public addQuiz(messageId: string, correctAnswer: string, rewardXp: number): DbRunResult {
        return this.quizzes.addQuiz(messageId, correctAnswer, rewardXp);
    }

    public queryQuiz(messageId: string): DbResult<Quiz | null> {
        const raw = this.quizzes.queryQuiz(messageId);

        if(!raw.value) {
            new DbResult(raw.statement, null);
        }

        return new DbResult(
            raw.statement,
            new Quiz(this, raw.value as RawDbQuiz)
        )
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
                correctAnswer VARCHAR(1) NOT NULL,
                rewardXp INTEGER NOT NULL,

                UNIQUE (messageId)
            )
        `);
    }

    public queryQuiz(messageId: string): DbResult<RawDbQuiz | null> {
        return this.db.queryAs(
            `SELECT * FROM ${this.name} WHERE messageId = ?`
        , messageId);
    }

    public addQuiz(messageId: string, correctAnswer: string, rewardXp: number): DbRunResult {
        return this.db.run(
            `INSERT INTO ${this.name} (messageId, correctAnswer, rewardXp) VALUES(?, ?, ?)`
        , messageId, correctAnswer, rewardXp);
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
                answer VARCHAR(1) NOT NULL,

                UNIQUE (messageId, userId)
            )
        `);
    }

    public queryAnswers(messageId: string): DbResult<RawDbQuizAnswer[]> {
        return this.db.queryAllAs(
            `SELECT * FROM ${this.name} WHERE messageId = ?`
        , messageId);
    }

    public queryAnswer(messageId: string, userId: string): DbResult<Answer | null> {
        return this.db.queryAs(
            `SELECT answer FROM ${this.name} WHERE messageId = ? AND userId = ?`
        , messageId, userId);
    }

    public addAnswer(messageId: string, userId: string, answer: Answer): DbRunResult {
        return this.db.run(
            `INSERT INTO ${this.name} (messageId, userId, answer) VALUES (?, ?, ?)`
        , messageId, userId, answer);
    }
}



export class Quiz {
    mgr: QuizManager;
    messageId: string;
    correctAnswer: string;
    rewardXp: number;

    constructor(mgr: QuizManager, data: RawDbQuiz) {
        this.mgr = mgr;
        this.messageId = data.messageId;
        this.correctAnswer = data.correctAnswer;
        this.rewardXp = data.rewardXp;
    }

    public queryAnswers(): DbResult<RawDbQuizAnswer[]> {
        return this.mgr.answers.queryAnswers(this.messageId);
    }

    public queryAnswer(userId: string): DbResult<Answer | null> {
        return this.mgr.answers.queryAnswer(this.messageId, userId);
    }
}