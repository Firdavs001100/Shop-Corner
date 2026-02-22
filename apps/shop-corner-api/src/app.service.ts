import { Injectable } from '@nestjs/common';

@Injectable()
export class CozyCornerService {
  getHello(): string {
    return 'Hello World!';
  }
}
