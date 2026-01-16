/**
 * Test Data Factories for Kindergarten Race Game E2E Tests
 * Provides reusable test data generation for various scenarios
 */

export interface GameLevel {
  id: number;
  name: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TestUser {
  id: string;
  name: string;
  age: number;
  preferences: {
    language: string;
    soundEnabled: boolean;
    difficulty: "easy" | "medium" | "hard";
  };
}

export interface GameSession {
  id: string;
  userId: string;
  levelId: number;
  startTime: Date;
  endTime?: Date;
  score: number;
  completed: boolean;
}

export class TestDataFactory {
  private static counter = 0;

  /**
   * Generate a unique test user
   */
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const id = `test-user-${++this.counter}`;
    return {
      id,
      name: `Test User ${this.counter}`,
      age: 5 + (this.counter % 3), // Ages 5-7
      preferences: {
        language: "en",
        soundEnabled: true,
        difficulty: "easy",
      },
      ...overrides,
    };
  }

  /**
   * Generate multiple test users
   */
  static createTestUsers(count: number): TestUser[] {
    return Array.from({ length: count }, () => this.createTestUser());
  }

  /**
   * Generate a game level
   */
  static createGameLevel(overrides: Partial<GameLevel> = {}): GameLevel {
    const id = ++this.counter;
    const categories = ["animals", "colors", "numbers", "shapes", "phonics"];
    const difficulties: ("easy" | "medium" | "hard")[] = [
      "easy",
      "medium",
      "hard",
    ];

    return {
      id,
      name: `Level ${id}`,
      category: categories[id % categories.length],
      difficulty: difficulties[id % difficulties.length],
      ...overrides,
    };
  }

  /**
   * Generate a game session
   */
  static createGameSession(
    userId: string,
    levelId: number,
    overrides: Partial<GameSession> = {},
  ): GameSession {
    const id = `session-${++this.counter}`;
    const startTime = new Date();
    const completed = Math.random() > 0.3; // 70% completion rate
    const score = completed
      ? Math.floor(Math.random() * 1000) + 500
      : Math.floor(Math.random() * 500);

    return {
      id,
      userId,
      levelId,
      startTime,
      endTime: completed
        ? new Date(startTime.getTime() + Math.random() * 300000)
        : undefined, // Up to 5 minutes
      score,
      completed,
      ...overrides,
    };
  }

  /**
   * Generate test data for performance testing
   */
  static createPerformanceTestData() {
    return {
      users: this.createTestUsers(10),
      levels: Array.from({ length: 20 }, () => this.createGameLevel()),
      sessions: [], // Will be populated based on users and levels
    };
  }

  /**
   * Generate edge case test data
   */
  static createEdgeCaseData() {
    return {
      emptyUser: this.createTestUser({ name: "", age: 0 }),
      maxLengthUser: this.createTestUser({
        name: "A".repeat(100),
        age: 99,
      }),
      specialCharsUser: this.createTestUser({
        name: "Test@#$%^&*()",
      }),
      unicodeUser: this.createTestUser({
        name: "测试用户 🚀",
      }),
    };
  }

  /**
   * Reset the internal counter (useful for consistent test runs)
   */
  static resetCounter(): void {
    this.counter = 0;
  }
}

/**
 * Predefined test data sets
 */
export const TestDataSets = {
  basic: {
    user: TestDataFactory.createTestUser(),
    level: TestDataFactory.createGameLevel(),
  },

  performance: TestDataFactory.createPerformanceTestData(),

  edgeCases: TestDataFactory.createEdgeCaseData(),

  multilingual: {
    english: TestDataFactory.createTestUser({
      preferences: { language: "en" },
    }),
    chinese: TestDataFactory.createTestUser({
      preferences: { language: "zh" },
    }),
    spanish: TestDataFactory.createTestUser({
      preferences: { language: "es" },
    }),
  },
};
