import { jest } from "@jest/globals";

// Mock xss library using unstable_mockModule (same approach as JWT test)
jest.unstable_mockModule("xss", () => ({
  default: jest.fn()
}));

// Dynamic imports
const xss = (await import("xss")).default;
const { SanitizeString, SanitizeObject } = await import("../../../src/utils/sanitizer.js");

describe("SanitizeUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // TEST SUITE 1: SanitizeString
  // ============================================================
  describe("SanitizeString", () => {
    
    // Test 1: Normal string
    it("should return sanitized string for normal input", () => {
      const input = "Hello World";
      const expected = "Hello World";
      
      xss.mockReturnValue(expected);
      
      const result = SanitizeString(input);
      
      expect(xss).toHaveBeenCalledWith(input);
      expect(result).toBe(expected);
    });

    // Test 2: Trim whitespace
    it("should trim whitespace from string", () => {
      const input = "  Hello World  ";
      const trimmed = "Hello World";
      
      xss.mockReturnValue(trimmed);
      
      const result = SanitizeString(input);
      
      expect(xss).toHaveBeenCalledWith("Hello World");
      expect(result).toBe(trimmed);
    });

    // Test 3: XSS payload
    it("should sanitize XSS payload", () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      
      xss.mockReturnValue(expected);
      
      const result = SanitizeString(input);
      
      expect(xss).toHaveBeenCalledWith(input);
      expect(result).toBe(expected);
    });

    // Test 4: Non-string input
    it("should return non-string input as-is without sanitization", () => {
      const testCases = [
        null,
        undefined,
        123,
        45.67,
        true,
        false,
        { key: "value" },
        [1, 2, 3]
      ];
      
      testCases.forEach((input) => {
        const result = SanitizeString(input);
        expect(result).toBe(input);
        expect(xss).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // TEST SUITE 2: SanitizeObject
  // ============================================================
  describe("SanitizeObject", () => {
    
    // Test 1: Simple object
    it("should sanitize all string fields in a simple object", () => {
      const input = {
        name: "  John Doe  ",
        email: "john@example.com",
        bio: '<script>alert("XSS")</script>'
      };
      
      xss.mockImplementation((str) => `sanitized_${str}`);
      
      const result = SanitizeObject(input);
      
      expect(result.name).toBe("sanitized_John Doe");
      expect(result.email).toBe("sanitized_john@example.com");
      expect(result.bio).toBe("sanitized_<script>alert(\"XSS\")</script>");
      expect(xss).toHaveBeenCalledTimes(3);
    });

    // Test 2: Nested object
    it("should recursively sanitize nested objects", () => {
      const input = {
        user: {
          name: "  Alice  ",
          profile: {
            bio: '<script>alert("XSS")</script>',
            location: "  New York  "
          }
        }
      };
      
      xss.mockImplementation((str) => `clean_${str}`);
      
      const result = SanitizeObject(input);
      
      expect(result.user.name).toBe("clean_Alice");
      expect(result.user.profile.bio).toBe("clean_<script>alert(\"XSS\")</script>");
      expect(result.user.profile.location).toBe("clean_New York");
      expect(xss).toHaveBeenCalledTimes(3);
    });

    // Test 3: Array of strings
    it("should sanitize string elements in arrays", () => {
      const input = {
        tags: ["  javascript  ", "  nodejs  ", '<script>alert("XSS")</script>']
      };
      
      xss.mockImplementation((str) => `clean_${str}`);
      
      const result = SanitizeObject(input);
      
      expect(result.tags[0]).toBe("clean_javascript");
      expect(result.tags[1]).toBe("clean_nodejs");
      expect(result.tags[2]).toBe("clean_<script>alert(\"XSS\")</script>");
      expect(xss).toHaveBeenCalledTimes(3);
    });

    // Test 4: Array of objects
    it("should sanitize nested objects inside arrays", () => {
      const input = {
        users: [
          { name: "  John  ", age: 25 },
          { name: '<script>alert("XSS")</script>', age: 30 }
        ]
      };
      
      xss.mockImplementation((str) => `clean_${str}`);
      
      const result = SanitizeObject(input);
      
      expect(result.users[0].name).toBe("clean_John");
      expect(result.users[0].age).toBe(25);
      expect(result.users[1].name).toBe("clean_<script>alert(\"XSS\")</script>");
      expect(result.users[1].age).toBe(30);
      expect(xss).toHaveBeenCalledTimes(2);
    });

    // Test 5: Password excluded
    it("should not sanitize fields specified in EXCLUDED_FIELDS", () => {
      const input = {
        username: "  john_doe  ",
        password: '<script>alert("XSS")</script>',
        email: "  john@example.com  "
      };
      
      xss.mockImplementation((str) => `clean_${str}`);
      
      const result = SanitizeObject(input);
      
      // password should NOT be sanitized
      expect(result.password).toBe('<script>alert("XSS")</script>');
      // other fields should be sanitized
      expect(result.username).toBe("clean_john_doe");
      expect(result.email).toBe("clean_john@example.com");
      expect(xss).toHaveBeenCalledTimes(2);
    });

    // Test 6: Null / Undefined
    it("should return null/undefined as-is without sanitization", () => {
      const testCases = [null, undefined];
      
      testCases.forEach((input) => {
        const result = SanitizeObject(input);
        expect(result).toBe(input);
        expect(xss).not.toHaveBeenCalled();
      });
    });

    // Test 7: Empty object
    it("should return empty object as-is", () => {
      const input = {};
      
      const result = SanitizeObject(input);
      
      expect(result).toEqual({});
      expect(xss).not.toHaveBeenCalled();
    });
  });
});