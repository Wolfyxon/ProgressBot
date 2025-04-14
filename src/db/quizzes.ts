import { wait } from "../utils";
import Database, { DbResult, DbRunResult } from "./database";
import DbTable from "./table";

export enum Answer {
    A = "a",
    B = "b",
    C = "c",
    D = "d"
}

export type RawDbQuiz = {
    quizId: number,
    channelId: string,
    messageId: string,
    correctAnswer: Answer,
    rewardXp: number
}

export type RawDbQuizAnswer = {
    quizId: string,
    userId: string,
    answer: Answer
}

export type QuizRemoveResult = { 
    quizzes: DbRunResult, 
    answers: DbRunResult 
}

export class QuizManager {
    db: Database;
    quizzes: Quizzes;
    answers: QuizAnswers;

    constructor(db: Database) {
        this.db = db;
        this.quizzes = new Quizzes(db);
        this.answers = new QuizAnswers(db);
    }

    public setup() {
        this.quizzes.setup();
        this.answers.setup();
    }

    public cleanup() {
        const quizzes = this.quizzes.queryQuizzes().value;

        quizzes.forEach(async q => {
            const mgr = this;
            
            function remove() {
                console.log(`Removing quiz: ${q.quizId}`);
                mgr.removeQuiz(q.quizId);
            }

            const channel = await this.db.botCtx.client!.channels.cache.get(q.channelId);
            
            if(!channel || !channel.isTextBased()) {
                remove();
                return;
            }

            const msg = await channel.messages.cache.get(q.messageId);

            if(!msg) {
                remove();
            }
        });
    }

    public addQuiz(channelId: string, messageId: string, correctAnswer: string, rewardXp: number): DbRunResult {
        return this.quizzes.addQuiz(channelId, messageId, correctAnswer, rewardXp);
    }

    public removeQuiz(quizId: number): QuizRemoveResult {
        const answersRes = this.db.run(
            `DELETE FROM ${this.answers.name} WHERE quizId = ?`
        , quizId);

        const quizRes = this.db.run(
            `DELETE FROM ${this.quizzes.name} WHERE quizId = ?`
        , quizId);

        return {
            quizzes: quizRes,
            answers: answersRes
        }
    }

    public removeQuizzes(quizIds: string[]): QuizRemoveResult {
        const idString = `(${quizIds.toString()})`;

        const answersRes = this.db.run(
            `DELETE FROM ${this.answers.name} WHERE quizId IN ${idString}`
        );

        const quizzesRes = this.db.run(
            `DELETE FROM ${this.quizzes.name} WHERE quizId IN ${idString}`
        );

        return {
            quizzes: quizzesRes, 
            answers: answersRes
        }
    }

    public queryQuiz(quizId: string): DbResult<Quiz | null> {
        const raw = this.quizzes.queryQuiz(quizId);

        if(!raw.value) {
            return new DbResult(raw.statement, null);
        }

        return new DbResult(
            raw.statement,
            new Quiz(this, raw.value as RawDbQuiz)
        )
    }

    public queryQuizByMessage(channelId: string, messageId: string): DbResult<Quiz | null> {
        const raw = this.quizzes.queryQuizByMessage(channelId, messageId);

        if(!raw.value) {
            return new DbResult(raw.statement, null);
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
                quizId INTEGER PRIMARY KEY AUTOINCREMENT,
                channelId VARCHAR(20) NOT NULL,
                messageId VARCHAR(20) NOT NULL,
                correctAnswer VARCHAR(1) NOT NULL,
                rewardXp INTEGER NOT NULL,

                UNIQUE (messageId, channelId)
            )
        `);
    }

    public queryQuizzes(): DbResult<RawDbQuiz[]> {
        return this.db.queryAllAs(
            `SELECT * FROM ${this.name}`
        );
    }

    public queryQuiz(quizId: string): DbResult<RawDbQuiz | null> {
        return this.db.queryAs(
            `SELECT * FROM ${this.name} WHERE quizId = ?`
        , quizId);
    }

    public queryQuizByMessage(channelId: string, messageId: string): DbResult<RawDbQuiz | null> {
        return this.db.queryAs(
            `SELECT * FROM ${this.name} WHERE channelId = ? AND messageId = ?`
        , channelId, messageId);
    }

    public addQuiz(channelId: string, messageId: string, correctAnswer: string, rewardXp: number): DbRunResult {
        return this.db.run(
            `INSERT INTO ${this.name} (channelId, messageId, correctAnswer, rewardXp) VALUES(?, ?, ?, ?)`
        , channelId, messageId, correctAnswer, rewardXp);
    }
}

export class QuizAnswers extends DbTable {
    constructor(db: Database) {
        super("QuizAnswers", db);
    }

    public setup() {
        this.db.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                quizId INTEGER NOT NULL,
                userId VARCHAR(20) NOT NULL,
                answer VARCHAR(1) NOT NULL,

                UNIQUE (quizId, userId)
            )
        `);
    }

    public queryAnswers(quizId: number): DbResult<RawDbQuizAnswer[]> {
        return this.db.queryAllAs(
            `SELECT * FROM ${this.name} WHERE quizId = ?`
        , quizId);
    }

    public queryAnswer(quizId: number, userId: string): DbResult<RawDbQuizAnswer | null> {
        return this.db.queryAs(
            `SELECT answer FROM ${this.name} WHERE quizId = ? AND userId = ?`
        , quizId, userId);
    }

    public addAnswer(quizId: number, userId: string, answer: Answer): DbRunResult {
        return this.db.run(
            `INSERT INTO ${this.name} (quizId, userId, answer) VALUES (?, ?, ?)`
        , quizId, userId, answer);
    }
}

export class Quiz {
    mgr: QuizManager;
    quizId: number;
    messageId: string;
    correctAnswer: string;
    rewardXp: number;

    constructor(mgr: QuizManager, data: RawDbQuiz) {
        this.mgr = mgr;
        this.quizId = data.quizId;
        this.messageId = data.messageId;
        this.correctAnswer = data.correctAnswer;
        this.rewardXp = data.rewardXp;
    }

    public queryAnswers(): DbResult<RawDbQuizAnswer[]> {
        return this.mgr.answers.queryAnswers(this.quizId);
    }

    public queryAnswer(userId: string): DbResult<RawDbQuizAnswer | null> {
        return this.mgr.answers.queryAnswer(this.quizId, userId);
    }
}