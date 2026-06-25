import {
  LoginSchema,
  SignupSchema,
  GoogleAuthSchema
} from "../../../src/modules/auth/AuthValidation";

describe("Auth Validation Schemas", () => {
  // ============================================================
  // SIGNUP SCHEMA
  // ============================================================
  describe("SignupSchema", () => {
    // 1. Happy path
    it("should validate correct signup data", () => {
      const { error } = SignupSchema.validate({
        full_name: "Test User",
        email: "test@example.com",
        password: "Password123",
      });
      expect(error).toBeUndefined();
    });

    // 2-4. Full name tests
    it("should reject missing full_name", () => {
      const { error } = SignupSchema.validate({
        email: "test@example.com",
        password: "Password123",
      });
 expect(error).toBeDefined();
    });

    it("should reject short full_name (min 3)", () => {
      const { error } = SignupSchema.validate({
        full_name: "Jo",
        email: "test@example.com",
        password: "Password123",
      });
 expect(error).toBeDefined();
    });

    it("should reject long full_name (max 30)", () => {
      const { error } = SignupSchema.validate({
        full_name: "A".repeat(31),
        email: "test@example.com",
        password: "Password123",
      });
 expect(error).toBeDefined();
    });

    // 5-6. Email tests
    it("should reject missing email", () => {
      const { error } = SignupSchema.validate({
        full_name: "Test User",
        password: "Password123",
      });
       expect(error).toBeDefined();
    });

    it("should reject invalid email format", () => {
      const { error } = SignupSchema.validate({
        full_name: "Test User",
        email: "not-an-email",
        password: "Password123",
      });
       expect(error).toBeDefined();
    });

    // 7-8. Password tests
    it("should reject missing password", () => {
      const { error } = SignupSchema.validate({
        full_name: "Test User",
        email: "test@example.com",
      });
      expect(error).toBeDefined();
    });

    it("should reject short password (min 6)", () => {
      const { error } = SignupSchema.validate({
        full_name: "Test User",
        email: "test@example.com",
        password: "12345",
      });
      expect(error).toBeDefined();
    });
  });

  // ============================================================
  // LOGIN SCHEMA
  // ============================================================
  describe("LoginSchema", () => {
    it("should validate correct login data", () => {
      const { error } = LoginSchema.validate({
        email: "test@example.com",
        password: "Password123",
      });
      expect(error).toBeUndefined();
    });


    it("should reject missing email", () => {
      const { error } = LoginSchema.validate({
        password: "Password123",
      });
      expect(error).toBeDefined();
      console.log('====================================');
      console.log(error);
      console.log('====================================');
      expect(error.message).toContain("Email");
    });


    it("should reject missing password", () => {
      const { error } = LoginSchema.validate({
        email: "test@example.com",
      });
      expect(error).toBeDefined();
      expect(error.message).toContain("Password is required");
    });
  });

  // ============================================================
  // GOOGLE AUTH SCHEMA
  // ============================================================
  describe("GoogleAuthSchema", () => {
    it("should validate correct Google auth data", () => {
      const { error } = GoogleAuthSchema.validate({
        idToken: "google_token_123",
      });
      expect(error).toBeUndefined();
    });

    it("should reject missing idToken", () => {
      const { error } = GoogleAuthSchema.validate({});
      expect(error).toBeDefined();
      expect(error.message).toContain("Google idToken is required");
    });
  });
});
