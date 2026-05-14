import { 
  GetUserSessionsSchema, 
  RevokeSessionSchema, 
  RevokeAllSessionsSchema 
} from "../../../src/modules/session/SessionValidation";

describe("Sessions Validation Schemas", () => {
  
  // ============================================================
  // GET USER SESSIONS SCHEMA
  // ============================================================
  describe("GetUserSessionsSchema", () => {
    it("should validate correct userId", () => {
      const { error } = GetUserSessionsSchema.validate({
        userId: "user_123",
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing userId", () => {
      const { error } = GetUserSessionsSchema.validate({});
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject empty userId", () => {
      const { error } = GetUserSessionsSchema.validate({ userId: "" });
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject null userId", () => {
      const { error } = GetUserSessionsSchema.validate({ userId: null });
      expect(error).toBeDefined();
    });

    it("should reject userId as number", () => {
      const { error } = GetUserSessionsSchema.validate({ userId: 123 });
      expect(error).toBeDefined();
    });
  });

  // ============================================================
  // REVOKE SESSION SCHEMA
  // ============================================================
  describe("RevokeSessionSchema", () => {
    it("should validate correct userId and sessionId", () => {
      const { error } = RevokeSessionSchema.validate({
        userId: "user_123",
        sessionId: "session_456",
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing userId", () => {
      const { error } = RevokeSessionSchema.validate({
        sessionId: "session_456",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject missing sessionId", () => {
      const { error } = RevokeSessionSchema.validate({
        userId: "user_123",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("Session id is required");
    });

    it("should reject empty userId", () => {
      const { error } = RevokeSessionSchema.validate({
        userId: "",
        sessionId: "session_456",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject empty sessionId", () => {
      const { error } = RevokeSessionSchema.validate({
        userId: "user_123",
        sessionId: "",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("Session id is required");
    });
  });

  // ============================================================
  // REVOKE ALL SESSIONS SCHEMA
  // ============================================================
  describe("RevokeAllSessionsSchema", () => {
    it("should validate correct userId", () => {
      const { error } = RevokeAllSessionsSchema.validate({
        userId: "user_123",
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing userId", () => {
      const { error } = RevokeAllSessionsSchema.validate({});
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject empty userId", () => {
      const { error } = RevokeAllSessionsSchema.validate({ userId: "" });
      expect(error).toBeDefined();
      expect(error.message).toContain("User id is required");
    });

    it("should reject null userId", () => {
      const { error } = RevokeAllSessionsSchema.validate({ userId: null });
      expect(error).toBeDefined();
    });
  });
});