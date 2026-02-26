import { registerEnumType } from '@nestjs/graphql';

export enum BoardArticleCategory {
	QUESTION = 'QUESTION',
	REVIEW = 'REVIEW',
	DISCUSSION = 'DISCUSSION',
	HELP = 'HELP',
	SHOWCASE = 'SHOWCASE', // outfit pics, hauls, etc
}
registerEnumType(BoardArticleCategory, {
	name: 'BoardArticleCategory',
});

export enum BoardArticleStatus {
	ACTIVE = 'ACTIVE',
	HIDDEN = 'HIDDEN',
	DELETE = 'DELETE',
}
registerEnumType(BoardArticleStatus, {
	name: 'BoardArticleStatus',
});
