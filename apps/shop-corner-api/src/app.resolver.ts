import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
	@Query(() => String)
	public sayHi(): String {
		return 'HI from GraphQL Api Server!';
	}
}
