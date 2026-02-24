import { registerEnumType } from '@nestjs/graphql';

export enum ProductStatus {
	ACTIVE = 'ACTIVE',
	DRAFT = 'DRAFT',
	OUT_OF_STOCK = 'OUT_OF_STOCK',
	HIDDEN = 'HIDDEN',
	DISCONTINUED = 'DISCONTINUED',
}
registerEnumType(ProductStatus, {
	name: 'ProductStatus',
});

export enum ProductCategory {
	TSHIRT = 'TSHIRT',
	SHIRT = 'SHIRT',
	SHORTS = 'SHORTS',
	HOODIE = 'HOODIE',
	JEANS = 'JEANS',

	SWEATER = 'SWEATER',
	JACKET = 'JACKET',
	COAT = 'COAT',
	PANTS = 'PANTS',
	SWEATPANTS = 'SWEATPANTS',

	SKIRT = 'SKIRT',
	DRESS = 'DRESS',

	BLAZER = 'BLAZER',
	CARDIGAN = 'CARDIGAN',
	VEST = 'VEST',

	TRACKSUIT = 'TRACKSUIT',
	ACTIVEWEAR = 'ACTIVEWEAR',
	PAJAMAS = 'PAJAMAS',

	UNDERWEAR = 'UNDERWEAR',
	SOCKS = 'SOCKS',

	ACCESSORIES = 'ACCESSORIES',
	HAT = 'HAT',
	BELT = 'BELT',
	BAG = 'BAG',

	SHOES = 'SHOES',
	SNEAKERS = 'SNEAKERS',
	SANDALS = 'SANDALS',
	BOOTS = 'BOOTS',
}
registerEnumType(ProductCategory, {
	name: 'ProductCategory',
});

export enum ProductDressStyle {
	CASUAL = 'CASUAL',
	FORMAL = 'FORMAL',
	PARTY = 'PARTY',
	GYM = 'GYM',

	// STREETWEAR = 'STREETWEAR',
	// BUSINESS_CASUAL = 'BUSINESS_CASUAL',
	// ATHLEISURE = 'ATHLEISURE',
	// LOUNGE = 'LOUNGE',
	// EVENING = 'EVENING',

	// MINIMAL = 'MINIMAL',
	// VINTAGE = 'VINTAGE',
	// SPORTY = 'SPORTY',
}
registerEnumType(ProductDressStyle, {
	name: 'ProductDressStyle',
});

export enum ProductSize {
	XXS = 'XXS',
	XS = 'XS',
	S = 'S',
	M = 'M',
	L = 'L',
	XL = 'XL',
	XXL = 'XXL',
	_3XL = '3XL',
	_4XL = '4XL',

	ONE_SIZE = 'ONE_SIZE',
	FREE_SIZE = 'FREE_SIZE',
}
registerEnumType(ProductSize, {
	name: 'ProductSize',
});