import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
	@Query(() => String)
	public sayHi(): String {
		return 'Everything is ready in GraphQL Api Server!';
	}
}
