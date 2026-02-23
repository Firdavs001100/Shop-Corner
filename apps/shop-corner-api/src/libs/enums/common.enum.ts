import { registerEnumType } from '@nestjs/graphql';

export enum Direction {
	ASC = 1,
	DESC = -1,
}

registerEnumType(Direction, { name: 'Direction' });

// common.enum.ts
export enum Message {
	/* =====================================================
	 * SYSTEM / GLOBAL
	 * ===================================================== */
	SUCCESS = 'Success',
	FAILED = 'Failed',
	OPERATION_COMPLETED = 'Operation completed successfully',
	OPERATION_FAILED = 'Operation failed',
	UNKNOWN_ERROR = 'Unknown error occurred',
	INVALID_REQUEST = 'Invalid request',
	SERVICE_UNAVAILABLE = 'Service temporarily unavailable',
	INTERNAL_SERVER_ERROR = 'Internal server error',
	TIMEOUT = 'Request timeout',

	/* =====================================================
	 * AUTHENTICATION
	 * ===================================================== */
	AUTH_REQUIRED = 'Authentication required',
	LOGIN_SUCCESS = 'Login successful',
	LOGIN_FAILED = 'Login failed',
	LOGOUT_SUCCESS = 'Logout successful',
	INVALID_CREDENTIALS = 'Invalid credentials',
	ACCOUNT_LOCKED = 'Account locked',
	ACCOUNT_DISABLED = 'Account disabled',
	TOKEN_NOT_EXIST = 'Token does not exist',
	ONLY_SPECIFIC_ROLES_ALLOWED = 'Only specific roles are allowed!',
	NOT_AUTHENTICATED = 'Not authenticated user!',

	/* =====================================================
	 * AUTHORIZATION
	 * ===================================================== */
	UNAUTHORIZED = 'Unauthorized access',
	FORBIDDEN = 'Access forbidden',
	INSUFFICIENT_PERMISSIONS = 'Insufficient permissions',

	/* =====================================================
	 * TOKEN / SESSION
	 * ===================================================== */
	TOKEN_MISSING = 'Token missing',
	TOKEN_INVALID = 'Invalid token',
	TOKEN_EXPIRED = 'Token expired',
	TOKEN_REFRESHED = 'Token refreshed successfully',
	SESSION_EXPIRED = 'Session expired',

	/* =====================================================
	 * USER
	 * ===================================================== */
	USER_CREATED = 'User created successfully',
	USER_UPDATED = 'User updated successfully',
	USER_DELETED = 'User deleted successfully',
	USER_FETCHED = 'User fetched successfully',
	USER_NOT_FOUND = 'User not found',
	USER_ALREADY_EXISTS = 'User already exists',
	USER_INACTIVE = 'User inactive',

	/* =====================================================
	 * PROFILE
	 * ===================================================== */
	PROFILE_UPDATED = 'Profile updated successfully',
	PROFILE_NOT_FOUND = 'Profile not found',

	/* =====================================================
	 * CRUD / RESOURCE
	 * ===================================================== */
	CREATED_SUCCESSFULLY = 'Created successfully',
	UPDATED_SUCCESSFULLY = 'Updated successfully',
	DELETED_SUCCESSFULLY = 'Deleted successfully',
	FETCHED_SUCCESSFULLY = 'Fetched successfully',
	RESOURCE_NOT_FOUND = 'Resource not found',
	RESOURCE_ALREADY_EXISTS = 'Resource already exists',
	RESOURCE_CONFLICT = 'Resource conflict',

	/* =====================================================
	 * VALIDATION
	 * ===================================================== */
	VALIDATION_FAILED = 'Validation failed',
	INVALID_INPUT = 'Invalid input',
	MISSING_REQUIRED_FIELDS = 'Missing required fields',
	FIELD_TOO_SHORT = 'Field value too short',
	FIELD_TOO_LONG = 'Field value too long',
	INVALID_EMAIL = 'Invalid email format',
	INVALID_PHONE = 'Invalid phone number format',
	PASSWORD_TOO_WEAK = 'Password too weak',
	PASSWORD_MISMATCH = 'Password mismatch',

	/* =====================================================
	 * FILE / UPLOAD
	 * ===================================================== */
	FILE_UPLOADED = 'File uploaded successfully',
	FILE_UPLOAD_FAILED = 'File upload failed',
	FILE_NOT_FOUND = 'File not found',
	FILE_TOO_LARGE = 'File too large',
	INVALID_FILE_TYPE = 'Invalid file type',

	/* =====================================================
	 * DATABASE
	 * ===================================================== */
	DATABASE_ERROR = 'Database error occurred',
	DUPLICATE_ENTRY = 'Duplicate entry',
	TRANSACTION_FAILED = 'Transaction failed',
	RECORD_NOT_FOUND = 'Record not found',

	/* =====================================================
	 * PAYMENT
	 * ===================================================== */
	PAYMENT_SUCCESS = 'Payment successful',
	PAYMENT_FAILED = 'Payment failed',
	PAYMENT_PENDING = 'Payment pending',
	PAYMENT_CANCELED = 'Payment canceled',
	INVALID_PAYMENT_METHOD = 'Invalid payment method',

	/* =====================================================
	 * RATE LIMITING
	 * ===================================================== */
	TOO_MANY_REQUESTS = 'Too many requests',
	RATE_LIMIT_EXCEEDED = 'Rate limit exceeded',

	/* =====================================================
	 * GRAPHQL
	 * ===================================================== */
	GRAPHQL_VALIDATION_ERROR = 'GraphQL validation error',
	GRAPHQL_EXECUTION_ERROR = 'GraphQL execution error',

	/* =====================================================
	 * THIRD-PARTY / EXTERNAL
	 * ===================================================== */
	EXTERNAL_SERVICE_ERROR = 'External service error',
	EXTERNAL_SERVICE_TIMEOUT = 'External service timeout',

	/* =====================================================
	 * FEATURE FLAGS / BUSINESS LOGIC
	 * ===================================================== */
	FEATURE_DISABLED = 'Feature is disabled',
	ACTION_NOT_ALLOWED = 'Action not allowed',
}
