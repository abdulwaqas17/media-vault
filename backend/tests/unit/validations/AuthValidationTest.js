import { LoginSchema, SignupSchema } from "../../../src/modules/auth/AuthValidation";


describe('Auth Validation Schemas', () => {
  
  describe('SignupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'Test User'
      };
      
      const { error } = SignupSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123',
        full_name: 'Test User'
      };
      
      const { error } = SignupSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.message).toContain('Email');
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        full_name: 'Test User'
      };
      
      const { error } = SignupSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject missing full_name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const { error } = SignupSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

//   describe('LoginSchema', () => {
//     it('should validate correct login data', () => {
//       const validData = {
//         email: 'test@example.com',
//         password: 'Password123'
//       };
      
//       const { error } = LoginSchema.validate(validData);
//       expect(error).toBeUndefined();
//     });

//   });
});