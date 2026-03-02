export enum HttpCode {
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,
	NOT_MODIFIED = 304,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	METHOD_NOT_ALLOWED = 405,
	CONFLICT = 409,
	INTERNAL_SERVER_ERROR = 500,
	NOT_IMPLEMENTED = 501,
	BAD_GATEWAY = 502,
	SERVICE_UNAVAILABLE = 503,
}

export enum Message {
	SOMETHING_WENT_WRONG = 'Something went wrong',
	NO_DATA_FOUND = 'No data found',
	CREATE_FAILED = 'Create is failed',
	UPDATE_FAILED = 'Update is failed',

	USED_NICK_PHONE = 'You are inserting already used phone number or a nickname!',
	TOKEN_CREATION_FAILED = 'Token creation error!',
	NO_MEMBER_NICK = 'No member was found with that nickname!',
	WRONG_PASSWORD = 'Wrong password, please try again!',
	NOT_AUTHENTICATED = "You're not authenticated. Please login first",
	BLOCKED_USER = 'You have been blocked. Please, contact the restaurant service!',
	PROVIDE_ALLOWED_FORMAT = 'Please upload only allowed format types, such as jpeg, jpg and png',
	UPLOAD_FAILED = 'File upload failed',
	NOT_ALLOWED_REQUEST = 'You are not allowed to perform this request.',
	REMOVE_FAILED = 'Remove is failed!',
	SELF_SUBSCRIBTION_DENIED = 'You cannot subscribe to yourself.',
	BAD_REQUEST = 'Something went wrong with your request.',

	NO_ITEM_FOUND = 'Order must contain at least one item',
	INVALID_STATUS_CHANGE = 'Invalid order status change.',
	PAYMENT_REQUIRED = 'Payment is required before this order can be shipped.',
	NO_SHIPPING_ADDRESS = 'No shipping address found for this member',
}

class Errors extends Error {
	public code: HttpCode;
	public message: Message;

	static standard = {
		code: HttpCode.INTERNAL_SERVER_ERROR,
		message: Message.SOMETHING_WENT_WRONG,
	};

	constructor(statusCode: HttpCode, statusMessage: Message) {
		super();
		this.code = statusCode;
		this.message = statusMessage;
	}
}

export default Errors;
