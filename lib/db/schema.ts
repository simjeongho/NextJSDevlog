// lib/db/schema.ts
import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  tag: varchar("tag", { length: 50 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  readingTime: integer("reading_time"),
  coverImage: varchar("cover_image", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ⭐ 학습 로그 테이블 추가
export const studyLogs = pgTable("study_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ⭐ 타입 자동 추론 — Drizzle 의 매력
export type Post = typeof posts.$inferSelect; // SELECT 결과 타입
export type NewPost = typeof posts.$inferInsert; // INSERT 시 필요한 타입
export type StudyLog = typeof studyLogs.$inferSelect;
export type NewStudyLog = typeof studyLogs.$inferInsert;
