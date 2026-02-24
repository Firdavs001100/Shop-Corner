import { registerEnumType } from '@nestjs/graphql';

export enum LikeGroup {
	MEMBER = 'MEMBER',
	PROPERTY = 'PROPERTY',
	PRODUCT = 'PRODUCT',
}
registerEnumType(LikeGroup, {
	name: 'LikeGroup',
});
